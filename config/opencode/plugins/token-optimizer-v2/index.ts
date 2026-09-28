/**
 * opencode-token-optimizer — V2 native port
 *
 * Reimplements the V1 optimizer against the V2 request pipeline. All of the
 * V1 logic is preserved:
 *   - RTK shell rewriting (before)
 *   - tool-output budgets per tool (after)
 *   - read-output compaction (after)
 *   - wide-line wrapping for the TUI (after)
 *   - call dedup for pure query tools, invalidated by any mutation
 *   - Code Mode nudge appended to the system prompt (context)
 *   - history compression (off by default)
 *   - per-session metrics persisted to state dir
 *   - plugin_health + read_smart tools
 *
 * The V1 entrypoint ran `experimental.chat.messages.transform` for the nudge
 * and metrics. V2 has no equivalent: the system prompt is part of the
 * `context` hook, which is registered here. `experimental.text.complete` has
 * no V2 destination and is intentionally not reproduced.
 */
import { Plugin } from "@opencode/plugin"
import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, writeFileSync, mkdirSync, renameSync, readFileSync, statSync, readdirSync, unlinkSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { MUTATING_TOOLS, DEDUP_TOOLS, TOOL_SHELL, type OptimizerState } from "./state.js"

type Json = any

const CFG = {
  rtk: { enabled: true, patterns: ["git", "ls", "find", "grep", "rg", "ps", "df", "du", "docker", "kubectl", "cat", "head", "tail"] },
  budgets: {
    default: { maxChars: 50_000, maxLines: 2000 },
    byTool: {
      read: { maxChars: 80_000, maxLines: 3000, preserve: true },
      write: { maxChars: 4_000, maxLines: 200, preserve: true },
      edit: { maxChars: 4_000, maxLines: 200, preserve: true },
      // v2 renamed the shell tool from "bash" to "shell"; keying this as "bash"
      // means the shell budget never applies.
      shell: { maxChars: 50_000, maxLines: 2000 },
      glob: { maxChars: 20_000, maxLines: 1000 },
      grep: { maxChars: 30_000, maxLines: 1500 },
      webfetch: { maxChars: 60_000, maxLines: 3000 },
      task: { maxChars: 30_000, maxLines: 1500 },
    } as Record<string, { maxChars?: number; maxLines?: number; preserve?: boolean }>,
  },
  dedup: { enabled: true, maxEntries: 200, ttlMs: 600_000, tools: ["glob", "grep"] },
  readCompact: { enabled: true, collapseRepeatedLines: true, trimTrailingWs: true },
  // DISABLED 2026-09-28. Wrapping cannot save tokens — it only splits lines and
  // adds the continuation indent, so it tends to cost tokens rather than save
  // them. Code stays in place; flip `enabled` back to true to restore it.
  wrap: { enabled: false, maxLineWidth: 120 },
  history: { enabled: false, keepLastTurns: 32 },
  systemPrompt: {
    enabled: true,
    codeModeNudge:
      "\n\n[Token-Optimizer hint] For batched tool work (>=3 tool calls, filter/aggregate/transform of results, or large file processing), prefer the `execute` tool (Code Mode). It can call multiple tools in one round, process data locally, and only return the summary to the context.",
  },
  stateDir: join(process.env.HOME || "/tmp", ".local", "state", "opencode", "token-optimizer-sessions"),
}

const MUTATING = MUTATING_TOOLS

/* ── state ───────────────────────────────────────────────────────────── */

interface Session {
  sessionID: string
  startedAt: number
  rtkRewrites: number
  dedupHits: number
  dedupMisses: number
  readCompactions: number
  outputTruncations: number
  historyDrops: number
  messagesSeen: number
  toolsInvoked: Record<string, number>
  totalInputChars: number
  totalOutputChars: number
}
const sessions = new Map<string, Session>()
function session(id: string): Session {
  let s = sessions.get(id)
  if (!s) {
    s = {
      sessionID: id, startedAt: Date.now(), rtkRewrites: 0, dedupHits: 0, dedupMisses: 0,
      readCompactions: 0, outputTruncations: 0, historyDrops: 0, messagesSeen: 0,
      toolsInvoked: {}, totalInputChars: 0, totalOutputChars: 0,
    }
    sessions.set(id, s)
  }
  return s
}

/* ── dedup ─────────────────────────────────────────────────────────────── */

const dedupCache = new Map<string, { output: string; ts: number; hits: number }>()
const pendingHits = new Map<string, { output: string; hits: number }>()

