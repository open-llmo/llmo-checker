import * as cheerio from "cheerio";
import type { CheckContext, CheckResult } from "../types.js";

export function checkCanonical(ctx: CheckContext): CheckResult {
  const $ = cheerio.load(ctx.html);
  const notes: string[] = [];
  const details: Record<string, unknown> = {};

  const canonical = $('link[rel="canonical"]').attr("href")?.trim();
  details.canonical = canonical ?? null;

  if (!canonical) {
    notes.push("Missing <link rel=\"canonical\">. AI crawlers may dedupe wrong URL.");
    return result("fail", 0, details, notes);
  }

  let absolute: URL;
  try {
    absolute = new URL(canonical, ctx.url);
  } catch {
    notes.push(`Canonical href is not a valid URL: ${canonical}`);
    return result("fail", 20, details, notes);
  }
  details.canonicalAbsolute = absolute.toString();

  const here = new URL(ctx.url);
  const matchesOrigin = absolute.origin === here.origin;
  details.matchesOrigin = matchesOrigin;

  if (!matchesOrigin) {
    notes.push(
      `Canonical points to a different origin (${absolute.origin}). Intentional only if this page is a republished mirror.`,
    );
    return result("warn", 60, details, notes);
  }

  const hreflang = $('link[rel="alternate"][hreflang]')
    .map((_, el) => $(el).attr("hreflang"))
    .get();
  details.hreflangCount = hreflang.length;

  let score = 90;
  if (hreflang.length > 0) score += 10;
  else notes.push("No hreflang alternates — fine for single-language sites.");

  return result("pass", Math.min(score, 100), details, notes);
}

function result(
  status: "pass" | "warn" | "fail",
  score: number,
  details: Record<string, unknown>,
  notes: string[],
): CheckResult {
  return {
    id: "canonical",
    name: "Canonical URL and hreflang",
    status,
    score,
    weight: 15,
    details,
    notes,
  };
}
