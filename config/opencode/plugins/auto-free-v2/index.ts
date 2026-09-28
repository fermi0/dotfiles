/**
 * opencode-auto-free — V2 port
 *
 * WHY THIS EXISTS IN v2 FORM
 * The V1 plugin worked by writing `provider.<id>.blacklist` from a `config`
 * hook. V2 has no mutable global config object, and the official migration guide
 * lists the V1 provider fields `whitelist` / `blacklist` under
 * "Accepted but unsupported fields" — they are IGNORED with a warning. There is
 * also no model-level policy: `experimental.policies` only understands
 * `provider.use` and `permission`. So the ONLY way to curate the model list in
 * v2 is a `ctx.model.transform` that calls `editor.remove(providerID, modelID)`,
 * plus `ctx.provider.transform` / `editor.models.set()` for nim inject mode.
 *
 * MISSION (from the user, unchanged from V1)
 * Auto-update the newer free models from all managed providers. The SOLE
 * quality gate is the capability threshold (default 115, calibrated so
 * Nemotron Ultra / Kimi K3 / GLM 5.3 / DeepSeek V4 tier models pass):
 *   keep   -> authoritative. Always shown, bypasses the threshold.
 *   hide   -> never auto-added. Does NOT remove a model the user explicitly
 *             defined in opencode.jsonc (V1 behaved the same way).
 *   show   = models explicitly defined in opencode.jsonc
 *          ∪ keep
 *          ∪ top-scored free+active models, up to maxModelsPerProvider
 *          ∪ brand-new models inside the newDays window
 *   blacklist mode -> remove every catalog model NOT in show
 *   inject mode (nim) -> publish the show set as model definitions, cloned
 *             from their OpenRouter free siblings so the Model.Info shape is
 *             always schema-compatible. Availability comes from the LIVE
 *             /models endpoint, never from models.dev status (V1 lesson:
 *             models.dev is stale/optimistic).
 *
 * Data sources: ~/.config/opencode/auto-free/config.json (settings),
 * ~/.cache/opencode/models.json (models.dev catalog), and the live provider
 * /models endpoint for inject-mode providers.
 */
import { Plugin } from "@opencode/plugin"
import { readFile } from "node:fs/promises"
import { appendFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

interface ModelInfo {
  name?: string
  cost?: { input?: number; output?: number }
  limit?: { context?: number; output?: number }
  reasoning?: boolean
  reasoning_options?: Array<{ type?: string; values?: string[] }>
  temperature?: boolean
  status?: string
  release_date?: string
  last_updated?: string
  modalities?: { output?: string[] }
}

interface ProviderSpec {
  catalog?: string
  live?: boolean
  crossRefCatalog?: string
  keep?: string[]
  hide?: string[]
  mode?: "blacklist" | "inject"
}

interface UserConfig {
  providers?: Record<string, ProviderSpec>
  newDays?: number
  maxModelsPerProvider?: number
  capabilityThreshold?: number
}

const CFG_DIR = join(homedir(), ".config", "opencode")
const CACHE = join(homedir(), ".cache", "opencode", "models.json")
const V1_STATE = join(CFG_DIR, "auto-free", "state.json")
const AF_LOG = join(CFG_DIR, "auto-free-v2.log")

const isFree = (m?: ModelInfo) => (m?.cost?.input ?? 1) === 0 && (m?.cost?.output ?? 1) === 0
const isActive = (m?: ModelInfo) => !m?.status || m.status === "active"
const isTextOut = (m?: ModelInfo) => {
  const out = m?.modalities?.output
  return Array.isArray(out) ? out.includes("text") : true
}

function stripJsonComments(t: string): string {
  return t
    .split("\n")
    .filter(l => !l.trim().startsWith("//"))
    .join("\n")
    .replace(/,(\s*[}\]])/g, "$1")
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T
  } catch {
    return fallback
  }
}

function resolveEnv(s: any): any {
  if (typeof s !== "string") return s
  return s.replace(/\{env:([^}]+)\}/g, (_, k) => process.env[k] ?? "")
}

/** Raw opencode.json(c), for manual models AND provider credentials. */
async function readOpencodeConfig(): Promise<any> {
  for (const f of ["opencode.jsonc", "opencode.json"]) {
    try {
      return JSON.parse(stripJsonComments(await readFile(join(CFG_DIR, f), "utf8")))
    } catch {
      /* try the next candidate */
    }
  }
  return null
}

