/**
 * opencode-poorguy-ratelimit — V2 native port (HTTP layer)
 *
 * The V1 plugin worked by wrapping `provider.options.fetch` from a `config` hook.
 * V2 has no mutable global config object, so that approach is gone. The V2
 * equivalent is the native HTTP exchange:
 *
 *   ctx.session.hook("http.request")  → rewrite the outbound Authorization header
 *   ctx.session.hook("retry")         → veto/retry provider failures per policy
 *
 * Rate limiting, key rotation, cooldowns (429/402/401/5xx), per-model
 * cooldowns, daily request caps, and the provider circuit breaker are
 * reimplemented in-process below. Cooldowns are no longer persisted across
 * restarts (the V1 plugin wrote claim/cooldown files under
 * ~/.config/opencode/.poorguy-claims); a fresh opencode therefore starts with
 * every key cool, so a restart during an active 429 window can retry a key
 * that was still limited.
 */
import { Plugin } from "@opencode/plugin"
import { readFile } from "node:fs/promises"
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { spawn } from "node:child_process"
import { homedir } from "node:os"
import { join } from "node:path"

/* ── desktop notifications ────────────────────────────────────────────────
 * opencode's `ctx.toast` / `ctx.attention` live on the TUI context only, so
 * they are unreachable from a server plugin and invisible in the desktop app.
 * swaync (or any freedesktop notifier) IS reachable from the server, so we
 * shell out to `notify-send`.
 *
 * Hard rules, because this runs on the request path:
 *   - detached + unref'd, so a slow notifier can never delay a model request
 *   - every failure swallowed; notifications are never allowed to throw
 *   - per-kind + global rate limits, so a failing provider cannot spam you
 *   - skipped entirely with no DISPLAY/DBUS session (headless, ssh, cron)
 */
let notifyCfg = { enabled: false, minIntervalMs: 60_000 }
const lastNotify = new Map<string, number>()
let lastNotifyAny = 0

function notify(kind: string, title: string, message: string) {
  if (!notifyCfg.enabled) return
  try {
    // No graphical session: notify-send would silently vanish or block.
    if (!process.env.DBUS_SESSION_BUS_ADDRESS && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY) return
    const now = Date.now()
    if (now - lastNotifyAny < notifyCfg.minIntervalMs) return
    const prev = lastNotify.get(kind) ?? 0
    if (now - prev < notifyCfg.minIntervalMs) return
    lastNotify.set(kind, now)
    lastNotifyAny = now
    const child = spawn("notify-send", ["--app-name=poorguy-ratelimit", "--urgency=normal", title, message], {
      detached: true,
      stdio: "ignore",
    })
    child.on("error", () => {})
    child.unref()
  } catch {
    /* notifications must never affect request handling */
  }
}

/* ── config loading (mirrors V1 src/config.ts, JSONC-tolerant) ───────── */

interface KeyCfg { key: string; name: string; rpd?: number }
// Per-key daily counter needs a UTC day stamp, not a rolling window.
interface ProviderCfg {
  keys: KeyCfg[]; rpm: number; rpd: number
  maxConcurrent: number; windowMs: number
  maxAttemptsPerRequest: number; strategy: string
  circuitBreaker?: Record<string, number>
  defaultKeyName?: string
}
interface Resolved {
  enabled: boolean
  providers: Record<string, ProviderCfg>
  backoff: { baseDelayMs: number; maxDelayMs: number }
  circuitBreaker: { failureThreshold: number; failureWindowMs: number; openDurationMs: number }
  notify: { enabled: boolean; minIntervalMs: number }
}

function stripJsonComments(text: string): string {
  let out = "", inStr = false, inLine = false, inBlock = false, esc = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1]
    if (inLine) { if (c === "\n") { inLine = false; out += c } continue }
    if (inBlock) { if (c === "*" && n === "/") { inBlock = false; i++ } continue }
    if (inStr) {
      out += c
      if (esc) esc = false
      else if (c === "\\") esc = true
      else if (c === '"') inStr = false
      continue
    }
    if (c === '"') { inStr = true; out += c }
    else if (c === "/" && n === "/") { inLine = true; i++ }
    else if (c === "/" && n === "*") { inBlock = true; i++ }
    else out += c
  }
  return out
}

function resolveEnv(v: any): any {
  if (typeof v !== "string") return v
  return v.replace(/\{env:([^}]+)\}/g, (_, k) => process.env[k] ?? "")
}

function normKey(k: any): KeyCfg {
  if (typeof k === "string") return { key: k, name: k.slice(-4) }
  return { ...k, name: k.name ?? k.key.slice(-4) }
}

async function loadOpencodeKeys(): Promise<Record<string, string>> {
  const dir = join(homedir(), ".config", "opencode")
  const keys: Record<string, string> = {}
  let docs: any[] = []
  for (const f of ["opencode.json", "opencode.jsonc"]) {
    try { docs.push(JSON.parse(stripJsonComments(await readFile(join(dir, f), "utf8")))) } catch { /* absent */ }
  }
  const names = new Set<string>()
  for (const d of docs) for (const n of Object.keys(d?.provider ?? {})) names.add(n)
  for (const n of names) {
    for (const d of docs) {
      const key = d?.provider?.[n]?.options?.apiKey
      if (!key) continue
      const r = resolveEnv(key)
      if (r) { keys[n] = r; break }
    }
  }
  return keys
}

