# Changelog

All notable changes to `llmo-checker` will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-24

Initial release. Minimal LLMO Score (v0.1 Draft) CLI for measuring AI-retrieval readiness of a URL.

### Added

- CLI: `npx llmo-checker <url>` with pretty and `--json` output modes
- 5 static checks (weighted total 85):
  - `llms-txt` (weight 20) — `/llms.txt` presence, H1 title, sections, links
  - `robots-ai` (weight 15) — explicit posture toward 11 AI crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended, PerplexityBot, Applebot-Extended, cohere-ai, etc.)
  - `canonical` (weight 15) — `<link rel="canonical">` correctness and hreflang alternates
  - `jsonld` (weight 20) — JSON-LD parseability and recognized schema.org `@type`s, with `@graph` traversal
  - `meta` (weight 15) — title (20–70 chars), description (80–200 chars), OpenGraph, single `<h1>`, `<html lang>`
- Score bands: 85+ well-grounded / 65–84 needs work / 40–64 poor / 0–39 critical
- Exit codes: `0` (score ≥ 50), `1` (score < 50), `2` (fetch error)
- Vitest test suite (11 tests across score / meta / jsonld)
- GitHub Actions CI on Node 20.x and 22.x

### Compatibility

- Requires Node.js 20+ (Node 18 dropped: EOL 2025-04, and the `cheerio → undici` chain needs the `File` global only available from Node 20)

### Known limitations

- v0.1 score covers substrate signals only. Citation Visibility, Chunk Readability, and Markdown Quality are reserved for v0.2.
- JSON output shape is **Draft** and may change in v0.2. Pin a specific version if you depend on it.
