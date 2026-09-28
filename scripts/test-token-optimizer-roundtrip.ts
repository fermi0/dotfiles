const server = await import("/home/work/.config/opencode/plugins/token-optimizer-v2/index.ts");
const os = await import("node:os");
const fs = await import("node:fs");
const path = await import("node:path");

const hooks: any[] = [];
const reg = { dispose: async () => {} };
const added: any[] = [];
const ctx: any = {
  location: { directory: process.cwd(), project: { id: "p", directory: process.cwd(), canonical: process.cwd() } },
  options: {}, app: { version: "2.0.18" },
  storage: { get: async () => undefined, set: async () => {}, remove: async () => {}, scan: async () => ({ entries: [] }) },
  session: { hook: async (n: string, f: any) => { hooks.push({ n, f }); return reg; } },
  tool: {
    hook: async (n: string, f: any) => { hooks.push({ n, f }); return reg; },
    transform: async (cb: any) => { cb({ add: (t: any) => added.push(t), namespace: () => {}, update: () => {}, remove: () => {} }); },
    list: async () => [], reload: async () => {},
  },
};
await server.default.setup(ctx);
const before = hooks.find(h => h.n === "execute.before")?.f;
const after = hooks.find(h => h.n === "execute.after")?.f;
const ctxHook = hooks.find(h => h.n === "context")?.f;

const ev: any = { sessionID: "AUDIT-SESSION", tool: "shell", input: { command: "git status" }, callID: "c1" };
await before?.(ev);
await after?.({ sessionID: "AUDIT-SESSION", tool: "shell", input: { command: "git status" }, callID: "c1", result: { content: "M file\n".repeat(3) }, status: "completed" });
await ctxHook?.({ sessionID: "AUDIT-SESSION", system: [{ type: "text", text: "x" }], messages: [{ info: { role: "user" }, parts: [] }] });

const dir = path.join(os.homedir(), ".local", "state", "opencode", "token-optimizer-sessions");
const f = path.join(dir, "AUDIT-SESSION.json");
const st = JSON.parse(fs.readFileSync(f, "utf8"));

console.log("top-level keys:", Object.keys(st).sort().join(", "));
console.log("rtkAvailable:", st.rtkAvailable, "| rtkBinaryPath:", st.rtkBinaryPath);
console.log("config keys:", Object.keys(st.config ?? {}).join(", ") || "MISSING");
console.log("metrics keys:", Object.keys(st.metrics ?? {}).join(", ") || "MISSING");
console.log("rtkRewrites:", st.metrics?.rtkRewrites);
console.log("toolsInvoked:", JSON.stringify(st.metrics?.toolsInvoked));

const m = st.metrics ?? {};
const cfg = st.config ?? {};
const rows = {
  RTK: !!(cfg.rtk?.enabled && st.rtkAvailable),
  Dedup: !!cfg.dedup?.enabled,
  Read: !!cfg.readCompact?.enabled,
  Wrap: !!cfg.wrap?.enabled,
  History: !!cfg.history?.enabled,
  CodeMode: !!cfg.systemPrompt?.enabled,
};
console.log("widget layer rows:", JSON.stringify(rows));
const allLit = Object.values(m).every(v => typeof v !== "undefined");
console.log("every metrics field resolvable:", allLit);
console.log("dedupHitRate:", m.dedupHitRate, "| uptimeMs>0:", m.uptimeMs > 0, "| messagesSeen:", m.messagesSeen);
const ok = !!st.config && !!st.metrics && st.rtkAvailable !== undefined && allLit && m.rtkRewrites > 0;
console.log(ok ? "\nROUND-TRIP OK - TUI will show live values" : "\nROUND-TRIP FAILED");
fs.unlinkSync(f);
