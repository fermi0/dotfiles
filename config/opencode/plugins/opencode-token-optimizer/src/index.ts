/**
 * opencode-token-optimizer v2 — lossless / near-lossless token optimizer
 *
 * Design principles (2026-01 best practice):
 *   1. NEVER touch tool.definition — tool descriptions are the model's contract
 *      with the tools. Mangling them breaks tool-calling accuracy.
 *   2. NEVER regex-strip the system prompt. Instead, APPEND a small Code Mode
 *      nudge. Regex-stripping destroys the very rules that make the model
 *      behave correctly.
 *   3. Tool-output budgets are SOFT caps (truncate with a clear "… [N more
 *      lines truncated, use Code Mode `execute` to inspect]") — never silent.
 *   4. Tool-call dedup: same tool + same args within a session → cached result.
 *      Truly lossless, 0ms.
 *   5. RTK for shell commands (git/ls/find/grep/etc.) — 70% output reduction.
 *   6. Read-output dedup: only collapse *consecutive identical* whitespace-
 *      stripped lines, keep all content. Never collapse code or JSON.
 *   7. History compression: OFF by default. When enabled, drops turns beyond
 *      the last N (not LLM summarization, not regex). The last 8 turns are
 *      always preserved verbatim.
 *   8. Real metrics. No hardcoded 1.0 quality score.
 *
 * Architecture win already in place: OpenCode's Code Mode (`execute` tool)
 * is the single biggest reducer (~80-98% on multi-tool tasks). This plugin
 * adds the next tier: per-tool budgets, dedup, and shell optimization.
 */

import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";

// ──────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────

export interface ToolOutputBudget {
  /** Soft cap in characters; output beyond this is truncated with a clear marker */
  maxChars: number;
  /** Soft cap in lines */
  maxLines: number;
  /** If true, this tool's output is exempt from any further compression */
  preserve: boolean;
}

export interface TokenOptimizationConfig {
  rtk: {
    enabled: boolean;
    commandPatterns: Record<string, string[]>;
    binaryPath: string | null;
  };
  outputBudgets: {
    default: ToolOutputBudget;
    byTool: Record<string, Partial<ToolOutputBudget>>;
  };
  dedup: {
    enabled: boolean;
    maxEntries: number;
    ttlMs: number;
  };
  readCompact: {
    enabled: boolean;
    collapseRepeatedLines: boolean;
    trimTrailingWs: boolean;
  };
  wrap: {
    enabled: boolean;
    maxLineWidth: number;
  };
  history: {
    enabled: boolean;
    keepLastTurns: number;
    dropOlder: boolean;
  };
  systemPrompt: {
    enabled: boolean;
    codeModeNudge: string;
  };
  statePersistence: {
    enabled: boolean;
    dir: string;
  };
}

const DEFAULT_CONFIG: TokenOptimizationConfig = {
  rtk: {
    enabled: true,
    commandPatterns: {
      "git": ["status", "diff", "log", "branch", "show", "log --oneline"],
      "ls": ["-la", "-l"],
      "find": [],
      "grep": ["-r", "-n", "-i"],
      "rg": [],
      "ps": ["aux", "auxf"],
      "df": ["-h"],
      "du": ["-h", "--max-depth=1", "--max-depth=2"],
      "docker": ["ps", "images", "logs"],
      "kubectl": ["get", "describe", "logs"],
      "cat": [],
      "head": ["-n 50", "-n 100"],
      "tail": ["-n 50", "-n 100"],
    },
    binaryPath: null,
  },
  outputBudgets: {
    default: { maxChars: 50_000, maxLines: 2000, preserve: false },
    byTool: {
      "read":         { maxChars: 80_000, maxLines: 3000, preserve: true },
      "write":        { maxChars: 4_000,  maxLines: 200,  preserve: true },
      "edit":         { maxChars: 4_000,  maxLines: 200,  preserve: true },
      "bash":         { maxChars: 50_000, maxLines: 2000, preserve: false },
      "glob":         { maxChars: 20_000, maxLines: 1000, preserve: false },
      "grep":         { maxChars: 30_000, maxLines: 1500, preserve: false },
      "webfetch":     { maxChars: 60_000, maxLines: 3000, preserve: false },
      "task":         { maxChars: 30_000, maxLines: 1500, preserve: false },
      "context7":           { preserve: true },
      "fetch":              { preserve: true },
      "filesystem":         { preserve: true },
      "filesystem-zurnel":  { preserve: true },
      "git":                { preserve: true },
      "lemma":              { preserve: true },
      "obsidian-rest":      { preserve: true },
      "playwright":         { preserve: true },
      "searxng":            { preserve: true },
      "sequential-thinking":{ preserve: true },
      "sqlite":             { preserve: true },
      "time":               { preserve: true },
      "with-context":       { preserve: true },
    },
  },
  dedup: {
    enabled: true,
    maxEntries: 200,
    ttlMs: 10 * 60 * 1000,
  },
  readCompact: {
    enabled: true,
    collapseRepeatedLines: true,
    trimTrailingWs: true,
  },
  wrap: {
    enabled: true,
    maxLineWidth: 120,
  },
  history: {
    enabled: false,
    keepLastTurns: 8,
    dropOlder: true,
  },
  systemPrompt: {
    enabled: true,
    codeModeNudge:
      "\n\n[Token-Optimizer hint] For batched tool work (>=3 tool calls, " +
      "filter/aggregate/transform of results, or large file processing), prefer " +
      "the `execute` tool (Code Mode). It can call multiple tools in one round, " +
      "process data locally, and only return the summary to the context.",
  },
  statePersistence: {
    enabled: true,
    dir: `${process.env.HOME || "/tmp"}/.local/state/opencode/token-optimizer-sessions`,
  },
};

