/**
 * subtask2 — V2 Port
 * Extend opencode /commands into a powerful orchestration system.
 * Ported from V1 to V2 (@opencode/plugin) API.
 */
import { Plugin } from "@opencode/plugin"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join } from "node:path"

// ── Config & Types ──────────────────────────────────────────────

interface CommandConfig {
  return?: string[]
  parallel?: { command: string; arguments?: string }[]
  agent?: string
  model?: string
}

interface PluginConfig {
  replace_generic: boolean
  generic_return?: string
}

const OPENCODE_GENERIC = "Summarize the task tool output above and continue with your task."
const DEFAULT_PROMPT = "Summarize the task tool output above and continue with your task."

// ── Session State ───────────────────────────────────────────────

let configs: Record<string, CommandConfig> = {}
let pluginConfig: PluginConfig = { replace_generic: true }
const callState = new Map<string, string>()
const returnState = new Map<string, string[]>()
const pendingReturns = new Map<string, string>()
const pendingNonSubtaskReturns = new Map<string, string[]>()
const pipedArgsQueue = new Map<string, string[]>()
const sessionMainCommand = new Map<string, string>()
const executedReturns = new Set<string>()
const firstReturnPrompt = new Map<string, string>()
let pendingParentSession: string | null = null
let hasActiveSubtask = false
/**
 * The live V2 context, captured during setup().
 * fetchSessionMessages()/resolveTurnReferences() are declared at module scope
 * (so they can be unit-tested independently) but still need ctx.session.*.
 * Without this, `ctx` is an unresolved identifier at call time and every $TURN
 * reference silently degrades to an error string.
 */
let pluginCtx: any = null

// ── Helpers ─────────────────────────────────────────────────────

function log(...args: any[]) {
  if (process.env.SUBTASK2_DEBUG) console.error("[subtask2]", ...args)
}

function hasTurnReferences(text: string): boolean {
  return /\$TURN\[/.test(text)
}

function extractTurnReferences(text: string): { type: string; match: string; count?: number; indices?: number[] }[] {
  const refs: { type: string; match: string; count?: number; indices?: number[] }[] = []
  const re = /\$TURN\[(\d+)?(?::([\d,]+))?\]/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m[2]) {
      refs.push({ type: "specific", match: m[0], indices: m[2].split(",").map(Number) })
    } else if (m[1]) {
      refs.push({ type: "lastN", match: m[0], count: Number(m[1]) })
    } else {
      refs.push({ type: "all", match: m[0] })
    }
  }
  return refs
}

function replaceTurnReferences(text: string, replacements: Map<string, string>): string {
  let result = text
  for (const [match, replacement] of replacements) {
    result = result.replace(match, replacement)
  }
  return result
}

async function fetchSessionMessages(sessionID: string, lastN?: number, specificIndices?: number[]): Promise<string> {
  if (!pluginCtx) return "[TURN: plugin not ready]"
  try {
    const result = await pluginCtx.session.context({ sessionID })
    const messages = Array.isArray(result) ? (result as any[]) : []
    if (!messages.length) return "[TURN: no messages found]"

    let effectiveMessages = messages
    while (effectiveMessages.length > 0) {
      const last = effectiveMessages[effectiveMessages.length - 1]
      const parts = Array.isArray(last?.parts) ? last.parts : []
      const hasContent = parts.some(
        (p: any) =>
          (p?.type === "text" && p?.text?.trim()) ||
          (p?.type === "tool" && p?.state?.status === "completed" && p?.state?.output),
      )
      if (!hasContent) effectiveMessages = effectiveMessages.slice(0, -1)
      else break
    }

    let selectedMessages: any[]
    if (specificIndices?.length) {
      selectedMessages = specificIndices.map(idx => effectiveMessages[effectiveMessages.length - idx]).filter(Boolean)
    } else if (lastN) {
      selectedMessages = effectiveMessages.slice(-lastN)
    } else {
      selectedMessages = effectiveMessages
    }

    const formatted = selectedMessages.map((msg: any) => {
      const role = String(msg?.info?.role ?? "unknown").toUpperCase()
      const parts: string[] = []
      const msgParts = Array.isArray(msg?.parts) ? msg.parts : []
      for (const part of msgParts) {
        if (!part || part.ignored) continue
        if (part.type === "text" && part.text) {
          if (part.text.startsWith("Summarize the task tool output")) {
            const replacement = firstReturnPrompt.get(sessionID)
            if (replacement) parts.push(replacement)
            continue
          }
          parts.push(part.text)
        } else if (part.type === "tool" && part.state?.status === "completed") {
          const toolName = part.tool
          let output: any = part.state.output
          if (output && typeof output === "string") {
            output = output.replace(/<task_metadata>[\s\S]*?<\/task_metadata>/g, "").trim()
            if (output && output.length < 2000) {
              if (toolName === "task") parts.push(output)
              else parts.push(`[Tool: ${toolName}]\n${output}`)
            }
          }
        }
      }
      return `--- ${role} ---\n${parts.join("\n")}`
    })
    return formatted.join("\n\n")
  } catch (e) {
    return `[TURN: error fetching messages - ${e}]`
  }
}

