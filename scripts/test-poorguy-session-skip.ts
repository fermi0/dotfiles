/**
 * Regression test for the poorguy failure loop seen 2026-09-28.
 *
 * Symptom: OpenRouter returned "No allowed providers ... your account's
 * allowed-providers setting permits only: z-ai, decart, ...". Every managed
 * key was at its daily rpd limit, so acquire() returned null, the request went
 * out UNCLAIMED on the provider's configured key (the whitelisted-away one),
 * 404'd, and because the response was untracked nothing was charged — so the
 * same doomed request repeated indefinitely.
 *
 * Two behaviours asserted here:
 *   1. an unclaimed response is attributed to the provider's CONFIGURED key
 *   2. a key rejected for a model is skipped for the rest of the session,
 *      for that model only, and the skip is enforced on the next acquire
 */
import { rmSync, mkdirSync, existsSync, readFileSync } from "node:fs"

// HERMETIC: point the plugin at a throwaway dir BEFORE importing it, so this
// test can never read or write the real cooldowns. It previously polluted them
// with fixture models (model-404-*, m-exhaust, ...).
const CLAIMS = "/tmp/opencode/poorguy-skip-claims"
rmSync(CLAIMS, { recursive: true, force: true })
mkdirSync(CLAIMS, { recursive: true })
process.env.POORGUY_CLAIMS_DIR = CLAIMS

type Hook = (e: any) => any
const req: Hook[] = []
const resp: Array<{ cb: Hook; pid?: string }> = []
const retry: Array<{ cb: Hook; pid?: string }> = []
const ctx: any = {
  app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {} },
  // poorguy registers the poorguy_reset tool, so setup() needs ctx.tool.
  tool: { transform: async (cb: any) => { cb({ add: () => {}, namespace: () => {}, update: () => {}, remove: () => {} }); return { dispose: async () => {} } }, list: async () => [], reload: async () => {} },
  session: {
    hook: async (n: string, cb: Hook, o?: any) => {
      if (n === "http.request") req.push(cb)
      else if (n === "http.response") resp.push({ cb, pid: o?.providerID })
      else if (n === "retry") retry.push({ cb, pid: o?.providerID })
      return { dispose: async () => {} }
    },
  },
}
const mod = await import("/home/work/.config/opencode/plugins/poorguy-ratelimit-v2/index.ts")
await mod.default.setup(ctx)

let fails = 0
const ok = (c: boolean, m: string) => { console.log(`  ${c ? "PASS" : "FAIL"}  ${m}`); if (!c) fails++ }

const S1 = "sess-A", S2 = "sess-B"
const keyOf = (ev: any, out: any) => {
  ev.request.headers.set = (k: string, v: string) => { if (k.toLowerCase() === "authorization") out.bearer = v.replace("Bearer ", "") }
  return ev
}
const call = async (sid: string, model: string, status: number) => {
  const out: any = {}
  const rq: any = { sessionID: sid, agent: "build", model: { id: `nim/${model}`, providerID: "nim" }, kind: "primary", request: { headers: { set: () => {} } } }
  keyOf(rq, out)
  for (const cb of req) await cb(rq)
  for (const { cb, pid } of resp) {
    if (pid && pid !== "nim") continue
    await cb({ ...rq, response: new Response("{}", { status }) })
  }
  return out.bearer
}
const state = () => (existsSync(`${CLAIMS}/nim.state.json`) ? JSON.parse(readFileSync(`${CLAIMS}/nim.state.json`, "utf8")) : null)

console.log("1. a 404 benches the key for that model and skips it for the session")
{
  const first = await call(S1, "m-404", 404)
  ok(!!first, `first request claimed a key (…${(first ?? "").slice(-4)})`)
  const st = state()
  const benched = Object.entries(st.keys).filter(([, k]: any) => (k.modelCooldowns ?? {})["m-404"] > Date.now())
  ok(benched.length === 1, `exactly one key model-benched for m-404 (…${benched.map(([n]) => n).join(",")})`)
  const benchedName = benched[0][0]

  // next requests in the SAME session must never use that key for m-404
  let reused = 0
  for (let i = 0; i < 8; i++) if ((await call(S1, "m-404", 404)) === benchedName) reused++
  ok(reused === 0, `benched key …${benchedName} never reused for m-404 in the session (8 attempts)`)

  // The ban must be MODEL-SCOPED: a different model must still be servable.
  // Don't assert WHICH key (least-used legitimately rotates); assert it works.
  const other = await call(S1, "m-other", 200)
  ok(!!other, `a different model is still servable (…${(other ?? "").slice(-4)})`)
  const stB = state()
  const wronglyBenched = Object.entries(stB.keys).filter(([, k]: any) => (k.modelCooldowns ?? {})["m-other"] > Date.now())
  ok(wronglyBenched.length === 0, "no key was benched for the healthy model (200 is not a rejection)")
}

console.log("\n2. unclaimed request is attributed to the provider's CONFIGURED key")
{
  // Exhaust every key's daily quota so acquire() must return null. nim ships
  // rpd: 0 (unlimited), so give the keys an explicit cap in the persisted
  // state, then RE-IMPORT so setup() restores it — mutating the file alone
  // cannot affect KeyState objects already built in memory.
  const st = state()
  const today = new Date().toISOString().slice(0, 10)
  for (const k of Object.values(st.keys) as any[]) {
    k.rpd = 1
    k.dayHits = [today]
  }
  const { writeFileSync } = await import("node:fs")
  writeFileSync(`${CLAIMS}/nim.state.json`, JSON.stringify(st))

  const fresh = await import(`/home/work/.config/opencode/plugins/poorguy-ratelimit-v2/index.ts?t=${Date.now()}`)
  req.length = 0; resp.length = 0; retry.length = 0
  await fresh.default.setup(ctx)

  const bearer = await call("sess-exhausted", "m-exhaust", 404)
  ok(bearer === undefined, "no managed key claimed (all at rpd limit)")
  const st2 = state()
  const charged = Object.entries(st2.keys).filter(([, k]: any) => (k.modelCooldowns ?? {})["m-exhaust"] > Date.now())
  ok(charged.length === 1, `unclaimed 404 charged to exactly one key (…${charged.map(([n]) => n).join(",")})`)
  ok(!!charged[0], "the failure is no longer silently dropped")
}

console.log(`\n${fails === 0 ? "SESSION-SKIP BEHAVIOUR OK" : fails + " FAILURE(S)"}`)
process.exit(fails ? 1 : 0)
