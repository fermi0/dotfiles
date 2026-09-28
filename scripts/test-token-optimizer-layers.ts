/**
 * Deterministic layer test for the token-optimizer.
 * Drives the REAL hooks with known inputs and asserts each layer actually
 * transforms output. Uses a throwaway session id so live state is untouched.
 */
import { readFileSync, existsSync, unlinkSync } from "node:fs"
import { join } from "node:path"

const SID = "test-layer-probe-" + Math.random().toString(36).slice(2, 8)
const STATE = join(process.env.HOME!, ".local/state/opencode/token-optimizer-sessions", `${SID}.json`)

type Hook = (e: any) => any
const before: Hook[] = []
const after: Hook[] = []
const ctx: any = {
  app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {} },
  session: { hook: async () => ({ dispose: async () => {} }) },
  tool: {
    hook: async (n: string, cb: Hook) => { (n === "execute.before" ? before : after).push(cb); return { dispose: async () => {} } },
    list: async () => [],
    transform: async (cb: any) => { cb({ add: () => {}, namespace: () => {}, update: () => {}, remove: () => {} }); return { dispose: async () => {} } },
    reload: async () => {},
  },
}
const mod = await import("/home/work/.config/opencode/plugins/token-optimizer-v2/index.ts")
await mod.default.setup(ctx)

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++ }
const state = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : null)

const fire = async (tool: string, input: any, result: any, callID: string) => {
  for (const h of before) await h({ sessionID: SID, tool, input, callID })
  const ev: any = { sessionID: SID, tool, input, callID, status: "success", result }
  for (const h of after) await h(ev)
  return ev
}

// ── 1. RTK: a pattern command must be prefixed with the rtk binary ─────────
console.log("1. RTK rewrite layer")
{
  const input = { command: "grep -rn foo /etc/hosts" }
  await fire("shell", input, { content: "x" }, "c1")
  const s = state()
  ok(String(input.command).includes("rtk"), `shell command rewritten -> "${String(input.command).slice(0, 60)}"`)
  ok((s?.metrics?.rtkRewrites ?? 0) >= 1, `rtkRewrites counted (${s?.metrics?.rtkRewrites})`)
}

// ── 1b. a non-pattern command must be left alone ──────────────────────────
{
  const input = { command: "python3 -c 'print(1)'" }
  await fire("shell", input, { content: "x" }, "c1b")
  ok(!String(input.command).includes("rtk"), `non-pattern command untouched -> "${String(input.command).slice(0, 40)}"`)
}

// ── 2. DEDUP: identical glob twice = 1 miss then 1 hit ───────────────────
console.log("\n2. DEDUP layer (glob)")
{
  const g1 = { input: { pattern: "**/*.ts", path: "/home/work" }, result: { content: "fileA\nfileB\n" } }
  const e1 = await fire("glob", g1.input, g1.result, "g1")
  ok(e1.result.content.includes("fileA"), "first glob returned real output")
  const e2 = await fire("glob", { ...g1.input }, { content: "fileA\nfileB\n" }, "g2")
  const s = state()
  ok((s?.metrics?.dedupMisses ?? 0) >= 1, `dedupMisses counted (${s?.metrics?.dedupMisses})`)
  ok((s?.metrics?.dedupHits ?? 0) >= 1, `dedupHits counted (${s?.metrics?.dedupHits}) — cache replayed`)
  ok((s?.config?.dedup?.size ?? 0) >= 1, `dedup cache non-empty (size=${s?.config?.dedup?.size})`)
}

// ── 3. READ COMPACT: repeated lines + trailing whitespace must shrink ────
// NOTE: compactRead only does trimTrailingWs + collapseRepeatedLines, so the
// fixture must actually contain those. An earlier fixture used all-distinct
// lines and correctly proved nothing.
console.log("\n3. readCompact layer (read tool)")
{
  const lines: string[] = []
  for (let i = 0; i < 40; i++) lines.push("      " + "identical line".padEnd(30) + "   ") // trailing ws
  for (let i = 0; i < 5; i++) lines.push(`unique ${i}`)
  for (let i = 0; i < 40; i++) lines.push("      " + "identical line".padEnd(30) + "   ")
  const big = lines.join("\n")
  const ev = await fire("read", { filePath: "/tmp/x" }, { content: big }, "r1")
  const s = state()
  ok((s?.metrics?.readCompactions ?? 0) >= 1, `readCompactions counted (${s?.metrics?.readCompactions})`)
  ok(ev.result.content.length < big.length, `read output shrunk ${big.length} -> ${ev.result.content.length}`)
  ok(/repeated \d+\+ times, collapsed/.test(ev.result.content), "repeated run collapsed to a marker")
  ok(!/[ \t]+\n/.test(ev.result.content), "trailing whitespace stripped")
}

// ── 4. WRAP: DISABLED 2026-09-28 (it costs tokens rather than saving them).
//         Assert long lines now pass through UNCHANGED, and that the per-tool
//         output budget still applies independently of wrapping.
console.log("\n4. wrap disabled + output budget still active")
{
  const cases = ["x".repeat(400), Array.from({ length: 60 }, (_, i) => "word" + i).join(" ")]
  for (const [i, body] of cases.entries()) {
    const ev = await fire("shell", { command: "cat /tmp/y" }, { content: body }, `w${i}`)
    const longest = Math.max(...ev.result.content.split("\n").map((l: string) => l.length))
    ok(longest === body.length, `case ${i}: line left intact (${longest} chars, no re-wrap)`)
  }
  // the budget must still cap huge output even with wrap off
  const huge = Array.from({ length: 4000 }, (_, i) => `row ${i} ${"z".repeat(200)}`).join("\n")
  const ev = await fire("shell", { command: "cat /tmp/big" }, { content: huge }, "wb")
  const s = state()
  ok(ev.result.content.length < huge.length, `budget still truncates (${huge.length} -> ${ev.result.content.length})`)
  ok((s?.metrics?.outputTruncations ?? 0) >= 1, `outputTruncations counted (${s?.metrics?.outputTruncations})`)
  ok(s?.config?.wrap?.enabled === false, "state snapshot reports wrap disabled")
}

if (existsSync(STATE)) unlinkSync(STATE)
console.log(`\n${fails === 0 ? "ALL LAYERS FUNCTIONAL" : fails + " LAYER(S) BROKEN"}`)
process.exit(fails ? 1 : 0)