function stable(v: Json): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v)
  if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]"
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + stable(v[k])).join(",") + "}"
}

function persist(s: Session) {
  try {
    if (!existsSync(CFG.stateDir)) mkdirSync(CFG.stateDir, { recursive: true })
    pruneStates()
    const file = join(CFG.stateDir, `${s.sessionID}.json`)
    const tmp = file + ".tmp"
    // MUST match OptimizerState: the TUI widget reads state.config.* and
    // state.metrics.*. A flat payload type-checks and then renders all zeros.
    const payload: OptimizerState = {
      sessionID: s.sessionID,
      startedAt: s.startedAt,
      updatedAt: Date.now(),
      rtkAvailable: !!rtkPath,
      rtkBinaryPath: rtkPath,
      config: {
        rtk: { enabled: CFG.rtk.enabled },
        dedup: { enabled: CFG.dedup.enabled, size: dedupCache.size },
        readCompact: { enabled: CFG.readCompact.enabled },
        wrap: { enabled: CFG.wrap.enabled, maxLineWidth: CFG.wrap.maxLineWidth },
        history: { enabled: CFG.history.enabled, keepLastTurns: CFG.history.keepLastTurns },
        systemPrompt: { enabled: CFG.systemPrompt.enabled },
      },
      metrics: {
        rtkRewrites: s.rtkRewrites,
        dedupHits: s.dedupHits,
        dedupMisses: s.dedupMisses,
        readCompactions: s.readCompactions,
        outputTruncations: s.outputTruncations,
        historyDrops: s.historyDrops,
        messagesSeen: s.messagesSeen,
        toolsInvoked: s.toolsInvoked,
        totalInputChars: s.totalInputChars,
        totalOutputChars: s.totalOutputChars,
        dedupHitRate: s.dedupHits + s.dedupMisses > 0 ? s.dedupHits / (s.dedupHits + s.dedupMisses) : 0,
        uptimeMs: Date.now() - s.startedAt,
      },
    }
    writeFileSync(tmp, JSON.stringify(payload, null, 2))
    renameSync(tmp, file)
  } catch { /* best effort */ }
}

