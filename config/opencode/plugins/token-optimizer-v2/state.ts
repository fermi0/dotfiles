/**
 * opencode-token-optimizer — shared state schema
 *
 * The server plugin WRITES this payload to
 *   ~/.local/state/opencode/token-optimizer-sessions/<sessionID>.json
 * and the TUI sidebar plugin READS it. They drift easily, so the shape is
 * defined once here and imported by both halves.
 *
 * The nested `config` / `metrics` layout is deliberate: the TUI widget reads
 * `state.metrics.*` and `state.config.*`. A flat payload type-checks fine and
 * then renders every counter as 0 and every layer as a red ✘.
 */

export interface OptimizerConfigSnapshot {
  rtk: { enabled: boolean }
  dedup: { enabled: boolean; size: number }
  readCompact: { enabled: boolean }
  wrap: { enabled: boolean; maxLineWidth: number }
  history: { enabled: boolean; keepLastTurns: number }
  systemPrompt: { enabled: boolean }
}

export interface OptimizerMetrics {
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
  dedupHitRate: number
  uptimeMs: number
}

export interface OptimizerState {
  sessionID: string
  startedAt: number
  updatedAt: number
  rtkAvailable: boolean
  rtkBinaryPath: string | null
  config: OptimizerConfigSnapshot
  metrics: OptimizerMetrics
}

/**
 * OpenCode v2 renamed `bash` to `shell` (see the v1→v2 permission-action
 * rename). Matching on "bash" silently disables RTK and every shell budget,
 * because the hook never matches.
 */
export const TOOL_SHELL = "shell"

/** Tools whose successful run invalidates the whole dedup cache. */
export const MUTATING_TOOLS = new Set(["write", "edit", "shell", "task"])

/** Pure read-only query tools safe to cache. */
export const DEDUP_TOOLS = new Set(["glob", "grep"])