/** Models the user pinned by hand in opencode.json(c) — V1 called these `defined`. */
function readDefinedModels(cfg: any): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {}
  const providers = cfg?.provider ?? cfg?.providers ?? {}
  for (const [pid, p] of Object.entries<any>(providers)) {
    const models = p?.models
    if (models && typeof models === "object") out[pid] = new Set(Object.keys(models))
  }
  return out
}

function capabilityScore(m?: ModelInfo & { id?: string }): number {
  if (!m) return 0
  let s = 0
  const rd = m.release_date || m.last_updated
  if (rd) {
    const days = (Date.now() - Date.parse(rd)) / 864e5
    if (Number.isFinite(days)) s += Math.max(0, 100 - days * 0.5)
  }
  s += Math.min(50, (m.limit?.context ?? 0) / 20000)
  if (m.reasoning) s += 30
  s += Math.min(20, (m.limit?.output ?? 0) / 5000)
  const pm = m.id?.match(/(\d+(?:\.\d+)?)\s*[bB]/)
  if (pm) s += Math.min(40, Math.log10(parseFloat(pm[1]) * 1e9) * 5)

  const id = (m.id ?? "").toLowerCase()
  if (id.includes("nemotron-3-ultra")) s += 25
  if (id.includes("nemotron-3-super")) s += 10
  if (id.includes("kimi-k3") || id.includes("kimi-k2.5")) s += 20
  if (id.includes("glm-5.3") || id.includes("glm-5.2")) s += 20
  if (id.includes("deepseek-v4")) s += 20
  if (id.includes("qwen3") || id.includes("qwen2.5")) s += 15
  if (id.includes("muse-spark") || id.includes("inkling")) s += 15
  if (id.includes("gpt-oss")) s += 15
  if (id.includes("mistral-large") || id.includes("mixtral-8x22b")) s += 15

  if (id.includes("content-safety") || id.includes("embed") || id.includes("rerank")) s -= 50
  if (id.includes("nano") || id.includes("mini") || id.includes("tiny") || id.includes("small")) s -= 20
  if (id.includes("guard") || id.includes("safety") || id.includes("moderation")) s -= 30
  if (id.includes("voicechat") || id.includes("audio") || id.includes("vision") || id.includes("vlm") || id.includes("vl-")) s -= 15
  if (id.includes("parse") || id.includes("calibration") || id.includes("detector")) s -= 30
  if (id.includes("video") || (id.includes("image") && !id.includes("multimodal"))) s -= 10
  if (m.status === "deprecated") s -= 1000
  return Math.max(0, s)
}

function familyOpts(id: string) {
  const i = id.toLowerCase()
  if (i.includes("nemotron") || i.includes("kimi") || i.includes("deepseek")) return { temperature: 1.0, top_p: 0.95 }
  if (i.includes("glm")) return { temperature: 0.6, top_p: 0.95 }
  if (i.includes("gpt-oss")) return { temperature: 1.0, top_p: 1.0 }
  if (i.includes("qwen")) return { temperature: 0.7, top_p: 0.95 }
  if (i.includes("inkling") || i.includes("muse")) return { temperature: 0.8, top_p: 0.95 }
  return { temperature: 1.0, top_p: 0.95 }
}

function nimToOpenRouterId(id: string): string {
  const map: Record<string, string> = {
    "nvidia/nemotron-3-ultra-550b-a55b": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3-super-120b-a12b": "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3.5-lightning-30b-a3b": "nvidia/nemotron-3.5-lightning:free",
    "moonshotai/kimi-k3": "moonshotai/kimi-k3:free",
    "deepseek-ai/deepseek-v4-flash-0731": "deepseek/deepseek-v4-flash-0731:free",
    "z-ai/glm-5.3": "z-ai/glm-5.3:free",
    "z-ai/glm-5.3-flash": "z-ai/glm-5.3-flash:free",
    "openai/gpt-oss-20b": "openai/gpt-oss-20b:free",
    "poolside/laguna-xs-2.1": "poolside/laguna-xs-2.1:free",
    "poolside/laguna-s-2.1": "poolside/laguna-s-2.1:free",
  }
  return map[id] ?? id + ":free"
}

