import { checkLlmsTxt } from "./checks/llms-txt.js";
import { checkRobotsAi } from "./checks/robots-ai.js";
import { checkCanonical } from "./checks/canonical.js";
import { checkJsonLd } from "./checks/jsonld.js";
import { checkMeta } from "./checks/meta.js";
import { computeScore } from "./score.js";
import type { CheckContext, CheckerReport } from "./types.js";

export const CHECKER_VERSION = "0.1.0";
export const SCORE_VERSION = "0.1" as const;

export async function runChecks(rawUrl: string): Promise<CheckerReport> {
  const url = new URL(rawUrl).toString();
  const origin = new URL(rawUrl).origin;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "llmo-checker/0.1.0 (+https://llmoframework.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  const html = await res.text();

  const ctx: CheckContext = { url, origin, html, fetch };

  const [llms, robots, canonical, jsonld, meta] = await Promise.all([
    checkLlmsTxt(ctx),
    checkRobotsAi(ctx),
    Promise.resolve(checkCanonical(ctx)),
    Promise.resolve(checkJsonLd(ctx)),
    Promise.resolve(checkMeta(ctx)),
  ]);

  const checks = [llms, robots, canonical, jsonld, meta];

  return {
    url,
    origin,
    timestamp: new Date().toISOString(),
    checkerVersion: CHECKER_VERSION,
    scoreVersion: SCORE_VERSION,
    score: computeScore(checks),
    checks,
  };
}