let pruned = false
function pruneStates(keep = 100) {
  if (pruned) return
  pruned = true
  try {
    const files = readdirSync(CFG.stateDir)
      .filter(f => f.endsWith(".json"))
      .map(f => ({ f, m: statSync(join(CFG.stateDir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m)
    for (const o of files.slice(keep)) {
      try { unlinkSync(join(CFG.stateDir, o.f)) } catch { /* ignore */ }
    }
  } catch { /* dir may not exist */ }
}

const hashOf = (tool: string, args: Json) => createHash("sha256").update(stable({ tool, args })).digest("hex").slice(0, 16)

/* ── transforms ──────────────────────────────────────────────────────── */

let rtkPath: string | null = null
function detectRtk(): string | null {
  const cands = [
    join(process.env.HOME || "/tmp", ".local", "bin", "rtk"),
    "/usr/local/bin/rtk", "/usr/bin/rtk",
    join(process.env.HOME || "/tmp", ".cargo", "bin", "rtk"),
  ]
  for (const p of cands) {
    if (!existsSync(p)) continue
    try { execSync(`${p} --version`, { timeout: 1000, stdio: "pipe" }) } catch { /* ok */ }
    return p
  }
  return null
}

function shouldRtk(cmd: string): boolean {
  const base = cmd.trim().split(/\s+/)[0] ?? ""
  const name = base.split("/").pop() ?? base
  return CFG.rtk.enabled && CFG.rtk.patterns.includes(name)
}

function budget(tool: string) {
  return { ...CFG.budgets.default, ...(CFG.budgets.byTool[tool] ?? {}) }
}

function applyBudget(tool: string, out: string): string {
  const b = budget(tool)
  if (b.preserve) return out
  let s = out
  const lines = s.split("\n")
  if (b.maxLines && lines.length > b.maxLines) {
    const dropped = lines.length - b.maxLines
    s = lines.slice(0, b.maxLines).join("\n") +
      `\n\n… [${dropped} more lines truncated by token-optimizer (max ${b.maxLines}). Use Code Mode \`execute\` to inspect the rest if needed.]`
  }
  if (b.maxChars && s.length > b.maxChars) {
    s = s.slice(0, b.maxChars) +
      `\n\n… [output truncated by token-optimizer (${out.length} → ${b.maxChars} chars). Use Code Mode \`execute\` to inspect the rest if needed.]`
  }
  return s
}

function compactRead(out: string): string {
  if (!CFG.readCompact.enabled) return out
  let lines = out.split("\n")
  if (CFG.readCompact.trimTrailingWs) lines = lines.map(l => l.replace(/\s+$/, ""))
  if (CFG.readCompact.collapseRepeatedLines) {
    const res: string[] = []
    let prev: string | null = null
    let run = 0
    for (const l of lines) {
      const t = l.trim()
      if (t && t === prev) {
        run++
        if (run <= 2) res.push(l)
        else if (run === 3) res.push(`… [${t} repeated ${run}+ times, collapsed] …`)
      } else {
        prev = t; run = 1; res.push(l)
      }
    }
    lines = res
  }
  return lines.join("\n")
}

/** Continuation indent for wrapped lines. Counted AGAINST the width budget:
 *  joining with this AFTER wrapping to `max` produced lines of max+12. */
const WRAP_INDENT = "            "

function wrapLines(out: string, max = CFG.wrap.maxLineWidth): string {
  if (!CFG.wrap.enabled || !out) return out
  // Continuation lines already carry WRAP_INDENT, so budget for it up front.
  const width = Math.max(20, max - WRAP_INDENT.length)
  const lines = out.split("\n")
  let changed = false
  const wrapped = lines.map(line => {
    if (line.length <= max) return line
    changed = true
    const words = line.split(/\s+/)
    const outLines: string[] = []
    let cur = ""
    for (const w of words) {
      if (w.length > width) {
        if (cur) { outLines.push(cur); cur = "" }
        for (let i = 0; i < w.length; i += width) outLines.push(w.slice(i, i + width))
        continue
      }
      if (cur && (cur + " " + w).length > width) { outLines.push(cur); cur = w }
      else cur = cur ? cur + " " + w : w
    }
    if (cur) outLines.push(cur)
    return outLines.join("\n" + WRAP_INDENT)
  })
  return changed ? wrapped.join("\n") : out
}

/* ── V2 result helpers ───────────────────────────────────────────────── */

function resultToString(result: Json): string {
  if (result == null) return ""
  if (typeof result === "string") return result
  const c = result.content
  if (typeof c === "string") return c
  if (Array.isArray(c)) {
    return c.map(p => (typeof p === "string" ? p : ((p?.text ?? p?.content ?? "")))).filter(Boolean).join("\n")
  }
  try { return JSON.stringify(result) } catch { return String(result) }
}

export default Plugin.define({
  id: "opencode-token-optimizer",

  async setup(ctx) {
    rtkPath = detectRtk()

    /* before: dedup lookup + RTK rewrite */
    await ctx.tool.hook("execute.before", (event: Json) => {
      const sid = event?.sessionID ?? "unknown"
      const s = session(sid)
      const tool = event?.tool ?? "?"
      s.toolsInvoked[tool] = (s.toolsInvoked[tool] ?? 0) + 1

      if (CFG.dedup.enabled && DEDUP_TOOLS.has(tool)) {
        const h = hashOf(tool, event?.input)
        const hit = dedupCache.get(h)
        if (hit && (CFG.dedup.ttlMs <= 0 || Date.now() - hit.ts <= CFG.dedup.ttlMs)) {
          hit.hits++
          s.dedupHits++
          if (event?.callID) pendingHits.set(event.callID, { output: hit.output, hits: hit.hits })
        } else {
          s.dedupMisses++
        }
      }

      if (rtkPath && tool === TOOL_SHELL) {
        const input = event?.input
        if (input && typeof input === "object" && typeof input.command === "string" && shouldRtk(input.command)) {
          input.command = input.command.replace(/^(\s*)(\S+)/, (_m, ws, cmd) => `${ws}${rtkPath} ${cmd}`)
          s.rtkRewrites++
        }
      }
      persist(s)
    })

    /* after: dedup replay, cache invalidate, compaction, budget, wrap */
    await ctx.tool.hook("execute.after", (event: Json) => {
      const sid = event?.sessionID ?? "unknown"
      const tool = event?.tool ?? "?"
      const s = session(sid)
      const callID = event?.callID ?? ""

      const cached = callID ? pendingHits.get(callID) : undefined
      if (cached) {
        event.result = { content: cached.output, metadata: { ...(event.result?.metadata ?? {}), dedupHit: true, dedupHits: cached.hits } }
        if (callID) pendingHits.delete(callID)
        persist(s)
        return
      }

      const isError = event?.status === "error" || !!event?.error
      if (MUTATING.has(tool) && !isError) dedupCache.clear()

      const before = resultToString(event?.result)
      if (!before) { persist(s); return }
      s.totalOutputChars += before.length

      let out = before
      if (CFG.readCompact.enabled && tool === "read") {
        const c = compactRead(out)
        if (c.length < out.length) { s.readCompactions++; out = c }
      }
      const budgeted = applyBudget(tool, out)
      if (budgeted !== out) { s.outputTruncations++; out = budgeted }
      const wrapped = wrapLines(out)
      if (wrapped !== out) { s.outputTruncations++; out = wrapped }

      if (out !== before) {
        event.result = { content: out, ...(event.result?.metadata ? { metadata: event.result.metadata } : {}) }
      }

      if (CFG.dedup.enabled && DEDUP_TOOLS.has(tool) && !isError) {
        const h = hashOf(tool, event?.input)
        dedupCache.set(h, { output: out, ts: Date.now(), hits: 0 })
        if (dedupCache.size > CFG.dedup.maxEntries) {
          const first = dedupCache.keys().next().value
          if (first) dedupCache.delete(first)
        }
      }
      persist(s)
    })

    /* context: Code Mode nudge + input metrics + history compression */
    await ctx.session.hook("context", (event: Json) => {
      if (CFG.systemPrompt.enabled && Array.isArray(event?.system) && event.system.length) {
        const last = event.system[event.system.length - 1]
        const addendum = CFG.systemPrompt.codeModeNudge
        if (typeof last === "string") event.system[event.system.length - 1] = last + addendum
        else if (last && typeof last.text === "string") last.text = last.text + addendum
        else event.system.push({ type: "text", text: addendum })
      }

      if (!Array.isArray(event?.messages)) return
      const sid = event?.sessionID ?? "unknown"
      const s = session(sid)
      s.messagesSeen = event.messages.length
      try { s.totalInputChars += stable(event.messages).length } catch { /* ignore */ }
      // Persist here too: this hook is the only writer of messagesSeen /
      // totalInputChars / historyDrops, and the tool hooks may not fire again
      // for a long stretch. Without this the TUI shows stale input counters.
      persist(s)

      if (CFG.history.enabled && event.messages.length) {
        const turns: Json[][] = []
        let cur: Json[] = []
        for (const m of event.messages) {
          if (m?.info?.role === "user" && cur.length) { turns.push(cur); cur = [] }
          cur.push(m)
        }
        if (cur.length) turns.push(cur)
        if (turns.length > CFG.history.keepLastTurns) {
          const keep = turns.slice(-CFG.history.keepLastTurns).flat()
          s.historyDrops += event.messages.length - keep.length
          event.messages = keep
        }
      }
    })

    /* tools */
    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "plugin_health",
        description: "Run a health check on the opencode plugin + MCP stack. Reports each plugin's load status, MCP server reachability, and any warnings. Use this after `pacman -Syu` or any config change.",
        input: {
          type: "object",
          properties: { verbose: { type: "boolean", description: "Also enumerate configured plugins and MCP servers" } },
          additionalProperties: false,
        },
        execute: async (input: Json) => {
          const lines: string[] = ["=== opencode plugin + MCP health check ===", ""]
          const issues: string[] = []
          const ver = spawnCapture(["opencode", "--version"])
          lines.push(`opencode version: ${ver ?? "NOT INSTALLED"}`)
          if (!ver) issues.push("opencode binary not in PATH")

          const cfgDir = join(homedir(), ".config", "opencode")
          let cfg: Json = {}
          for (const f of ["opencode.json", "opencode.jsonc"]) {
            try {
              cfg = JSON.parse(stripComments(readFileSync(join(cfgDir, f), "utf8")))
              break
            } catch { /* try next */ }
          }
          const plugins: string[] = (cfg.plugins ?? cfg.plugin ?? []).map((p: Json) =>
            typeof p === "string" ? p : Array.isArray(p) ? p[0] : p?.package,
          ).filter(Boolean)
          lines.push("", `--- plugins configured (${plugins.length}) ---`)
          for (const p of plugins) lines.push(`  ${p}`)

          const mcp = cfg.mcp && typeof cfg.mcp === "object" ? (cfg.mcp.servers ?? cfg.mcp) : {}
          const names = Object.keys(mcp)
          lines.push("", `--- MCP servers configured (${names.length}) ---`)
          for (const n of names) {
            const e = (mcp as Json)[n]
            const disabled = (cfg.mcp?.servers ? e?.disabled : e?.enabled === false) ?? false
            lines.push(`  ${n}: ${disabled ? "disabled" : "enabled"}`)
          }

          if (input?.verbose) {
            const live = spawnJSON(["opencode", "debug", "config"])
            if (live) {
              const docs = live.filter((d: Json) => d?.type === "document")
              for (const d of docs) {
                const list = d?.info?.plugins ?? []
                lines.push("", `--- resolved plugins in ${d.path} (${list.length}) ---`)
                for (const p of list) lines.push(`  ${p?.package ?? p}`)
              }
            } else {
              issues.push("could not run `opencode debug config` (it reports the background service, which may be stale — restart it)")
            }
          }

          lines.push("", `--- this plugin ---`, `  RTK available: ${!!rtkPath} (path: ${rtkPath ?? "n/a"})`)
          lines.push("", issues.length ? `--- ISSUES (${issues.length}) ---` : "--- NO ISSUES FOUND ---")
          for (const i of issues) lines.push(`  ⚠ ${i}`)
          return { content: lines.map(l => wrapLine(l)).join("\n") }
        },
      })

      editor.add({
        name: "read_smart",
        description: "Smart file reader that bypasses the 50KB read limit. Reads a file in line-range chunks and concatenates the result. For files > 200KB, prefer Code Mode `execute` to read in a JS sandbox.",
        input: {
          type: "object",
          properties: {
            filePath: { type: "string", description: "Absolute or relative path" },
            startLine: { type: "number", description: "1-based start line (default 1)" },
            maxLines: { type: "number", description: "Number of lines (default 1000)" },
          },
          required: ["filePath"],
          additionalProperties: false,
        },
        execute: async (input: Json) => {
          const start = Math.max(1, Number(input?.startLine ?? 1))
          const limit = Math.min(10000, Math.max(1, Number(input?.maxLines ?? 1000)))
          const fp = String(input?.filePath ?? "")
          const path = fp.startsWith("/") ? fp : join(ctx?.location?.directory ?? process.cwd(), fp)
          try {
            const lines = readFileSync(path, "utf8").split("\n")
            const slice = lines.slice(start - 1, start - 1 + limit)
            const truncated = lines.length > start - 1 + limit
            const header = `[read_smart] ${path}: lines ${start}-${start - 1 + slice.length} of ${lines.length}${truncated ? " (truncated)" : ""}`
            const numbered = slice.map((l, i) => `${String(start + i).padStart(6, " ")}\t${l}`).join("\n")
            const tail = truncated
              ? `\n\n[truncated at line ${start - 1 + limit}. Use startLine=${start - 1 + limit + 1} to continue, or Code Mode \`execute\` for full file processing.]`
              : ""
            return { content: `${header}\n${numbered}${tail}` }
          } catch (e: any) {
            return { content: `read ${path} FAILED: ${e?.message ?? e}` }
          }
        },
      })
    })

    return () => {
      const sid = [...sessions.keys()].pop()
      if (sid) persist(sessions.get(sid)!)
      dedupCache.clear()
      pendingHits.clear()
      sessions.clear()
    }
  },
})

