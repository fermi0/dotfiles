---
name: research
description: Generate market research + interactive HTML dashboard ($0 Free, searxng→sqlite→pandoc). Use for any topic (e.g., MCPs, VAT, fintech).
---

# /research — Market Research + HTML Dashboard Generator ($0 Free)

Generates a **market research summary + self-contained interactive HTML dashboard** (no CDN, inline SVG, paired tables, `role=img`) for any topic, using the **$0 Free stack** from `phase3research.md` + `phase3brainstorm-output.md`.

## When to Use

- User asks for market research, lead gen, idea gen, TAM/SAM/SOM, Porter, JTBD, Lean Canvas, RICE, BRD, dashboards/graphs
- Topic example: `Selling MCPs and TAX/VAT/Billing fintech SaaS in Kathmandu, Nepal. VAT lottery context` (prize.ird.gov.np)

## Workflow (Golden Loop, $0 Free)

1. **Searxng (self-hosted, unlimited):** `mcp-searxng` with `SEARXNG_URL http://localhost:8080` (70 engines, private,  `~/searxng_instance/docker-compose.yml` ) — search topic + IRD/CBMS/WDI docs. Fallback `fetch` for `https://ird.gov.np`, `https://cbms.ird.gov.np`, `https://prize.ird.gov.np`, `https://data.finstatglobe.com/nepal`.
2. **SQLite (`data/business.db`):** `mcp-sqlite --db-path /home/work/data/business.db` — store TAM/SAM/SOM tables, RICE backlog, leads. Schema `tam(segment, count, arpu, tam_npr)`, `rice(feature, reach, impact, confidence, effort, score)`.
3. **Sequential Thinking:** Decompose Porter 5 forces, JTBD, Pugh, RICE sequencing, BRD — `sequential-thinking` MCP.
4. **Report Markdown:** Write `reports/<topic>-YYYY-MM-DD.md` with sections: Executive Summary, TAM/SAM/SOM (bottom-up, WDI ceiling), Porter (binding constraint), JTBD/persona, Lean Canvas, RICE, BRD, Dashboard inline SVG (bar=comparison, pie 2-5 slices), Nepal $0 data table, Future Prediction, Workflow. Cite `prize.ird.gov.np 13598`, `cbms.ird.gov.np`, `IRD Annual 13350`, `FinStatGlobe 28.1%`.
5. **Pandoc + Mermaid-CLI:** `pandoc 3.10 --embed-resources --self-contained` + `mermaid-cli 11.16` → inline SVG (no Chart.js CDN). Verify `mmdc --version` + `pandoc --version`. Example:
   ```bash
   pandoc reports/topic-2026-08-21.md -s --embed-resources --metadata title="Topic Dashboard" -o reports/topic-2026-08-21.html
   ```
   HTML is self-contained (email/portable), paired HTML `<table>` + `role="img"` + `<title>/<desc>` + `aria-labelledby` per `business-planning` skill.
6. **Vault (with-context):** `with-context write` to `~/shared/Zurnel/reports/` + `Bases` dashboard aggregates (cross-domain proof for P3.7).
7. **Daily:** `scheduler 07:00` daily note links `[[Zurnel/reports/topic|...]]` via `Tasks` query.

## Verification

```bash
# 1. SearXNG up (if docker)
docker ps | grep searxng || docker compose -f ~/searxng_instance/docker-compose.yml up -d && curl -s http://localhost:8080/search?q=test&format=json | head
# 2. SQLite
sqlite3 /home/work/data/business.db "select * from tam;"
# 3. Pandoc + Mermaid
pandoc --version; mmdc --version; echo '# Test' | pandoc -s --embed-resources -o /tmp/test.html && ls -lh /tmp/test.html
# 4. Report exists
ls ~/projects/zurnel-saas/reports/kathmandu-vat-saas-2026-08-21.{md,html} && ls -lh ~/projects/zurnel-saas/reports/*.html
```

## Example Topic (P3.5)

**Input:** `Selling MCPs and TAX/VAT/Billing fintech, SaaS in Kathmandu, Nepal. VAT lottery context`

**Output:** `~/projects/zurnel-saas/reports/kathmandu-vat-saas-2026-08-21.md` (14K) → `kathmandu-vat-saas-2026-08-21.html` (22K, self-contained, inline SVG bar for TAM/SAM/SOM + Porter circles, paired tables, all $0 Free verified Aug 2026). See that report as template.

## Implementation

This slash-command is a **recipe**, not a code generator. To run it, invoke the `business-planning` skill and follow the workflow above, using `searxng`, `sqlite`, `sequential-thinking`, `pandoc`, `mermaid-cli`, `with-context`.

```bash
# Example invocation (in opencode TUI):
# /research Selling MCPs and TAX/VAT/Billing fintech SaaS in Kathmandu, Nepal — VAT lottery context
```