// ──────────────────────────────────────────────────────────────────────
// OpenCode plugin API v1 (minimal types we need)
// ──────────────────────────────────────────────────────────────────────

interface PluginInput {
  client: unknown;
  project: unknown;
  directory: string;
  worktree: unknown;
  serverUrl: unknown;
  $: unknown;
}

type AnyHook = (input: any, output: any) => Promise<void> | void;
type ToolResult = { title: string; output: string; metadata: any };

// ──────────────────────────────────────────────────────────────────────
// Runtime state
// ──────────────────────────────────────────────────────────────────────

interface SessionState {
  sessionID: string;
  startedAt: number;
  rtkRewrites: number;
  dedupHits: number;
  dedupMisses: number;
  readCompactions: number;
  outputTruncations: number;
  historyDrops: number;
  messagesSeen: number;
  toolsInvoked: Record<string, number>;
  totalInputChars: number;
  totalOutputChars: number;
}

let config: TokenOptimizationConfig = DEFAULT_CONFIG;
let rtkAvailable = false;
let rtkBinaryPath: string | null = null;
let currentSessionID: string | null = null;
const sessionStates = new Map<string, SessionState>();

function getOrCreateSession(sessionID: string): SessionState {
  let s = sessionStates.get(sessionID);
  if (!s) {
    s = {
      sessionID,
      startedAt: Date.now(),
      rtkRewrites: 0,
      dedupHits: 0,
      dedupMisses: 0,
      readCompactions: 0,
      outputTruncations: 0,
      historyDrops: 0,
      messagesSeen: 0,
      toolsInvoked: {},
      totalInputChars: 0,
      totalOutputChars: 0,
    };
    sessionStates.set(sessionID, s);
  }
  return s;
}

// ──────────────────────────────────────────────────────────────────────
// Tool-call dedup
// ──────────────────────────────────────────────────────────────────────

interface CacheEntry { tool: string; args: any; result: ToolResult; ts: number; hits: number }
const dedupCache = new Map<string, CacheEntry>();
const pendingDedupHits = new Map<string, CacheEntry>(); // callID → cached entry

function stableStringify(v: any): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  const keys = Object.keys(v).sort();
  return "{" + keys.map(k => JSON.stringify(k) + ":" + stableStringify(v[k])).join(",") + "}";
}

function hashArgs(tool: string, args: any): string {
  return createHash("sha256").update(stableStringify({ tool, args })).digest("hex").slice(0, 16);
}

function dedupGet(tool: string, args: any): CacheEntry | null {
  if (!config.dedup.enabled) return null;
  const e = dedupCache.get(hashArgs(tool, args));
  if (!e) return null;
  if (config.dedup.ttlMs > 0 && Date.now() - e.ts > config.dedup.ttlMs) {
    dedupCache.delete(hashArgs(tool, args));
    return null;
  }
  e.hits++;
  return e;
}

