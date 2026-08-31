/**
 * opencode-token-optimizer — TUI Sidebar Plugin
 *
 * Displays live token optimization stats in the TUI sidebar.
 * Reads per-session state written by the server plugin (index.ts).
 *
 * Style note: we use the manual OpenTUI Solid primitives
 * (createElement / setProp / insertNode / effect) rather than JSX.
 * This matches the convention used by every other TUI plugin in
 * the OpenCode ecosystem (opencode-throughput, opencode-rpm-guard).
 */
import { createSignal, onCleanup } from "solid-js";
import {
  createElement, setProp, insertNode, effect,
  createComponent,
} from "@opentui/solid";
import { readLatestState, readStateForSession, type SidebarState } from "./sidebar";

const ID = "opencode-token-optimizer";
const REFRESH_MS = 1000;

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function pad(s: string, width: number): string {
  // Right-pad with spaces; left-align numbers for readability
  return s + " ".repeat(Math.max(0, width - s.length));
}

function fmtUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function TokenOptimizerWidget(props: { api: any; sessionID?: string }) {
  const [state, setState] = createSignal<SidebarState | null>(null);
  // Current sessionID from the slot. If not provided, fall back to latest by mtime.
  const sid = () => props.sessionID;

  const update = () => {
    const id = sid();
    if (id) {
      // Per-session: read THIS session's state, not "latest by mtime"
      setState(readStateForSession(id));
    } else {
      // No sessionID from slot (older opencode or different layout) — fall back
      setState(readLatestState());
    }
  };
  update();
  const timer = setInterval(update, REFRESH_MS);
  onCleanup(() => clearInterval(timer));

  // Manual Solid helpers
  const el = (tag: string) => createElement(tag);
  const set = (n: any, k: string, v: any) => setProp(n, k, v);
  const add = (p: any, c: any) => insertNode(p, c);
  const fx = (fn: () => void) => effect(fn);

  // Reactive text — content updates via effect
  const txt = (content: string, style?: string) => {
    const t = el("text");
    set(t, "content", content);
    if (style) set(t, "style", style);
    return t;
  };
  const dynTxt = (getContent: () => string, getStyle?: () => string) => {
    const t = el("text");
    fx(() => set(t, "content", getContent()));
    if (getStyle) fx(() => set(t, "style", getStyle()));
    return t;
  };

  // Compute layers reactively
  const layerRow = (name: string, active: () => boolean) =>
    dynTxt(
      () => `  ${active() ? "✔" : "✘"} ${name}`,
      () => `color: ${active() ? "#4ade80" : "#f87171"}`
    );

  const divider = () => txt("  " + "─".repeat(28), "color: #404040");

  // Build the widget box
  const box = el("box");
  set(box, "title", " Token Optimizer ");
  set(box, "border", true);
  set(box, "borderStyle", "rounded");
  set(box, "width", "100%");
  set(box, "height", "auto");
  set(box, "flexDirection", "column");

  // Render content reactively
  fx(() => {
    const s = state();
    if (!s) {
      // Reset and add waiting message
      // (insertNode will append; we don't try to clear because fresh widget per render)
      return;
    }
  });

  // Header (only shows the title bar — content starts with the layers section).
  // The "waiting..." placeholder has been removed: when no state has been
  // written yet, the layer rows / metrics / volumes are all empty. That's fine.

  // Layers section — recompute when state changes
  const layersBox = el("box");
  set(layersBox, "flexDirection", "column");
  fx(() => {
    const s = state();
    if (!s) return;
  });
  add(layersBox, txt(" Layers:", "color: #a3a3a3"));
  // Static layer rows (state-driven reactivity comes via signal)
  // Defensive optional chaining: state JSON may be from an older plugin
  // version missing some config keys (e.g. `wrap`). Without `?.`, a stale
  // state file can throw "undefined is not an object" and crash the TUI.
  const layerChecks = [
    { name: "RTK", active: () => { const s = state(); return !!s && !!s.config?.rtk?.enabled && s.rtkAvailable; } },
    { name: "Dedup",    active: () => { const s = state(); return !!s && !!s.config?.dedup?.enabled; } },
    { name: "Read",     active: () => { const s = state(); return !!s && !!s.config?.readCompact?.enabled; } },
    { name: "Wrap",     active: () => { const s = state(); return !!s && !!s.config?.wrap?.enabled; } },
    { name: "History",  active: () => { const s = state(); return !!s && !!s.config?.history?.enabled; } },
    { name: "CodeMode", active: () => { const s = state(); return !!s && !!s.config?.systemPrompt?.enabled; } },
  ];
  for (const l of layerChecks) add(layersBox, layerRow(l.name, l.active));
  add(box, layersBox);

  add(box, divider());

  // Metrics section
  const metricsBox = el("box");
  set(metricsBox, "flexDirection", "column");
  // rtkRewrites
  const tRtk = el("text");
  fx(() => {
    const s = state();
    const v = s ? fmt(s.metrics.rtkRewrites) : "0";
    set(tRtk, "content", ` RTK:     ${pad(v, 4)}`);
    set(tRtk, "style", "color: #fbbf24");
  });
  add(metricsBox, tRtk);
  // dedup
  const tDedup = el("text");
  fx(() => {
    const s = state();
    const v = s ? `${fmt(s.metrics.dedupHits)} (${(s.metrics.dedupHitRate * 100).toFixed(0)}%)` : "0 (0%)";
    set(tDedup, "content", ` Dedup:   ${pad(v, 6)}`);
    set(tDedup, "style", "color: #60a5fa");
  });
  add(metricsBox, tDedup);
  // read compactions
  const tRead = el("text");
  fx(() => {
    const v = state() ? fmt(state()!.metrics.readCompactions) : "0";
    set(tRead, "content", ` Read:    ${pad(v, 4)}`);
    set(tRead, "style", "color: #a78bfa");
  });
  add(metricsBox, tRead);
  // output trims
  const tTrim = el("text");
  fx(() => {
    const v = state() ? fmt(state()!.metrics.outputTruncations) : "0";
    set(tTrim, "content", ` Trim:    ${pad(v, 4)}`);
    set(tTrim, "style", "color: #f472b6");
  });
  add(metricsBox, tTrim);
  // history drops
  const tHist = el("text");
  fx(() => {
    const v = state() ? fmt(state()!.metrics.historyDrops) : "0";
    set(tHist, "content", ` Drop:    ${pad(v, 4)}`);
    set(tHist, "style", "color: #fb923c");
  });
  add(metricsBox, tHist);
  add(box, metricsBox);

  add(box, divider());

  // Volume section
  const volBox = el("box");
  set(volBox, "flexDirection", "column");
  const mkStatic = (label: string, getter: () => string, color = "#e5e5e5") => {
    const t = el("text");
    fx(() => { set(t, "content", ` ${label} ${getter()}`); set(t, "style", `color: ${color}`); });
    return t;
  };
  add(volBox, mkStatic("In:", () => state() ? fmt(state()!.metrics.totalInputChars) : "0"));
  add(volBox, mkStatic("Out:", () => state() ? fmt(state()!.metrics.totalOutputChars) : "0"));
  add(volBox, mkStatic("Msgs:", () => state() ? fmt(state()!.metrics.messagesSeen) : "0"));
  add(volBox, mkStatic("Up:", () => state() ? fmtUptime(state()!.metrics.uptimeMs) : "0s"));
  add(box, volBox);

  add(box, divider());

  // Top tools section
  const toolsBox = el("box");
  set(toolsBox, "flexDirection", "column");
  const toolsHeader = txt(" Top tools:", "color: #a3a3a3");
  add(toolsBox, toolsHeader);
  // We render top 4 tools reactively by pre-allocating 4 rows
  const toolRows: any[] = [];
  for (let i = 0; i < 4; i++) {
    const r = el("text");
    set(r, "content", " " + " ".repeat(13) + "0");
    set(r, "style", "color: #fbbf24");
    add(toolsBox, r);
    toolRows.push(r);
  }
  fx(() => {
    const s = state();
    if (!s) {
      for (let i = 0; i < 4; i++) {
        set(toolRows[i], "content", " " + " ".repeat(13) + "0");
        set(toolRows[i], "style", "color: #fbbf24");
      }
      return;
    }
    const tops = Object.entries(s.metrics.toolsInvoked)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const MAX_NAME = 11;
    for (let i = 0; i < 4; i++) {
      if (i < tops.length) {
        const [name, count] = tops[i];
        // Truncate long names to fit the box; padding keeps columns aligned
        const truncated = name.length > MAX_NAME ? name.slice(0, MAX_NAME - 1) + "…" : name;
        const padded = truncated.padEnd(MAX_NAME, " ");
        set(toolRows[i], "content", ` ${padded} ${pad(fmt(count), 4)}`);
        set(toolRows[i], "style", "color: #fbbf24");
      } else {
        const padded = "".padEnd(MAX_NAME, " ");
        set(toolRows[i], "content", ` ${padded}  —`);
        set(toolRows[i], "style", "color: #555");
      }
    }
  });
  add(box, toolsBox);

  return box;
}

const tui = async (api: any) => {
  api.slots.register({
    order: 230, // 240 = rpm-guard, 250 = throughput → put us just before rpm-guard
    slots: {
      sidebar_content(_ctx: any, slotProps: any) {
        // slotProps.session_id is the current open session. Read THAT session's
        // state, not "latest by mtime" — with multiple sessions running in
        // parallel, the latest-by-mtime approach causes the widget to jump
        // between sessions as each one calls tools.
        return createComponent(TokenOptimizerWidget, { api, sessionID: slotProps?.session_id });
      },
    },
  });

  api.lifecycle.onDispose(() => {
    // The widget's own onCleanup handles the interval; this is a safety net
  });
};

const plugin = { id: ID, tui };
export default plugin;
