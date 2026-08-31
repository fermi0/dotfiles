/**
 * opencode-token-optimizer — sidebar state reader
 *
 * Reads the per-session state JSON written by the server plugin (index.ts)
 * and exposes a minimal API the TUI widget consumes.
 */
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const STATE_DIR = join(process.env.HOME || "/tmp", ".local", "state", "opencode");
const SESSIONS_DIR = join(STATE_DIR, "token-optimizer-sessions");

export interface OptimizerMetrics {
  rtkRewrites: number;
  dedupHits: number;
  dedupMisses: number;
  dedupHitRate: number;
  readCompactions: number;
  outputTruncations: number;
  historyDrops: number;
  messagesSeen: number;
  toolsInvoked: Record<string, number>;
  totalInputChars: number;
  totalOutputChars: number;
  inputOutputRatio: number;
  uptimeMs: number;
}

export interface OptimizerConfig {
  rtk: { enabled: boolean };
  dedup: { enabled: boolean; size: number };
  readCompact: { enabled: boolean };
  wrap: { enabled: boolean; maxLineWidth: number };
  history: { enabled: boolean; keepLastTurns: number };
  systemPrompt: { enabled: boolean };
}

export interface SidebarState {
  sessionID: string;
  startedAt: number;
  updatedAt: number;
  rtkAvailable: boolean;
  rtkBinaryPath: string | null;
  config: OptimizerConfig;
  metrics: OptimizerMetrics;
}

function latestSessionFile(): string | null {
  try {
    if (!existsSync(SESSIONS_DIR)) return null;
    let best: { name: string; mtime: number } | null = null;
    for (const f of readdirSync(SESSIONS_DIR)) {
      if (!f.endsWith(".json") || f.endsWith(".tmp")) continue;
      const m = statSync(join(SESSIONS_DIR, f)).mtimeMs;
      if (!best || m > best.mtime) best = { name: f, mtime: m };
    }
    return best ? join(SESSIONS_DIR, best.name) : null;
  } catch { return null; }
}

export function readLatestState(): SidebarState | null {
  try {
    const f = latestSessionFile();
    if (f && existsSync(f)) return JSON.parse(readFileSync(f, "utf-8")) as SidebarState;
  } catch {}
  return null;
}

export function readStateForSession(sessionID: string): SidebarState | null {
  try {
    const f = join(SESSIONS_DIR, `${sessionID}.json`);
    if (existsSync(f)) return JSON.parse(readFileSync(f, "utf-8")) as SidebarState;
  } catch {}
  return null;
}

export { SESSIONS_DIR };
