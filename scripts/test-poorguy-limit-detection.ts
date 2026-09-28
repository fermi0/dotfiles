/**
 * Tests the live limit classification (restored from V1) against realistic
 * provider error bodies. The point: a hardcoded daily cap is a guess, whereas
 * the provider states the real reason in the 429 body.
 */
import { rmSync, mkdirSync } from "node:fs"

const CLAIMS_DIR = "/tmp/opencode/poorguy-detect-claims"
rmSync(CLAIMS_DIR, { recursive: true, force: true })
mkdirSync(CLAIMS_DIR, { recursive: true })
process.env.POORGUY_CLAIMS_DIR = CLAIMS_DIR

const mod = await import("/home/work/.config/opencode/plugins/poorguy-ratelimit-v2/index.ts")

type Hook = (e: any) => any
const req: Hook[] = []
const addedTools = new Map<string, any>()
const resp: Array<{ cb: Hook; pid?: string }> = []
const ctx: any = {
  app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {} },
  session: {
    hook: async (n: string, cb: Hook, o?: any) => {
      if (n === "http.request") req.push(cb)
      else if (n === "http.response") resp.push({ cb, pid: o?.providerID })
      return { dispose: async () => {} }
    },
  },
  tool: {
    // capture the registered tools so the test can drive poorguy_reset itself;
    // editing the state file would NOT affect the in-memory limiter.
    transform: async (cb: any) => { cb({ add: (t: any) => addedTools.set(t.name, t), namespace: () => {}, update: () => {}, remove: () => {} }); return { dispose: async () => {} } },
  },
}
await mod.default.setup(ctx)

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++ }

const state = async () => {
  const { readFileSync, existsSync } = await import("node:fs")
  const p = `${CLAIMS_DIR}/nim.state.json`
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null
}

/** Free every daily-benched key using the plugin's OWN reset tool (a file edit
 *  would not touch the live limiter). */
async function clearDaily() {
  const t = addedTools.get("poorguy_reset")
  if (!t) throw new Error("poorguy_reset tool was not registered")
  await t.execute({ scope: "daily", provider: "nim" })
}

/** Send one nim request that comes back with `status` and `body`. */
async function send(sid: string, status: number, body: string, headers: Record<string, string> = {}) {
  const rq: any = { sessionID: sid, agent: "build", model: { id: "nim/z-ai/glm-5.3", providerID: "nim" }, kind: "primary", request: { headers: { set: () => {} } } }
  for (const cb of req) await cb(rq)
  for (const { cb, pid } of resp) {
    if (pid && pid !== "nim") continue
    await cb({ ...rq, response: new Response(body, { status, headers }) })
  }
}

const DAILY_BODIES = [
  'Provider returned error: 429. Rate limit exceeded: 200 requests per day',
  '{"error":{"code":"rate_limit_exceeded","message":"daily limit reached, resets at 00:00 UTC"}}',
  'You have exceeded your requests per day limit (limit_rpd)',
  '429: per 24 hours quota reset pending',
]
const QUOTA_BODIES = [
  'Provider returned error: 402. insufficient credits',
  '{"error":{"message":"out of credit balance"}}',
  'Your account has insufficient balance to use this model',
]
const TRANSIENT_BODIES = [
  'Rate limit exceeded, retry after a moment',
  'Too many requests, slow down',
]

console.log("1. a 429 whose body states a DAILY limit benches the key to midnight UTC")
let prevBenched = 0
for (const [i, b] of DAILY_BODIES.entries()) {
  await send(`d${i}`, 429, b)
  const st = await state()
  // least-used rotates, so each send claims a fresh key -> one MORE daily bench.
  const benched = Object.values(st.keys).filter((k: any) => (k.dailyUntil ?? 0) > Date.now())
  ok(benched.length === prevBenched + 1,
    `daily-detected (+1 benched, now ${benched.length}): ${JSON.stringify(b).slice(0, 46)}…`)
  prevBenched = benched.length
}

console.log("\n2. quota/credit exhaustion is NOT treated as daily (30 min, not to midnight)")
{
  await clearDaily()   // so the assertion is about classification, not leftovers
  await send("q0", 429, QUOTA_BODIES[0], { "retry-after": "1800" })
  const st2 = await state()
  const daily = Object.values(st2.keys).filter((k: any) => (k.dailyUntil ?? 0) > Date.now())
  ok(daily.length === 0, "quota exhaustion did NOT set a daily block")
}

console.log("\n3. a plain per-minute 429 with a short Retry-After stays transient")
{
  await clearDaily()
  await send("t0", 429, TRANSIENT_BODIES[0], { "retry-after": "30" })
  const st2 = await state()
  const daily = Object.values(st2.keys).filter((k: any) => (k.dailyUntil ?? 0) > Date.now())
  ok(daily.length === 0, "short Retry-After kept transient (no daily block)")
}

console.log("\n4. a SHORT Retry-After outranks daily wording (safer direction)")
{
  // Deliberate asymmetry: benching a healthy key for ~8h because a busy minute
  // was misread as a daily cut-off is far worse than a few extra 429s. So the
  // Retry-After guard wins, and "daily" only applies without one.
  await clearDaily()
  await send("d9", 429, "daily limit reached for this key", { "retry-after": "20" })
  const st2 = await state()
  const daily = Object.values(st2.keys).filter((k: any) => (k.dailyUntil ?? 0) > Date.now())
  ok(daily.length === 0, "short Retry-After kept it transient even with 'daily' wording")

  await clearDaily()
  await send("d10", 429, "daily limit reached for this key")   // no Retry-After
  const st3 = await state()
  const daily2 = Object.values(st3.keys).filter((k: any) => (k.dailyUntil ?? 0) > Date.now())
  ok(daily2.length === 1, "same body with no Retry-After IS treated as daily")
}

console.log(`\n${fails === 0 ? "LIVE LIMIT DETECTION OK" : fails + " FAILURE(S)"}`)
process.exit(fails ? 1 : 0)
