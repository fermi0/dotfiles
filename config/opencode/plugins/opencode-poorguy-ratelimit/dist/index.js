// src/config.ts
import { join, dirname } from "path";
import { homedir } from "os";
import { readFile } from "fs/promises";
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from "fs";
var DEFAULT_BACKOFF = {
  baseDelayMs: 5000,
  maxDelayMs: 120000
};
var DEFAULT_LOGGING = {
  enabled: true
};
var DEFAULT_RPM = 40;
var CLAIMS_DIR = join(homedir(), ".config", "opencode", ".poorguy-claims");
var OUR_PID = process.pid;
function ensureClaimsDir() {
  try { mkdirSync(CLAIMS_DIR, { recursive: true }); } catch {}
}
function isProcessAlive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
function isKeyClaimedSync(providerName, keySuffix) {
  try {
    const p = join(CLAIMS_DIR, `${providerName}-${keySuffix}.claim`);
    const c = JSON.parse(readFileSync(p, "utf-8"));
    if (c.pid === OUR_PID) return false;
    if (!isProcessAlive(c.pid)) { try { unlinkSync(p); } catch {} return false; }
    return true;
  } catch { return false; }
}
function claimKeySync(providerName, keySuffix) {
  ensureClaimsDir();
  const p = join(CLAIMS_DIR, `${providerName}-${keySuffix}.claim`);
  try {
    writeFileSync(p, JSON.stringify({ pid: OUR_PID, ts: Date.now() }), { flag: "wx" });
    return true;
  } catch (e) {
    if (e.code !== "EEXIST") return false;
    try {
      const c = JSON.parse(readFileSync(p, "utf-8"));
      if (!isProcessAlive(c.pid)) { unlinkSync(p); writeFileSync(p, JSON.stringify({ pid: OUR_PID, ts: Date.now() }), { flag: "wx" }); return true; }
    } catch { try { unlinkSync(p); } catch {} try { writeFileSync(p, JSON.stringify({ pid: OUR_PID, ts: Date.now() }), { flag: "wx" }); return true; } catch {} }
    return false;
  }
}
function releaseKeySync(providerName, keySuffix) {
  if (!keySuffix) return;
  try {
    const p = join(CLAIMS_DIR, `${providerName}-${keySuffix}.claim`);
    const c = JSON.parse(readFileSync(p, "utf-8"));
    if (c.pid === OUR_PID) unlinkSync(p);
  } catch {}
}

// ---- Cooldown persistence ----
// Persist cooldownUntil to disk so it survives process restarts. Without this, every opencode
// restart would re-try keys that the server is still rate-limiting, immediately getting another
// 429 and re-entering cooldown (death spiral). The .cooldown file lives next to the .claim file
// in the same dir. Atomic write via writeFileSync (we don't need lock semantics here because
// the value is monotonic — last writer wins, and the larger until-timestamp is the right one).
function cooldownPath(providerName, keySuffix) {
  return join(CLAIMS_DIR, `${providerName}-${keySuffix}.cooldown`);
}
function loadCooldownSync(providerName, keySuffix) {
  try {
    const p = cooldownPath(providerName, keySuffix);
    const c = JSON.parse(readFileSync(p, "utf-8"));
    if (typeof c.until === "number" && c.until > Date.now()) {
      return { until: c.until, reason: c.reason ?? "unknown", ts: c.ts ?? 0 };
    }
    // Expired — clean up
    try { unlinkSync(p); } catch {}
    return null;
  } catch { return null; }
}
function saveCooldownSync(providerName, keySuffix, untilMs, reason) {
  try {
    ensureClaimsDir();
    const p = cooldownPath(providerName, keySuffix);
    // Read existing; if existing.until is later, keep it (don't shrink cooldown)
    let existing = null;
    try { existing = JSON.parse(readFileSync(p, "utf-8")); } catch {}
    if (existing && typeof existing.until === "number" && existing.until >= untilMs) {
      return; // already cooling down longer
    }
    writeFileSync(p, JSON.stringify({ until: untilMs, reason, ts: Date.now() }));
  } catch {}
}
function clearCooldownSync(providerName, keySuffix) {
  try { unlinkSync(cooldownPath(providerName, keySuffix)); } catch {}
}

// ---- Per-model cooldown persistence ----
// A 404 means "this model is not available on this key/account" and a 402 means "this
// model costs money this key/account doesn't have" — both say nothing about the key's
// other models. So 404/402 cooldowns are scoped to (key, model); the key stays eligible
// for every other model. Persisted (with reason) so they survive restarts.
// File format: {model: {until, reason}} — legacy {model: untilNumber} is accepted on load.
function modelCooldownPath(providerName, keySuffix) {
  return join(CLAIMS_DIR, `${providerName}-${keySuffix}.modelcooldowns`);
}
function loadModelCooldownsSync(providerName, keySuffix) {
  try {
    const c = JSON.parse(readFileSync(modelCooldownPath(providerName, keySuffix), "utf-8"));
    const now = Date.now();
    const out = {};
    const reasons = {};
    for (const [m, v] of Object.entries(c)) {
      const until = typeof v === "number" ? v : v?.until;
      if (typeof until === "number" && until > now) {
        out[m] = until;
        reasons[m] = (typeof v === "object" && v?.reason) || "notfound";
      }
    }
    return { cooldowns: out, reasons };
  } catch { return { cooldowns: {}, reasons: {} }; }
}
function saveModelCooldownsSync(providerName, keySuffix, map, reasons = {}) {
  try {
    ensureClaimsDir();
    const now = Date.now();
    const pruned = {};
    for (const [m, until] of Object.entries(map)) {
      if (typeof until === "number" && until > now)
        pruned[m] = { until, reason: reasons[m] ?? "notfound" };
    }
    writeFileSync(modelCooldownPath(providerName, keySuffix), JSON.stringify(pruned));
  } catch {}
}

