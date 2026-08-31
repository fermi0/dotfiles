/**
 * notify-essentials — minimal desktop notification plugin
 *
 * Replaces kdcokenny/opencode-notify which was causing TUI overflow by
 * rendering large error popups inside the opencode TUI.
 *
 * Design principles:
 *  1. Essentials only — 4 event types: session.idle, permission.asked,
 *     question.asked, session.error (crash only)
 *  2. Native OS notifications via `notify-send` (Linux) — no TUI overlay
 *  3. NEVER render any UI inside opencode TUI (the root cause of the
 *     overflow)
 *  4. Errors: only notify if opencode itself crashes (session.error), NOT
 *     for individual tool errors. The model can see tool errors in its
 *     own context; we only alert when opencode itself is in trouble.
 *  5. Auto-detect: use `notify-send` on Linux, no-op on other platforms
 *
 * Install: just drop this file in `~/.config/opencode/plugins/`. Auto-loaded.
 */

const ID = "notify-essentials";

let lastQuestionID = null; // debounce: only notify once per question

export const NotifyEssentialsPlugin = async ({ $, directory, worktree }) => {
  const send = (title, body) => {
    try {
      // Linux: notify-send (dunst/mako/swaync/fnott). On Wayland/Hyprland,
      // a notification daemon must be running. Falls through silently if not.
      $`notify-send -a opencode -u low -t 5000 "${title}" "${body}"`.quiet().nothrow();
    } catch {
      // best-effort only; never block the agent
    }
  };

  return {
    "permission.asked": async (input, output) => {
      send(
        "OpenCode: permission needed",
        input.action ?? "Tool needs your approval"
      );
    },

    "question.asked": async (input, output) => {
      // Debounce: only notify once per unique question id
      if (input.id === lastQuestionID) return;
      lastQuestionID = input.id;
      send(
        "OpenCode: question",
        input.header ?? input.question ?? "Agent is asking a question"
      );
    },

    "event": async ({ event }) => {
      switch (event.type) {
        case "session.idle":
          send("OpenCode: done", "Agent stopped. Check the terminal.");
          break;
        case "session.error":
          // Only this is an "error" event — when opencode itself crashed.
          // Individual tool errors stay in the TUI scrollback.
          send(
            "OpenCode: crashed",
            (event.properties?.error?.message ?? "Unknown error").slice(0, 200)
          );
          break;
      }
    },
  };
};

export default NotifyEssentialsPlugin;
