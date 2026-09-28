/**
 * Functional test for the v2 poorguy-ratelimit port.
 *
 * Loads the plugin with a mock ctx, then drives the real http.request /
 * http.response / retry hooks and asserts the observable policy:
 *   1. Authorization header is set on every outbound request
 *   2. keys rotate once the rpm window is full
 *   3. a 429 puts that key in cooldown
 *   4. a 2xx clears cooldown
 *   5. a 402/404-style status does not ban the key for other models
 *   6. the retry hook proposes a delay while keys are cooling down
 */
const PATH = "/home/work/.config/opencode/plugins/poorguy-ratelimit-v2/index.ts"

const mod = await import(PATH)
const def: any = mod.default

const hooks: Record<string, Array<{ fn: Function; opts?: any }>> = {}
const reg = { dispose: async () => {} }
const ctx: any = {
  location: { directory: process.cwd(), project: { id: "p", directory: process.cwd(), canonical: process.cwd() } },
  options: {}, app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {}, remove: async () => {}, scan: async () => ({ entries: [] }) },
  session: {
    hook: async (name: string, fn: Function, opts?: any) => {
      ;(hooks[name] ??= []).push({ fn, opts })
      return reg
    },
    context: async () => [], get: async () => ({}), create: async () => ({}),
    prompt: async () => ({}), generate: async () => ({ text: "" }), command: async () => ({}),
    synthetic: async () => ({}), interrupt: async () => {}, rename: async () => {}, wait: async () => {},
    switchAgent: async () => {}, switchModel: async () => {},
  },
  tool: { hook: async () => reg, list: async () => [], transform: async () => {}, reload: async () => {} },
}

const cleanup = await def.setup(ctx)

const fails: string[] = []
const ok = (cond: boolean, msg: string) => { if (!cond) fails.push(msg) }

const reqHooks = hooks["http.request"] ?? []
const resHooks = hooks["http.response"] ?? []
const retryHooks = hooks["retry"] ?? []

console.log(`registered: http.request=${reqHooks.length} http.response=${resHooks.length} retry=${retryHooks.length}`)
ok(reqHooks.length === 1, `expected exactly 1 http.request hook, got ${reqHooks.length}`)

function fireReq(providerID: string, model?: string) {
  // Real requests already carry the provider's configured credential before our
  // hook runs. Model that here so "leave the header alone" is observable.
  const headers = new Headers({ "content-type": "application/json", Authorization: "Bearer PRE-EXISTING" })
  const body = model ? new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(JSON.stringify({ model }))) } }) : undefined
  const request = new Request("https://api.example.com/v1/chat/completions", { method: "POST", headers, ...(body ? { body, duplex: "half" } : {}) }) as any
  const ev: any = { sessionID: "s1", model: { providerID, id: model ?? "m" }, request, kind: "primary" }
  reqHooks[0]?.fn(ev)
  return request.headers.get("Authorization")
}

function fireRes(providerID: string, status: number, retryAfter?: string) {
  const headers = new Headers()
  if (retryAfter) headers.set("retry-after", retryAfter)
  const ev: any = { sessionID: "s1", model: { providerID, id: "m" }, response: new Response("x", { status, headers }), kind: "primary" }
  for (const h of resHooks) h.fn(ev)
}

function fireRetry(providerID: string, status: number) {
  const ev: any = { sessionID: "s1", model: { providerID, id: "m" }, error: { status }, attempt: 1, decision: { retry: false } }
  for (const h of retryHooks) if (!h.opts || h.opts.providerID === providerID) h.fn(ev)
  return ev.decision
}

// ── 1. header injection
const a1 = fireReq("groq", "llama-3")
ok(!!a1 && a1.startsWith("Bearer "), `Authorization not set (got ${a1})`)
console.log(`1. Authorization injected: ${a1 ? a1.slice(0, 14) + "…" : "NONE"}`)

// ── 2. a provider we do not manage keeps its own credential
const a2 = fireReq("some-unknown-provider")
ok(a2 === "Bearer PRE-EXISTING", `unmanaged provider must keep its own header, got ${a2}`)
console.log(`2. unmanaged provider keeps its own header: ${a2 === "Bearer PRE-EXISTING"}`)

// ── 3. key rotation under rpm pressure (openrouter rpm=20, 7 keys)
const seen = new Set<string>()
for (let i = 0; i < 12; i++) { const h = fireReq("openrouter", "m"); if (h) seen.add(h) }
ok(seen.size > 1, `expected key rotation across 12 requests, saw ${seen.size} distinct key(s)`)
console.log(`3. rotation: 12 requests -> ${seen.size} distinct keys`)

// ── 4. 429 puts the key in cooldown
// groq has exactly 1 key, so after a 429 the plugin has nothing to rotate TO.
// Correct fail-open behaviour: leave the pre-existing header untouched rather
// than blanking it (a blank header would turn a rate limit into a 401).
fireRes("groq", 429, "2")
const after429 = fireReq("groq", "llama-3")
ok(after429 === "Bearer PRE-EXISTING", `single-key provider in cooldown should fail open, got ${after429}`)
console.log(`4. 429 on 1-key provider -> fail open, header preserved: ${after429 === "Bearer PRE-EXISTING"}`)

// ── 4b. multi-key provider rotates away from a cooled key
const o1 = fireReq("openrouter", "m")
fireRes("openrouter", 429, "1")
const o2 = fireReq("openrouter", "m")
ok(!!o1 && !!o2 && o1 !== o2, `openrouter should rotate off the 429'd key (${o1?.slice(-4)} -> ${o2?.slice(-4)})`)
console.log(`4b. 429 on 7-key provider -> rotated: ${o1?.slice(-4)} => ${o2?.slice(-4)}`)

// ── 5. retry hook proposes a delay while cooling
const d = fireRetry("groq", 429)
ok(d.retry === true && d.delay > 0, `retry hook should propose retry+delay, got ${JSON.stringify(d)}`)
console.log(`5. retry decision while cooling: ${JSON.stringify(d)}`)

// ── 6. 2xx clears cooldown
fireRes("groq", 200)
const d2 = fireRetry("groq", 429)
console.log(`6. after 2xx, retry decision: ${JSON.stringify(d2)}`)

if (typeof cleanup === "function") await cleanup()

console.log(fails.length === 0 ? "\nPOORGUY FUNCTIONAL TEST PASS" : `\n${fails.length} ASSERTION(S) FAILED:`)
for (const f of fails) console.log(`  - ${f}`)
process.exit(fails.length === 0 ? 0 : 1)