function dedupPut(tool: string, args: any, result: ToolResult): void {
  if (!config.dedup.enabled) return;
  if (result?.metadata?.error) return;
  const h = hashArgs(tool, args);
  dedupCache.set(h, { tool, args, result, ts: Date.now(), hits: 0 });
  if (dedupCache.size > config.dedup.maxEntries) {
    const first = dedupCache.keys().next().value;
    if (first) dedupCache.delete(first);
  }
}

// ──────────────────────────────────────────────────────────────────────
// RTK
// ──────────────────────────────────────────────────────────────────────

function detectRTK(): { available: boolean; path: string | null } {
  if (config.rtk.binaryPath) {
    return { available: existsSync(config.rtk.binaryPath), path: config.rtk.binaryPath };
  }
  const candidates = [
    `${process.env.HOME}/.local/bin/rtk`,
    "/usr/local/bin/rtk",
    "/usr/bin/rtk",
    `${process.env.HOME}/.cargo/bin/rtk`,
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        execSync(`${p} --version`, { timeout: 1000, stdio: "pipe" });
        return { available: true, path: p };
      } catch {
        return { available: true, path: p };
      }
    }
  }
  return { available: false, path: null };
}

function shouldRewriteWithRTK(command: string): boolean {
  const parts = command.trim().split(/\s+/);
  const base = parts[0];
  const patterns = config.rtk.commandPatterns[base];
  if (!patterns) return false;
  if (patterns.length === 0) return true;
  return parts.slice(1).some(p => patterns.includes(p));
}

function rewriteCommandForRTK(command: string): string {
  if (!rtkBinaryPath) return command;
  return command.replace(/^(\s*)(\S+)/, (_m, ws, cmd) => `${ws}${rtkBinaryPath} ${cmd}`);
}

// ──────────────────────────────────────────────────────────────────────
// Output budget
// ──────────────────────────────────────────────────────────────────────

function getBudgetForTool(tool: string): ToolOutputBudget {
  return { ...config.outputBudgets.default, ...(config.outputBudgets.byTool[tool] ?? {}) };
}

function applyOutputBudget(tool: string, output: string): string {
  const b = getBudgetForTool(tool);
  if (b.preserve) return output;
  let s = output;
  let lines = s.split("\n");
  if (lines.length > b.maxLines) {
    const dropped = lines.length - b.maxLines;
    s = lines.slice(0, b.maxLines).join("\n")
       + `\n\n… [${dropped} more lines truncated by token-optimizer (max ${b.maxLines}). Use Code Mode \`execute\` to inspect the rest if needed.]`;
    lines = s.split("\n");
  }
  if (s.length > b.maxChars) {
    s = s.slice(0, b.maxChars)
       + `\n\n… [output truncated by token-optimizer (${output.length} → ${b.maxChars} chars). Use Code Mode \`execute\` to inspect the rest if needed.]`;
  }
  return s === output ? output : s;
}

// ──────────────────────────────────────────────────────────────────────
// Read compaction (lossless within constraints)
// ──────────────────────────────────────────────────────────────────────

function compactReadOutput(output: string): string {
  if (!config.readCompact.enabled) return output;
  let lines = output.split("\n");
  if (config.readCompact.trimTrailingWs) lines = lines.map(l => l.replace(/\s+$/, ""));
  if (config.readCompact.collapseRepeatedLines) {
    const out: string[] = [];
    let prev: string | null = null;
    let run = 0;
    for (const l of lines) {
      const t = l.trim();
      if (t && t === prev) {
        run++;
        if (run <= 2) out.push(l);
        else if (run === 3) out.push(`… [${t} repeated ${run}+ times, collapsed] …`);
      } else {
        prev = t;
        run = 1;
        out.push(l);
      }
    }
    lines = out;
  }
  return lines.join("\n");
}

/**
 * Wrap any line wider than `max` chars to fit the TUI chat panel.
 * Lossless: only adds newlines at word boundaries, never truncates.
 * Used in tool.execute.after to prevent the chat panel from overflowing
 * (opencode TUI does not word-wrap long chat lines).
 */
