/**
 * opencode-token-optimizer — sidebar state reader (v2)
 *
 * Reads the per-session metrics JSON written by the server plugin
 * (token-optimizer-v2/index.ts) from
 * ~/.local/state/opencode/token-optimizer-sessions/.
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const STATE_DIR = join(process.env.HOME || "/tmp", ".local", "state", "opencode")
export const SESSIONS_DIR = join(STATE_DIR, "token-optimizer-sessions")

function latestSessionFile(): string | null {
  try {
    if (!existsSync(SESSIONS_DIR)) return null
    let best: { name: string; mtime: number } | null = null
    for (const f of readdirSync(SESSIONS_DIR)) {
      if (!f.endsWith(".json") || f.endsWith(".tmp")) continue
      const m = statSync(join(SESSIONS_DIR, f)).mtimeMs
      if (!best || m > best.mtime) best = { name: f, mtime: m }
    }
    return best ? join(SESSIONS_DIR, best.name) : null
  } catch {
    return null
  }
}

export function readLatestState(): any | null {
  try {
    const f = latestSessionFile()
    if (f && existsSync(f)) return JSON.parse(readFileSync(f, "utf-8"))
  } catch {
    /* partial write while the server plugin renames */
  }
  return null
}

export function readStateForSession(sessionID: string): any | null {
  if (!sessionID) return null
  try {
    const f = join(SESSIONS_DIR, `${sessionID}.json`)
    if (existsSync(f)) return JSON.parse(readFileSync(f, "utf-8"))
  } catch {
    /* partial write */
  }
  return null
}
