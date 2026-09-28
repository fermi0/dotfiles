/**
 * Runtime audit for V2 plugin ports.
 * Imports each port, validates the V2 shape, calls setup() with a mock ctx,
 * then drives every registered hook/tool with hostile inputs so unguarded
 * iteration (e.g. `for (const x of obj.maybe)`) fails HERE, not in a session.
 */
const DIR = "/home/work/.config/opencode/plugins"
import { readFileSync } from "node:fs"
import { homedir } from "node:os"
const HOME = homedir()

/**
 * v2 Model.Info carries TWO identity fields: `id` is the registry key (what
 * /models lists and what you select), `modelID` is the string placed in the
 * outgoing request body. A model cloned from another provider inherits that
 * provider's modelID unless BOTH are overridden — the model then looks correct
 * in the picker and 404s on every call. This was a real bug (2026-09-27), so the
 * invariant is asserted here rather than trusted to review.
 */
let identityFailures = 0
function assertInjectedIdentity(state: any, pluginName: string) {
  const batches = state.injectedModels ?? []
  if (!batches.length) {
    console.log(`     (no models injected by ${pluginName} — identity check vacuous)`)
    return
  }
  for (const { providerID, defs } of batches) {
    for (const d of defs) {
      const id = d?.id
      const modelID = (d as any)?.modelID
      if (modelID === undefined) {
        console.log(`FAIL ${pluginName}: ${providerID}/${id} has no modelID field`)
        identityFailures++
      } else if (id !== modelID) {
        console.log(`FAIL ${pluginName}: ${providerID}/${id} has modelID="${modelID}" (would be sent upstream and 404)`)
        identityFailures++
      } else if (typeof id === "string" && id.endsWith(":free") && providerID !== "openrouter") {
        // ":free" is an OpenRouter naming convention; on any other provider it
        // is a strong signal the sibling's id leaked through.
        console.log(`FAIL ${pluginName}: ${providerID}/${id} carries an OpenRouter-style ":free" suffix`)
        identityFailures++
      }
    }
  }
  if (!identityFailures) {
    const total = batches.reduce((n: number, b: any) => n + b.defs.length, 0)
    console.log(`     injected identity OK: ${total} model(s), id === modelID, no ":free" leakage`)
  }
}

const PORTS = [
  ["token-optimizer-v2", `${DIR}/token-optimizer-v2/index.ts`],
  ["poorguy-ratelimit-v2", `${DIR}/poorguy-ratelimit-v2/index.ts`],
  ["auto-free-v2", `${DIR}/auto-free-v2/index.ts`],
  ["sentinel-v2", `${DIR}/sentinel-v2/index.ts`],
  ["subtask2-v2", `${DIR}/subtask2-v2/index.ts`],
  ["handoff-v2", `${DIR}/handoff-v2/index.ts`],
]

type Rec = { dispose(): Promise<void> }
const reg = (): Rec => ({ dispose: async () => {} })