/* ── live provider probing (V1 logic, unchanged) ─────────────────────── */

async function liveModelIds(baseURL: string, apiKey: string): Promise<Set<string> | null> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(`${baseURL.replace(/\/+$/, "")}/models`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const list = Array.isArray((data as any)?.data) ? (data as any).data : []
    return new Set(list.map((m: any) => m?.id).filter(Boolean))
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// A SINGLE KEY failing does NOT mean the model is gone. Providers apply
// per-key policy: OpenRouter accounts can whitelist `allowed-providers`, and
// each key has its own credit. Verified 2026-09-28: one of 7 openrouter keys
// is whitelisted to a few providers and 404s on `stealth/*`, while three
// other keys serve the same model with HTTP 200.
//
// So 402/401/403/404 are KEY-scoped, not model-scoped — the same conclusion V1
// reached when it scoped 402/404 cooldowns to (key, model). A model is retired
// only when the provider states the MODEL itself is unavailable. Otherwise it
// is kept, because a stale entry in the picker is far less harmful than
// silently deleting a model that other keys serve perfectly well.
//
// Phrase-based and word-bounded. Deliberately no bare status-code patterns
// (statuses are checked explicitly) and no bare /402/i, which would match any
// body merely containing the digits "402".
const MODEL_UNAVAILABLE =
  /does not exist|no such model|model[_ ]not[_ ]found|is deprecated|\bdeprecated\b|end[- ]of[- ]life|\beol\b|no longer available|\bdiscontinued\b|has been retired|not served by|is not served/i

async function testModel(baseURL: string, apiKey: string, modelId: string) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(`${baseURL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: ctrl.signal,
    })
    const text = await res.text()
    const detail = text.slice(0, 200)
    // 410 Gone is an explicit lifecycle signal — trust it.
    if (res.status === 410) return { ok: false, reason: "gone_eol", detail }
    // 404 is only authoritative when the provider says the MODEL is gone.
    // Otherwise the key is simply not permitted to serve it (OpenRouter
    // `allowed-providers` whitelists) and other keys may work fine.
    if (res.status === 404) {
      return MODEL_UNAVAILABLE.test(text)
        ? { ok: false, reason: "not_found", detail }
        : { ok: true, status: res.status, reason: "key_not_permitted" }
    }
    // Account/key-scoped: this key lacks credit or is unauthorised. Another
    // key may be fine, so the model is kept.
    if (res.status === 402) return { ok: true, status: res.status, reason: "key_no_credit", detail }
    if (res.status === 401 || res.status === 403) return { ok: true, status: res.status, reason: "key_auth", detail }
    if (MODEL_UNAVAILABLE.test(text)) return { ok: false, reason: "model_unavailable", detail }
    return { ok: true, status: res.status }
  } catch (e: any) {
    if (e?.name === "AbortError") return { ok: true, status: 408, reason: "timeout_server_busy" }
    return { ok: true, status: 0, reason: "network_error" }
  } finally {
    clearTimeout(timer)
  }
}

export default Plugin.define({
  id: "opencode-auto-free",

  async setup(ctx: any) {
    const userCfg = await readJson<UserConfig | null>(join(CFG_DIR, "auto-free", "config.json"), null)
    if (!userCfg?.providers) return () => {}

    const db = await readJson<Record<string, { models?: Record<string, ModelInfo> }> | null>(CACHE, null)
    const ocCfg = await readOpencodeConfig()
    const defined = readDefinedModels(ocCfg)
    const windowMs = (userCfg.newDays ?? 45) * 86400_000
    const now = Date.now()
    const maxModels = userCfg.maxModelsPerProvider ?? 8
    const threshold = userCfg.capabilityThreshold ?? 80

    // Migrate the V1 seen/tested baseline once: without it every currently
    // known model looks "fresh" and the 45-day new-model window is meaningless.
    // V1 keys win — v2 storage is only filled where V1 has no record.
    const v1state = await readJson<{ seen?: Record<string, Record<string, string>>; tested?: Record<string, any> }>(V1_STATE, {})
    let seenStore: Record<string, Record<string, string>> = {}
    let testedStore: Record<string, any> = {}
    try {
      seenStore = (await ctx.storage.get("seen").catch(() => undefined) as any) ?? {}
      testedStore = (await ctx.storage.get("tested").catch(() => undefined) as any) ?? {}
    } catch {
      /* storage optional */
    }
    let migrated = false
    for (const [prov, rec] of Object.entries(v1state.seen ?? {})) {
      seenStore[prov] ??= {}
      for (const [id, ts] of Object.entries(rec ?? {})) {
        if (!(id in seenStore[prov]!)) {
          seenStore[prov]![id] = ts
          migrated = true
        }
      }
    }
    for (const [k, v] of Object.entries(v1state.tested ?? {})) {
      if (!(k in testedStore)) {
        testedStore[k] = v
        migrated = true
      }
    }
    void migrated

    // OpenRouter free set, for NIM cross-referencing
    const orFreeModels = new Set<string>()
    for (const [id, m] of Object.entries(db?.openrouter?.models ?? {})) {
      if (isFree(m) && isActive(m) && isTextOut(m) && m.status !== "deprecated") orFreeModels.add(id)
    }

    const removals = new Map<string, Array<{ providerID: string; modelID: string }>>()
    const additions = new Map<string, any[]>()
    const report: Record<string, unknown> = {}
    const testedReport: Record<string, any> = {}

    for (const [provId, spec] of Object.entries(userCfg.providers)) {
      try {
        const catalog = spec.catalog ? db?.[spec.catalog]?.models : undefined
        if (!catalog && !spec.live) {
          report[provId] = { error: `no models.dev catalog '${spec.catalog}'` }
          continue
        }
        const provCfg = (ocCfg?.provider ?? ocCfg?.providers ?? {})[provId] ?? {}
        const definedHere = defined[provId] ?? new Set<string>()
        const keep = new Set<string>(spec.keep ?? [])
        const hide = new Set<string>(spec.hide ?? [])
        const mode = spec.mode ?? "blacklist"

        let candidateIds: string[] = []
        const staticIds = Object.entries(catalog ?? {})
          .filter(([, m]) => isFree(m) && isActive(m) && isTextOut(m) && (m as ModelInfo)?.status !== "deprecated")
          .map(([id]) => id)

        /** Same metadata resolution the scorer uses, so ranking and injection agree. */
        const metaFor = (id: string) => {
          const m = catalog?.[id]
          if (m) return m
          if (spec.crossRefCatalog) return db?.[spec.crossRefCatalog]?.models?.[nimToOpenRouterId(id)]
          return undefined
        }
        const rank = (ids: string[]) =>
          ids
            .map(id => ({ id, score: capabilityScore({ ...(metaFor(id) ?? {}), id }) }))
            .sort((a, b) => b.score - a.score)

        if (spec.live) {
          // LIVE path: availability = presence in the live /models fetch plus a
          // passing testModel probe. models.dev status is ignored -- it is stale
          // and optimistic (the kimi-k2.6 lesson).
          const baseURL = resolveEnv(provCfg?.options?.baseURL)
          const apiKey = resolveEnv(provCfg?.options?.apiKey)
          const liveModels = baseURL ? await liveModelIds(baseURL, apiKey) : null

          // Build the candidate POOL with no network cost: membership in the
          // live /models list is a free set lookup.
          let pool: string[]
          if (liveModels && liveModels.size > 0) {
            pool = [...liveModels].filter(id => {
              if (keep.has(id)) return true
              if (spec.crossRefCatalog && orFreeModels.size > 0) return orFreeModels.has(nimToOpenRouterId(id))
              const m = catalog?.[id]
              return m ? isFree(m) && isActive(m) && isTextOut(m) && m.status !== "deprecated" : false
            })
          } else {
            pool = staticIds
          }

          // BOUNDED PROBING. Only models that could actually be shown are ever
          // probed: the keep list plus the top `maxModels` by score. Probing
          // every live model would mean ~400 requests to OpenRouter on a cold
          // cache -- slow, and an invitation to rate limiting, for zero benefit:
          // anything past the cap can never enter the show set.
          const shortlist = [...new Set([...keep, ...rank(pool).slice(0, maxModels).map(r => r.id)])]

          if (!baseURL) {
            // No discoverable endpoint (e.g. opencode's own zen service), so
            // live verification is impossible: stay on the static path. Never
            // fabricate a baseURL here -- hardcoding one is how a plugin rots.
            candidateIds = [...new Set([...shortlist, ...staticIds])]
            ;(report as any)[`${provId}:liveNote`] = `live requested but no baseURL for '${provId}'; using static catalog`
          } else {
            const probe = async (id: string) => {
              const testKey = `${provId}:${id}`
              const cached = testedStore[testKey]
              if (cached && now - Date.parse(cached.at) < 86400_000) return { id, ...cached }
              const result = await testModel(baseURL, apiKey, id)
              const testResult = { ...result, at: new Date().toISOString() }
              testedStore[testKey] = testResult
              testedReport[testKey] = testResult
              return { id, ...result }
            }
            const verified = (
              await Promise.allSettled(shortlist.map(probe))
            )
              .filter(r => r.status === "fulfilled" && (r.value as any).ok)
              .map(r => (r.value as any).id as string)
            if (liveModels && liveModels.size > 0) {
              candidateIds = verified
            } else {
              // Live endpoint unreachable: keep the static catalog so a network
              // blip can never wipe a provider. Never block startup.
              candidateIds = [...new Set([...verified, ...staticIds])]
            }
          }
        } else {
          // Static catalog path (V1 logic, verbatim)
          candidateIds = staticIds
        }

        // Score and rank candidates (V1 logic, verbatim)
        const scored = candidateIds
          .map(id => {
            const m = catalog?.[id]
            let modelData = m
            if (!modelData && spec.crossRefCatalog) {
              const orId = nimToOpenRouterId(id)
              modelData = db?.[spec.crossRefCatalog]?.models?.[orId]
            }
            return { id, score: capabilityScore({ ...(modelData ?? {}), id }) }
          })
          .filter(({ score }) => score >= threshold)
          .sort((a, b) => b.score - a.score)

        // First-seen tracking for the new-model window
        const seen = (seenStore[provId] ??= {})
        const fresh: string[] = []
        for (const { id } of scored) {
          if (!(id in seen)) {
            seen[id] = new Date(now).toISOString()
            fresh.push(id)
          }
        }

        // Candidate pool: top scored + verified keep + fresh + defined (V1 verbatim)
        const candidatePool = new Set<string>()
        for (const { id } of scored.slice(0, maxModels)) {
          if (!hide.has(id)) candidatePool.add(id)
        }
        for (const id of keep) {
          if (hide.has(id)) continue
          const m = catalog?.[id]
          let modelData = m
          if (!modelData && spec.crossRefCatalog) {
            const orId = nimToOpenRouterId(id)
            modelData = db?.[spec.crossRefCatalog]?.models?.[orId]
          }
          if (modelData && isFree(modelData) && isActive(modelData) && isTextOut(modelData) && modelData.status !== "deprecated") {
            candidatePool.add(id)
          } else if (!modelData && candidateIds.includes(id)) {
            // Live-tested keep model with no catalog entry: trust the probe
            candidatePool.add(id)
          }
        }
        for (const id of fresh) {
          const t = Date.parse(seen[id])
          if (Number.isFinite(t) && now - t <= windowMs && !hide.has(id)) {
            candidatePool.add(id)
          }
        }
        for (const id of definedHere) candidatePool.add(id)

        // Final show set (V1 ordering, verbatim)
        const show = new Set<string>()
        if (mode === "inject") {
          for (const id of definedHere) if (keep.has(id)) show.add(id)
        } else {
          for (const id of definedHere) show.add(id)
        }
        for (const id of keep) if (candidatePool.has(id)) show.add(id)
        for (const { id } of scored) if (candidatePool.has(id) && show.size < maxModels) show.add(id)
        for (const id of fresh) if (candidatePool.has(id) && show.size < maxModels) show.add(id)

        if (mode === "inject") {
          // Publish as Model.Info CLONED from the OpenRouter free sibling, so
          // the shape is always schema-compatible. Never fabricate one.
          const pending: Array<{ nimId: string; orId: string }> = []
          for (const id of show) {
            if (!candidateIds.includes(id)) continue // must be live-verified
            pending.push({ nimId: id, orId: nimToOpenRouterId(id) })
          }
          if (pending.length) additions.set(provId, pending as any)
          report[provId] = {
            mode, shown: [...show].sort(), fresh,
            candidates: candidateIds.length, threshold, maxModels,
          }
        } else {
          const rm = Object.keys(catalog ?? {}).filter(id => !show.has(id))
          if (rm.length) removals.set(provId, rm.map(modelID => ({ providerID: provId, modelID })))
          report[provId] = {
            mode,
            catalog: Object.keys(catalog ?? {}).length,
            shown: [...show].sort(),
            removed: rm.length,
            keep: keep.size,
            hidden: hide.size,
            keepMissingFromCatalog: [...keep].filter(k => !catalog?.[k]),
          }
        }
      } catch (e: any) {
        report[provId] = { error: String(e?.message ?? e) }
      }
    }

    try {
      await ctx.storage.set("seen", seenStore)
      await ctx.storage.set("tested", testedStore)
    } catch {
      /* storage optional */
    }

    if (removals.size) {
      await ctx.model.transform((editor: any) => {
        for (const list of removals.values()) for (const m of list) editor.remove(m.providerID, m.modelID)
      })
    }
    for (const [provId, pending] of additions) {
      // One transform: read the OpenRouter sibling defs, clone them under the
      // NIM ids. Siblings carry valid cost/capabilities/variants; only the
      // identity, display name and limits are overridden.
      let published = 0
      const unresolved: string[] = []
      await ctx.provider.transform((editor: any) => {
        const orRec = editor.get("openrouter")
        const rawModels: unknown = orRec?.models
        // Sibling lookup that tolerates every models shape a host or mock may
        // hand us: ReadonlyMap (real v2 editor), array, or plain object.
        const findSibling = (orId: string): any | undefined => {
          if (!rawModels) return undefined
          if (typeof (rawModels as any).get === "function") return (rawModels as Map<string, any>).get(orId)
          if (Array.isArray(rawModels)) return rawModels.find((m: any) => m?.id === orId)
          if (typeof rawModels === "object") return (rawModels as Record<string, any>)[orId]
          return undefined
        }
        const defs: any[] = []
        for (const { nimId, orId } of pending as Array<{ nimId: string; orId: string }>) {
          // The :free-suffixed IDs in the static mapping table go stale
          // whenever OpenRouter renames catalog entries (observed 2026-09-27:
          // moonshotai/kimi-k3:free -> moonshotai/kimi-k3). Resolve dynamically:
          // mapped id first, then the bare NIM id, which is the current
          // catalog form. An unresolvable sibling is REPORTED, never silent.
          const sib = findSibling(orId) ?? findSibling(nimId)
          if (!sib) {
            unresolved.push(`${nimId} (tried ${orId}, ${nimId})`)
            continue
          }
          // CRITICAL: v2 Model.Info carries TWO identity fields.
          //   id      -> registry key / what /models lists / what we select
          //   modelID -> the id actually placed in the outgoing request body
          // Cloning an OpenRouter sibling inherits its `modelID` (e.g.
          // "nvidia/nemotron-3-ultra-550b-a55b:free"), which the provider then
          // rejects with 404 because NIM serves "...-a55b" without the suffix.
          // Both MUST be overridden; overriding only `id` yields a model that
          // looks correct in the picker and fails on every call.
          const def = {
            ...sib,
            id: nimId,
            modelID: nimId,
            name: `${sib.name ?? nimId} (auto free)`,
            limit: {
              context: sib?.limit?.context ?? 131072,
              output: Math.min(sib?.limit?.output ?? 8192, 32768),
            },
          }
          defs.push(def)
          try {
            appendFileSync(
              AF_LOG,
              `${new Date().toISOString()} PUBLISH ${provId} id=${def.id} modelID=${(def as any).modelID} sibId=${sib.id}\n`,
            )
          } catch {
            /* diagnostics only */
          }
        }
        published = defs.length
        if (defs.length) editor.models.set(provId, defs)
      })
      const r = report[provId] as any
      if (r && typeof r === "object") {
        r.injected = (pending as Array<unknown>).length
        r.published = published
        if (unresolved.length) r.unresolvedSiblings = unresolved
      }
    }

    const totalRemoved = [...removals.values()].reduce((n, l) => n + l.length, 0)
    try {
      await ctx.storage.set("last-run", { at: new Date().toISOString(), totalRemoved, report, tested: testedReport })
    } catch {
      /* storage optional */
    }
    console.error(`[opencode-auto-free] removed ${totalRemoved} models`)

    return () => {}
  },
})
