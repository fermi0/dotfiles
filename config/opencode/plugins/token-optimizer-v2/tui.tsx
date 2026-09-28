/**
 * opencode-token-optimizer — TUI sidebar widget (v2 CLI plugin)
 *
 * Ported from the v1 `dist/tui.js`. The v1 plugin used the removed
 * `api.slots.register({ order, slots: { sidebar_content } })` shape; v2 uses
 * `ctx.ui.slot({ append, render })`.
 *
 * MUST be .tsx: OpenTUI's `text`/`box` are host elements, so the JSX
 * namespace has to be configured for this file. A .ts file compiles without a
 * JSX runtime and fails with "Expected '>' but found 'fg'".
 *
 * Reads per-session metrics written by the server plugin
 * (token-optimizer-v2/index.ts → ~/.local/state/opencode/token-optimizer-sessions/).
 */
/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import { createSignal, onCleanup, type JSX } from "solid-js"
import { readStateForSession, readLatestState } from "./sidebar.js"

const REFRESH_MS = 1000

function fmt(n: unknown): string {
  const v = typeof n === "number" && Number.isFinite(n) ? n : 0
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M"
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "k"
  return String(Math.round(v))
}

function pad(s: string, width: number): string {
  return s + " ".repeat(Math.max(0, width - s.length))
}

function fmtUptime(ms: unknown): string {
  const v = typeof ms === "number" && Number.isFinite(ms) ? ms : 0
  const s = Math.floor(v / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${s % 60}s`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const LAYERS: Array<{ name: string; active: (s: any) => boolean }> = [
  { name: "RTK", active: (s) => !!s && !!s.config?.rtk?.enabled && !!s.rtkAvailable },
  { name: "Dedup", active: (s) => !!s && !!s.config?.dedup?.enabled },
  { name: "Read", active: (s) => !!s && !!s.config?.readCompact?.enabled },
  { name: "Wrap", active: (s) => !!s && !!s.config?.wrap?.enabled },
  { name: "History", active: (s) => !!s && !!s.config?.history?.enabled },
  { name: "CodeMode", active: (s) => !!s && !!s.config?.systemPrompt?.enabled },
]

function Widget(props: { sessionID?: string }): JSX.Element {
  const [state, setState] = createSignal<any>(null)

  const update = () => {
    const id = props.sessionID
    setState(id ? readStateForSession(id) : readLatestState())
  }

  update()
  const timer = setInterval(update, REFRESH_MS)
  onCleanup(() => clearInterval(timer))

  const m = () => (state()?.metrics ?? {}) as Record<string, any>

  const rows: JSX.Element[] = []

  rows.push(<text fg="#a3a3a3" content=" Layers:" />)
  for (const l of LAYERS) {
    const on = l.active(state())
    rows.push(<text fg={on ? "#4ade80" : "#f87171"} content={` ${on ? "✔" : "✘"} ${l.name}`} />)
  }

  rows.push(<text fg="#404040" content={"  " + "─".repeat(28)} />)

  const mm = m()
  rows.push(
    <text fg="#fbbf24" content={` RTK:     ${pad(fmt(mm.rtkRewrites), 4)}`} />,
    <text fg="#60a5fa" content={` Dedup:   ${pad(`${fmt(mm.dedupHits)} (${Math.round((mm.dedupHitRate ?? 0) * 100)}%)`, 6)}`} />,
    <text fg="#a78bfa" content={` Read:    ${pad(fmt(mm.readCompactions), 4)}`} />,
    <text fg="#f472b6" content={` Trim:    ${pad(fmt(mm.outputTruncations), 4)}`} />,
    <text fg="#fb923c" content={` Drop:    ${pad(fmt(mm.historyDrops), 4)}`} />,
  )

  rows.push(<text fg="#404040" content={"  " + "─".repeat(28)} />)
  rows.push(
    <text fg="#e5e5e5" content={` In: ${fmt(mm.totalInputChars)}`} />,
    <text fg="#e5e5e5" content={` Out: ${fmt(mm.totalOutputChars)}`} />,
    <text fg="#e5e5e5" content={` Msgs: ${fmt(mm.messagesSeen)}`} />,
    <text fg="#e5e5e5" content={` Up: ${fmtUptime(mm.uptimeMs)}`} />,
  )

  rows.push(<text fg="#404040" content={"  " + "─".repeat(28)} />)
  rows.push(<text fg="#a3a3a3" content=" Top tools:" />)

  const invoked = (mm.toolsInvoked ?? {}) as Record<string, number>
  const tops = Object.entries(invoked)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 4)
  const MAX_NAME = 11
  for (let i = 0; i < 4; i++) {
    const entry = tops[i]
    if (entry) {
      const [name, count] = entry
      const t = name.length > MAX_NAME ? name.slice(0, MAX_NAME - 1) + "…" : name
      rows.push(<text fg="#fbbf24" content={` ${t.padEnd(MAX_NAME, " ")} ${pad(fmt(count), 4)}`} />)
    } else {
      rows.push(<text fg="#555555" content={` ${"".padEnd(MAX_NAME, " ")}  —`} />)
    }
  }

  return (
    <box title=" Token Optimizer " border style="rounded" width="100%" height="auto" flexDirection="column">
      {rows}
    </box>
  )
}

export default Plugin.define({
  id: "opencode-token-optimizer.tui",

  setup(ctx) {
    // v1 used order 230 to sit just before rpm-guard; v2 slots have no order
    // key (the host resolves placement), so append is the closest equivalent.
    return ctx.ui.slot({
      append: "sidebar.content",
      render: (input) => <Widget sessionID={input?.sessionID} />,
    })
  },
})