// ---- RPD (daily request count) persistence ----
// Track per-key daily request counts so we can preemptively cool down keys approaching
// their daily quota (e.g. NIM's 10k/day, OpenRouter free's ~100/day). Without this, the
// plugin only learns about daily limits when the server returns 429 — by then the key
// is already exhausted and we're in cooldown hell.
function rpdPath(providerName, keySuffix) {
  return join(CLAIMS_DIR, `${providerName}-${keySuffix}.rpd`);
}
function getUtcDay() {
  const now = new Date;
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}
function loadRpdSync(providerName, keySuffix) {
  try {
    const p = rpdPath(providerName, keySuffix);
    const c = JSON.parse(readFileSync(p, "utf-8"));
    if (c.day === getUtcDay() && typeof c.count === "number") return c.count;
    return 0;
  } catch { return 0; }
}
function saveRpdSync(providerName, keySuffix, count) {
  try {
    ensureClaimsDir();
    writeFileSync(rpdPath(providerName, keySuffix), JSON.stringify({ day: getUtcDay(), count, ts: Date.now() }));
  } catch {}
}
function incrementRpdSync(providerName, keySuffix) {
  const current = loadRpdSync(providerName, keySuffix);
  const next = current + 1;
  saveRpdSync(providerName, keySuffix, next);
  return next;
}

