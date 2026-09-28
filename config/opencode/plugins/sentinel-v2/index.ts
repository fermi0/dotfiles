/**
 * opencode-sentinel — V2 Port
 * Background process monitoring with real-time agent notifications.
 * Ported from V1 (@opencode-ai/plugin) to V2 (@opencode/plugin) API.
 */
import { Plugin } from "@opencode/plugin"
import { exec } from "node:child_process"
import type { ChildProcess } from "node:child_process"

// v2 tool contract: execute() must return structured content, not a bare
// string. A bare string makes the host throw `s is not an Object`.
const out = (content: string) => ({ content })

// ── Monitor Manager ──────────────────────────────────────────────

interface MonitorEntry {
  id: string
  proc: ChildProcess
  description: string
  command: string
  startedAt: string
  linesEmitted: number
  filter?: string
  until?: string
}

class MonitorManager {
  private entries = new Map<string, MonitorEntry>()

  start(entry: MonitorEntry): string {
    this.entries.set(entry.id, entry)
    return entry.id
  }

  stop(id: string): void {
    const entry = this.entries.get(id)
    if (!entry) throw new Error(`Monitor not found: ${id}`)
    if (entry.proc.pid) {
      try { process.kill(-entry.proc.pid, "SIGTERM") } catch { /* dead */ }
    }
    this.entries.delete(id)
  }

  get(id: string): MonitorEntry | undefined {
    return this.entries.get(id)
  }

  list() {
    return Array.from(this.entries.values()).map(({ proc: _, ...rest }) => rest)
  }

  incrementLines(id: string): void {
    const entry = this.entries.get(id)
    if (entry) entry.linesEmitted++
  }

  dispose(): void {
    for (const entry of this.entries.values()) {
      if (entry.proc.pid) {
        try { process.kill(-entry.proc.pid, "SIGTERM") } catch { /* dead */ }
      }
    }
    this.entries.clear()
  }
}

const manager = new MonitorManager()

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function timestamp(): string {
  return new Date().toISOString()
}

function startWatcher(opts: {
  id: string
  command: string
  sessionID: string
  filter?: string
  until?: string
  onLine: (line: string) => void
}): ChildProcess {
  const proc = exec(opts.command, { cwd: process.cwd(), env: process.env })
  const filterRe = opts.filter ? new RegExp(opts.filter) : null
  const untilRe = opts.until ? new RegExp(opts.until) : null

  proc.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (filterRe && !filterRe.test(trimmed)) continue
      manager.incrementLines(opts.id)
      opts.onLine(trimmed)
      if (untilRe && untilRe.test(trimmed)) {
        manager.stop(opts.id)
      }
    }
  })

  proc.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n")
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (filterRe && !filterRe.test(trimmed)) continue
      manager.incrementLines(opts.id)
      opts.onLine(trimmed)
      if (untilRe && untilRe.test(trimmed)) {
        manager.stop(opts.id)
      }
    }
  })

  return proc
}

// ── V2 Plugin ────────────────────────────────────────────────────

export default Plugin.define({
  id: "opencode-sentinel",

  async setup(ctx) {
    // Register tools
    await ctx.tool.transform((editor) => {
      // sentinel_monitor
      editor.add({
        name: "sentinel_monitor",
        description: "Start a background process monitor. Executes a shell command and notifies the agent in real-time when lines match optional regex filters. Use 'until' for one-shot wake patterns like 'wait for CI to finish'.",
        input: {
          type: "object",
          properties: {
            command: { type: "string", description: "Shell command to execute and watch" },
            description: { type: "string", description: "Human-readable label" },
            filter: { type: "string", description: "Regex — only notify matching lines" },
            until: { type: "string", description: "Regex — auto-stop after first match" },
          },
          required: ["command", "description"],
          additionalProperties: false,
        },
        execute: async (args: any, context) => {
          const command = typeof args?.command === "string" ? args.command : ""
          const description = typeof args?.description === "string" ? args.description : ""
          const filter = typeof args?.filter === "string" ? args.filter : undefined
          const until = typeof args?.until === "string" ? args.until : undefined

          if (!command) return out("error: 'command' is required")
          if (!description) return out("error: 'description' is required")

          if (filter) {
            try { new RegExp(filter) } catch (e: any) { return out(`Invalid filter regex: ${e.message}`) }
          }
          if (until) {
            try { new RegExp(until) } catch (e: any) { return out(`Invalid until regex: ${e.message}`) }
          }

          const id = generateId()
          const sessionID = context.sessionID ?? ""
          const proc = startWatcher({
            id,
            command,
            sessionID,
            filter,
            until,
            onLine: (line) => {
              // Fire-and-forget notification via session prompt
              ctx.session.prompt({
                sessionID,
                text: `[sentinel:${id}] ${line}`,
              }).catch(() => {})
            },
          })

          manager.start({
            id,
            proc,
            description,
            command,
            startedAt: timestamp(),
            linesEmitted: 0,
            filter,
            until,
          })

          return out(`Monitor started: ${id}\nCommand: ${command}\nUse sentinel_stop to stop it.`)
        },
      })

      // sentinel_stop
      editor.add({
        name: "sentinel_stop",
        description: "Stop a running monitor by its ID.",
        input: {
          type: "object",
          properties: {
            id: { type: "string", description: "Monitor ID to stop" },
          },
          required: ["id"],
          additionalProperties: false,
        },
        execute: async (args: any) => {
          const id = typeof args?.id === "string" ? args.id : ""
          if (!id) return out("error: 'id' is required")
          try {
            manager.stop(id)
            return out(`Monitor ${id} stopped.`)
          } catch (err: any) {
            return out(`Error: ${err.message}`)
          }
        },
      })

      // sentinel_list
      editor.add({
        name: "sentinel_list",
        description: "List all currently running monitors.",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => {
          const monitors = manager.list()
          if (monitors.length === 0) return out("No monitors are currently running.")
          return monitors
            .map((m) => {
              let s = `[${m.id}] ${m.description}\n  command: ${m.command}\n  started: ${m.startedAt}\n  lines: ${m.linesEmitted}`
              if (m.filter) s += `\n  filter: ${m.filter}`
              if (m.until) s += `\n  until: ${m.until}`
              return s
            })
            .join("\n\n")
        },
      })

      // sentinel_ping
      editor.add({
        name: "sentinel_ping",
        description: "Health check for the sentinel plugin.",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: async () => out("pong"),
      })

      // sentinel_spike
      editor.add({
        name: "sentinel_spike",
        description: "Spike test: schedules a delayed message delivery to verify the wake mechanism works.",
        input: { type: "object", properties: {}, additionalProperties: false },
        execute: async (_args: any, context: any) => {
          const sessionID = context?.sessionID ?? ""
          setTimeout(() => {
            ctx.session.prompt({
              sessionID,
              text: "[spike] hello from sentinel — delivery test",
            }).catch(() => {})
          }, 3000)
          return out("scheduled — message delivery will fire in 3 seconds")
        },
      })
    })

    // Handle session.deleted events
    const controller = new AbortController()
    void (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (event?.type === "session.deleted") {
            const sessionID = (event as any).properties?.sessionID
            if (sessionID) manager.dispose()
          }
        }
      } catch { /* stream closed during teardown */ }
    })()

    return () => {
      controller.abort()
      manager.dispose()
    }
  },
})