/* ── small helpers ───────────────────────────────────────────────────── */

function stripComments(t: string): string {
  return t.split("\n").filter(l => !l.trim().startsWith("//")).join("\n").replace(/,(\s*[}\]])/g, "$1")
}
function wrapLine(l: string, max = 100): string {
  if (l.length <= max) return l
  const words = l.split(/\s+/)
  const out: string[] = []
  let cur = ""
  for (const w of words) {
    if (w.length > max) { if (cur) { out.push(cur); cur = "" } for (let i = 0; i < w.length; i += max) out.push(w.slice(i, i + max)); continue }
    if (cur && (cur + " " + w).length > max) { out.push(cur); cur = w } else cur = cur ? cur + " " + w : w
  }
  if (cur) out.push(cur)
  return out.join("\n            ")
}
function spawnCapture(args: string[], t = 8000): string | null {
  try {
    const { spawnSync } = require("node:child_process")
    const r = spawnSync(args[0], args.slice(1), { encoding: "utf8", timeout: t, killSignal: "SIGKILL" })
    return (r.stdout ?? "").trim() || null
  } catch { return null }
}
function spawnJSON(args: string[]): any[] | null {
  try {
    const { spawnSync } = require("node:child_process")
    const r = spawnSync(args[0], args.slice(1), { encoding: "utf8", timeout: 15000, killSignal: "SIGKILL" })
    if (r.status !== 0) return null
    return JSON.parse((r.stdout ?? "").trim())
  } catch { return null }
}
