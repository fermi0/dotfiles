/**
 * Verifies the retry policy rotates IMMEDIATELY when a fresh key is available,
 * and only waits when every key is cooling. This is v2's stand-in for v1's
 * maxAttemptsPerRequest, which cannot be ported (no fetch-injection point).
 */
import { rmSync, mkdirSync } from "node:fs"

const CLAIMS_DIR = "/tmp/opencode/poorguy-rotate-claims"
rmSync(CLAIMS_DIR, { recursive: true, force: true })
mkdirSync(CLAIMS_DIR, { recursive: true })
process.env.POORGUY_CLAIMS_DIR = CLAIMS_DIR

const mod = await import("/home/work/.config/opencode/plugins/poorguy-ratelimit-v2/index.ts")

type Hook = (e: any) => any
const req: Hook[] = []
const resp: Array<{ cb: Hook; pid?: string }> = []
const retry: Array<{ cb: Hook; pid?: string }> = []
const ctx: any = {
  app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {} },
  session: {
    hook: async (n: string, cb: Hook, o?: any) => {
      if (n === "http.request") req.push(cb)
      else if (n === "http.response") resp.push({ cb, pid: o?.providerID })
      else if (n === "retry") retry.push({ cb, pid: o?.providerID })
      return { dispose: async () => {} }
    },
  },
  tool: { transform: async (cb: any) => { cb({ add: () => {}, namespace: () => {}, update: () => {}, remove: () => {} }); return { dispose: async () => {} } }, list: async () => [], reload: async () => {} },
}
await mod.default.setup(ctx)

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++ }

const MODEL = "z-ai/glm-5.3"
async function round_(sid: string, status: number) {
  const rq: any = { sessionID: sid, agent: "build", model: { id: `nim/${MODEL}`, providerID: "nim" }, kind: "primary", request: { headers: { set: () => {} } } }
  for (const cb of req) await cb(rq)
  for (const { cb, pid } of resp) {
    if (pid && pid !== "nim") continue
    await cb({ ...rq, response: new Response("rate limited", { status }) })
  }
}
async function fireRetry(sid: string, status: number): Promise<any> {
  const ev: any = { sessionID: sid, agent: "build", model: { id: `nim/${MODEL}`, providerID: "nim" }, attempt: 1, error: { status }, decision: { retry: false } }
  for (const { cb, pid } of retry) {
    if (pid && pid !== "nim") continue
    await cb(ev)
  }
  return ev.decision
}

console.log("1. a 429 with other keys free -> rotate IMMEDIATELY (delay 0)")
{
  await round_("a1", 429)                       // benches one key; 8 nim keys exist
  const d = await fireRetry("a1", 429)
  console.log("   decision:", JSON.stringify(d))
  ok(d.retry === true && d.delay === 0, "retried with delay 0 -> next attempt takes a different key")
}

console.log("\n2. 5xx behaves the same (rotates, no needless wait)")
{
  await round_("a2", 503)
  const d = await fireRetry("a2", 503)
  ok(d.retry === true && d.delay === 0, "server error also rotates immediately")
}

console.log("\n3. when EVERY key is cooling, it waits for the soonest instead of spinning")
{
  // 429 every key, once each, so all are benched
  for (let i = 0; i < 12; i++) await round_((`b${i}`), 429)
  const d = await fireRetry("b9", 429)
  console.log("   decision:", JSON.stringify(d))
  ok(d.retry === true && typeof d.delay === "number" && d.delay > 0,
    "waits for the soonest cooldown rather than hot-looping on dead keys")
}

console.log("\n4. 404 with all keys model-cooled still refuses to retry")
{
  const d = await fireRetry("b9", 404)
  ok(d.retry === false, "404 + every key benched for this model -> retry:false")
}

console.log(`\n${fails === 0 ? "RETRY ROTATION OK" : fails + " FAILURE(S)"}`)
process.exit(fails ? 1 : 0)