async function loadConfig(): Promise<Resolved> {
  const path = join(homedir(), ".config", "opencode", "opencode-poorguy-ratelimit.jsonc")
  let raw: any
  try { raw = JSON.parse(stripJsonComments(await readFile(path, "utf8"))) } catch { raw = {} }
 if (raw.enabled === false) return { enabled: false, providers: {}, backoff: { baseDelayMs: 5000, maxDelayMs: 120000
            }, circuitBreaker: { failureThreshold: 10, failureWindowMs: 120000, openDurationMs: 180000 }, notify: { enabled: false, minIntervalMs: 0 } }

  const autoKeys = await loadOpencodeKeys()
  const providers: Record<string, ProviderCfg> = {}
  for (const [name, pc] of Object.entries<any>(raw.providers ?? {})) {
    const explicit: KeyCfg[] = (pc.keys ?? []).map(normKey)
    const auto = autoKeys[name]
    const keys = [...explicit]
    if (auto && !keys.some(k => k.key === auto)) keys.push(normKey(auto))
    if (!keys.length) continue
    // Remember which key the PROVIDER is configured with. When every managed
    // key is exhausted we let the request through unclaimed, and that key is
    // then the one that actually served it.
    const defaultKeyName = auto
      ? (keys.find(k => k.key === auto)?.name ?? normKey(auto).name)
      : undefined
    providers[name] = {
      keys,
      defaultKeyName,
      rpm: pc.rpm ?? 40,
      rpd: typeof pc.rpd === "number" ? pc.rpd : 0,
      maxConcurrent: typeof pc.maxConcurrent === "number" ? pc.maxConcurrent : 2,
      windowMs: typeof pc.windowMs === "number" ? pc.windowMs : 60000,
      maxAttemptsPerRequest: typeof pc.maxAttemptsPerRequest === "number" ? pc.maxAttemptsPerRequest : 1,
      strategy: pc.strategy ?? raw.strategy ?? "round-robin",
    }
  }
  return {
    enabled: true,
    providers,
    backoff: { baseDelayMs: raw.backoff?.baseDelayMs ?? 5000, maxDelayMs: raw.backoff?.maxDelayMs ?? 120000 },
    circuitBreaker: {
      failureThreshold: raw.circuitBreaker?.failureThreshold ?? 10,
      failureWindowMs: raw.circuitBreaker?.failureWindowMs ?? 120000,
      openDurationMs: raw.circuitBreaker?.openDurationMs ?? 180000,
    },
    notify: {
      // Desktop notifications are opt-in: a per-request rotation notice would
      // be one popup per model call, which is unusable. Only state CHANGES are
      // announced, and each kind is rate-limited.
      enabled: raw.notify?.enabled === true,
      minIntervalMs: typeof raw.notify?.minIntervalMs === "number" ? raw.notify.minIntervalMs : 60_000,
    },
  }
}

/* ── in-process limiter (same policy as V1, no fetch wrapper) ────────── */

