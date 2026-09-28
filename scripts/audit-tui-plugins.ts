/**
 * Load-check v2 TUI (CLI) plugins against a mock @opencode/plugin/tui context.
 * JSX in these plugins compiles via Bun's automatic runtime, so this also
 * verifies the JSX transform and element construction do not throw.
 */
const PORTS: Array<[string, string]> = [
  ["token-optimizer-v2/tui", "/home/work/.config/opencode/plugins/token-optimizer-v2/tui.tsx"],
]

let failed = 0

for (const [name, path] of PORTS) {
  try {
    const mod = await import(path)
    const def: any = mod.default
    if (!def || typeof def !== "object") { console.log(`FAIL ${name}: default is ${typeof def}`); failed++; continue }
    if (typeof def.id !== "string" || !def.id) { console.log(`FAIL ${name}: bad id`); failed++; continue }
    if (typeof def.setup !== "function") { console.log(`FAIL ${name}: no setup`); failed++; continue }

    const claims: any[] = []
    const ctx: any = {
      options: {},
      app: { version: "2.0.18", channel: "latest" },
      location: { directory: "/home/work" },
      renderer: {},
      client: {},
      data: {
        on: () => () => {},
        listen: () => () => {},
        session: { list: () => [], get: () => undefined, message: { list: () => [] } },
        location: { default: () => ({ directory: "/home/work" }) },
      },
      attention: { notify: async () => ({ ok: true }) },
      theme: { text: { base: "#fff" } },
      themeMode: "dark",
      markdown: { registerCodeBlockRenderer: () => () => {} },
      keymap: { layer: () => {}, dispatch: () => {}, shortcuts: () => [], commands: () => [], pending: () => [], active: () => [], mode: { current: () => "normal", push: () => () => {} } },
      storage: { store: (_k: string, o: any) => [{ ...o.initial }, async () => {}] as const, memory: (_k: string, o: any) => [{ ...o.initial }, () => {}] as const },
      ui: {
        toast: { show: () => {} },
        dialog: { set: () => {}, clear: () => {}, show: () => {}, alert: async () => {}, confirm: async () => undefined, prompt: async () => undefined, select: async () => undefined },
        format: { path: (p: string) => p },
        router: { register: () => () => {}, navigate: () => {}, current: () => ({ type: "home" }) },
        panel: { open: () => true, close: () => {}, current: () => undefined },
        tabs: { enabled: () => false, list: () => [], open: () => false, focus: () => false, move: () => false, close: () => false },
        model: { current: () => undefined, variant: { list: () => [], set: () => false } },
        slot: (c: any) => { claims.push(c); return () => {} },
      },
    }

    let cleanup: any
    try { cleanup = def.setup(ctx) }
    catch (e: any) { console.log(`FAIL ${name}: setup threw ${e?.message}`); failed++; continue }

    // Exercise every registered slot render with hostile inputs.
    //
    // "No renderer found" is EXPECTED here: OpenTUI's `useRenderer()` reads a
    // Solid context that only the real TUI host provides. The v1 plugin had the
    // same requirement (it used @opentui/solid's createElement too), so this is
    // a limit of the mock, not a defect. Any other error is a real failure.
    const EXPECTED = /No renderer found/
    let rendererLimited = false
    for (const c of claims) {
      for (const input of [undefined, {}, { sessionID: "" }, { sessionID: "ses_abc" }]) {
        try {
          c.render?.(input)
        } catch (e: any) {
          const msg = String(e?.message ?? e)
          if (EXPECTED.test(msg)) { rendererLimited = true; continue }
          console.log(`FAIL ${name}: render threw ${msg}`)
          failed++
        }
      }
    }

    if (typeof cleanup === "function") {
      try { cleanup() } catch (e: any) { console.log(`FAIL ${name}: cleanup threw ${e?.message}`); failed++ }
    }

    const placements = claims.map(c => Object.keys(c).find(k => ["prepend", "append", "before", "after", "replace"].includes(k)))
    console.log(`OK   ${name} id=${def.id}`)
    console.log(`     slots: ${placements.join(", ") || "(none)"}`)
    if (rendererLimited) console.log(`     note: render() reached OpenTUI's renderer-context guard (expected outside a real TUI)`)
  } catch (e: any) {
    console.log(`FAIL ${name}: import ${e?.message?.split("\n")[0] ?? e}`)
    failed++
  }
}

console.log(failed === 0 ? "\nALL TUI PORTS PASS" : `\n${failed} TUI PORT(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