function makeMockCtx() {
  const state: any = { sessionHooks: [], toolHooks: [], tools: [], eventSubs: 0, providerEdits: [], modelEdits: [], injectedModels: [] }
  let editor: any = null

  // Seed the probe cache so auto-free's nim live-probe short-circuits: the
  // audit must be deterministic and offline, not dependent on NIM being up.
  // Without this the inject path is skipped and the id/modelID assertion
  // below would silently check nothing.
  const seededStore: Record<string, any> = {
    tested: Object.fromEntries(
      [
        "nvidia/nemotron-3-ultra-550b-a55b",
        "nvidia/nemotron-3-super-120b-a12b",
        "nvidia/nemotron-3.5-lightning-30b-a3b",
        "moonshotai/kimi-k3",
        "z-ai/glm-5.3",
        "z-ai/glm-5.3-flash",
      ].map((id) => [`nim:${id}`, { at: new Date().toISOString(), ok: true, status: 200 }]),
    ),
  }

  const ctx: any = {
    location: { directory: process.cwd(), project: { id: "p", directory: process.cwd(), canonical: process.cwd() } },
    options: {},
    app: { version: "2.0.18" },
    storage: {
      get: async (k: string) => seededStore[k], set: async (k: string, v: any) => { seededStore[k] = v },
      remove: async () => {},
      scan: async () => ({ entries: [] }),
    },
    session: {
      hook: async (name: string, fn: any) => { state.sessionHooks.push({ name, fn }); return reg() },
      context: async () => [], get: async () => ({}), create: async () => ({}),
      prompt: async () => ({}), generate: async () => ({ text: "" }),
      command: async () => ({}), synthetic: async () => ({}),
      interrupt: async () => {}, rename: async () => {}, wait: async () => {},
      switchAgent: async () => {}, switchModel: async () => {},
    },
    tool: {
      hook: async (name: string, fn: any) => { state.toolHooks.push({ name, fn }); return reg() },
      list: async () => [],
      transform: async (cb: any) => {
        editor = { add: (t: any) => state.tools.push(t), namespace: () => {}, update: () => {}, remove: () => {} }
        cb(editor)
      },
      reload: async () => {},
    },
    provider: {
      list: async () => ([{ info: { id: "openrouter" } }, { info: { id: "nim" } }, { info: { id: "zai" } }] as any),
      get: async (i: any) => ({ info: { id: i?.providerID }, models: [] } as any),
      transform: async (cb: any) => {
                // Real OpenRouter catalog, so sibling-clone resolution is genuinely
        // exercised. A fake catalog makes every sibling unresolvable, which
        // would silently skip the inject path the assertion depends on.
        let orModels: any[] = [{ id: "old-model" }]
        try {
          const db = JSON.parse(readFileSync(`${HOME}/.cache/opencode/models.json`, "utf8"))
          orModels = Object.entries(db?.openrouter?.models ?? {}).map(([id, m]: [string, any]) => ({ ...m, id }))
        } catch {
          /* keep the placeholder */
        }
        const provs = new Map<string, any>([["openrouter", { info: { id: "openrouter" }, models: orModels }]])
        cb({
          list: () => [...provs.values()],
          get: (id: string) => provs.get(id),
          add: () => {}, remove: () => {},
          update: (id: string, fn: any) => { const p = provs.get(id); if (p) fn(p); state.providerEdits.push(id) },
          models: {
            set: (pid: string, defs: any[]) => state.injectedModels.push({ providerID: pid, defs }),
            update: () => {}, remove: () => {},
          },
        })
        return reg()
      },
      reload: async () => {},
    },
    model: {
      list: async () => [], default: async () => undefined,
      transform: async (cb: any) => {
        cb({
          list: () => [{ providerID: "openrouter", id: "m1" }], get: () => undefined,
          update: () => {}, remove: (p: string, m: string) => state.modelEdits.push(`${p}/${m}`),
          default: { get: () => undefined, set: () => {} },
          provider: { list: () => [], get: () => undefined },
        })
        return reg()
      },
      reload: async () => {},
    },
    command: { list: async () => [], transform: async () => reg(), reload: async () => {} },
    mcp: { list: async () => [], transform: async () => reg(), reload: async () => {} },
    reference: { list: async () => [], transform: async () => reg(), reload: async () => {} },
    skill: { list: async () => [], transform: async () => reg(), reload: async () => {} },
    integration: { list: async () => [], get: async () => undefined, transform: async () => reg(), reload: async () => {} },
    worktree: { create: async () => ({}), list: async () => [], refresh: async () => ({}), remove: async () => {} },
    generate: { text: async () => ({ text: "" }) },
    vcs: { get: async () => ({}), branches: async () => [], status: async () => [], diff: async () => ({}), transform: async () => reg() },
    plugin: { list: async () => [] },
    websearch: { providers: async () => [], query: async () => [], transform: async () => reg(), reload: async () => {} },
    permission: { hook: async () => reg(), list: async () => [], get: async () => undefined, reply: async () => {}, rules: async () => {} },
    agent: { list: async () => [], get: async () => undefined, transform: async () => reg(), reload: async () => {} },
    shell: { hook: async () => reg() },
    event: {
      subscribe: ({ signal }: any = {}) => {
        state.eventSubs++
        return { async *[Symbol.asyncIterator]() { void signal } }
      },
    },
  }
  return { ctx, state }
}