// ---- Circuit breaker persistence ----
// Provider-level circuit breaker: if too many keys fail within a window, open the circuit
// for the whole provider. Prevents hammering an overloaded provider and lets it recover.
function circuitPath(providerName) {
  return join(CLAIMS_DIR, `${providerName}-circuit.json`);
}
function loadCircuitSync(providerName) {
  try {
    const c = JSON.parse(readFileSync(circuitPath(providerName), "utf-8"));
    return c;
  } catch { return { state: "closed", failures: [], openedAt: 0 }; }
}
function saveCircuitSync(providerName, state) {
  try {
    ensureClaimsDir();
    writeFileSync(circuitPath(providerName), JSON.stringify(state));
  } catch {}
}
function normalizeKey(key) {
  if (typeof key === "string") {
    return { key, name: key.slice(-4) };
  }
  return { ...key, name: key.name ?? key.key.slice(-4) };
}
function stripJsonComments(text) {
  let result = "";
  let inString = false;
  let inBlockComment = false;
  let inLineComment = false;
  let escaped = false;
  for (let i = 0;i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inLineComment) {
      if (ch === `
`) {
        inLineComment = false;
        result += ch;
      }
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      result += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      result += ch;
    } else if (ch === "/" && next === "/") {
      inLineComment = true;
      i++;
    } else if (ch === "/" && next === "*") {
      inBlockComment = true;
      i++;
    } else {
      result += ch;
    }
  }
  return result;
}
async function readJsonFile(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(stripJsonComments(content));
  } catch {
    return {};
  }
}
function resolveEnvTemplate(val) {
 if (typeof val !== "string") return val;
 const m = val.match(/^\{env:([^}]+)\}$/);
 if (m) {
 const envVal = process.env[m[1]];
 if (envVal) return envVal;
 return null;
 }
 if (val.includes("{env:")) return null;
 return val;
}
async function loadOpencodeProviderKeys() {
  const configDir = join(homedir(), ".config", "opencode");
  const json = await readJsonFile(join(configDir, "opencode.json"));
  const jsonc = await readJsonFile(join(configDir, "opencode.jsonc"));
  const keys = {};
  const allProviderNames = new Set([
    ...Object.keys(json?.provider ?? {}),
    ...Object.keys(jsonc?.provider ?? {})
  ]);
  for (const name of allProviderNames) {
    const provider = jsonc?.provider?.[name] ?? json?.provider?.[name];
    if (provider?.options?.apiKey) {
      const resolved = resolveEnvTemplate(provider.options.apiKey);
 if (resolved) keys[name] = resolved;
    }
  }
  return keys;
}
function getDefaultConfigPath() {
  return join(homedir(), ".config", "opencode", "opencode-poorguy-ratelimit.jsonc");
}
async function validateConfig(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid config: must be an object");
  }
  const enabled = raw.enabled !== false;
  const strategy = raw.strategy || "round-robin";
  if (!["round-robin", "least-used", "random"].includes(strategy)) {
    throw new Error(`Invalid strategy: ${strategy}`);
  }
  const opencodeKeys = await loadOpencodeProviderKeys();
  const providers = {};
  if (raw.providers && typeof raw.providers === "object") {
    for (const [name, config] of Object.entries(raw.providers)) {
      const pConfig = config;
      const autoKey = opencodeKeys[name];
      const explicitKeys = pConfig.keys ? pConfig.keys.map(normalizeKey) : [];
      const allKeys = [...explicitKeys];
      if (autoKey && !allKeys.some((k) => k.key === autoKey)) {
        allKeys.push(normalizeKey(autoKey));
      }
      if (allKeys.length === 0) {
        throw new Error(`Provider ${name}: no keys found. Add keys in plugin config or set apiKey in opencode.json provider options`);
      }
      const windowMs = typeof pConfig.windowMs === "number" && pConfig.windowMs > 0 ? pConfig.windowMs : 60000;
      const strategy = typeof pConfig.strategy === "string" && ["round-robin", "least-used", "random"].includes(pConfig.strategy) ? pConfig.strategy : undefined;
      const maxAttemptsPerRequest = typeof pConfig.maxAttemptsPerRequest === "number" && pConfig.maxAttemptsPerRequest > 0 ? pConfig.maxAttemptsPerRequest : 1;
      providers[name] = {
        keys: allKeys,
        rpm: pConfig.rpm ?? DEFAULT_RPM,
        rpd: typeof pConfig.rpd === "number" && pConfig.rpd > 0 ? pConfig.rpd : 0,
        maxConcurrent: typeof pConfig.maxConcurrent === "number" && pConfig.maxConcurrent > 0 ? pConfig.maxConcurrent : 2,
        windowMs,
        strategy,
        maxAttemptsPerRequest
      };
    }
  }
  const circuitBreaker = {
    failureThreshold: typeof raw.circuitBreaker?.failureThreshold === "number" && raw.circuitBreaker.failureThreshold > 0 ? raw.circuitBreaker.failureThreshold : 5,
    failureWindowMs: typeof raw.circuitBreaker?.failureWindowMs === "number" && raw.circuitBreaker.failureWindowMs > 0 ? raw.circuitBreaker.failureWindowMs : 60000,
    openDurationMs: typeof raw.circuitBreaker?.openDurationMs === "number" && raw.circuitBreaker.openDurationMs > 0 ? raw.circuitBreaker.openDurationMs : 180000
  };
  return {
    enabled,
    strategy,
    providers,
    backoff: { ...DEFAULT_BACKOFF, ...raw.backoff },
    circuitBreaker,
    logging: { ...DEFAULT_LOGGING, ...raw.logging }
  };
}
async function loadConfig(configPath) {
  const path = configPath || getDefaultConfigPath();
  let content;
  try {
    content = await readFile(path, "utf-8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      await createDefaultConfig(path);
      return validateConfig({});
    }
    throw error;
  }
  try {
    const raw = JSON.parse(stripJsonComments(content));
    return await validateConfig(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${path}`);
    }
    throw error;
  }
}
async function createDefaultConfig(path) {
  const defaultConfig = `{
  "enabled": true,
  "strategy": "round-robin",
  "providers": {},
  "backoff": {
    "baseDelayMs": 5000,
    "maxDelayMs": 120000
  },
  "logging": {
    "enabled": true
  }
}
`;
  try {
    const dir = dirname(path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, defaultConfig, "utf-8");
  } catch (e) {}
}

// src/logger.ts
import { appendFileSync, existsSync, statSync, truncateSync, mkdirSync as mkdirSync2 } from "fs";
import { join as join2, dirname as dirname2 } from "path";
import { homedir as homedir2 } from "os";
var LOG_FILE = join2(homedir2(), ".config", "opencode", "opencode-poorguy-ratelimit.log");
var logEnabled = true;
function setLogEnabled(v) {
  logEnabled = v;
}
function fileLog(level, msg) {
  if (!logEnabled)
    return;
  try {
    mkdirSync2(dirname2(LOG_FILE), { recursive: true });
    if (existsSync(LOG_FILE) && statSync(LOG_FILE).size > 2 * 1024 * 1024) {
      truncateSync(LOG_FILE, 0);
    }
    appendFileSync(LOG_FILE, `${new Date().toISOString()} [${level.toUpperCase()}] ${msg}
`);
  } catch {}
}

// src/fetch-interceptor.ts
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class ProviderLimiter {
  name;
  rpm;
  rpd;
  opts;
  keys;
  rrIndex = 0;
  circuit;
  cbOpts;
  constructor(name, keyCfgs, rpm, opts) {
    this.name = name;
    this.rpm = rpm;
    this.rpd = opts.rpd ?? 0;
    this.opts = opts;
    // Per-instance mutex for atomic check+push in acquire (prevents race with maxConcurrent > 1)
    this._acquireLock = Promise.resolve();
    if (keyCfgs.length === 0)
      throw new Error(`ProviderLimiter ${name}: no keys`);
    this._maxConcurrent = opts.maxConcurrent > 0 ? opts.maxConcurrent : 2;
    // Circuit breaker defaults: less aggressive (was 5/60s, now 10/120s)
    this.cbOpts = opts.circuitBreaker ?? { failureThreshold: 10, failureWindowMs: 120000, openDurationMs: 180000 };
    // Ensure maxCooldownMs has a sane default (2 min) even if config misses it
    this.opts.maxCooldownMs = this.opts.maxCooldownMs ?? 120000;
    this.opts.baseCooldownMs = this.opts.baseCooldownMs ?? 5000;
    // Per-provider strategy override (defaults to global strategy)
    this.opts.strategy = this.opts.strategy ?? opts.strategy ?? "round-robin";
    this.circuit = loadCircuitSync(name);
    this.keys = keyCfgs.map((k) => {
      const tail = k.name ?? k.key.slice(-4);
      // Load any persisted cooldown from previous sessions
      const persisted = loadCooldownSync(name, tail);
      const mc = loadModelCooldownsSync(name, tail);
      return {
        key: k.key,
        name: tail,
        hits: [],
        cooldownUntil: persisted?.until ?? 0,
        cooldownReason: persisted?.reason ?? "",
        error429Count: 0,
        lastSuccessAt: 0,
        rpd: typeof k.rpd === "number" ? k.rpd : undefined,
        modelCooldowns: mc.cooldowns,
        modelCooldownReasons: mc.reasons
      };
    });
  }
  isCircuitOpen(now = Date.now()) {
    if (this.circuit.state === "open") {
      const elapsed = now - this.circuit.openedAt;
      if (elapsed >= this.cbOpts.openDurationMs) {
        this.circuit.state = "half-open";
        saveCircuitSync(this.name, this.circuit);
        fileLog("info", `[${this.name}] circuit half-open after ${elapsed}ms`);
        return false;
      }
      return true;
    }
    return false;
  }
  recordFailure() {
    const now = Date.now();
    const cutoff = now - this.cbOpts.failureWindowMs;
    this.circuit.failures = (this.circuit.failures || []).filter((t) => t > cutoff);
    this.circuit.failures.push(now);
    if (this.circuit.failures.length >= this.cbOpts.failureThreshold) {
      this.circuit.state = "open";
      this.circuit.openedAt = now;
      fileLog("warn", `[${this.name}] circuit OPENED after ${this.circuit.failures.length} failures in ${this.cbOpts.failureWindowMs}ms`);
    }
    saveCircuitSync(this.name, this.circuit);
  }
  recordSuccess() {
    if (this.circuit.state !== "closed") {
      fileLog("info", `[${this.name}] circuit CLOSED after success`);
      this.circuit.state = "closed";
      this.circuit.failures = [];
      saveCircuitSync(this.name, this.circuit);
    }
  }
  keyRpdLimit(k) {
    return typeof k.rpd === "number" ? k.rpd : this.rpd;
  }
  isKeyAtRpdLimit(k, now = Date.now()) {
    const limit = this.keyRpdLimit(k);
    if (limit <= 0) return false;
    const count = loadRpdSync(this.name, k.name);
    return count >= limit;
  }
  getRpdRemaining(k) {
    const limit = this.keyRpdLimit(k);
    if (limit <= 0) return Infinity;
    return Math.max(0, limit - loadRpdSync(this.name, k.name));
  }
  async _lock() {
    // Real async mutex: callers queue on the previous holder's promise.
    const prev = this._acquireLock;
    let release;
    this._acquireLock = new Promise((r) => (release = r));
    await prev;
    return release;
  }
  async acquire(prevClaim, model = null) {
    if (prevClaim) releaseKeySync(this.name, prevClaim);
    // Fast-fail when every key has burned its daily quota — no point sleeping until midnight.
    if (this.keys.some((k) => this.keyRpdLimit(k) > 0) && this.keys.every((k) => this.isKeyAtRpdLimit(k))) {
      throw new Error(`[poorguy-ratelimit] ${this.name}: all ${this.keys.length} keys hit their daily limit (rpd), resets 00:00 UTC`);
    }
    // Fast-fail when every key is model-cooled (404/402) for THIS model — waiting won't help until midnight.
    if (model) {
      const cooled = this.keys.filter((k) => (k.modelCooldowns[model] ?? 0) > Date.now());
      if (cooled.length === this.keys.length && cooled.length > 0) {
        const n402 = cooled.filter((k) => k.modelCooldownReasons?.[model] === "payment").length;
        const n404 = cooled.length - n402;
        const detail = n402 === cooled.length
          ? `402 payment required on all keys (paid model — no key has credit/access for it)`
          : n404 === cooled.length
            ? `404 on all keys (model not served by any key/account)`
            : `${n402}x 402 (payment) + ${n404}x 404 (unavailable)`;
throw new Error(`[poorguy-ratelimit] ${this.name}: model '${model}' unusable until 00:00 UTC — ${detail}. Pick another model.`);
      }
    }
    let waited = 0;
    for (let round = 0;round < 120; round++) {
      const now = Date.now();
      if (this.isCircuitOpen(now)) {
        const remaining = this.cbOpts.openDurationMs - (now - this.circuit.openedAt);
        throw new Error(`[poorguy-ratelimit] ${this.name}: circuit OPEN, retry in ${Math.ceil(remaining / 1000)}s`);
      }
      // Mutex is held ONLY for the synchronous check+claim+push critical section,
      // and released before any sleep so other requests are never blocked while we wait.
      const release = await this._lock();
      let acquired = null;
      try {
        for (const k of this.orderedAvailable(now)) {
          // Skip keys that returned 404 for this specific model (they stay eligible for other models)
          if (model && (k.modelCooldowns[model] ?? 0) > now) continue;
          // orderedAvailable already evicts for least-used; skip redundant evict for other strategies
          if (this.opts.strategy !== "least-used") this.evict(k, now);
          if (k.hits.length < this.rpm) {
            if (isKeyClaimedSync(this.name, k.name)) continue;
            if (!claimKeySync(this.name, k.name)) continue;
            if (this.isKeyAtRpdLimit(k, now)) {
              releaseKeySync(this.name, k.name);
              continue;
            }
            k.hits.push(now);
            // Only update rrIndex for round-robin strategy (least-used/random don't use it)
            if (this.opts.strategy === "round-robin") {
              const idx = this.keys.indexOf(k);
              if (idx >= 0) this.rrIndex = (idx + 1) % this.keys.length;
            }
            acquired = {
              key: k.key,
              tail: k.name,
              waitedMs: waited,
              windowUsed: k.hits.length,
              keyIndex: this.keys.indexOf(k),
              totalKeys: this.keys.length
            };
            break;
          }
        }
      } finally {
        release();
      }
      if (acquired) return acquired;
      const wait = this.earliestAvailable(now);
      if (wait > 0) {
        this.opts.onWait?.(wait + waited);
        await sleep(wait);
        waited += wait;
      }
    }
    throw new Error(`[poorguy-ratelimit] ${this.name}: acquire failed after 120 rounds`);
  }
  mark429(keyIndex, responseHeaders, isQuotaExhausted = false, isDailyLimit = false) {
    const k = this.keys[keyIndex];
    if (!k)
      return 0;
    const now = Date.now();
    k.hits.push(now);
    let cooldownMs;
    let reason;
    if (isDailyLimit) {
      const midnightUtc = new Date(now);
      midnightUtc.setUTCHours(24, 0, 0, 0);
      cooldownMs = Math.max(0, midnightUtc.getTime() - now);
      reason = "daily-limit";
    } else if (isQuotaExhausted) {
      // Real quota exhaustion: 30 min, server-stated (account out of credit).
      // This is conservative — once an account hits quota, the only way to recover is to
      // add credits, and we don't want to hammer a quota-exhausted key every 30s.
      cooldownMs = 30 * 60 * 1000;
      reason = "quota";
    } else {
      // Prefer the server's Retry-After header. If absent, exponential backoff capped.
      const serverHint = readRetryAfterMs(responseHeaders);
      if (serverHint > 0) {
        // Cap server-suggested cooldown at maxCooldownMs (default 2min). Some servers send
        // 24h Retry-After for quota 429s, but those are now caught by QUOTA_RE first.
        cooldownMs = Math.min(serverHint, this.opts.maxCooldownMs);
        reason = "rate-limit";
      } else {
        cooldownMs = Math.min(this.opts.baseCooldownMs * Math.pow(2, k.error429Count), this.opts.maxCooldownMs);
        reason = "rate-limit";
      }
    }
    k.error429Count++;
    k.cooldownUntil = now + cooldownMs;
    k.cooldownReason = reason;
    // Persist to disk so the cooldown survives process restarts. Without this, every opencode
    // restart re-tries a still-rate-limited key and immediately re-enters cooldown.
    saveCooldownSync(this.name, k.name, k.cooldownUntil, reason);
    this.recordFailure();
    fileLog("warn", `[${this.name}] 429 @key…${k.name} -> cooldown ${cooldownMs}ms (${reason})`);
    return cooldownMs;
  }
  markNetworkError(keyIndex) {
    // Network error / timeout before any response arrived. Usually transient (local blip
    // or provider routing). Short key cooldown + circuit-breaker failure so a real
    // provider-wide outage still opens the circuit.
    const k = this.keys[keyIndex];
    if (!k) return 0;
    const now = Date.now();
    const cooldownMs = 30000;
    k.cooldownUntil = Math.max(k.cooldownUntil, now + cooldownMs);
    k.cooldownReason = "network";
    saveCooldownSync(this.name, k.name, k.cooldownUntil, "network");
    this.recordFailure();
    fileLog("warn", `[${this.name}] network error @key…${k.name} -> cooldown ${cooldownMs}ms`);
    return cooldownMs;
  }
  mark5xx(keyIndex) {
    // 408/5xx = server-side problem. Transient more often than not: short key cooldown,
    // feed the circuit breaker, and let rotation try another key.
    const k = this.keys[keyIndex];
    if (!k) return 0;
    const now = Date.now();
    const cooldownMs = 30000;
    k.cooldownUntil = Math.max(k.cooldownUntil, now + cooldownMs);
    k.cooldownReason = "server-error";
    saveCooldownSync(this.name, k.name, k.cooldownUntil, "server-error");
    this.recordFailure();
    fileLog("warn", `[${this.name}] 5xx/408 @key…${k.name} -> cooldown ${cooldownMs}ms`);
    return cooldownMs;
  }
  mark402(keyIndex, model) {
    // 402 = this key/account has no credit for THIS model (e.g. free-tier key on a
    // paid-only model). It says nothing about the key's other models, so scope the
    // cooldown to (key, model) until 00:00 UTC — the key stays usable for free models.
    const k = this.keys[keyIndex];
    if (!k) return 0;
    const now = Date.now();
    const midnightUtc = new Date(now);
    midnightUtc.setUTCHours(24, 0, 0, 0);
    const cooldownMs = Math.max(60000, midnightUtc.getTime() - now);
    if (model) {
      k.modelCooldowns[model] = now + cooldownMs;
      k.modelCooldownReasons = k.modelCooldownReasons ?? {};
      k.modelCooldownReasons[model] = "payment";
      saveModelCooldownsSync(this.name, k.name, k.modelCooldowns, k.modelCooldownReasons);
    } else {
      // Couldn't identify the model — fall back to a short key-wide cooldown.
      k.cooldownUntil = Math.max(k.cooldownUntil, now + Math.min(cooldownMs, 300000));
      k.cooldownReason = "payment";
      saveCooldownSync(this.name, k.name, k.cooldownUntil, "payment");
    }
    fileLog("warn", `[${this.name}] 402 @key…${k.name} model=${model ?? "unknown"} -> model-scoped cooldown ${cooldownMs}ms (payment, until 00:00 UTC)`);
    return cooldownMs;
  }
  markModel404(keyIndex, model) {
    // 404 = this model is not served by this key/account. Scope the cooldown to
    // (key, model) only — the key remains usable for every other model.
    const k = this.keys[keyIndex];
    if (!k) return 0;
    const now = Date.now();
    const midnightUtc = new Date(now);
    midnightUtc.setUTCHours(24, 0, 0, 0);
    const cooldownMs = Math.max(60000, midnightUtc.getTime() - now);
    if (model) {
      k.modelCooldowns[model] = now + cooldownMs;
      k.modelCooldownReasons = k.modelCooldownReasons ?? {};
      k.modelCooldownReasons[model] = "notfound";
      saveModelCooldownsSync(this.name, k.name, k.modelCooldowns, k.modelCooldownReasons);
    } else {
      // Couldn't identify the model — fall back to a short key-wide cooldown.
      k.cooldownUntil = now + Math.min(cooldownMs, 300000);
      k.cooldownReason = "not-found";
      saveCooldownSync(this.name, k.name, k.cooldownUntil, "not-found");
    }
    fileLog("warn", `[${this.name}] 404 @key…${k.name} model=${model ?? "unknown"} -> model-scoped cooldown ${cooldownMs}ms`);
    return cooldownMs;
  }
  markAuthFailure(keyIndex) {
    // 401/403 = key invalid, revoked, or forbidden. Cool key-wide for 30 min so rotation
    // skips it, but don't kill it for a day (keys sometimes get re-enabled).
    const k = this.keys[keyIndex];
    if (!k) return 0;
    const now = Date.now();
    const cooldownMs = 30 * 60 * 1000;
    k.cooldownUntil = now + cooldownMs;
    k.cooldownReason = "auth";
    saveCooldownSync(this.name, k.name, k.cooldownUntil, "auth");
    fileLog("warn", `[${this.name}] auth failure @key…${k.name} -> cooldown ${cooldownMs}ms`);
    return cooldownMs;
  }
  noteSuccess(keyIndex) {
    const k = this.keys[keyIndex];
    if (k) {
      k.error429Count = 0;
      k.lastSuccessAt = Date.now();
      // Clear any persisted cooldown — the key just proved it's healthy
      if (k.cooldownUntil > 0) {
        k.cooldownUntil = 0;
        k.cooldownReason = "";
        clearCooldownSync(this.name, k.name);
      }
    }
  }
  remaining(now = Date.now()) {
    let r = 0;
    for (const k of this.keys) {
      this.evict(k, now);
      if (k.cooldownUntil <= now)
        r += this.rpm - k.hits.length;
    }
    return r;
  }
  availableKeyCount(now = Date.now()) {
    return this.keys.filter((k) => k.cooldownUntil <= now).length;
  }
  get totalKeyCount() {
    return this.keys.length;
  }
  setMaxConcurrent(n) {
    this._maxConcurrent = n;
  }
  _maxConcurrent;
  inFlight = 0;
  queue = [];
  async acquireSlot() {
    if (this.inFlight < this._maxConcurrent) {
      this.inFlight++;
      return;
    }
    fileLog("info", `[${this.name}] concurrency full (${this.inFlight}/${this._maxConcurrent}), queueing`);
    await new Promise((r) => this.queue.push(r));
    this.inFlight++;
  }
  releaseSlot() {
    this.inFlight--;
    const next = this.queue.shift();
    if (next)
      next();
  }
  orderedAvailable(now) {
    const avail = this.keys.filter((k) => k.cooldownUntil <= now);
    if (avail.length === 0)
      return [];
    const n = this.keys.length;
    switch (this.opts.strategy) {
      case "round-robin": {
        const out = [];
        for (let i = 0;i < n; i++) {
          const k = this.keys[(this.rrIndex + i) % n];
          if (k.cooldownUntil <= now)
            out.push(k);
        }
        return out;
      }
      case "least-used": {
        for (const k of avail)
          this.evict(k, now);
        const sorted = [...avail].sort((a, b) => a.hits.length - b.hits.length);
        // Tie-break rotation: without this, sparse usage (all windows empty) degenerates
        // to always picking keys[0], because V8's stable sort keeps array order on ties.
        let tieCount = 0;
        const min = sorted.length ? sorted[0].hits.length : 0;
        while (tieCount < sorted.length && sorted[tieCount].hits.length === min)
          tieCount++;
        if (tieCount > 1) {
          this._tieRot = ((this._tieRot ?? 0) + 1) % tieCount;
          const head = sorted.splice(0, tieCount);
          head.push(...head.splice(0, this._tieRot));
          sorted.unshift(...head);
        }
        return sorted;
      }
      case "random": {
        for (let i = avail.length - 1;i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [avail[i], avail[j]] = [avail[j], avail[i]];
        }
        return avail;
      }
      default:
        return avail;
    }
  }
  evict(k, now) {
    const cutoff = now - this.opts.windowMs;
    while (k.hits.length > 0 && k.hits[0] <= cutoff)
      k.hits.shift();
  }
  earliestAvailable(now) {
    let wait = Infinity;
    for (const k of this.keys) {
      if (k.cooldownUntil > now) {
        wait = Math.min(wait, k.cooldownUntil - now);
        continue;
      }
      this.evict(k, now);
      if (k.hits.length >= this.rpm)
        wait = Math.min(wait, k.hits[0] + this.opts.windowMs - now);
    }
    if (!Number.isFinite(wait)) return 1000;
    const baseWait = Math.max(10, wait + 10);
    // Add jitter: +/-25% to prevent thundering herd when multiple requests hit limit simultaneously
    const jitter = baseWait * 0.25 * (Math.random() * 2 - 1);
    return Math.max(10, Math.floor(baseWait + jitter));
  }
}
var WRAPPED_MARK = Symbol.for("poorguy-ratelimit.wrapped");
var QUOTA_RE = /(insufficient|out\s+of|exceeded|exhausted|reached)\s*(.{0,15})?\s*(credit|quota|balance|funds|allowance|usage\s*cap|allocation|capacity)|quota\s*(?:has\s+been\s+)?(exceeded|exhausted|reached|limit)|payment\s+required|account\s+(?:is\s+|has\s+(?:been\s+)?)?(suspended|disabled|banned|terminated|out\s+of)|subscription\s+(?:has\s+(?:been\s+)?)?(expired|inactive)|no\s+remaining\s+credits?|no\s+credit\s+left|credit\s+balance|out\s+of\s+credit|usage\s*cap|exceeded\s+(?:your\s+)?plan\s*limit/i;
var RATE_LIMIT_RE = /(too\s*many\s*requests|rate\s*limit|requests?\s*per\s*(minute|second|hour|min)|try\s*again\s*(later|in))/i;
var PAYMENT_REQUIRED_RE = /insufficient\s+balance|payment\s+required/i;
var NOT_FOUND_RE = /Not Found|not found/i;
var DAILY_LIMIT_RE = /(daily\s+limit|limit_rpd|requests?\s*per\s*day|rpd|per\s*24\s*hours?|24h\s+limit|quota\s+reset)/i;
function readRetryAfterMs(headers) {
  if (!headers) return 0;
  const ram = headers.get("retry-after-ms");
  if (ram) {
    const v = parseFloat(ram);
    if (Number.isFinite(v) && v > 0) return v;
  }
  const ra = headers.get("retry-after");
  if (ra) {
    const asNum = parseFloat(ra);
    if (Number.isFinite(asNum) && asNum > 0) return asNum * 1000;
    const asDate = Date.parse(ra);
    if (Number.isFinite(asDate)) return Math.max(0, asDate - Date.now());
  }
  const reset = headers.get("x-ratelimit-reset");
  if (reset) {
    const asNum = parseFloat(reset);
    if (Number.isFinite(asNum)) {
      if (asNum > 1e12) return Math.max(0, asNum - Date.now());
      if (asNum > 1e9) return Math.max(0, asNum * 1000 - Date.now());
    }
  }
  return 0;
}
async function detectQuotaExhausted(res) {
  try {
    const text = await res.clone().text();
    return QUOTA_RE.test(text);
  } catch {
    return false;
  }
}
async function detectPaymentRequired(res) {
  try {
    const text = await res.clone().text();
    return PAYMENT_REQUIRED_RE.test(text);
  } catch {
    return false;
  }
}

async function detectNotFound(res) {
  try {
    const text = await res.clone().text();
    return NOT_FOUND_RE.test(text);
  } catch {
    return false;
  }
}

async function detectDailyLimit(res) {
  try {
    const text = await res.clone().text();
    return DAILY_LIMIT_RE.test(text);
  } catch {
    return false;
  }
}

function extractModel(init) {
  try {
    const b = init?.body;
    if (typeof b === "string") return JSON.parse(b)?.model ?? null;
  } catch {}
  return null;
}
function wrapFetch(origFetch, limiter, toast) {
  if (origFetch[WRAPPED_MARK])
    return origFetch;
  const wrapped = async (input, init) => {
    const maxAttempts = limiter.opts.maxAttemptsPerRequest ?? 1;
    const model = extractModel(init);
    let lastRes;
    let claimedKey = null;
    let slotReleased = false;
    await limiter.acquireSlot();
    try {
    for (let attempt = 0;attempt < maxAttempts; attempt++) {
      let acq;
      try {
        acq = await limiter.acquire(claimedKey, model);
      } catch (e) {
        if (e.message && e.message.includes('circuit OPEN')) {
          const remaining = limiter.cbOpts.openDurationMs - (Date.now() - limiter.circuit.openedAt);
          if (remaining > 0) {
            fileLog("info", `[${limiter.name}] circuit open, sleeping ${Math.ceil(remaining / 1000)}s for half-open`);
            await toast(`⏳ [${limiter.name}] circuit breaker open, waiting ${Math.ceil(remaining / 1000)}s for recovery...`, "warning");
            await sleep(remaining + 1000);
            continue;
          }
        }
        slotReleased = true; limiter.releaseSlot();
        throw e;
      }
      claimedKey = acq.tail;
      await toast(`\uD83D\uDD11 [${limiter.name}] key…${acq.tail} · window ${acq.windowUsed}/${limiter.rpm} · key ${acq.keyIndex + 1}/${acq.totalKeys}`, "info");
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${acq.key}`);
      const finalInit = { ...init ?? {}, headers };
      let res;
      try {
        res = await origFetch(input, finalInit);
      } catch (e) {
        // Network error / timeout before any response: cool the key briefly, feed the
        // circuit breaker, and rotate to another key while attempts remain.
        limiter.markNetworkError(acq.keyIndex);
        if (attempt >= maxAttempts - 1) {
          releaseKeySync(limiter.name, claimedKey);
          slotReleased = true; limiter.releaseSlot();
          throw e;
        }
        fileLog("warn", `[${limiter.name}] key=…${acq.tail} network error: ${e.message} — rotating`);
        await toast(`[NET] [${limiter.name}] key…${acq.tail} network error, rotating to next key`, "warning");
        continue;
      }
      fileLog("info", `[${limiter.name}] key=…${acq.tail} wait=${acq.waitedMs}ms attempt=${attempt + 1}/${maxAttempts} -> ${res.status}`);
        const lastAttempt = attempt >= maxAttempts - 1;
        const rotateNote = lastAttempt ? `, attempts exhausted (${maxAttempts}), opencode will retry` : ", rotating to next key";
        if (res.status === 429) {
          const quota = await detectQuotaExhausted(res);
          const daily = !quota && await detectDailyLimit(res);
          const cd = limiter.mark429(acq.keyIndex, res.headers, quota, daily);
          lastRes = res;
          if (lastAttempt) {
            releaseKeySync(limiter.name, claimedKey);
            slotReleased = true;
            limiter.releaseSlot();
          }
          const reason = quota ? " (quota exhausted)" : daily ? " (daily limit)" : "";
          await toast(`[429] [${limiter.name}] key…${acq.tail}${reason}, cooldown ${(cd / 1000).toFixed(0)}s${rotateNote}`, "error");
          continue;
        }
        if (res.status === 402) {
          const cd = limiter.mark402(acq.keyIndex, model);
          lastRes = res;
          if (lastAttempt) {
            releaseKeySync(limiter.name, claimedKey);
            slotReleased = true;
            limiter.releaseSlot();
          }
await toast(`[402] [${limiter.name}] key…${acq.tail}${model ? ` model=${model}` : ""} payment required, key skipped for this model until 00:00 UTC${rotateNote}`, "error");
          continue;
        }
        if (res.status === 404) {
          const cd = limiter.markModel404(acq.keyIndex, model);
          lastRes = res;
          if (lastAttempt) {
            releaseKeySync(limiter.name, claimedKey);
            slotReleased = true;
            limiter.releaseSlot();
          }
          await toast(`[404] [${limiter.name}] key…${acq.tail}${model ? ` model=${model}` : ""}, key skipped for this model until 00:00 UTC${rotateNote}`, "error");
          continue;
        }
        if (res.status === 401 || res.status === 403) {
          const cd = limiter.markAuthFailure(acq.keyIndex);
          lastRes = res;
          if (lastAttempt) {
            releaseKeySync(limiter.name, claimedKey);
            slotReleased = true;
            limiter.releaseSlot();
          }
          await toast(`[${res.status}] [${limiter.name}] key…${acq.tail} auth failed, key cooled ${(cd / 60000).toFixed(0)}min${rotateNote}`, "error");
          continue;
        }
        if (res.status === 408 || res.status >= 500) {
          const cd = limiter.mark5xx(acq.keyIndex);
          lastRes = res;
          if (lastAttempt) {
            releaseKeySync(limiter.name, claimedKey);
            slotReleased = true;
            limiter.releaseSlot();
          }
          await toast(`[${res.status}] [${limiter.name}] key…${acq.tail} server error, cooldown ${(cd / 1000).toFixed(0)}s${rotateNote}`, "error");
          continue;
        }
        if (res.status >= 200 && res.status < 300) {
          limiter.noteSuccess(acq.keyIndex);
          incrementRpdSync(limiter.name, acq.tail);
          limiter.recordSuccess();
          if (attempt > 0) {
            await toast(`[OK] [${limiter.name}] key…${acq.tail} succeeded on attempt ${attempt + 1}`, "success");
          }
          return wrapResponseForSlot(res, () => {
            releaseKeySync(limiter.name, claimedKey);
            slotReleased = true;
            limiter.releaseSlot();
          }, init?.signal ?? (input instanceof Request ? input.signal : null));
        }
        fileLog("warn", `[${limiter.name}] key=…${acq.tail} -> ${res.status} (unhandled, passing through)`);
        releaseKeySync(limiter.name, claimedKey);
        slotReleased = true;
        limiter.releaseSlot();
        return res;
    }
    return lastRes;
    } finally {
      if (!slotReleased) limiter.releaseSlot();
    }
  };
  wrapped[WRAPPED_MARK] = true;
  return wrapped;
}
function wrapResponseForSlot(res, release, signal) {
  if (!res.body) {
    release();
    return res;
  }
  const { readable, writable } = new TransformStream;
  const reader = res.body.getReader();
  const writer = writable.getWriter();
  const onAbort = () => {
    reader.cancel().catch(() => {});
    writer.abort(new Error("request aborted")).catch(() => {});
  };
  if (signal) {
    if (signal.aborted)
      onAbort();
    else
      signal.addEventListener("abort", onAbort, { once: true });
  }
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        await writer.write(value);
      }
      await writer.close();
    } catch (e) {
      try {
        writer.abort(e);
      } catch {}
    } finally {
      signal?.removeEventListener("abort", onAbort);
      release();
    }
  })();
  return new Response(readable, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers
  });
}

