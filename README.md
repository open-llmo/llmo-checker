# llmo-checker

> LLMO Score checker — measures AI-retrieval readiness of a URL.
> Part of the [Open LLMO Research Initiative](https://llmoframework.com).

[![npm version](https://img.shields.io/npm/v/llmo-checker.svg)](https://www.npmjs.com/package/llmo-checker)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`llmo-checker` is a Lighthouse-style CLI that scores how "AI-retrievable" a given URL is. It fetches the page, runs a small set of static checks, and returns a JSON report with a single LLMO Score (0-100) plus per-check scores and notes.

It is intentionally **not** a full AI-citation simulator. It measures the *substrate* — the structured signals an AI crawler can extract without running an LLM — so that page authors get a fast, reproducible signal before paying for citation simulations.

## Status

**v0.1 — Draft.** Score weights, check list, and JSON schema may change in v0.2. Pin a specific version if you depend on the JSON shape.

## Install / Run

Run with `npx` (no install):

```bash
npx llmo-checker https://example.com
npx llmo-checker https://example.com --json
```

Or install globally:

```bash
npm install -g llmo-checker
llmo-checker https://example.com
```

Requires Node.js 18+.

## What it checks (v0.1)

| Check | Weight | What it measures |
|---|---|---|
| `llms-txt` | 20 | Presence and structure of `/llms.txt` per [llmstxt.org](https://llmstxt.org/) |
| `robots-ai` | 15 | Explicit posture toward known AI crawlers in `/robots.txt` (GPTBot, ClaudeBot, CCBot, Google-Extended, PerplexityBot, etc.) |
| `canonical` | 15 | `<link rel="canonical">` correctness and hreflang alternates |
| `jsonld` | 20 | JSON-LD structured data presence, parseability, and recognized schema.org `@type`s |
| `meta` | 15 | `<title>` / `<meta name="description">` / OpenGraph / `<h1>` / `<html lang>` |

Total weight in v0.1 is **85** (scores normalize to 0-100). Citation Visibility and Chunk Readability are planned for v0.2.

## Score bands

| Band | Score | Meaning |
|---|---|---|
| Green | 85-100 | Well-grounded for AI retrieval |
| Yellow | 65-84 | Needs work — several signals missing or weak |
| Yellow | 40-64 | Poor — significant grounding gaps |
| Red | 0-39 | Critical — page is largely invisible to AI crawlers |

## JSON output

```bash
npx llmo-checker https://example.com --json
```

```json
{
  "url": "https://example.com/",
  "origin": "https://example.com",
  "timestamp": "2026-05-24T10:00:00.000Z",
  "checkerVersion": "0.1.0",
  "scoreVersion": "0.1",
  "score": 72,
  "checks": [
    {
      "id": "llms-txt",
      "name": "llms.txt presence and structure",
      "status": "pass",
      "score": 100,
      "weight": 20,
      "details": { "...": "..." },
      "notes": []
    }
  ]
}
```

Each check exits with one of `pass` / `warn` / `fail` / `skip`. The CLI exits with status `0` if the overall score is ≥ 50, `1` otherwise, and `2` on fetch errors.

## Score v0.1 indicator set (Draft)

These are the indicator categories the v0.1 score covers. Inclusion does not imply causation with downstream AI citation — they are *necessary substrate signals* that have a clear definition.

- Citation Visibility — whether AI assistants cite the URL (planned v0.2, requires probing)
- Chunk Readability — heuristic readability of extracted chunks (planned v0.2)
- Semantic Structure — JSON-LD, OpenGraph, heading hierarchy (covered by `jsonld` and `meta`)
- AI Crawlability — robots.txt posture toward known AI bots (covered by `robots-ai`)
- llms.txt — covered by `llms-txt`
- Markdown Quality — applies only when the page has a Markdown source (planned v0.2)
- Entity Clarity — JSON-LD `@type` Organization / Person / Book recognition (partially covered by `jsonld`)

The full draft spec lives at <https://llmoframework.com/en/experimental-projects/>.

## Development

```bash
git clone https://github.com/open-llmo/llmo-checker.git
cd llmo-checker
npm install
npm run dev https://example.com
npm test
npm run build
```

## Contributing

This is an early Draft. Issues and PRs welcome at <https://github.com/open-llmo/llmo-checker/issues>.

If you want to propose a new check, open an issue with:
- the signal name and what it measures
- why it predicts AI-retrieval readiness (a paper, a public experiment, or a Lighthouse-style argument)
- proposed weight and scoring rule

## License

MIT — see [LICENSE](LICENSE).

Founded and maintained by [Ken Imoto](https://kenimoto.dev) as part of the Open LLMO Research Initiative.