interface KeyState {
  key: string; name: string
  hits: number[]
  dayHits: string[]          // UTC day stamps, for per-key daily (rpd) limits
  rpd: number                // per-key daily cap; 0 = unlimited
  cooldownUntil: number
  cooldownReason: string
  errorCount: number
  modelCooldowns: Record<string, number>
  modelCooldownReasons: Record<string, string>
  /** Set when the PROVIDER told us this key is out for the day (live-detected
   *  from a 429 body, not a guessed cap). Expires at midnight UTC. */
  dailyUntil: number
  lastUse: number
}
interface Limiter {
  name: string
  rpm: number
  keys: KeyState[]
  rrIndex: number
  tieRot: number
  windowMs: number
  maxCooldownMs: number
  baseCooldownMs: number
  circuitBreaker: { failureThreshold: number; failureWindowMs: number; openDurationMs: number }
  failures: number[]
  circuitOpenUntil: number
  strategy: string
  day: string
  dayCount: number
  /** The key the PROVIDER is configured with, used to attribute responses for
   *  requests we did not claim (all managed keys exhausted). */
  defaultKey?: KeyState
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
const todayUtc = () => new Date().toISOString().slice(0, 10)

function newLimiter(name: string, cfg: ProviderCfg, cb: Resolved["circuitBreaker"]): Limiter {
  return {
    name, rpm: cfg.rpm,
    keys: cfg.keys.map(k => ({
      key: k.key, name: k.name, hits: [], dayHits: [], rpd: k.rpd ?? cfg.rpd, dailyUntil: 0,
      cooldownUntil: 0, cooldownReason: "",
      errorCount: 0, modelCooldowns: {}, modelCooldownReasons: {}, lastUse: 0,
    })),
    rrIndex: 0, tieRot: 0, windowMs: cfg.windowMs,
    maxCooldownMs: cb.openDurationMs, baseCooldownMs: 5000,
    circuitBreaker: cb, failures: [], circuitOpenUntil: 0,
    strategy: cfg.strategy, day: todayUtc(), dayCount: 0,
  }
}

function evict(l: Limiter, k: KeyState, now: number) {
  const cutoff = now - l.windowMs
  while (k.hits.length && k.hits[0] <= cutoff) k.hits.shift()
}

function available(l: Limiter, now: number): KeyState[] {
  const ok = l.keys.filter(k => k.cooldownUntil <= now)
  if (!ok.length) return []
  const n = l.keys.length
  if (l.strategy === "round-robin") {
    const out: KeyState[] = []
    for (let i = 0; i < n; i++) {
      const k = l.keys[(l.rrIndex + i) % n]
      if (k.cooldownUntil <= now) out.push(k)
    }
    return out
  }
  if (l.strategy === "random") return ok.sort(() => Math.random() - 0.5)
  // least-used: sort by rolling-window hit count, then a rotating tie-break.
  // Without the tie-break, V8's stable sort keeps array order on equal counts
  // and sparse usage degenerates to always picking keys[0] — the key never
  // rotates. This mirrors the V1 implementation exactly.
  for (const k of ok) evict(l, k, now)
  const sorted = [...ok].sort((a, b) => a.hits.length - b.hits.length)
  let tieCount = 0
  const min = sorted[0]?.hits.length ?? 0
  while (tieCount < sorted.length && sorted[tieCount].hits.length === min) tieCount++
  if (tieCount > 1) {
    l.tieRot = ((l.tieRot ?? 0) + 1) % tieCount
    const head = sorted.splice(0, tieCount)
    head.push(...head.splice(0, l.tieRot))
    sorted.unshift(...head)
  }
  return sorted
}

/** V1 semantics: 0 when the cap is unset, otherwise today's usage vs the cap. */
function keyRpdLimit(k: KeyState): number {
  return typeof k.rpd === "number" ? k.rpd : 0
}
function isKeyAtRpdLimit(k: KeyState, now = Date.now()): boolean {
  // Live-detected cut-off wins: the provider said so, no guessing needed.
  if (k.dailyUntil > now) return true
  const limit = keyRpdLimit(k)
  if (limit <= 0) return false
  const day = new Date(now).toISOString().slice(0, 10)
  return k.dayHits.filter(d => d === day).length >= limit
}

/** Why no key could be claimed — surfaced in logs and the retry policy. */
export type AcquireFail =
  | { reason: "circuit-open"; retryInMs: number }
  | { reason: "daily-limit" }
  | { reason: "model-unusable"; model: string; detail: string }
  | { reason: "no-capacity" }

function modelUnusableDetail(l: Limiter, model: string, now: number): string | null {
  const cooled = l.keys.filter(k => (k.modelCooldowns[model] ?? 0) > now)
  if (!cooled.length || cooled.length !== l.keys.length) return null
  const n402 = cooled.filter(k => k.modelCooldownReasons?.[model] === "payment").length
  const n404 = cooled.length - n402
  if (n402 === cooled.length) return `402 payment required on all keys (paid model — no key has credit/access for it)`
  if (n404 === cooled.length) return `404 on all keys (model not served by any key/account)`
  return `${n402}x 402 (payment) + ${n404}x 404 (unavailable)`
}

/** Reserve a key. Returns null when the provider is temporarily unusable. */
function acquire(l: Limiter, model?: string, now = Date.now(), sessionID?: string): KeyState | null {
  if (l.circuitOpenUntil > now) return null
  // Fast-fail when every key has burned its daily quota — waiting won't help.
  if (l.keys.some(k => keyRpdLimit(k) > 0) && l.keys.every(k => isKeyAtRpdLimit(k, now))) return null
  // Fast-fail when every key is model-cooled (404/402) for THIS model.
  if (model && modelUnusableDetail(l, model, now)) return null
  for (const k of available(l, now)) {
    // Skipped for the rest of this session after rejecting THIS model.
    if (isSkipped(sessionID, model, k.name)) continue
    // A 404 for this model says nothing about the key's other models.
    if (model && (k.modelCooldowns[model] ?? 0) > now) continue
    if (k.hits.length >= l.rpm) continue
    if (isKeyAtRpdLimit(k, now)) continue
    k.hits.push(now)
    k.dayHits.push(new Date(now).toISOString().slice(0, 10))
    k.lastUse = now
    // Only round-robin advances the cursor; least-used/random don't use it.
    if (l.strategy === "round-robin") {
      const idx = l.keys.indexOf(k)
      if (idx >= 0) l.rrIndex = (idx + 1) % l.keys.length
    }
    if (todayUtc() !== l.day) { l.day = todayUtc(); l.dayCount = 0 }
    l.dayCount++
    return k
  }
  return null
}

/** Diagnose why acquire() returned null, for logging and retry decisions. */
function diagnose(l: Limiter, model: string | undefined, now: number): AcquireFail {
  const circuitWait = l.circuitOpenUntil - now
  if (circuitWait > 0) return { reason: "circuit-open", retryInMs: circuitWait }
  if (l.keys.some(k => keyRpdLimit(k) > 0) && l.keys.every(k => isKeyAtRpdLimit(k, now)))
    return { reason: "daily-limit" }
  if (model) {
    const detail = modelUnusableDetail(l, model, now)
    if (detail) return { reason: "model-unusable", model, detail }
  }
  return { reason: "no-capacity" }
}

function cooldownMs(l: Limiter, k: KeyState, retryAfter?: number | null): number {
  if (retryAfter && retryAfter > 0) return Math.min(retryAfter, l.maxCooldownMs)
  return Math.min(l.baseCooldownMs * Math.pow(2, k.errorCount), l.maxCooldownMs)
}

/* ── persistence (V1 parity: cooldowns survive a restart) ────────────────
 * A fresh process must not forget an active 429 window, or it will hammer a
 * limited key again immediately. Best-effort: any failure is swallowed so
 * disk problems can never break request handling.
 */
// Overridable so test harnesses can run against a throwaway directory instead
// of the real cooldowns. Unset in normal use.
const CLAIMS_DIR = process.env.POORGUY_CLAIMS_DIR || join(homedir(), ".config", "opencode", ".poorguy-claims")
const statePath = (name: string) => join(CLAIMS_DIR, `${name}.state.json`)

function persist(l: Limiter) {
  try {
    mkdirSync(CLAIMS_DIR, { recursive: true })
    writeFileSync(
      statePath(l.name),
      JSON.stringify({
        v: 1,
        at: Date.now(),
        circuitOpenUntil: l.circuitOpenUntil,
        keys: Object.fromEntries(
          l.keys.map(k => [
            k.name,
            {
              cooldownUntil: k.cooldownUntil,
              cooldownReason: k.cooldownReason,
              errorCount: k.errorCount,
              // rpd MUST be persisted: dayHits without the cap it is compared
              // against is meaningless, and a per-key override would silently
              // reset to "unlimited" on every restart.
              rpd: k.rpd,
              // Live-detected daily cut-off must survive a restart, else a key the
              // provider already cut off gets re-probed until it 429s again.
              dailyUntil: k.dailyUntil,
              modelCooldowns: k.modelCooldowns,
              modelCooldownReasons: k.modelCooldownReasons,
              dayHits: k.dayHits,
            },
          ]),
        ),
      }),
    )
  } catch {
    /* persistence is best-effort */
  }
}

function restore(l: Limiter) {
  try {
    const raw = JSON.parse(readFileSync(statePath(l.name), "utf8"))
    if (typeof raw?.circuitOpenUntil === "number" && raw.circuitOpenUntil > Date.now()) {
      l.circuitOpenUntil = raw.circuitOpenUntil
    }
    for (const k of l.keys) {
      const s = raw?.keys?.[k.name]
      if (!s) continue
      // Never resurrect an expired cooldown.
      if (typeof s.cooldownUntil === "number" && s.cooldownUntil > Date.now()) {
        k.cooldownUntil = s.cooldownUntil
        k.cooldownReason = s.cooldownReason ?? ""
      }
      k.errorCount = typeof s.errorCount === "number" ? s.errorCount : 0
      if (typeof s.rpd === "number") k.rpd = s.rpd
      // Never resurrect an expired daily cut-off.
      k.dailyUntil = typeof s.dailyUntil === "number" && s.dailyUntil > Date.now() ? s.dailyUntil : 0
      k.modelCooldowns = s.modelCooldowns ?? {}
      k.modelCooldownReasons = s.modelCooldownReasons ?? {}
      // Daily counters are day-stamped, so expired days drop out on their own.
      const today = new Date().toISOString().slice(0, 10)
      k.dayHits = (Array.isArray(s.dayHits) ? s.dayHits : []).filter((d: string) => d === today)
    }
  } catch {
    /* no prior state, or unreadable: start clean */
  }
}

function penalize(l: Limiter, k: KeyState, ms: number, reason: string) {
  k.cooldownUntil = Date.now() + ms
  k.cooldownReason = reason
  k.errorCount++
  if (reason !== "rate-limit") {
    const now = Date.now()
    l.failures = l.failures.filter(t => t > now - l.circuitBreaker.failureWindowMs)
    l.failures.push(now)
    if (l.failures.length >= l.circuitBreaker.failureThreshold) {
      l.circuitOpenUntil = now + l.circuitBreaker.openDurationMs
    }
  }
  persist(l)
}

/** V1: a 404/402 says nothing about the key's OTHER models, so the cooldown is
 *  scoped to (key, model) until 00:00 UTC. The key stays eligible for every
 *  other model, which is the whole point of the per-model map. */
function penalizeModel(k: KeyState, model: string | undefined, reason: "payment" | "notfound") {
  if (!model) return
  const now = Date.now()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  const ms = Math.max(60_000, midnight.getTime() - now)
  k.modelCooldowns[model] = now + ms
  k.modelCooldownReasons[model] = reason
  for (const l of limitersRef) if (l.keys.includes(k)) persist(l)
}

function credit(l: Limiter, k: KeyState) {
  k.errorCount = 0
  k.cooldownUntil = 0
  k.cooldownReason = ""
  l.failures = []
  l.circuitOpenUntil = 0
  persist(l)
}

/* ── plugin ──────────────────────────────────────────────────────────── */

function readRetryAfterMs(h: Headers | null | undefined): number | null {
  if (!h) return null
  const ms = h.get("retry-after-ms")
  if (ms) { const v = parseFloat(ms); if (Number.isFinite(v) && v > 0) return v }
  const ra = h.get("retry-after")
  if (ra) {
    const n = parseFloat(ra)
    if (Number.isFinite(n) && n > 0) return n * 1000
    const d = Date.parse(ra)
    if (Number.isFinite(d)) return Math.max(0, d - Date.now())
  }
  const reset = h.get("x-ratelimit-reset")
  if (reset) {
    const n = parseFloat(reset)
    if (Number.isFinite(n)) {
      if (n > 1e12) return Math.max(0, n - Date.now())
      if (n > 1e9) return Math.max(0, n * 1000 - Date.now())
    }
  }
  return null
}

/* ── diagnostics ─────────────────────────────────────────────────────────
 * Append-only, never throws, never touches request/response state. Safe to
 * leave enabled: it can only add lines to the log file.
 */
const LOG_FILE = join(homedir(), ".config", "opencode", "poorguy-v2.log")
let logSeq = 0
function log(msg: string) {
  try {
    appendFileSync(LOG_FILE, `${new Date().toISOString()} #${++logSeq} ${msg}\n`)
  } catch {
    /* diagnostics must never break request handling */
  }
}

/** Live limiters, so penalizeModel can persist without being passed one. */
const limitersRef = new Set<Limiter>()

/**
 * Session-scoped key/model skips: `${sessionID}\u0000${model}` -> Set<keyName>.
 * In-memory on purpose — it lives exactly as long as the server process, so a
 * key rejected for a model is skipped for the rest of the session and starts
 * fresh after a restart. This is IN ADDITION to the persisted model cooldown
 * (which lasts to 00:00 UTC), so it can only make skipping stricter, never
 * weaker. Needed because a single-key provider policy (e.g. OpenRouter
 * `allowed-providers`) rejects that key for one model but not others.
 */
const sessionSkips = new Map<string, Set<string>>()
const skipKey = (sessionID: string | undefined, model: string | undefined, keyName: string) => {
  if (!sessionID || !model) return
  const k = `${sessionID}\u0000${model}`
  let set = sessionSkips.get(k)
  if (!set) sessionSkips.set(k, (set = new Set()))
  set.add(keyName)
}
const isSkipped = (sessionID: string | undefined, model: string | undefined, keyName: string) => {
  if (!sessionID || !model) return false
  return sessionSkips.get(`${sessionID}\u0000${model}`)?.has(keyName) ?? false
}

/* -- live limit detection (restored from V1) -------------------------------
 * A hardcoded daily cap is a guess. The provider KNOWS when a key is out for
 * the day and says so in the 429 body. V1 classified that body; the v2 port had
 * regressed to generic exponential backoff, so a key the provider had already
 * cut off kept being retried until a static rpd finally stopped it. `rpd` stays
 * available as a SAFETY NET, but the primary signal is what the API said.
 */
const DAILY_LIMIT_RE =
  /(daily\s+limit|limit_rpd|requests?\s*per\s*day|\brpd\b|per\s*24\s+hours?|24h\s+limit|quota\s+reset|daily\s+quota|per\s*day)/i
const QUOTA_RE =
  /(insufficient|out\s+of|exceeded|exhausted|reached)\s*(.{0,15})?\s*(credit|quota|balance|funds|allowance|usage\s*cap|allocation|capacity)|quota\s*(?:has\s+been\s+)?(exceeded|exhausted|reached|limit)|payment\s+required|account\s+(?:is\s+|has\s+(?:been\s+)?)?(suspended|disabled|banned|terminated|out\s+of)|subscription\s+(?:has\s+(?:been\s+)?)?(expired|inactive)|no\s+remaining\s+credits?|no\s+credit\s+left|credit\s+balance|out\s+of\s+credit|usage\s*cap|exceeded\s+(?:your\s+)?plan\s*limit/i

type LimitClass = "daily" | "quota" | "transient"
function classifyLimit(body: string, retryAfterMs: number | null): LimitClass {
  // A short Retry-After is a per-minute rate limit, not a daily cut-off, so
  // check it first or a busy minute gets misread as a dead key for the day.
  if (retryAfterMs != null && retryAfterMs > 0 && retryAfterMs <= 10 * 60_000) return "transient"
  if (DAILY_LIMIT_RE.test(body)) return "daily"
  if (QUOTA_RE.test(body)) return "quota"
  return "transient"
}

/** Midnight UTC - when a daily cut-off expires. */
function msUntilMidnightUtc(now = Date.now()): number {
  const d = new Date(now)
  d.setUTCHours(24, 0, 0, 0)
  return Math.max(0, d.getTime() - now)
}

export default Plugin.define({
  id: "opencode-poorguy-ratelimit",

  async setup(ctx) {
    const cfg = await loadConfig()
    notifyCfg = cfg.notify
    if (!cfg.enabled || !Object.keys(cfg.providers).length) {
      return () => {}
    }
    const limiters = new Map<string, Limiter>()
    for (const [name, pc] of Object.entries(cfg.providers)) {
      const l = newLimiter(name, pc, cfg.circuitBreaker)
      if (pc.defaultKeyName) l.defaultKey = l.keys.find(k => k.name === pc.defaultKeyName)
      limiters.set(name, l)
    }
    for (const [name, l] of limiters) {
      limitersRef.add(l)
      restore(l)
      log(`setup provider=${name} keys=${l.keys.length} rpm=${l.rpm} window=${l.windowMs} strategy=${l.strategy} rpd=${l.keys[0]?.rpd ?? 0} restored=${l.keys.filter(k => k.cooldownUntil > Date.now()).length}cooling`)
    }
    log(`setup done: providers=${[...limiters.keys()].join(",")}`)
    // key name (tail) → limiter, so a response can be attributed to a key
    const tailIndex = new Map<string, { l: Limiter; k: KeyState }>()
    for (const l of limiters.values()) for (const k of l.keys) tailIndex.set(k.name, { l, k })
    // In-flight request attribution: sessionID → {limiter, key, model}. The
    // http.response event carries the same sessionID+model, so this lets a 404
    // or 402 be scoped to the exact (key, model) pair that produced it.
    const inFlight = new Map<string, { l: Limiter; k: KeyState; model?: string; at: number }>()

    const providerFor = (providerID?: string) => {
      if (!providerID) return undefined
      if (limiters.has(providerID)) return limiters.get(providerID)
      // case-insensitive / alias fallback
      for (const [name, l] of limiters) if (name.toLowerCase() === providerID.toLowerCase()) return l
      return undefined
    }

    // Rotate the Authorization header on every outbound provider request.
    // ONE unscoped hook: the event carries its own providerID, so registering
    // a hook per provider would create N hooks of which only one ever fires.
    await ctx.session.hook("http.request", (event) => {
      if (!event?.request) return
      const prov = (event.model as any)?.providerID ?? (event as any)?.providerID
      const l = providerFor(prov)
      if (!l) return // unmanaged provider: never touch its headers
      // Model.Ref is { id, providerID, variant } — the id is what the provider
      // will be asked for, and it is available synchronously here.
      const refId: string | undefined = (event.model as any)?.id
      const model = typeof refId === "string" ? refId.split("/").pop() : readModel(event.request)
      const sessionID = (event as any)?.sessionID
      const k = acquire(l, model, Date.now(), sessionID)
      if (!k) {
        const why = diagnose(l, model, Date.now())
        log(`req prov=${prov} model=${model ?? "?"} kind=${(event as any)?.kind} -> NO KEY (${why.reason}${why.reason === "model-unusable" ? `: ${why.detail}` : ""})`)
        return // nothing available; let the request proceed unthrottled
      }
      tailIndex.set(k.name, { l, k })
      if (sessionID) inFlight.set(sessionID, { l, k, model, at: Date.now() })
      let applied = "not-attempted"
      try {
        ;(event.request.headers as Headers).set("Authorization", `Bearer ${k.key}`)
        applied = "header-set-ok"
      } catch (e: any) {
        applied = `header-set-THREW:${e?.name}`
      }
      log(`req prov=${prov} model=${model ?? "?"} kind=${(event as any)?.kind} key=${k.name} hits=${k.hits.length}/${l.rpm} strat=${l.strategy} ${applied}`)
    })

    // Attribute responses back to the key that was used, and apply cooldowns.
    for (const name of limiters.keys()) {
      try {
        await ctx.session.hook(
          "http.response",
          async (event) => {
            const l = limiters.get(name)
            if (!l || !event?.response) return
            const status = event.response.status ?? 0
            // Prefer the exact key this session used; fall back to most-recent.
            const sessionID = (event as any)?.sessionID
            const tracked = sessionID ? inFlight.get(sessionID) : undefined
            // Attribution. If we CLAIMED a key, that key served the request.
            // If we did not, the request went out on whatever key the provider
            // itself is configured with — so that IS the key that served it, and
            // NOT charging it is what caused an infinite failure loop: when all
            // managed keys hit their daily rpd limit, every request fell through
            // to the configured key (which may be whitelisted away for that
            // model), 404'd, and stayed unrecorded forever.
            const served: KeyState | undefined = tracked?.l === l ? tracked.k : l.defaultKey
            if (!served) {
              log(`resp prov=${name} status=${status} -> untracked and no configured key known; not charged`)
              if (sessionID) inFlight.delete(sessionID)
              return
            }
            const untracked = !(tracked?.l === l && tracked.k)
            if (untracked) {
              log(`resp prov=${name} status=${status} -> unclaimed; attributing to configured key …${served.name}`)
            }
            const used: KeyState = served
            const model = untracked ? readModelFromRef(event) : tracked!.model
            const ra = readRetryAfterMs(event.response.headers)
            let action = "none"
            if (status === 429) {
              // Classify from what the provider ACTUALLY said instead of
              // assuming every 429 is a short rate limit.
              const kind = classifyLimit(await readBodySafe(event.response), ra)
              if (kind === "daily") {
                const ms = msUntilMidnightUtc()
                used.dailyUntil = Date.now() + ms
                penalize(l, used, ms, "daily-limit")
                action = `DAILY limit reported by provider -> benched ${Math.round(ms / 60000)}min (to 00:00 UTC)`
                notify("daily", `${name}: daily limit reached`,
                  `Provider reports key …${used.name} is out for the day — benched to 00:00 UTC; other keys keep serving`)
              } else if (kind === "quota") {
                penalize(l, used, 30 * 60_000, "quota")
                action = "QUOTA/credit exhausted -> benched 30min"
                notify("quota", `${name}: quota exhausted`,
                  `Key …${used.name} reports quota/credit exhaustion — benched 30 min`)
              } else {
                const ms = cooldownMs(l, used, ra)
                penalize(l, used, ms, "rate-limit")
                action = `transient rate-limit -> ${ms}ms (retryAfter=${ra ?? "none"})`
                notify("rate-limit", `${name}: rate limited`,
                  `Key …${used.name} cooled ${Math.round(ms / 1000)}s on ${model ?? "?"}`)
              }
            } else if (status === 402) {
              // Scoped to (key, model): the key is still fine for other models.
              penalizeModel(used, model, "payment")
              skipKey(sessionID, model, used.name)
              action = `model-cooldown payment model=${model ?? "?"} until 00:00Z + session skip`
              notify("payment", `${name}: payment required`,
                `Key …${used.name} cannot afford ${model ?? "?"} — benched for that model until 00:00 UTC`)
            } else if (status === 404) {
              // Model not served by this key/account — also model-scoped.
              penalizeModel(used, model, "notfound")
              skipKey(sessionID, model, used.name)
              action = `model-cooldown notfound model=${model ?? "?"} until 00:00Z + session skip`
              notify("notfound", `${name}: model unavailable`,
                `Key …${used.name} cannot serve ${model ?? "?"} — benched for that model until 00:00 UTC`)
            } else if (status === 401 || status === 403) {
              // Auth failures are key-wide, not model-scoped.
              penalize(l, used, 30 * 60_000, "auth")
              action = "penalize auth 30min (key-wide)"
              notify("auth", `${name}: key rejected`,
                `Key …${used.name} failed auth (${status}) — benched 30 min, check its quota or provider whitelist`)
            } else if (status === 408 || status >= 500) {
              penalize(l, used, 30_000, "server-error")
              action = "penalize server-error 30s"
            } else if (status >= 200 && status < 300) {
              credit(l, used)
              action = "credit (cooldown cleared)"
            }
            log(`resp prov=${name} status=${status} key=${used.name} model=${model ?? "?"} -> ${action}`)
            if (sessionID) inFlight.delete(sessionID)
          },
          { providerID: name },
        )
      } catch { /* ignore */ }
    }

    // Surface a clear retry policy when a provider is cooling down.
    for (const name of limiters.keys()) {
      try {
        await ctx.session.hook(
          "retry",
          (event) => {
            const l = limiters.get(name)
            if (!l || !event) return
            const now = Date.now()
            const wait = l.circuitOpenUntil - now
            if (wait > 0) {
              event.decision = { retry: true, delay: wait }
              notify("circuit", `${name}: circuit open`,
                `Too many failures — pausing ${name} for ${Math.round(wait / 1000)}s`)
              return
            }
            const status = event.error?.status
            if (status === 429 || status === 408 || (status ?? 0) >= 500) {
              // v1 could retry the SAME request against up to maxAttemptsPerRequest
              // different keys. v2 gives a plugin no fetch-injection point (the AI
              // SDK reads only settings.apiKey/baseURL/headers and drives an
              // Effect HttpClient), so the plugin cannot re-issue the request.
              // The equivalent is to make the host's OWN retry land on a fresh key
              // immediately, instead of waiting for the soonest cooldown.
              const model = (event as any)?.model?.id?.split?.("/").pop()
              const probe = acquire(l, model, now)
              if (probe) {
                // A different key is usable right now -> rotate without waiting.
                event.decision = { retry: true, delay: 0 }
                log(`retry prov=${name} status=${status} -> fresh key …${probe.name} available, rotating immediately`)
              } else {
                const cooling = l.keys.map(k => Math.max(0, k.cooldownUntil - now)).filter(v => v > 0)
                if (cooling.length) {
                  const soonest = Math.min(...cooling)
                  event.decision = { retry: true, delay: Math.min(soonest || 5000, 60_000) }
                }
              }
            }
            // 404/402 are model-scoped: rotating keys cannot help once every
            // key is cooled for THIS model, so do not spin the retry loop.
            if (status === 404 || status === 402) {
              const model = (event as any)?.model?.id?.split?.("/").pop()
              const detail = model ? modelUnusableDetail(l, model, now) : null
              if (detail) {
                log(`retry prov=${name} status=${status} model=${model} -> NOT retrying: ${detail}`)
                event.decision = { retry: false }
                // The single most useful notice: every key is benched for this
                // model, so no amount of retrying or rotating will succeed.
                notify("model-unusable", `${name}: ${model} unusable`,
                  `${detail}. Pick another model.`)
              }
            }
          },
          { providerID: name },
        )
      } catch { /* ignore */ }
    }

    // -- poorguy_reset: live counter/cooldown reset, no server restart ------
    // Limiter state lives in memory, so editing the persisted state file does
    // nothing until the next restart. This mutates the LIVE limiters and
    // re-persists, so "I burned today's budget" is fixable mid-session.
    await ctx.tool.transform((editor: any) => {
      editor.add({
        name: "poorguy_reset",
        description:
          "Reset poorguy-ratelimit counters/cooldowns immediately, without restarting opencode. " +
          "scope=daily clears today's per-key request counters (daily cap exhausted but quota remains); " +
          "scope=cooldowns clears active key cooldowns; scope=model clears per-model cooldowns " +
          "(provider stopped serving a model); scope=all clears everything. Optionally narrow to one provider/model.",
        input: {
          type: "object",
          properties: {
            scope: { type: "string", enum: ["daily", "cooldowns", "model", "all"], description: "What to clear. Default 'daily'." },
            provider: { type: "string", description: "Limit to one provider, e.g. openrouter" },
            model: { type: "string", description: "Limit to one model id, e.g. stealth/space-bunny-alpha" },
          },
          additionalProperties: false,
        },
        execute: async (input: Json) => {
          const scope = typeof input?.scope === "string" ? input.scope : "daily"
          const onlyProvider = typeof input?.provider === "string" ? input.provider : undefined
          const onlyModel = typeof input?.model === "string" ? input.model.split("/").pop() : undefined
          const targets = [...limiters.entries()].filter(([n]) => !onlyProvider || n === onlyProvider)
          if (!targets.length) return { content: `poorguy: no such provider '${onlyProvider}'` }

          const summary: string[] = []
          for (const [name, l] of targets) {
            let daily = 0, keyCd = 0, modelCd = 0
            for (const k of l.keys) {
              if (scope === "daily" || scope === "all") {
                daily += k.dayHits.length
                k.dayHits = []
                // also clear the LIVE-detected daily cut-off, otherwise scope=daily
                // would not actually free a key the provider cut off for the day.
                if (k.dailyUntil > Date.now()) daily++
                k.dailyUntil = 0
              }
              if (scope === "cooldowns" || scope === "all") {
                if (k.cooldownUntil > Date.now()) keyCd++
                k.cooldownUntil = 0
                k.cooldownReason = ""
              }
              if (scope === "model" || scope === "all") {
                for (const m of Object.keys(k.modelCooldowns)) {
                  if (onlyModel && m !== onlyModel) continue
                  if ((k.modelCooldowns[m] ?? 0) > Date.now()) modelCd++
                  delete k.modelCooldowns[m]
                  delete k.modelCooldownReasons[m]
                }
              }
            }
            if (scope === "all") { l.circuitOpenUntil = 0; l.failures = [] }
            persist(l)
            const bits: string[] = []
            if (scope === "daily" || scope === "all") bits.push(`daily counters cleared (${daily} request(s))`)
            if (scope === "cooldowns" || scope === "all") bits.push(`key cooldowns cleared (${keyCd} active)`)
            if (scope === "model" || scope === "all") bits.push(`model cooldowns cleared (${modelCd} active)`)
            summary.push(`${name}: ${bits.join("; ")}`)
          }
          log(`reset scope=${scope} provider=${onlyProvider ?? "all"} model=${onlyModel ?? "all"} -> ${summary.join(" | ")}`)
          return {
            content:
              `poorguy_reset (${scope}${onlyProvider ? `, provider=${onlyProvider}` : ""}` +
              `${onlyModel ? `, model=${onlyModel}` : ""}) applied live - no restart needed.\n` +
              summary.join("\n"),
          }
        },
      })
    })

    return () => {}
  },
})

/** Read an error body for limit classification without disturbing the host.
 *  Uses clone() so the original body stream is left untouched; never throws and
 *  degrades to "" (=> "transient", i.e. the previous behaviour). */
async function readBodySafe(res: any): Promise<string> {
  try {
    const src = typeof res?.clone === "function" ? res.clone() : res
    const t = await src?.text?.()
    return typeof t === "string" ? t.slice(0, 2000) : ""
  } catch {
    return ""
  }
}

/** Model id from a response event's Model.Ref, e.g. "stealth/space-bunny-alpha" -> "space-bunny-alpha". */
function readModelFromRef(event: any): string | undefined {
  const ref = event?.model?.id ?? (event as any)?.modelID
  if (typeof ref !== "string" || !ref) return undefined
  return ref.split("/").pop() || ref
}

/** Best-effort model id extraction from a request body without consuming the stream. */
function readModel(request: any): string | undefined {
  try {
    const body = request?.body
    if (body == null) return undefined
    if (typeof body === "string") {
      const j = JSON.parse(body)
      return typeof j?.model === "string" ? j.model : undefined
    }
    // ReadableStream: leave it untouched, we only need this opportunistically.
    if (typeof body.getReader === "function") return undefined
    if (typeof body.model === "string") return body.model
  } catch { /* not JSON */ }
  return undefined
}