// src/index.ts
var NIM_WINDOW_MS = 61000;
var PoorguyRatelimit = async ({ client }) => {
  const config = await loadConfig();
  if (!config.enabled)
    return {};
  setLogEnabled(config.logging.enabled);
  const limiters = new Map;
  for (const [name, p] of Object.entries(config.providers)) {
    const keys = p.keys.map((k) => typeof k === "string" ? { key: k } : k);
    limiters.set(name, new ProviderLimiter(name, keys, p.rpm ?? 40, {
      windowMs: p.windowMs ?? 60000,
      baseCooldownMs: config.backoff.baseDelayMs,
      maxCooldownMs: config.backoff.maxDelayMs,
      maxConcurrent: p.maxConcurrent ?? 2,
      maxAttemptsPerRequest: p.maxAttemptsPerRequest ?? 1,
      rpd: p.rpd ?? 0,
      circuitBreaker: config.circuitBreaker,
      strategy: p.strategy ?? config.strategy,
      onWait: (ms) => {
        const l = limiters.get(name);
toast(`⏳ [${name}] rate limit triggered, waiting ${(ms / 1000).toFixed(1)}s (${l?.availableKeyCount() ?? 0}/${l?.totalKeyCount ?? 0} keys available)`, "warning");
      }
    }));
    const limiter = limiters.get(name);
    const cooling = (limiter?.keys ?? []).filter((k) => k.cooldownUntil > Date.now()).map((k) => `${k.name}(${k.cooldownReason},${Math.round((k.cooldownUntil - Date.now()) / 1000)}s)`);
    fileLog("info", `plugin ready: provider=${name} keys=${keys.length} rpm=${p.rpm ?? 40} strategy=${config.strategy} logFile=${LOG_FILE}${cooling.length ? ` restoredCooldowns=[${cooling.join(",")}]` : ""}`);
  }
  async function toast(message, variant = "info") {
    try {
      await client.tui.showToast({ body: { message, variant } });
    } catch {}
  }
  return {
    config: async (cfg) => {
      for (const [name, limiter] of limiters) {
        const providerCfg = cfg.provider?.[name];
        if (!providerCfg) {
          fileLog("warn", `provider '${name}' configured in plugin but not found in opencode config, skipping interception`);
          continue;
        }
        providerCfg.options = providerCfg.options ?? {};
        const prev = providerCfg.options.fetch ?? globalThis.fetch;
        providerCfg.options.fetch = wrapFetch(prev, limiter, toast);
        fileLog("info", `fetch wrapped for provider=${name}`);
      }
    }
  };
};
var src_default = PoorguyRatelimit;
export {
  src_default as default,
  PoorguyRatelimit
};
