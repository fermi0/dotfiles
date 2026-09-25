// opencode-auto-free v2 — Intelligent free model curation with live API testing
// Keeps /models clean: tests models with API keys, ranks by capability, excludes deprecated/weak models

import { mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const DATA_DIR = path.join(os.homedir(), ".config", "opencode", "auto-free")
const STATE_FILE = path.join(DATA_DIR, "state.json")
const CONFIG_FILE = path.join(DATA_DIR, "config.json")
const REPORT_FILE = path.join(DATA_DIR, "last-run.json")
const MODELS_DEV_CACHE = path.join(os.homedir(), ".cache", "opencode", "models.json")

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"))
  } catch {
    return fallback
  }
}

function resolveEnv(s) {
  if (typeof s !== "string") return s
  return s.replace(/\{env:([^}]+)\}/g, (_, k) => process.env[k] ?? "")
}

function isFree(m) {
  return (m?.cost?.input ?? 1) === 0 && (m?.cost?.output ?? 1) === 0
}

function isActive(m) {
  return !m?.status || m.status === "active"
}

function isTextOut(m) {
  const out = m?.modalities?.output
  return Array.isArray(out) ? out.includes("text") : true
}

function capabilityScore(model) {
  let score = 0
  if (!model) return 0

  // 1. Recency (newest = best) - up to 100 pts
  const rd = model.release_date || model.last_updated
  if (rd) {
    const daysOld = (Date.now() - Date.parse(rd)) / 864e5
    score += Math.max(0, 100 - daysOld * 0.5)
  }

  // 2. Context window - up to 50 pts
  score += Math.min(50, (model.limit?.context ?? 0) / 20000)

  // 3. Reasoning capability - 30 pts
  if (model.reasoning) score += 30

  // 4. Output tokens - up to 20 pts
  score += Math.min(20, (model.limit?.output ?? 0) / 5000)

  // 5. Parameter count from ID - up to 40 pts
  const paramMatch = model.id.match(/(\d+(?:\.\d+)?)\s*[bB]/)
  if (paramMatch) {
    const params = parseFloat(paramMatch[1]) * 1e9
    score += Math.min(40, Math.log10(params) * 5)
  }

  // 6. Architecture bonuses for top-tier models
  const idLower = model.id.toLowerCase()
  if (idLower.includes("nemotron-3-ultra")) score += 25
  if (idLower.includes("nemotron-3-super")) score += 10
  if (idLower.includes("kimi-k3") || idLower.includes("kimi-k2.5")) score += 20
  if (idLower.includes("glm-5.3") || idLower.includes("glm-5.2")) score += 20
  if (idLower.includes("deepseek-v4")) score += 20
  if (idLower.includes("qwen3") || idLower.includes("qwen2.5")) score += 15
  if (idLower.includes("muse-spark")) score += 15
  if (idLower.includes("inkling")) score += 15
  if (idLower.includes("gpt-oss")) score += 15
  if (idLower.includes("mistral-large") || idLower.includes("mixtral-8x22b")) score += 15

  // 7. Penalties for weak/specialized models
  if (idLower.includes("content-safety") || idLower.includes("embed") || idLower.includes("rerank")) score -= 50
  if (idLower.includes("nano") || idLower.includes("mini") || idLower.includes("tiny") || idLower.includes("small")) score -= 20
  if (idLower.includes("guard") || idLower.includes("safety") || idLower.includes("moderation")) score -= 30
  if (idLower.includes("voicechat") || idLower.includes("audio") || idLower.includes("vision") || idLower.includes("vlm") || idLower.includes("vl-")) score -= 15
  if (idLower.includes("parse") || idLower.includes("calibration") || idLower.includes("detector")) score -= 30
  if (idLower.includes("video") || (idLower.includes("image") && !idLower.includes("multimodal"))) score -= 10

  // 8. Deprecated = massive penalty
  if (model.status === "deprecated") score -= 1000

  return Math.max(0, score)
}

