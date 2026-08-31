const log = (...a) => {
  if (process.env.OPENCODE_DEBUG_PLUGINS || a[0] === "merged") console.log("[merge-system-messages]", ...a)
}

export const mergeSystemMessages = async () => {
  log("plugin loaded")
  return {
    "experimental.chat.system.transform": async (_i, out) => {
      if (Array.isArray(out.system) && out.system.length > 1) {
        out.system = [out.system.join("\n\n")]
        log("merged system bucket to 1", out.system.map((s) => s.length))
      }
    },
    "experimental.chat.messages.transform": async (_i, out) => {
      const sys = out.messages
        .map((m, i) => ({ m, i }))
        .filter(({ m }) => m.info?.role === "system")
      if (sys.length === 0) return
      if (sys.length === 1 && sys[0].i === 0) return
      const texts = []
      for (const { m } of sys) {
        for (const p of m.parts) {
          if (p.type === "text" && typeof p.text === "string" && p.text) texts.push(p.text)
        }
      }
      const first = sys[0].m
      first.parts = first.parts.filter((p) => p.type !== "text")
      first.parts.push({
        id: `merged-${Date.now()}`,
        sessionID: first.info.sessionID || "",
        messageID: first.info.id || "",
        type: "text",
        text: texts.join("\n\n"),
      })
      out.messages = out.messages.filter((m, i) => m.info?.role !== "system" || i === sys[0].i)
      log("merged", `collapsed ${sys.length} system messages into message 0`)
    },
  }
}

export default mergeSystemMessages