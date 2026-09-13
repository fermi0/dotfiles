#!/usr/bin/env python3
"""
Nepal News Delta Detector

Compares today's headlines against yesterday's (or the last available day)
to surface:
- New stories (not seen before)
- Continuing stories (still being covered)
- Dropped stories (no longer in headlines)

Usage:
  python3 news-delta-detector.py [--today YYYY-MM-DD] [--baseline YYYY-MM-DD]

Outputs:
- ~/Downloads/BusinessPlanning/news-intel/{today}/delta-report.md
- ~/Downloads/BusinessPlanning/logs/delta-{today}.json

If --baseline is not given, the most recent prior day is used.
"""

import argparse
import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path


def slug(s: str) -> str:
    """Normalize a title to a slug for comparison."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


def extract_titles(html_path: Path) -> list[dict]:
    """Extract (title, slug) pairs from an HTML file.

    Heuristic: look for <a> tags with text ≥ 20 chars and URL paths matching
    news patterns. Returns a list of {title, slug, href}.
    """
    if not html_path.exists():
        return []
    content = html_path.read_text(errors="ignore")
    pattern = re.compile(
        r'<a[^>]+href="([^"]+)"[^>]*>([^<]{20,200})</a>', re.IGNORECASE
    )
    items = []
    seen = set()
    for m in pattern.finditer(content):
        href, title = m.group(1), m.group(2).strip()
        title = re.sub(r"\s+", " ", title)
        # Filter: likely article
        is_article = bool(
            re.search(r"/\d{4}/\d{2}/\d{2}/", href)
            or re.search(r"-/\d+", href)
            or re.search(r"/(story|article|news|post)/", href)
        )
        if not is_article:
            continue
        s = slug(title)
        if not s or s in seen or len(s) < 8:
            continue
        seen.add(s)
        items.append({"title": title, "slug": s, "href": href})
    return items


def collect_day(day: str, base: Path) -> dict:
    """Collect all titles from a day's news-intel folder."""
    folder = base / "news-intel" / day
    if not folder.exists():
        return {"day": day, "by_source": {}, "all_titles": [], "all_slugs": set()}
    by_source = {}
    all_titles = []
    all_slugs = set()
    for html in sorted(folder.glob("*.html")):
        items = extract_titles(html)
        source = html.stem
        by_source[source] = items
        for it in items:
            all_titles.append({**it, "source": source})
            all_slugs.add(it["slug"])
    return {
        "day": day,
        "by_source": by_source,
        "all_titles": all_titles,
        "all_slugs": all_slugs,
    }


def find_previous_day(today: str, base: Path) -> str | None:
    """Find the most recent prior day with data."""
    news_intel = base / "news-intel"
    if not news_intel.exists():
        return None
    days = sorted(
        [d.name for d in news_intel.iterdir() if d.is_dir() and re.match(r"\d{4}-\d{2}-\d{2}", d.name)],
        reverse=True,
    )
    for d in days:
        if d < today:
            return d
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--today", default=date.today().isoformat())
    ap.add_argument("--baseline", default=None, help="YYYY-MM-DD to compare against; default = previous day")
    ap.add_argument(
        "--base",
        default=str(Path.home() / "Downloads" / "BusinessPlanning"),
        help="Base downloads folder",
    )
    args = ap.parse_args()

    base = Path(args.base)
    today = args.today
    baseline = args.baseline or find_previous_day(today, base)

    print(f"[delta] today = {today}, baseline = {baseline or '(none)'}")

    today_data = collect_day(today, base)
    if baseline:
        baseline_data = collect_day(baseline, base)
    else:
        baseline_data = {"day": None, "by_source": {}, "all_titles": [], "all_slugs": set()}

    today_slugs = today_data["all_slugs"]
    baseline_slugs = baseline_data["all_slugs"]

    new_slugs = today_slugs - baseline_slugs
    dropped_slugs = baseline_slugs - today_slugs
    continuing_slugs = today_slugs & baseline_slugs

    # Build report
    lines = []
    lines.append(f"# Delta Report — {today}")
    lines.append("")
    lines.append(f"**Today:** {today} — {len(today_data['all_titles'])} titles across {len(today_data['by_source'])} sources")
    lines.append(f"**Baseline:** {baseline or '(none)'} — {len(baseline_data.get('all_titles', []))} titles")
    lines.append("")
    lines.append("## New today")
    if not new_slugs:
        lines.append("_(none — all stories are continuing)_")
    else:
        for t in today_data["all_titles"]:
            if t["slug"] in new_slugs:
                lines.append(f"- **{t['title']}** ({t['source']})")
                lines.append(f"  {t['href']}")
    lines.append("")
    lines.append("## Continuing")
    if not continuing_slugs:
        lines.append("_(none)_")
    else:
        for t in today_data["all_titles"]:
            if t["slug"] in continuing_slugs:
                lines.append(f"- {t['title']} ({t['source']})")
    lines.append("")
    lines.append("## Dropped (not in today's headlines)")
    if not dropped_slugs:
        lines.append("_(none)_")
    else:
        for t in baseline_data.get("all_titles", []):
            if t["slug"] in dropped_slugs:
                lines.append(f"- {t['title']} ({t['source']})")
    lines.append("")
    lines.append("---")
    lines.append(f"_Generated at {datetime.now().isoformat()}_")

    out_md = base / "news-intel" / today / "delta-report.md"
    out_md.parent.mkdir(parents=True, exist_ok=True)
    out_md.write_text("\n".join(lines))
    print(f"[delta] wrote {out_md}")

    # JSON log
    out_json = base / "logs" / f"delta-{today}.json"
    out_json.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "today": today,
        "baseline": baseline,
        "new": sorted(new_slugs),
        "continuing": sorted(continuing_slugs),
        "dropped": sorted(dropped_slugs),
        "today_count": len(today_slugs),
        "baseline_count": len(baseline_slugs),
        "generated_at": datetime.now().isoformat(),
    }
    out_json.write_text(json.dumps(payload, indent=2))
    print(f"[delta] wrote {out_json}")
    print(f"[delta] new={len(new_slugs)} continuing={len(continuing_slugs)} dropped={len(dropped_slugs)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