async function liveModelIds(baseURL, apiKey) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 10000)
  try {
    const res = await fetch(`${baseURL.replace(/\/+$/, "")}/models`, {
      headers: apiKey ? { authorization: `Bearer ${apiKey}` } : {},
      signal: ctrl.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const list = Array.isArray(data?.data) ? data.data : []
    return new Set(list.map((m) => m?.id).filter(Boolean))
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const PERMANENT_ERROR_PATTERNS = [
  /payment required/i,
  /402/i,
  /paid model/i,
  /requires payment/i,
  /no credit/i,
  /insufficient credit/i,
  /billing/i,
  /subscription/i,
  /paywall/i,
  /deprecated/i,
  /end of life/i,
  /eol/i,
  /has been retired/i,
  /no longer available/i,
  /not supported/i,
  /discontinued/i,
  /gone/i,
  /deleted/i,
]

async function testModel(baseURL, apiKey, modelId) {
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
    // 402 = payment required, 410 = gone/EOL -> permanently unusable
    if (res.status === 402) return { ok: false, reason: "payment_required", detail: text.slice(0, 200) }
    if (res.status === 410) return { ok: false, reason: "gone_eol", detail: text.slice(0, 200) }
    if (res.status === 404) return { ok: false, reason: "not_found", detail: text.slice(0, 200) }
    if (res.status === 401 || res.status === 403) return { ok: false, reason: "auth" }
    // Some providers return 200/4xx with a message body describing permanent errors
    if (PERMANENT_ERROR_PATTERNS.some((re) => re.test(text))) {
      return { ok: false, reason: "permanent_error", detail: text.slice(0, 200) }
    }
    // Everything else (429, 5xx, 200) = model exists or server busy -> keep
    return { ok: true, status: res.status }
  } catch (e) {
    if (e.name === "AbortError") return { ok: true, status: 408, reason: "timeout_server_busy" }
    return { ok: true, status: 0, reason: "network_error" }
  } finally {
    clearTimeout(timer)
  }
}

function getFamilyOpts(id) {
  const idLower = id.toLowerCase()
  if (idLower.includes("nemotron") || idLower.includes("kimi") || idLower.includes("deepseek")) {
    return { temperature: 1.0, top_p: 0.95 }
  }
  if (idLower.includes("glm")) {
    return { temperature: 0.6, top_p: 0.95 }
  }
  if (idLower.includes("gpt-oss")) {
    return { temperature: 1.0, top_p: 1.0 }
  }
  if (idLower.includes("qwen")) {
    return { temperature: 0.7, top_p: 0.95 }
  }
  if (idLower.includes("inkling") || idLower.includes("muse")) {
    return { temperature: 0.8, top_p: 0.95 }
  }
  return { temperature: 1.0, top_p: 0.95 }
}

function variantsFrom(m) {
  const ro = m?.reasoning_options
  if (!Array.isArray(ro)) return undefined
  const effort = ro.find((r) => r?.type === "effort" && Array.isArray(r.values))
  if (!effort) return undefined
  const out = {}
  for (const v of effort.values) if (typeof v === "string") out[v] = { reasoningEffort: v }
  return Object.keys(out).length ? out : undefined
}

function synthesizedModel(id, m) {
  const familyOpts = getFamilyOpts(id)
  const entry = {
    name: `${m?.name ?? id} (auto free)`,
    limit: {
      context: m?.limit?.context ?? 131072,
      output: Math.min(m?.limit?.output ?? 8192, 32768),
    },
    stream: true,
    reasoning: Boolean(m?.reasoning ?? true),
  }
  if (m?.temperature !== false) entry.options = familyOpts
  const variants = variantsFrom(m)
  if (variants) entry.variants = variants
  return entry
}

// Map NIM model IDs to OpenRouter free IDs
function nimToOpenRouterId(nimId) {
  const mapping = {
    "nvidia/nemotron-3-ultra-550b-a55b": "nvidia/nemotron-3-ultra-550b-a55b:free",
    "nvidia/nemotron-3-super-120b-a12b": "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "nvidia/nemotron-3.5-lightning-30b-a3b": "nvidia/nemotron-3.5-lightning:free",
    "moonshotai/kimi-k3": "moonshotai/kimi-k3:free",
    "deepseek-ai/deepseek-v4-flash-0731": "deepseek/deepseek-v4-flash-0731:free",
    "z-ai/glm-5.3": "z-ai/glm-5.3:free",
    "z-ai/glm-5.3-flash": "z-ai/glm-5.3-flash:free",
    "mistralai/mistral-nemotron": "mistralai/mistral-nemotron:free",
    "openai/gpt-oss-20b": "openai/gpt-oss-20b:free",
    "poolside/laguna-xs-2.1": "poolside/laguna-xs-2.1:free",
    "poolside/laguna-s-2.1": "poolside/laguna-s-2.1:free",
  }
  return mapping[nimId] || nimId + ":free"
}

export default async function AutoFree() {
  return {
    config: async (cfg) => {
      const report = { at: new Date().toISOString(), providers: {}, errors: [], tested: {} }
      try {
        await mkdir(DATA_DIR, { recursive: true })
        const userCfg = await readJson(CONFIG_FILE, null)
        if (!userCfg) {
          report.errors.push({ fatal: `${CONFIG_FILE} missing or invalid` })
          await writeFile(REPORT_FILE, JSON.stringify(report, null, 2))
          return
        }
        const state = await readJson(STATE_FILE, { seen: {}, tested: {} })
        state.seen = state.seen ?? {}
        state.tested = state.tested ?? {}
        const db = await readJson(MODELS_DEV_CACHE, null)
        const windowMs = (userCfg.newDays ?? 45) * 86400_000
        const now = Date.now()
        const maxModels = userCfg.maxModelsPerProvider ?? 8
        const threshold = userCfg.capabilityThreshold ?? 80

        // Pre-fetch OpenRouter free models for NIM cross-reference
        let orFreeModels = new Set()
        if (db?.openrouter?.models) {
          for (const [id, m] of Object.entries(db.openrouter.models)) {
            if (isFree(m) && isActive(m) && isTextOut(m) && m.status !== "deprecated") {
              orFreeModels.add(id)
            }
          }
        }

        for (const [provId, spec] of Object.entries(userCfg.providers ?? {})) {
          try {
            const catalog = db?.[spec.catalog]?.models
            if (!catalog && !spec.live) {
              report.providers[provId] = { error: `no models.dev catalog '${spec.catalog}'` }
              continue
            }
            const prov = ((cfg.provider ??= {})[provId] ??= {})
            const defined = new Set(Object.keys(prov.models ?? {}))
            const keep = new Set(spec.keep ?? [])
            const hide = new Set(spec.hide ?? [])
            const mode = spec.mode ?? "blacklist"

            // For inject mode: always run, but preserve manual models
            // For blacklist mode: always run to hide unwanted models

            let candidateIds = []
            let liveModels = new Set()

            if (spec.live) {
              const baseURL = resolveEnv(prov.options?.baseURL)
              const apiKey = resolveEnv(prov.options?.apiKey)

              // Start liveModelIds and test keep-list models in parallel
              const liveModelsPromise = baseURL ? liveModelIds(baseURL, apiKey) : Promise.resolve(new Set())

              // Test keep-list models directly (in parallel) - don't wait for liveModels
              const testedKeep = await Promise.allSettled([...keep].map(async (id) => {
                const testKey = `${provId}:${id}`
                const cached = state.tested[testKey]
                if (cached && now - Date.parse(cached.at) < 86400_000) {
                  return { id, ...cached }
                }
                const result = await testModel(baseURL, apiKey, id)
                const testResult = { ...result, at: new Date().toISOString() }
                state.tested[testKey] = testResult
                report.tested[testKey] = testResult
                return { id, ...result }
              })).then(results => results.filter(r => r.status === 'fulfilled' && r.value.ok).map(r => r.value))

              // Wait for live models for cross-ref
              liveModels = await liveModelsPromise

              // Cross-reference other live models with OR free list
              let crossRefCandidates = []
              if (liveModels.size > 0) {
                const otherLiveModels = [...liveModels].filter(id => !keep.has(id))
                if (spec.crossRefCatalog && orFreeModels.size > 0) {
                  for (const id of otherLiveModels) {
                    const orId = nimToOpenRouterId(id)
                    if (orFreeModels.has(orId)) {
                      crossRefCandidates.push(id)
                    }
                  }
                } else {
                  for (const id of liveModels) {
                    if (!keep.has(id)) {
                      const m = catalog?.[id]
                      if (m ? isTextOut(m) : true) crossRefCandidates.push(id)
                    }
                  }
                }

                // Test cross-ref candidates (in parallel)
                const testedCrossRef = await Promise.allSettled(crossRefCandidates.map(async (id) => {
                  const testKey = `${provId}:${id}`
                  const cached = state.tested[testKey]
                  if (cached && now - Date.parse(cached.at) < 86400_000) {
                    return { id, ...cached }
                  }
                  const result = await testModel(baseURL, apiKey, id)
                  const testResult = { ...result, at: new Date().toISOString() }
                  state.tested[testKey] = testResult
                  report.tested[testKey] = testResult
                  return { id, ...result }
                })).then(results => results.filter(r => r.status === 'fulfilled' && r.value.ok).map(r => r.value))

                candidateIds = [...testedKeep.filter(t => t.ok), ...testedCrossRef.filter(t => t.ok)].map(t => t.id)
              }
            } else {
              // Static catalog mode
              candidateIds = Object.entries(catalog)
                .filter(([, m]) => isFree(m) && isActive(m) && isTextOut(m) && m.status !== "deprecated")
                .map(([id]) => id)
            }

            // Score and rank candidates
            const scored = candidateIds
              .map(id => {
                const m = catalog?.[id]
                let modelData = m
                if (!modelData && spec.crossRefCatalog) {
                  const orId = nimToOpenRouterId(id)
                  modelData = db?.[spec.crossRefCatalog]?.models?.[orId]
                }
                return { id, score: capabilityScore(modelData || { id, limit: {}, reasoning: false }) }
              })
              .filter(({ score }) => score >= threshold)
              .sort((a, b) => b.score - a.score)

            // Track first-seen for "new" models
            const seen = (state.seen[provId] ??= {})
            const fresh = []
            for (const { id } of scored) {
              if (!(id in seen)) {
                seen[id] = new Date(now).toISOString()
                fresh.push(id)
              }
            }

            // Build candidate pool: top scored + keep (if they pass threshold) + fresh
            const candidatePool = new Set()
            // Add top scored up to maxModels
            for (const { id } of scored.slice(0, maxModels)) {
              if (!hide.has(id)) candidatePool.add(id)
            }
            // Add keep-list models (bypass threshold - user explicitly wants these)
            for (const id of keep) {
              if (hide.has(id)) continue
              // Verify it's actually free/active (basic check)
              const m = catalog?.[id]
              let modelData = m
              if (!modelData && spec.crossRefCatalog) {
                const orId = nimToOpenRouterId(id)
                modelData = db?.[spec.crossRefCatalog]?.models?.[orId]
              }
              if (modelData && isFree(modelData) && isActive(modelData) && isTextOut(modelData) && modelData.status !== "deprecated") {
                candidatePool.add(id)
              } else if (!modelData && candidateIds.includes(id)) {
                // For NIM keep models tested directly, trust the test result
                candidatePool.add(id)
              }
            }
            // Add fresh models within window
            for (const id of fresh) {
              const t = Date.parse(seen[id])
              if (Number.isFinite(t) && now - t <= windowMs && !hide.has(id)) {
                candidatePool.add(id)
              }
            }
            // Always include defined
            for (const id of defined) candidatePool.add(id)

            // Enforce maxModels on final pool (priority: keep > top scored > fresh)
            // In inject mode: only keep defined models that are in keep list (user exceptions)
            // In blacklist mode: keep all defined models
            const show = new Set()
            if (mode === "inject") {
              for (const id of defined) if (keep.has(id)) show.add(id)
            } else {
              for (const id of defined) show.add(id)
            }
            for (const id of keep) if (candidatePool.has(id)) show.add(id)
            for (const { id } of scored) if (candidatePool.has(id) && show.size < maxModels) show.add(id)
            for (const id of fresh) if (candidatePool.has(id) && show.size < maxModels) show.add(id)

            if (mode === "inject") {
              // Preserve manual models, merge with injected keep-list models
              const manualModels = { ...prov.models }
              prov.models = { ...manualModels }
              let injected = 0
              for (const id of show) {
                if (manualModels[id]) continue // Don't override manual
                const m = catalog?.[id]
                let modelData = m
                if (!modelData && spec.crossRefCatalog) {
                  const orId = nimToOpenRouterId(id)
                  modelData = db?.[spec.crossRefCatalog]?.models?.[orId]
                }
                if (candidateIds.includes(id)) {
                  prov.models[id] = synthesizedModel(id, modelData)
                  injected++
                }
              }
              report.providers[provId] = {
                shown: [...show].sort(),
                fresh,
                injected,
                candidates: candidateIds.length,
                threshold,
                maxModels,
              }
            } else {
              // Blacklist mode (for opencode provider)
              if (catalog) {
                prov.blacklist = Object.keys(catalog).filter((id) => !show.has(id))
                delete prov.whitelist
              }
              report.providers[provId] = {
                shown: [...show].sort(),
                fresh,
                blacklisted: prov.blacklist?.length ?? 0,
              }
            }
          } catch (e) {
            report.errors.push({ provider: provId, error: String(e?.message ?? e) })
          }
        }
        await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
        await writeFile(REPORT_FILE, JSON.stringify(report, null, 2))
      } catch (e) {
        try {
          await mkdir(DATA_DIR, { recursive: true })
          await writeFile(REPORT_FILE, JSON.stringify({ fatal: String(e?.message ?? e) }, null, 2))
        } catch {}
      }
    },
  }
}