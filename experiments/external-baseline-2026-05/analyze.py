#!/usr/bin/env python3
"""Aggregate llmo-checker results for the external baseline panel."""
import json
import statistics
from pathlib import Path
from collections import defaultdict

RESULTS_DIR = Path(__file__).parent / "results"

# Category mapping
CATEGORIES = {
    "Documentation": {
        "react.dev", "vuejs.org", "svelte.dev", "astro.build", "nextjs.org",
        "tailwindcss.com", "vitejs.dev", "docs.python.org", "golang.org",
        "www.rust-lang.org", "nodejs.org", "kubernetes.io", "docs.docker.com",
        "www.postgresql.org", "redis.io", "www.djangoproject.com",
        "flask.palletsprojects.com", "fastapi.tiangolo.com", "expressjs.com",
        "laravel.com", "docs.anthropic.com", "platform.openai.com",
    },
    "Product marketing": {
        "stripe.com", "www.notion.so", "linear.app", "vercel.com",
        "www.cloudflare.com", "www.netlify.com", "supabase.com",
        "www.figma.com", "www.mongodb.com", "www.elastic.co",
        "about.gitlab.com", "github.com",
    },
    "Dev blog": {
        "stripe.com_blog", "vercel.com_blog", "github.blog",
        "www.cloudflare.com_blog", "blog.cloudflare.com", "www.docker.com_blog",
    },
}


def categorize(slug: str) -> str:
    for cat, members in CATEGORIES.items():
        if slug in members:
            return cat
    return "Uncategorized"


def main() -> None:
    rows = []
    for f in sorted(RESULTS_DIR.glob("*.json")):
        try:
            d = json.loads(f.read_text())
        except Exception as e:
            print(f"[skip] {f.name}: {e}")
            continue
        url = d.get("url", f.stem)
        score = d.get("score")
        if score is None:
            continue
        checks = {c["id"]: c["score"] for c in d.get("checks", [])}
        rows.append({
            "slug": f.stem,
            "url": url,
            "score": score,
            "category": categorize(f.stem),
            **{f"check_{k}": v for k, v in checks.items()},
        })

    n = len(rows)
    vals = [r["score"] for r in rows]
    print(f"\n=== Panel summary ===")
    print(f"n = {n}")
    print(f"mean   = {statistics.mean(vals):.1f}")
    print(f"median = {statistics.median(vals)}")
    print(f"stdev  = {statistics.pstdev(vals):.1f}")
    print(f"min    = {min(vals)}")
    print(f"max    = {max(vals)}")
    q = statistics.quantiles(vals, n=4)
    print(f"Q1 / Q2 / Q3 = {q[0]:.1f} / {q[1]:.1f} / {q[2]:.1f}")

    print(f"\n=== Top 5 ===")
    for r in sorted(rows, key=lambda x: -x["score"])[:5]:
        print(f"  {r['score']:>3}  {r['url']}")
    print(f"\n=== Bottom 5 ===")
    for r in sorted(rows, key=lambda x: x["score"])[:5]:
        print(f"  {r['score']:>3}  {r['url']}")

    print(f"\n=== By category ===")
    by_cat = defaultdict(list)
    for r in rows:
        by_cat[r["category"]].append(r["score"])
    for cat, vs in by_cat.items():
        print(f"  {cat:>20}  n={len(vs):>2}  median={statistics.median(vs):>4.1f}  mean={statistics.mean(vs):>4.1f}  range={min(vs)}-{max(vs)}")

    print(f"\n=== Per-check medians ===")
    check_ids = ["llms-txt", "robots-ai", "canonical", "jsonld", "meta"]
    for cid in check_ids:
        vs = [r[f"check_{cid}"] for r in rows if f"check_{cid}" in r]
        if vs:
            print(f"  {cid:>10}  median={statistics.median(vs):>4.1f}  mean={statistics.mean(vs):>4.1f}  range={min(vs)}-{max(vs)}")

    print(f"\n=== Histogram (10-point buckets) ===")
    buckets = defaultdict(int)
    for v in vals:
        b = (v // 10) * 10
        buckets[b] += 1
    for b in sorted(buckets.keys()):
        bar = "█" * buckets[b]
        print(f"  {b:>3}-{b+9}  {buckets[b]:>2}  {bar}")

    out = Path(__file__).parent / "summary.json"
    out.write_text(json.dumps({
        "n": n,
        "mean": round(statistics.mean(vals), 2),
        "median": statistics.median(vals),
        "stdev": round(statistics.pstdev(vals), 2),
        "min": min(vals),
        "max": max(vals),
        "q1": round(q[0], 2),
        "q3": round(q[2], 2),
        "rows": rows,
    }, indent=2))
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
