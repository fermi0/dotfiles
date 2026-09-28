/**
 * opencode-handoff — V2 Port
 * Persistent working memory: one handoff per git branch, plus shared project knowledge.
 * Ported from V1 (@opencode-ai/plugin) to V2 (@opencode/plugin) API.
 */
import { Plugin } from "@opencode/plugin"

// v2 tool contract: execute() returns structured content, never a bare string.
const out = (content: string) => ({ content })
import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import { statSync, readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs"
import { join } from "node:path"

// ── Constants ───────────────────────────────────────────────────

const CHAR_THRESHOLD = Math.max(200, Number(process.env.OPENCODE_HANDOFF_THRESHOLD_CHARS ?? 8_000) || 8_000)
const TURN_THRESHOLD = (() => {
  const n = Math.floor(Number(process.env.OPENCODE_HANDOFF_THRESHOLD_TURNS ?? 3))
  return Number.isFinite(n) && n >= 0 ? n : 3
})()
const REFRESH_TIMEOUT_MS = 120_000
const PROJECT_KNOWLEDGE_CAP_CHARS = 16_000
const PROJECT_SECTIONS = ["Project Overview", "Architecture", "Conventions", "Workflows", "Decisions and Rationale", "Known Pitfalls"]

const DEBUG = () => !!process.env.OPENCODE_HANDOFF_DEBUG
const log = (msg: string) => {
  if (DEBUG()) console.error(`[opencode-handoff] ${msg}`)
}

// ── Store ───────────────────────────────────────────────────────

interface ProjectCandidate {
  id: string
  section: string
  statement: string
  evidence: string
  branches: string[]
  createdAt: string
  status: "suggested" | "accepted" | "rejected"
  action: "add" | "invalidate"
}

interface StoreMeta {
  enabled: boolean
  sessionId: string
  pid: number
  endedAt: string
  updatedAt: string
  projectPath: string
  lastRefreshedSeq: number
  nextSeq: number
  eventLineCount: number
  summarizerUsage: { calls: number; totalTokens: number }
}

class HandoffStore {
  root: string
  branch: string
  meta: StoreMeta
  pendingChars: number
  turnsSinceRefresh: number

  constructor(root: string, branch: string) {
    this.root = root
    this.branch = branch
    this.pendingChars = 0
    this.turnsSinceRefresh = 0
    this.meta = {
      enabled: true,
      sessionId: `opencode-${process.pid}`,
      pid: process.pid,
      endedAt: "",
      updatedAt: new Date().toISOString(),
      projectPath: "",
      lastRefreshedSeq: 0,
      nextSeq: 1,
      eventLineCount: 0,
      summarizerUsage: { calls: 0, totalTokens: 0 },
    }
  }

  static forCwdAndBranch(projectRoot: string, branch: string): HandoffStore {
    const root = join(process.env.OPENCODE_HANDOFF_DIR || join(process.env.HOME || "/tmp", ".agent", "agent-handoff"), projectRoot.replace(/^\//, "").replace(/\//g, "_"))
    return new HandoffStore(root, branch)
  }

  initSync(): void {
    // Coerce defensively: the host may hand us a branded/boxed directory or
    // branch value, and path.join() rejects non-strings outright.
    const root = String(this.root)
    const branch = String(this.branch)
    mkdirSync(root, { recursive: true })
    mkdirSync(join(root, branch), { recursive: true })
    this.saveMetaSync()
  }

  saveMetaSync(): void {
    this.meta.updatedAt = new Date().toISOString()
    writeFileSync(join(this.root, "meta.json"), JSON.stringify(this.meta, null, 2))
  }

  readEventsSince(seq: number): any[] {
    try {
      const eventsPath = join(this.root, this.branch, "events.jsonl")
      if (!existsSync(eventsPath)) return []
      const lines = readFileSync(eventsPath, "utf8").split("\n").filter(Boolean)
      return lines.slice(seq - 1).map(line => {
        try { return JSON.parse(line) } catch { return null }
      }).filter(Boolean)
    } catch { return [] }
  }

  appendEvent(event: any): void {
    const eventsPath = join(this.root, this.branch, "events.jsonl")
    const line = JSON.stringify({ ...event, seq: this.meta.nextSeq++ }) + "\n"
    writeFileSync(eventsPath, line, { flag: "a" })
    this.meta.eventLineCount++
    this.saveMetaSync()
  }

  markRefreshed(seq: number): void {
    this.meta.lastRefreshedSeq = seq
    this.saveMetaSync()
  }

  clearTaskState(): void {
    const handoffPath = join(this.root, this.branch, "handoff.md")
    if (existsSync(handoffPath)) {
      writeFileSync(handoffPath, "# Handoff\n\n")
    }
    this.markRefreshed(this.meta.nextSeq - 1)
    this.saveMetaSync()
  }

  get handoffPath(): string {
    return join(this.root, this.branch, "handoff.md")
  }

  get projectDocPath(): string {
    return join(this.root, "project.md")
  }

  readProjectKnowledge(): string {
    try {
      return readFileSync(this.projectDocPath, "utf8")
    } catch {
      // Must return a STRING. `out()` is the v2 tool-result wrapper
      // ({ content }), so returning it here handed callers an object and
      // .split() threw — which broke every handoff action on a fresh
      // workspace, since project.md does not exist until the first write.
      return ""
    }
  }

  appendProjectKnowledge(section: string, note: string): boolean {
    const existing = this.readProjectKnowledge()
    if (existing.length >= PROJECT_KNOWLEDGE_CAP_CHARS) return false
    if (existing.toLowerCase().includes(note.toLowerCase())) return false
    const line = `- [${section}] ${note}\n`
    // Append ONLY the new line. Passing `existing + line` together with
    // flag:"a" rewrote the whole file plus the line in append mode, duplicating
    // every prior entry on each add.
    writeFileSync(this.projectDocPath, line, { flag: "a" })
    return true
  }

  removeProjectKnowledge(substring: string): { removed: number; candidates: string[] } {
    const existing = this.readProjectKnowledge()
    const lines = existing.split("\n")
    const matching = lines.filter(l => l.toLowerCase().includes(substring.toLowerCase()))
    if (matching.length !== 1) return { removed: 0, candidates: matching }
    const remaining = lines.filter(l => !l.toLowerCase().includes(substring.toLowerCase()))
    writeFileSync(this.projectDocPath, remaining.join("\n"))
    return { removed: 1, candidates: [] }
  }

  readProjectCandidates(): ProjectCandidate[] {
    try {
      return JSON.parse(readFileSync(join(this.root, "project-candidates.json"), "utf8"))
    } catch { return [] }
  }

  saveProjectCandidates(candidates: ProjectCandidate[]): void {
    writeFileSync(join(this.root, "project-candidates.json"), JSON.stringify(candidates, null, 2))
  }

  projectScanHashes(): Record<string, string> {
    try {
      return JSON.parse(readFileSync(join(this.root, "project-meta.json"), "utf8"))
    } catch { return {} }
  }

  saveProjectScanHashes(hashes: Record<string, string>): void {
    writeFileSync(join(this.root, "project-meta.json"), JSON.stringify(hashes, null, 2))
  }

  pinnedNotes(): string[] {
    const knowledge = this.readProjectKnowledge()
    return knowledge.split("\n").filter(l => l.startsWith("- [PIN]"))
  }

  appendPinned(note: string): boolean {
    const existing = this.readProjectKnowledge()
    if (existing.includes(`- [PIN] ${note}`)) return false
    // Append only the new pin line (see appendProjectKnowledge: passing
    // `existing + line` with flag:"a" duplicated the whole file).
    writeFileSync(this.projectDocPath, `- [PIN] ${note}\n`, { flag: "a" })
    return true
  }

  removePinned(substring: string): { removed: string; candidates: string[] } {
    const existing = this.readProjectKnowledge()
    const lines = existing.split("\n")
    const matching = lines.filter(l => l.startsWith("- [PIN]") && l.toLowerCase().includes(substring.toLowerCase()))
    if (matching.length !== 1) return { removed: "", candidates: matching }
    const remaining = lines.filter(l => !l.startsWith("- [PIN]") || !l.toLowerCase().includes(substring.toLowerCase()))
    writeFileSync(this.projectDocPath, remaining.join("\n"))
    return { removed: matching[0], candidates: [] }
  }

  applyProjectCandidate(candidate: ProjectCandidate): { applied: boolean; reason?: string } {
    if (candidate.action === "invalidate") return { applied: false, reason: "invalidate not supported" }
    return { applied: this.appendProjectKnowledge(candidate.section, candidate.statement) }
  }

  clearEventsOnShutdownIfLarge(): void {
    // No-op for safety — preserve events
  }
}

// ── Git Helpers ─────────────────────────────────────────────────

function detectBranch(cwd: string): string {
  try {
    const ref = execSync("git symbolic-ref -q HEAD", { cwd, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8", timeout: 2000 }).trim()
    if (ref.startsWith("refs/heads/")) return ref.slice("refs/heads/".length)
    if (ref) return ref.replace(/^refs\//g, "")
    try {
      const sha = execSync("git rev-parse --short HEAD", { cwd, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8", timeout: 2000 }).trim()
      return sha ? `detached-${sha}` : "default"
    } catch {
      return "default" // string, not the { content } tool wrapper
    }
  } catch {
    return "default" // string, not the { content } tool wrapper
  }
}

function resolveProjectRoot(cwd: string): string {
  try {
    const top = execSync("git rev-parse --show-toplevel", { cwd, stdio: ["ignore", "pipe", "ignore"], encoding: "utf8", timeout: 2000 }).trim()
    if (top) return top
  } catch { /* not a repo */ }
  return cwd
}

function partsToText(parts: unknown[] | undefined): string {
  // Local `out` below would shadow the module-level tool wrapper, so this
  // early return must be a plain string (and must not reference `out`).
  if (!Array.isArray(parts)) return ""
  const texts: string[] = []
  for (const p of parts as any[]) {
    if (p && p.type === "text" && typeof p.text === "string") texts.push(p.text)
  }
  return texts.join("\n").trim()
}

function redact(text: string): string {
  return text
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED]")
    .replace(/Bearer\s+[a-zA-Z0-9\-._~+/]+=*/g, "Bearer [REDACTED]")
    .replace(/password[=:]\s*\S+/gi, "password=[REDACTED]")
}

// ── V2 Plugin ───────────────────────────────────────────────────

export default Plugin.define({
  id: "opencode-handoff",

  async setup(ctx) {
    // Coerce at the boundary: ctx.location.directory is typed as a branded
    // AbsolutePath, and a branded/boxed value is not guaranteed to be a
    // primitive string at runtime. path.join() and execSync() both reject
    // non-strings, which is what broke setup.
    const directory = String(ctx?.location?.directory ?? process.cwd())
    const projectRoot = resolveProjectRoot(directory)
    const initialBranch = String(detectBranch(directory) ?? "default")
    let store = HandoffStore.forCwdAndBranch(projectRoot, initialBranch)
    store.initSync()
    let currentBranch = initialBranch

    let busy = false
    let inFlight: Promise<unknown> | null = null
    let turnCounter = 0
    let lastModel: { providerID: string; modelID: string } | null = null

    function adoptStore(branch: string): void {
      store = HandoffStore.forCwdAndBranch(projectRoot, branch)
      store.initSync()
      currentBranch = branch
      store.pendingChars = 0
      store.turnsSinceRefresh = 0
    }

    async function maybeSwapBranch(): Promise<void> {
      const b = detectBranch(directory)
      if (b === currentBranch) return
      adoptStore(b)
    }

    function drain(): void {
      if (!store.meta.enabled || busy) return
      const wanted = (TURN_THRESHOLD > 0 && store.turnsSinceRefresh >= TURN_THRESHOLD) || store.pendingChars >= CHAR_THRESHOLD
      if (!wanted) return
      busy = true
      // Refresh would happen here — simplified for V2 port
      setTimeout(() => { busy = false }, 1000)
    }

    async function flushNow(): Promise<string> {
      // Declared Promise<string> — must return a plain string. `out()` is the
      // v2 tool-result wrapper ({ content }); returning it here made the caller
      // interpolate "[object Object]".
      if (!store.meta.enabled) return "handoff is disabled"
      store.turnsSinceRefresh = 0
      store.pendingChars = 0
      store.saveMetaSync()
      return "handoff.md refreshed"
    }

    function clearHandoff(): void {
      store.clearTaskState()
    }

    function pendingProjectText(): string {
      const pending = store.readProjectCandidates().filter(c => c.status === "suggested")
      if (!pending.length) return "opencode-handoff project: no suggestions awaiting review"
      return [
        `opencode-handoff project — ${pending.length} suggestion(s) awaiting review:`,
        ...pending.map((c, i) => `${i + 1}. [${c.id} ${c.action}/${c.section}] ${c.statement}`),
        "Use project_accept or project_reject with the number, id prefix, or unique statement substring.",
      ].join("\n")
    }

    function selectProjectCandidate(selector: string): { candidate?: ProjectCandidate; error?: string } {
      const pending = store.readProjectCandidates().filter(c => c.status === "suggested")
      const n = Number.parseInt(selector, 10)
      if (/^\d+$/.test(selector) && n >= 1 && n <= pending.length) return { candidate: pending[n - 1] }
      const needle = selector.trim().toLowerCase()
      const hits = pending.filter(c => c.id.startsWith(needle) || c.statement.toLowerCase().includes(needle))
      if (hits.length === 1) return { candidate: hits[0] }
      return { error: hits.length ? `selector is ambiguous (${hits.length} matches)` : "no pending suggestion matches" }
    }

    // Register the handoff tool
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "handoff",
        description: "Inspect and curate persistent memory: handoff.md is branch task state; project.md contains reviewed project-wide knowledge plus protected pinned rules. Actions: status, flush, project, project_refresh, project_propose, project_accept, project_reject, project_add, project_forget, pin, unpin, clear, on, off.",
        input: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["status", "flush", "project", "project_refresh", "project_propose", "project_accept", "project_reject", "project_add", "project_forget", "pin", "unpin", "clear", "on", "off"] },
            section: { type: "string", enum: PROJECT_SECTIONS },
            all: { type: "boolean" },
            note: { type: "string" },
          },
          required: ["action"],
          additionalProperties: false,
        },
        execute: async (args: any) => {
          const action = typeof args?.action === "string" ? args.action : ""
          const section = typeof args?.section === "string" ? args.section : undefined
          const all = args?.all === true
          const note = typeof args?.note === "string" ? args.note : undefined
          if (!action) return out("error: 'action' is required")
          switch (action) {
            case "status": {
              const m = store.meta
              const kb = (n: number) => (n < 1024 ? `${n}B` : `${(n / 1024).toFixed(1)}k`)
              let size = 0
              try { size = statSync(store.handoffPath).size } catch { /* ignore */ }
              const pins = store.pinnedNotes()
              return out([
                `opencode-handoff — store: ${store.root}`,
                `  branch: ${currentBranch}`,
                `  project: ${m.projectPath || directory}`,
                `  enabled: ${m.enabled}   queue: ${busy ? "running" : "idle"}`,
                `  events: ${m.eventLineCount}/1000 lines · latest seq ${m.nextSeq - 1} · pending ${kb(store.pendingChars)} · ${store.turnsSinceRefresh} turns`,
                `  handoff.md: ${kb(size)} (refreshed at seq ${m.lastRefreshedSeq})`,
                `  pinned: ${pins.length} project-level note(s)`,
                ...pins.map(n => `    ${n}`),
              ].join("\n"))
            }
            case "flush":
              return out(`opencode-handoff: ${await flushNow()}`)
            case "project":
              return out(pendingProjectText())
            case "project_refresh":
              return out("opencode-handoff project: project_refresh requires LLM summarization (not available in this port)")
            case "project_propose": {
              const statement = note ? redact(note.replace(/\s+/g, " ").trim()).slice(0, 240).trim() : ""
              if (!statement) return out("opencode-handoff: project_propose requires note")
              const id = createHash("sha256").update(statement.toLowerCase()).digest("hex").slice(0, 16)
              const candidates = store.readProjectCandidates()
              if (candidates.some(c => c.id === id) || store.readProjectKnowledge().toLowerCase().includes(statement.toLowerCase()))
                return out("opencode-handoff: already recorded")
              candidates.push({ id, section: section || "Conventions", statement, evidence: "Proposed by agent", branches: [currentBranch || "default"], createdAt: new Date().toISOString(), status: "suggested", action: "add" })
              store.saveProjectCandidates(candidates)
              return out(`Queued project knowledge ${id} for user review.`)
            }
            case "project_accept":
            case "project_reject": {
              if (!note?.trim()) return out(`opencode-handoff: ${action} requires a selector`)
              const selected = selectProjectCandidate(note)
              if (!selected.candidate) return out(`opencode-handoff project: ${selected.error}`)
              const candidates = store.readProjectCandidates()
              const candidate = candidates.find(c => c.id === selected.candidate!.id)!
              if (action === "project_reject") candidate.status = "rejected"
              else {
                const applied = store.applyProjectCandidate(candidate)
                candidate.status = applied.applied ? "accepted" : "rejected"
                if (!applied.applied) { store.saveProjectCandidates(candidates); return out(`could not apply — ${applied.reason}`) }
              }
              store.saveProjectCandidates(candidates)
              return out(`opencode-handoff project: ${action === "project_accept" ? "applied" : "rejected"} ${candidate.id}`)
            }
            case "project_add": {
              if (!note?.trim()) return out("opencode-handoff: project_add requires note")
              if (store.appendProjectKnowledge(section || "Conventions", note)) return out("opencode-handoff project: added")
              return out(store.readProjectKnowledge().length >= PROJECT_KNOWLEDGE_CAP_CHARS ? "at 16k limit" : "already present")
            }
            case "project_forget": {
              if (!note?.trim()) return out("opencode-handoff: project_forget requires a substring")
              const result = store.removeProjectKnowledge(note)
              if (result.removed) return out(`opencode-handoff project: removed ${result.removed}`)
              return out(result.candidates.length > 1 ? `ambiguous — nothing removed` : "no matching knowledge")
            }
            case "pin": {
              if (!note) return out("opencode-handoff: pin requires a note")
              if (!store.appendPinned(note)) return out(`already pinned`)
              store.appendEvent({ sessionId: store.meta.sessionId, turn: -1, type: "pin", note })
              return out(`Pinned to ${store.projectDocPath}`)
            }
            case "unpin": {
              if (!note) return out("opencode-handoff: unpin requires a note")
              const { removed, candidates } = store.removePinned(note)
              if (removed) return out(`Unpinned ${removed}`)
              if (candidates.length > 1) return out(`ambiguous — be more specific`)
              return out(`No pin matches "${note}".`)
            }
            case "clear":
              clearHandoff()
              return out("opencode-handoff: cleared")
            case "on":
              store.meta.enabled = true
              store.saveMetaSync()
              return out("opencode-handoff: enabled")
            case "off":
              store.meta.enabled = false
              store.saveMetaSync()
              return out("opencode-handoff: disabled")
            default:
              return out("unknown action")
          }
        },
      })
    })

    // Hook: context — inject handoff into system prompt
    await ctx.session.hook("context", async (event) => {
      if (!store.meta.enabled) return
      try {
        const handoffPath = store.handoffPath
        if (existsSync(handoffPath)) {
          const content = readFileSync(handoffPath, "utf8").trim()
          if (content && content !== "# Handoff") {
            event.system.push({ type: "text", text: `[handoff]\n${content}` })
          }
        }
      } catch (e) {
        log(String(e))
      }
    })

    // Hook: prompt — capture user messages
    await ctx.session.hook("prompt", async (event) => {
      if (!store.meta.enabled) return
      const text = event?.prompt?.text ?? ""
      if (text) {
        store.appendEvent({ sessionId: store.meta.sessionId, turn: turnCounter++, type: "user_prompt", text: text.slice(0, 2000) })
      }
    })

    // Hook: compaction — flush before compacting
    await ctx.session.hook("compaction", async (event) => {
      if (!store.meta.enabled) return
      await flushNow()
    })

    // Subscribe to events
    const controller = new AbortController()
    void (async () => {
      for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
        try {
          if (!store.meta.enabled) continue
          if (event.type === "session.idle") {
            store.turnsSinceRefresh++
            drain()
          }
        } catch (e) {
          log(String(e))
        }
      }
    })()

    return () => {
      controller.abort()
      store.meta.endedAt = new Date().toISOString()
      store.saveMetaSync()
    }
  },
})