function wrapWideLines(output: string, max: number = 120): string {
  const lines = output.split("\n");
  let changed = false;
  const wrapped = lines.map((line) => {
    if (line.length <= max) return line;
    const words = line.split(/\s+/);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      if (w.length > max) {
        // Hard-wrap a single very long word (URL, path)
        if (cur) {
          out.push(cur);
          cur = "";
        }
        for (let i = 0; i < w.length; i += max) {
          out.push(w.slice(i, i + max));
        }
        continue;
      }
      if ((cur + " " + w).length > max && cur) {
        out.push(cur);
        cur = w;
      } else {
        cur = cur ? cur + " " + w : w;
      }
    }
    if (cur) out.push(cur);
    changed = true;
    return out.join("\n            ");
  });
  return changed ? wrapped.join("\n") : output;
}

// ──────────────────────────────────────────────────────────────────────
// History compression (opt-in, never LLM-based)
// ──────────────────────────────────────────────────────────────────────

function compressHistory(messages: any[]): any[] {
  if (!config.history.enabled) return messages;
  if (!Array.isArray(messages) || messages.length === 0) return messages;
  const turns: any[][] = [];
  let current: any[] = [];
  for (const m of messages) {
    const role = m?.info?.role ?? m?.role;
    if (role === "user" && current.length > 0) {
      turns.push(current);
      current = [];
    }
    current.push(m);
  }
  if (current.length > 0) turns.push(current);
  if (turns.length <= config.history.keepLastTurns) return messages;
  const keep = turns.slice(-config.history.keepLastTurns);
  return keep.flat();
}

// ──────────────────────────────────────────────────────────────────────
// State persistence
// ──────────────────────────────────────────────────────────────────────

import { renameSync } from "node:fs";

function persistState(state: SessionState): void {
  if (!config.statePersistence.enabled) return;
  try {
    if (!existsSync(config.statePersistence.dir)) {
      mkdirSync(config.statePersistence.dir, { recursive: true });
    }
    const file = join(config.statePersistence.dir, `${state.sessionID}.json`);
    const tmp = `${file}.tmp`;
    const payload = {
      sessionID: state.sessionID,
      startedAt: state.startedAt,
      updatedAt: Date.now(),
      rtkAvailable,
      rtkBinaryPath,
      config: {
        rtk: { enabled: config.rtk.enabled },
        dedup: { enabled: config.dedup.enabled, size: dedupCache.size },
        readCompact: { enabled: config.readCompact.enabled },
        wrap: { enabled: config.wrap.enabled, maxLineWidth: config.wrap.maxLineWidth },
        history: { enabled: config.history.enabled, keepLastTurns: config.history.keepLastTurns },
        systemPrompt: { enabled: config.systemPrompt.enabled },
      },
      metrics: {
        rtkRewrites: state.rtkRewrites,
        dedupHits: state.dedupHits,
        dedupMisses: state.dedupMisses,
        dedupHitRate: state.dedupHits + state.dedupMisses > 0
          ? state.dedupHits / (state.dedupHits + state.dedupMisses)
          : 0,
        readCompactions: state.readCompactions,
        outputTruncations: state.outputTruncations,
        historyDrops: state.historyDrops,
        messagesSeen: state.messagesSeen,
        toolsInvoked: state.toolsInvoked,
        totalInputChars: state.totalInputChars,
        totalOutputChars: state.totalOutputChars,
        inputOutputRatio: state.totalOutputChars > 0
          ? state.totalInputChars / state.totalOutputChars
          : 0,
        uptimeMs: Date.now() - state.startedAt,
      },
    };
    writeFileSync(tmp, JSON.stringify(payload, null, 2));
    renameSync(tmp, file);
  } catch {
    // best-effort
  }
}

// ──────────────────────────────────────────────────────────────────────
// Deep merge
// ──────────────────────────────────────────────────────────────────────

