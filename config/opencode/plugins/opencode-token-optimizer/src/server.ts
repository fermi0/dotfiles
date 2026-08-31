/**
 * opencode-token-optimizer — server plugin entry
 *
 * Wraps the plugin factory in the PluginModule shape OpenCode v1 expects.
 */
import tokenOptimizerPlugin from "./index";

const plugin = {
  id: "opencode-token-optimizer",
  server: tokenOptimizerPlugin,
};

export default plugin;
