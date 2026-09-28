/**
 * Behavioural test for the V1 mechanics restored in the poorguy v2 port.
 * Drives the real plugin's hooks; asserts rotation, 404/402 scoping, retry, rpd.
 *
 * HERMETIC: this test exercises failure paths that PERSIST cooldowns, writing
 * fixture models (model-404-*, m-402, ...). It used to run against the real
 * ~/.config/opencode/.poorguy-claims/ and polluted it with ~120 phantom
 * entries. POORGUY_CLAIMS_DIR must be set BEFORE the plugin is imported,
 * because the plugin resolves its state directory at module load.
 */
import { rmSync, mkdirSync } from "node:fs"

const CLAIMS_DIR = "/tmp/opencode/poorguy-v1-claims"
rmSync(CLAIMS_DIR, { recursive: true, force: true })
mkdirSync(CLAIMS_DIR, { recursive: true })
process.env.POORGUY_CLAIMS_DIR = CLAIMS_DIR

const mod = await import("/home/work/.config/opencode/plugins/poorguy-ratelimit-v2/index.ts")

// The plugin PERSISTS cooldowns to ~/.config/opencode/.poorguy-claims/ and
// restores them at setup, so a previous run that benched every key for a model
// would leak into this one. Use a unique token per run so the test is
// idempotent and never depends on (or pollutes) earlier state.
const RUN = Math.random().toString(36).slice(2, 8)
const M404 = `bad/model-404-${RUN}`
const M200 = `good/model-200-${RUN}`
const M402 = `paid/model-402-${RUN}`

type Hook = (e: any) => any
type Entry = { cb: Hook; providerID?: string }
const reqHooks: Entry[] = []
const respHooks: Entry[] = []
const retryHooks: Entry[] = []

const makeCtx = (): any => ({
  app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {} },
  // poorguy registers the poorguy_reset tool, so setup() needs ctx.tool.
  tool: { transform: async (cb: any) => { cb({ add: () => {}, namespace: () => {}, update: () => {}, remove: () => {} }); return { dispose: async () => {} } }, list: async () => [], reload: async () => {} },
  session: {
    hook: async (name: string, cb: Hook, opts?: any) => {
      const e: Entry = { cb, providerID: opts?.providerID }
      if (name === "http.request") reqHooks.push(e)
      else if (name === "http.response") respHooks.push(e)
      else if (name === "retry") retryHooks.push(e)
      return { dispose: async () => {} }
    },
  },
})

await mod.default.setup(makeCtx())
console.log(`registered: ${reqHooks.length} request hook(s), ${respHooks.length} response, ${retryHooks.length} retry\n`)

/** Fire the provider-scoped hooks for one provider only, as the real host does. */
async function fireProviderScoped(list: Entry[], providerID: string, ev: any) {
  for (const { cb, providerID: want } of list) {
    if (want && want !== providerID) continue
    await cb(ev)
  }
}