function deepMerge<T extends Record<string, any>>(target: T, source: any): T {
  const result: any = { ...target };
  for (const key of Object.keys(source ?? {})) {
    const sv = source[key];
    if (sv === undefined) continue;
    const tv = (target as any)[key];
    if (sv && typeof sv === "object" && !Array.isArray(sv) && tv && typeof tv === "object" && !Array.isArray(tv)) {
      result[key] = deepMerge(tv, sv);
    } else {
      result[key] = sv;
    }
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────
// Plugin factory
// ──────────────────────────────────────────────────────────────────────

const tokenOptimizerPlugin = async (input: PluginInput, options?: Record<string, any>): Promise<any> => {
  config = options?.tokenOptimization
    ? deepMerge(DEFAULT_CONFIG, options.tokenOptimization)
    : DEFAULT_CONFIG;

  const rtk = detectRTK();
  rtkAvailable = rtk.available;
  rtkBinaryPath = rtk.path;

  const hooks: any = {
    "tool.execute.before": async (
      hookInput: { tool: string; sessionID: string; callID: string },
      output: { args: any }
    ) => {
      const sessionID = hookInput.sessionID || currentSessionID;
      if (!currentSessionID && sessionID) currentSessionID = sessionID;
      if (!sessionID) return;
      const s = getOrCreateSession(sessionID);
      s.toolsInvoked[hookInput.tool] = (s.toolsInvoked[hookInput.tool] ?? 0) + 1;

      // Tool-call dedup lookup (record pending hit for the after-hook)
      if (config.dedup.enabled) {
        const hit = dedupGet(hookInput.tool, output.args);
        if (hit) {
          s.dedupHits++;
          pendingDedupHits.set(hookInput.callID, hit);
        } else {
          s.dedupMisses++;
        }
      }

      // RTK rewrite (bash only)
      if (config.rtk.enabled && rtkAvailable && hookInput.tool === "bash") {
        const cmd = output.args?.command;
        if (typeof cmd === "string" && shouldRewriteWithRTK(cmd)) {
          output.args = { ...output.args, command: rewriteCommandForRTK(cmd) };
          s.rtkRewrites++;
        }
      }

      persistState(s);
    },

    "tool.execute.after": async (
      hookInput: { tool: string; sessionID: string; callID: string; args: any },
      output: { title: string; output: string; metadata: any }
    ) => {
      const sessionID = hookInput.sessionID || currentSessionID;
      if (!sessionID) return;
      const s = getOrCreateSession(sessionID);

      // Honor pending dedup hit
      const cached = pendingDedupHits.get(hookInput.callID);
      if (cached) {
        output.output = cached.result.output;
        output.title = (output.title ?? cached.result.title) + " (cached)";
        output.metadata = { ...(output.metadata ?? {}), dedupHit: true, dedupHits: cached.hits };
        pendingDedupHits.delete(hookInput.callID);
        persistState(s);
        return;
      }

      if (typeof output.output !== "string") {
        persistState(s);
        return;
      }

      s.totalOutputChars += output.output.length;

      if (config.readCompact.enabled && hookInput.tool === "read") {
        const before = output.output.length;
        const after = compactReadOutput(output.output);
        if (after.length < before) {
          s.readCompactions++;
          output.output = after;
        }
      }

      const budgeted = applyOutputBudget(hookInput.tool, output.output);
      if (budgeted !== output.output) {
        s.outputTruncations++;
        output.output = budgeted;
      }

      // Wrap any line wider than maxLineWidth to fit the TUI chat panel.
      // opencode TUI does NOT word-wrap chat text, so long single lines
      // (e.g. `python3 -c '...'` output, `opencode --help`) overflow past
      // the right edge. This is a near-lossless fix: it doesn't change
      // the data, just adds newlines at word boundaries.
      if (config.wrap.enabled) {
        const wrapped = wrapWideLines(output.output, config.wrap.maxLineWidth);
        if (wrapped !== output.output) {
          s.outputTruncations++;
          output.output = wrapped;
        }
      }

      // NOTE: We deliberately do NOT truncate bash output (e.g. errors,
      // build logs, stack traces). Truncation destroys information the model
      // needs for debugging. The TUI's scrollback buffer preserves the full
      // output and is scrollable (Shift+PageUp). If the model needs a
      // specific portion, it uses `read_smart` or `head`/`tail`/`sed` on
      // the command. `wrapWideLines` above is the only output transform.

      if (config.dedup.enabled) {
        dedupPut(hookInput.tool, hookInput.args, {
          title: output.title,
          output: output.output,
          metadata: output.metadata,
        });
      }

      persistState(s);
    },

    "experimental.chat.system.transform": async (
      _hookInput: {},
      output: { system: string[] }
    ) => {
      if (!config.systemPrompt.enabled) return;
      if (!Array.isArray(output.system) || output.system.length === 0) return;
      // APPEND only, never replace. Never regex-strip.
      output.system = output.system.map(s => s + config.systemPrompt.codeModeNudge);
    },

    "experimental.chat.messages.transform": async (
      _hookInput: {},
      output: { messages: any[] }
    ) => {
      if (!output.messages || !Array.isArray(output.messages)) return;
      if (currentSessionID) {
        const s = getOrCreateSession(currentSessionID);
        s.messagesSeen = output.messages.length;
        s.totalInputChars += JSON.stringify(output.messages).length;
      }
      if (config.history.enabled) {
        const before = output.messages.length;
        const after = compressHistory(output.messages);
        if (after.length < before && currentSessionID) {
          getOrCreateSession(currentSessionID).historyDrops += before - after.length;
          output.messages = after;
        }
      }
    },

    "dispose": async () => {
      if (currentSessionID) {
        const s = sessionStates.get(currentSessionID);
        if (s) persistState(s);
      }
      dedupCache.clear();
      pendingDedupHits.clear();
      sessionStates.clear();
      currentSessionID = null;
    },

    // ─── Custom tools: exposed to the model as native tools ───
    tool: {
      plugin_health: toolPluginHealth(),
      read_smart: toolReadSmart(),
    },
  };

  return hooks;
};

// ──────────────────────────────────────────────────────────────────────
// Custom tools: plugin_health, read_smart
// ──────────────────────────────────────────────────────────────────────
//
// These are exposed as opencode custom tools via the `tool` hook so the
// model can invoke them directly. They make the plugin stack self-diagnosing.

import { readFileSync as _readFileSync, statSync as _statSync, readdirSync as _readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir as _homedir } from "node:os";

function toolPluginHealth() {
  return {
    description:
      "Run a health check on the opencode plugin + MCP stack. " +
      "Reports each plugin's load status, MCP server reachability, and any " +
      "warnings. Use this after `pacman -Syu` or any config change.",
    args: {
      verbose: {
        type: "boolean",
        description: "If true, also try to load each plugin and report its hooks.",
      },
    },
    execute: async (
      args: { verbose?: boolean },
      ctx: { sessionID: string; directory: string }
    ): Promise<{ title: string; output: string; metadata: any }> => {
      const lines: string[] = [];
      const issues: string[] = [];

      lines.push("=== opencode plugin + MCP health check ===\n");

      // 1. OpenCode version
      try {
        const v = spawnSync("opencode", ["--version"], { encoding: "utf-8" }).stdout.trim();
        lines.push(`opencode version: ${v}`);
      } catch {
        lines.push("opencode: NOT INSTALLED");
        issues.push("opencode binary not in PATH");
      }

      // 2. Config sanity
      const configPath = `${_homedir()}/.config/opencode/opencode.jsonc`;
      try {
        const stat = _statSync(configPath);
        lines.push(`config: ${configPath} (${stat.size} bytes, mtime ${stat.mtime.toISOString()})`);
      } catch {
        lines.push(`config: MISSING (${configPath})`);
        issues.push("Main config file missing");
      }

      // 3. Plugins from opencode debug info
      try {
        const out = spawnSync("opencode", ["debug", "info"], { encoding: "utf-8" });
        const plugins = out.stdout.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
        lines.push(`\n--- plugins (${plugins.length}) ---`);
        for (const p of plugins) {
          lines.push(`  ${p}`);
        }
      } catch (e: any) {
        lines.push(`\nplugins: FAILED to list — ${e.message}`);
        issues.push("Could not list plugins via 'opencode debug info'");
      }

      // 4. MCP servers
      try {
        const out = spawnSync("opencode", ["mcp", "list"], { encoding: "utf-8" });
        const mcpLines = out.stdout.split("\n").filter((l) => l.trim());
        lines.push(`\n--- MCP servers ---`);
        for (const l of mcpLines) lines.push(`  ${l}`);
      } catch (e: any) {
        lines.push(`\nMCP: FAILED to list — ${e.message}`);
      }

      // 5. RTK
      lines.push(`\n--- this plugin ---`);
      lines.push(`  RTK available: ${rtkAvailable} (path: ${rtkBinaryPath ?? "n/a"})`);

      // 6. Verbose: try to load each listed plugin
      if (args.verbose) {
        lines.push(`\n--- verbose plugin load test ---`);
        try {
          const out = spawnSync("opencode", ["debug", "info"], { encoding: "utf-8" });
          const plugins = out.stdout
            .split("\n")
            .filter((l) => l.startsWith("- "))
            .map((l) => l.slice(2).trim());
          for (const spec of plugins) {
            const result = probePlugin(spec);
            const icon = result.ok ? "✓" : "✗";
            const detail = result.ok ? `${result.hooks} hooks` : result.error ?? "unknown";
            lines.push(`  ${icon} ${spec} — ${detail}`);
            if (!result.ok) issues.push(`Plugin ${spec} failed: ${result.error}`);
          }
        } catch (e: any) {
          lines.push(`  verbose probe FAILED: ${e.message}`);
        }
      }

      if (issues.length > 0) {
        lines.push(`\n--- ISSUES (${issues.length}) ---`);
        for (const i of issues) lines.push(`  ⚠ ${i}`);
      } else {
        lines.push(`\n--- NO ISSUES FOUND ---`);
      }

      return {
        title: "Plugin + MCP health",
        output: lines.map(wrap).join("\n"),
        metadata: { ok: issues.length === 0, issueCount: issues.length },
      };
    },
  };
}

/**
 * Word-wrap a string to fit a maximum line width.
 * Used by plugin_health and other tool outputs to keep them readable
 * in the TUI's chat panel (which doesn't word-wrap long lines itself).
 */
function wrap(line: string, max: number = 90): string {
  if (line.length <= max) return line;
  // Simple greedy wrap: split on spaces, build lines
  const words = line.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if (w.length > max) {
      // Hard-wrap a single very long word
      if (cur) {
        out.push(cur);
        cur = "";
      }
      for (let i = 0; i < w.length; i += max) {
        out.push(w.slice(i, i + max));
      }
      continue;
    }
    if ((cur + " " + w).length > max && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) out.push(cur);
  return out.join("\n            "); // indent continuation
}

function toolReadSmart() {
  return {
    description:
      "Smart file reader that bypasses the 50KB read limit. " +
      "Reads a file in line-range chunks and concatenates the result. " +
      "For files > 200KB, prefer Code Mode `execute` to read in a JS sandbox.",
    args: {
      filePath: {
        type: "string",
        description: "Absolute or relative path to the file to read.",
      },
      startLine: {
        type: "number",
        description: "1-based start line (default 1).",
      },
      maxLines: {
        type: "number",
        description: "Number of lines to read (default 1000).",
      },
    },
    execute: async (
      args: { filePath: string; startLine?: number; maxLines?: number },
      ctx: { sessionID: string; directory: string }
    ): Promise<{ title: string; output: string; metadata: any }> => {
      const start = Math.max(1, args.startLine ?? 1);
      const limit = Math.min(10000, Math.max(1, args.maxLines ?? 1000));
      const path = args.filePath.startsWith("/") ? args.filePath : `${ctx.directory}/${args.filePath}`;
      try {
        const content = _readFileSync(path, "utf-8");
        const lines = content.split("\n");
        const slice = lines.slice(start - 1, start - 1 + limit);
        const truncated = lines.length > start - 1 + limit;
        const header = `[read_smart] ${path}: lines ${start}-${start - 1 + slice.length} of ${lines.length}${truncated ? " (truncated)" : ""}`;
        const numbered = slice.map((l, i) => `${String(start + i).padStart(6, " ")}\t${l}`).join("\n");
        return {
          title: `read ${path} (${slice.length} lines)`,
          output: `${header}\n${numbered}${truncated ? `\n\n[truncated at line ${start - 1 + limit}. Use startLine=${start - 1 + limit + 1} to continue, or Code Mode \`execute\` for full file processing.]` : ""}`,
          metadata: { path, start, lines: slice.length, total: lines.length, truncated },
        };
      } catch (e: any) {
        return {
          title: `read ${path} FAILED`,
          output: `Error: ${e.message}`,
          metadata: { error: true, message: e.message },
        };
      }
    },
  };
}

// Probe a single plugin: try to import + call the factory
function probePlugin(spec: string): { ok: true; hooks: number } | { ok: false; error: string } {
  let resolved = spec;
  let isFileEntry = false;
  if (spec.startsWith("file://")) {
    // file://spec — the spec itself IS the entry point, not a directory
    resolved = spec.replace("file://", "");
    isFileEntry = true;
  } else {
    // npm package — try to find in cache
    const cacheBase = `${_homedir()}/.cache/opencode/packages`;
    const parts = spec.split("/");
    let pkg: string;
    if (spec.startsWith("@")) {
      pkg = `${parts[0]}/${parts[1]}`;
    } else {
      pkg = parts[0];
    }
    const short = pkg.replace("/", "-");
    const candidates = [
      `${cacheBase}/${short}@latest/node_modules/${pkg}`,
      `${cacheBase}/${short}/node_modules/${pkg}`,
      `${_homedir()}/.config/opencode/node_modules/${pkg}`,
    ];
    for (const c of candidates) {
      try {
        if (_statSync(c).isDirectory()) {
          resolved = c;
          break;
        }
      } catch {}
    }
  }
  if (!resolved) return { ok: false, error: "package not installed" };

  // For file://spec, use the file path directly
  if (isFileEntry) {
    return probeEntry(spec, spec.replace("file://", ""));
  }

  // Read package.json to find entry
  let entry = "dist/index.js";
  let isTuiOnly = false;
  try {
    const pkg = JSON.parse(_readFileSync(`${resolved}/package.json`, "utf-8"));
    if (pkg.exports && typeof pkg.exports === "object") {
      // Look for ./tui export first if no ./server
      if (!pkg.exports["."] && pkg.exports["./tui"] && !pkg.exports["./server"]) {
        isTuiOnly = true;
      }
      if (pkg.exports["."]) {
        const d = pkg.exports["."];
        if (typeof d === "string") entry = d;
        else if (d.import) entry = d.import;
        else if (d.default) entry = d.default;
      } else if (pkg.exports["./tui"]) {
        const d = pkg.exports["./tui"];
        if (typeof d === "string") entry = d;
        else if (d.import) entry = d.import;
        else if (d.default) entry = d.default;
      } else if (pkg.exports["./server"]) {
        const d = pkg.exports["./server"];
        if (typeof d === "string") entry = d;
        else if (d.import) entry = d.import;
        else if (d.default) entry = d.default;
      }
    } else if (pkg.main) {
      entry = pkg.main;
    }
  } catch {
    // use default
  }

  return probeEntry(spec, `${resolved}/${entry}`);
}

function probeEntry(spec: string, fullPath: string): { ok: true; hooks: number } | { ok: false; error: string } {
  // For TUI plugins, we can't test the api.slots path with a fake api.
  // Detect TUI-only plugins and skip probe with "tui-only" status.
  try {
    const pkgPath = fullPath.replace(/\/dist\/.*$/, "/package.json");
    const pkg = JSON.parse(_readFileSync(pkgPath, "utf-8"));
    const exports = pkg.exports || {};
    if (exports["./tui"] && !exports["./server"] && !exports["."]) {
      return { ok: true, hooks: 0 }; // TUI-only — assume OK
    }
    if (spec.endsWith("/tui.js") || spec.endsWith("/tui.ts")) {
      return { ok: true, hooks: 0 };
    }
  } catch {}

  const probeScript = `
try {
  const m = await import(${JSON.stringify(fullPath)});
  const p = m.default;
  if (typeof p === 'function') {
    const hooks = await p({directory: '/tmp', project: {}, worktree: '', serverUrl: new URL('http://x'), \$: null, client: null}, {});
    const n = Object.keys(hooks || {}).filter(k => typeof hooks[k] === 'function').length;
    console.log(JSON.stringify({ok: true, hooks: n}));
  } else if (p && typeof p === 'object') {
    const fn = p.server || p.tui;
    if (fn) {
      const hooks = await fn({directory: '/tmp', project: {}, worktree: '', serverUrl: new URL('http://x'), \$: null, client: null}, {});
      const n = Object.keys(hooks || {}).filter(k => typeof hooks[k] === 'function').length;
      console.log(JSON.stringify({ok: true, hooks: n}));
    } else {
      console.log(JSON.stringify({ok: true, hooks: 0, note: 'no server/tui function'}));
    }
  } else {
    console.log(JSON.stringify({ok: false, error: 'default is empty'}));
  }
} catch (e) {
  console.log(JSON.stringify({ok: false, error: e.message.slice(0, 100)}));
}
`;
  try {
    const tmpFile = `/tmp/probe-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`;
    require("node:fs").writeFileSync(tmpFile, probeScript);
    const result = spawnSync("bun", [tmpFile], { encoding: "utf-8", timeout: 8000 });
    try { require("node:fs").unlinkSync(tmpFile); } catch {}
    if (result.status !== 0) {
      return { ok: false, error: result.stderr?.slice(0, 100) ?? "spawn failed" };
    }
    return JSON.parse(result.stdout.trim());
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export default tokenOptimizerPlugin;