// Hostile payloads: the shapes that actually reach hooks in production.
const HOSTILE: any[] = [
  undefined,
  {},
  { sessionID: "s" },
  { sessionID: "s", prompt: {} },
  { sessionID: "s", prompt: { text: "hi" }, messages: undefined },
  { sessionID: "s", prompt: { text: "hi" }, messages: [{}] },
  { sessionID: "s", prompt: { text: "hi" }, messages: [{ parts: undefined }] },
  { sessionID: "s", prompt: { text: "hi" }, messages: [{ parts: [null, undefined, { type: "text" }] }] },
  { sessionID: "s", system: undefined, messages: [{ parts: [{ type: "text", text: "x" }] }] },
  { sessionID: "s", system: [{ type: "text", text: "x" }] },
  { sessionID: "s", tool: "task", input: undefined, callID: "c" },
  { sessionID: "s", tool: "task", input: {}, callID: "c", result: undefined },
  { sessionID: "s", tool: "bash", input: { command: "ls" }, callID: "c2" },
  { sessionID: "s", tool: "read", input: {}, callID: "c3", result: { content: [{ type: "text", text: "hi" }] } },
  { sessionID: "s", model: { providerID: "openrouter", id: "m" }, request: new Request("http://x", { headers: { a: "b" } }) },
  { sessionID: "s", response: new Response("x", { status: 429, headers: { "retry-after": "3" } }) },
  { sessionID: "s", error: { status: 429 }, attempt: 1, decision: { retry: true, delay: 100 } },
  { attempt: 2, error: { status: 500 } },
]

let failed = 0

for (const [name, path] of PORTS) {
  const problems: string[] = []
  try {
    const mod = await import(path)
    const def: any = mod.default
    if (!def || typeof def !== "object") { console.log(`FAIL ${name}: default is ${typeof def}`); failed++; continue }
    if (typeof def.id !== "string" || !def.id) { console.log(`FAIL ${name}: bad id`); failed++; continue }
    if (typeof def.setup !== "function") { console.log(`FAIL ${name}: no setup fn`); failed++; continue }

    const { ctx, state } = makeMockCtx()
    let cleanup: any
    try { cleanup = await def.setup(ctx) }
    catch (e: any) { problems.push(`setup() threw: ${e?.message?.split("\n")[0] ?? e}`) }

    // drive hooks
    for (const h of [...state.sessionHooks, ...state.toolHooks]) {
      for (const inp of HOSTILE) {
        try { await h.fn(inp) }
        catch (e: any) { problems.push(`${h.name}(${JSON.stringify(inp)?.slice(0, 46) ?? "undefined"}): ${e?.message?.split("\n")[0]}`) }
      }
    }
    // drive tools with junk
    for (const t of state.tools) {
      for (const inp of [{}, { verbose: true }, { filePath: "/etc/hostname" }, { filePath: "nope", startLine: 0, maxLines: -5 }]) {
        try {
          const r: any = await t.execute(inp, { sessionID: "s", signal: new AbortController().signal })
          // v2 contract: execute() must resolve to an OBJECT carrying `content`.
          // A bare string makes the host throw `s is not an Object`.
          if (typeof r === "string" || r === null || typeof r !== "object") {
            problems.push(`tool ${t.name} returned ${typeof r}; v2 requires { content } (got bare ${typeof r})`)
          } else if (!("content" in r)) {
            problems.push(`tool ${t.name} returned an object with no 'content' key`)
          }
        }
        catch (e: any) { problems.push(`tool ${t.name}: ${e?.message?.split("\n")[0]}`) }
      }
    }
    if (typeof cleanup === "function") {
      try { await cleanup() } catch (e: any) { problems.push(`cleanup: ${e?.message?.split("\n")[0]}`) }
    }

    const hooks = [...state.sessionHooks.map((h: any) => `s:${h.name}`), ...state.toolHooks.map((h: any) => `t:${h.name}`)]
    if (problems.length) {
      console.log(`FAIL ${name} (id=${def.id})`)
      for (const p of problems.slice(0, 12)) console.log(`      - ${p}`)
      if (problems.length > 12) console.log(`      ... +${problems.length - 12} more`)
      failed++
    } else {
      console.log(`OK   ${name} id=${def.id}`)
      console.log(`     hooks: ${hooks.length ? hooks.join(", ") : "(none)"}`)
      console.log(`     tools: ${state.tools.length ? state.tools.map((t: any) => t.name).join(", ") : "(none)"}`)
      if (state.eventSubs) console.log(`     event subscriptions: ${state.eventSubs}`)
      if (state.modelEdits.length) console.log(`     model removals: ${state.modelEdits.length}`)
      if (state.providerEdits.length) console.log(`     provider edits: ${state.providerEdits.join(",")}`)
      assertInjectedIdentity(state, name)
    }
  } catch (e: any) {
    console.log(`FAIL ${name}: import ${e?.message?.split("\n")[0] ?? e}`)
    failed++
  }
}

const verdict = failed === 0 && identityFailures === 0
console.log(
  verdict
    ? "\nALL PORTS PASS"
    : `\n${failed} PORT(S) FAILED` + (identityFailures ? `, ${identityFailures} IDENTITY VIOLATION(S)` : ""),
)
process.exit(verdict ? 0 : 1)
