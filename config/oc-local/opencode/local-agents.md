# Local agent rules (oc-local)

## Using MCP tools (Code Mode)
- To discover any capability: `await tools.$codemode.search({ query: "<intent>" })`
  then call the EXACT path it returns, e.g. `await tools.playwright.browser_navigate({ url: "..." })`.
- CodeMode sandbox limits (do NOT fight them):
  - Tool args must be plain JSON objects. No functions, closures, `new Promise(...)`,
    dynamic `import()`, or `const` inside evaluate-code strings.