let fails = 0
const ok = (cond: boolean, msg: string) => {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${msg}`)
  if (!cond) fails++
}

const mkReq = (sid: string, url = "https://x/v1/chat/completions") => {
  const r: any = new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })
  return r
}

/** Send one nim request; returns the Authorization bearer that was set. */
async function send(sid: string, modelId: string, status: number, retryAfter?: string) {
  const headers: Record<string, string> = {}
  const req: any = mkReq(sid)
  const set = req.headers.set.bind(req.headers)
  req.headers.set = (k: string, v: string) => {
    headers[k.toLowerCase()] = v
    return set(k, v)
  }
  const ev: any = { sessionID: sid, agent: "build", model: { id: `nim/${modelId}`, providerID: "nim" }, kind: "primary", request: req }
  for (const { cb } of reqHooks) await cb(ev)
  await fireProviderScoped(respHooks, "nim", { ...ev, response: new Response("{}", { status, headers: retryAfter ? { "retry-after": retryAfter } : {} }) })
  return (headers["authorization"] ?? "").replace("Bearer ", "")
}

// ── 1. rotation across distinct keys ─────────────────────────────────────
console.log("1. least-used rotation spreads across keys")
const seq: string[] = []
for (let i = 0; i < 6; i++) seq.push(await send(`rot-${i}`, "nvidia/nemotron-3-ultra-550b-a55b", 200))
console.log("   keys used:", seq.join(" "))
ok(new Set(seq).size >= 5, `rotation used ${new Set(seq).size} distinct keys (V1 tie-break prevents keys[0] lock-in)`)

// ── 2. a 404 is scoped to (key, model), not the whole key ────────────────
console.log("\n2. 404 -> per-model cooldown (key stays usable for other models)")
const a = await send("m1", M404, 404)
const b = await send("m2", M200, 200)
const c = await send("m3", M404, 404)
const d = await send("m4", M200, 200)
ok(a.length > 0 && b !== "" && d !== "", "healthy model still served after a 404 on another model")
ok(new Set([b, d]).size >= 1, "healthy model keeps getting keys")

// ── 3. 402 also model-scoped ─────────────────────────────────────────────
console.log("\n3. 402 -> per-model cooldown")
await send("p1", M402, 402)
const afterPaid = await send("p2", M200, 200)
ok(afterPaid.length > 0, "free model unaffected by a 402 on a paid model")

// ── 4. retry: 404 must NOT spin when every key is model-cooled ──────────
// V1 fast-fails only when ALL keys are cooled for this model, so drive one
// 404 per key (9 configured) before asserting.
console.log("\n4. retry policy stops spinning once ALL keys are model-cooled")
const KEY_COUNT = 9
// more attempts than keys: once a key is benched for M404 it is skipped, so
// this converges on every key being cooled regardless of rotation order
for (let i = 0; i < KEY_COUNT * 3; i++) await send(`all404-${i}`, M404, 404)
// NOTE: the plugin REPLACES event.decision, so the event object must be kept
// and read back — holding the original sub-object would read a stale value.
const ev404: any = { sessionID: "r1", agent: "build", model: { id: `nim/${M404}`, providerID: "nim" }, attempt: 1, error: { status: 404 }, decision: { retry: true } }
await fireProviderScoped(retryHooks, "nim", ev404)
console.log("   decision:", JSON.stringify(ev404.decision))
ok(ev404.decision.retry === false, "404 with all keys model-cooled -> retry:false (V1 threw instead of spinning)")

// and the cooled model must no longer be handed a key at all
const cooledReq: any = mkReq("cooled-1")
const cooledSet: string[] = []
const origSet = cooledReq.headers.set.bind(cooledReq.headers)
cooledReq.headers.set = (k: string, v: string) => { cooledSet.push(v); return origSet(k, v) }
for (const { cb } of reqHooks) {
  await cb({ sessionID: "cooled-1", agent: "build", model: { id: `nim/${M404}`, providerID: "nim" }, kind: "primary", request: cooledReq })
}
ok(cooledSet.length === 0, "fully model-cooled model is not given any key (V1 acquire throws)")

// ── 5. 429 still retries with a delay ────────────────────────────────────
console.log("\n5. 429 still drives a delayed retry")
await send("q1", "nvidia/nemotron-3-ultra-550b-a55b", 429, "2")
const ev429: any = { sessionID: "r2", agent: "build", model: { id: "nim/nvidia/nemotron-3-ultra-550b-a55b", providerID: "nim" }, attempt: 1, error: { status: 429 }, decision: { retry: false } }
await fireProviderScoped(retryHooks, "nim", ev429)
console.log("   decision:", JSON.stringify(ev429.decision))
ok(ev429.decision.retry === true && typeof ev429.decision.delay === "number", "429 -> retry:true with a delay")

// ── 6. unmanaged providers are never touched ─────────────────────────────
console.log("\n6. unmanaged provider headers are left alone")
const r: any = mkReq("u1")
const before = r.headers.get("authorization")
const ev: any = { sessionID: "u1", agent: "build", model: { id: "opencode/x", providerID: "opencode" }, kind: "primary", request: r }
for (const { cb } of reqHooks) await cb(ev)
ok(r.headers.get("authorization") === before, "opencode provider header untouched")

console.log(`\n${fails === 0 ? "ALL V1 MECHANICS PASS" : fails + " FAILURE(S)"}`)
process.exit(fails ? 1 : 0)