async function resolveTurnReferences(text: string, sessionID: string): Promise<string> {
  if (!hasTurnReferences(text)) return text
  const refs = extractTurnReferences(text)
  if (!refs.length) return text
  const replacements = new Map<string, string>()
  for (const ref of refs) {
    if (ref.type === "lastN") {
      const content = await fetchSessionMessages(sessionID, ref.count)
      replacements.set(ref.match, content)
    } else if (ref.type === "specific") {
      const content = await fetchSessionMessages(sessionID, undefined, ref.indices)
      replacements.set(ref.match, content)
    } else if (ref.type === "all") {
      const content = await fetchSessionMessages(sessionID, Infinity)
      replacements.set(ref.match, content)
    }
  }
  return replaceTurnReferences(text, replacements)
}

function getConfig(cmd: string): CommandConfig | undefined {
  return configs[cmd]
}

// ── V2 Plugin ───────────────────────────────────────────────────

export default Plugin.define({
  id: "subtask2",

  async setup(ctx) {
    // Load configs from .opencode/commands/
    try {
      const commandsDir = join(process.cwd(), ".opencode", "commands")
      if (existsSync(commandsDir)) {
        const files = readdirSync(commandsDir).filter(f => f.endsWith(".md"))
        for (const file of files) {
          const content = readFileSync(join(commandsDir, file), "utf8")
          const cmdName = file.replace(/\.md$/, "")
          // Parse frontmatter
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
          if (fmMatch) {
            const fm = fmMatch[1]
            const config: CommandConfig = {}
            const returnMatch = fm.match(/^return:\s*(.+)$/m)
            if (returnMatch) config.return = returnMatch[1].split(",").map(s => s.trim())
            const parallelMatch = fm.match(/^parallel:\s*(.+)$/m)
            if (parallelMatch) config.parallel = parallelMatch[1].split(",").map(s => ({ command: s.trim() }))
            const agentMatch = fm.match(/^agent:\s*(.+)$/m)
            if (agentMatch) config.agent = agentMatch[1].trim()
            const modelMatch = fm.match(/^model:\s*(.+)$/m)
            if (modelMatch) config.model = modelMatch[1].trim()
            configs[cmdName] = config
          }
        }
      }
    } catch (e) {
      log("Failed to load configs:", e)
    }

    // Hook: prompt admission (replaces command.execute.before)
    await ctx.session.hook("prompt", async (event) => {
      pluginCtx = ctx
      const text = event?.prompt?.text ?? ""
      const sessionID = event?.sessionID ?? ""

      // Parse pipe-separated arguments
      const argSegments = text.split("||").map(s => s.trim())
      const mainArgs = argSegments[0] || ""
      const allPipedArgs = argSegments.slice(1)

      if (allPipedArgs.length) {
        pipedArgsQueue.set(sessionID, allPipedArgs)
      }

      // Resolve $TURN references in mainArgs
      if (hasTurnReferences(mainArgs)) {
        event.prompt.text = await resolveTurnReferences(mainArgs, sessionID)
      }
    })

    // Hook: tool execution before (replaces tool.execute.before)
    await ctx.tool.hook("execute.before", async (event) => {
      if (event?.tool !== "task") return
      hasActiveSubtask = true
      const sessionID = event.sessionID ?? ""
      const input = (event.input ?? {}) as Record<string, any>
      const prompt = input.prompt
      if (!sessionMainCommand.get(sessionID) && input.command && getConfig(input.command)) {
        sessionMainCommand.set(sessionID, input.command)
      }

      // Resolve $TURN in prompt
      if (typeof prompt === "string" && hasTurnReferences(prompt)) {
        const resolveFromSession = pendingParentSession || sessionID
        input.prompt = await resolveTurnReferences(prompt, resolveFromSession)
        pendingParentSession = null
      }
    })

    // Hook: tool execution after (replaces tool.execute.after)
    await ctx.tool.hook("execute.after", async (event) => {
      if (event?.tool !== "task") return
      const sessionID = event.sessionID ?? ""
      const callID = event.callID ?? ""
      const cmd = callState.get(callID)
      if (!cmd) return
      callState.delete(callID)

      const mainCmd = sessionMainCommand.get(sessionID)
      const cmdConfig = getConfig(cmd)
      if (cmd && cmd === mainCmd && cmdConfig?.return?.length) {
        if (!pendingReturns.has(sessionID)) {
          pendingReturns.set(sessionID, cmdConfig.return[0])
        }
      }
    })

    // Hook: context (replaces experimental.chat.messages.transform)
    await ctx.session.hook("context", async (event) => {
      // Replace generic summarize prompt with return prompt.
      // `messages` and `parts` are both optional on the wire: a session can
      // legitimately have no messages, and a message can have no parts.
      const messages = Array.isArray(event?.messages) ? (event.messages as any[]) : []
      for (const msg of messages) {
        for (const part of Array.isArray(msg?.parts) ? msg.parts : []) {
          if (part?.type === "text" && part.text === OPENCODE_GENERIC) {
            for (const [sessionID, returnPrompt] of pendingReturns) {
              if (returnPrompt.startsWith("/")) {
                part.text = ""
                // Execute return command
                const [cmdName, ...argParts] = returnPrompt.slice(1).split(/\s+/)
                const args = argParts.join(" ")
                try {
                  await ctx.session.command({ sessionID, command: cmdName, arguments: args })
                } catch (e) {
                  log("executeReturn failed:", e)
                }
              } else {
                part.text = returnPrompt
              }
              pendingReturns.delete(sessionID)
              hasActiveSubtask = false
              return
            }
            if (hasActiveSubtask && pluginConfig.replace_generic) {
              part.text = pluginConfig.generic_return ?? DEFAULT_PROMPT
              hasActiveSubtask = false
              return
            }
          }
        }
      }
    })

    // Hook: compaction (replaces experimental.text.complete)
    await ctx.session.hook("compaction", async (event) => {
      const sessionID = event?.sessionID ?? ""
      const pendingReturn = pendingNonSubtaskReturns.get(sessionID)
      if (pendingReturn?.length) {
        const next = pendingReturn.shift()
        if (!pendingReturn.length) pendingNonSubtaskReturns.delete(sessionID)
        if (next?.startsWith("/")) {
          const [cmdName, ...argParts] = next.slice(1).split(/\s+/)
          try {
            await ctx.session.command({ sessionID, command: cmdName, arguments: argParts.join(" ") })
          } catch (e) {
            log("executeReturn failed:", e)
          }
        } else if (next) {
          try {
            await ctx.session.prompt({ sessionID, text: next })
          } catch (e) {
            log("executeReturn failed:", e)
          }
        }
        return
      }
      const remaining = returnState.get(sessionID)
      if (!remaining?.length) return
      const next = remaining.shift()
      if (!remaining.length) returnState.delete(sessionID)
      if (next?.startsWith("/")) {
        const [cmdName, ...argParts] = next.slice(1).split(/\s+/)
        try {
          await ctx.session.command({ sessionID, command: cmdName, arguments: argParts.join(" ") })
        } catch (e) {
          log("executeReturn failed:", e)
        }
      } else if (next) {
        try {
          await ctx.session.prompt({ sessionID, text: next })
        } catch (e) {
          log("executeReturn failed:", e)
        }
      }
    })

    return () => {
      // Cleanup
      pluginCtx = null
      configs = {}
      callState.clear()
      returnState.clear()
      pendingReturns.clear()
      pendingNonSubtaskReturns.clear()
      pipedArgsQueue.clear()
      sessionMainCommand.clear()
      executedReturns.clear()
      firstReturnPrompt.clear()
    }
  },
})
