import * as cheerio from "cheerio";
import type { CheckContext, CheckResult } from "../types.js";

const ENTITY_TYPES = [
  "Organization",
  "Person",
  "Article",
  "BlogPosting",
  "TechArticle",
  "Book",
  "WebSite",
  "WebPage",
  "BreadcrumbList",
  "FAQPage",
  "HowTo",
  "Product",
  "SoftwareApplication",
];

export function checkJsonLd(ctx: CheckContext): CheckResult {
  const $ = cheerio.load(ctx.html);
  const notes: string[] = [];
  const blocks: unknown[] = [];
  const types = new Set<string>();
  let parseErrors = 0;

  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      blocks.push(parsed);
      collectTypes(parsed, types);
    } catch {
      parseErrors += 1;
    }
  });

  const details: Record<string, unknown> = {
    blockCount: blocks.length,
    typesFound: [...types],
    parseErrors,
  };

  if (blocks.length === 0) {
    notes.push("No JSON-LD found. Entity grounding will rely on text alone.");
    return result("fail", 0, details, notes);
  }

  if (parseErrors > 0) {
    notes.push(`${parseErrors} JSON-LD block(s) failed to parse.`);
  }

  const recognized = [...types].filter((t) => ENTITY_TYPES.includes(t));
  details.recognizedTypes = recognized;

  let score = 50;
  score += Math.min(recognized.length * 12, 36);
  if (types.has("Organization") || types.has("Person")) score += 8;
  if (parseErrors > 0) score -= 20;

  score = Math.max(0, Math.min(100, score));
  const status = score >= 85 ? "pass" : score >= 50 ? "warn" : "fail";
  if (recognized.length === 0) {
    notes.push("JSON-LD present but no recognized schema.org entity types.");
  }
  return result(status, score, details, notes);
}

function collectTypes(node: unknown, out: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const t = obj["@type"];
  if (typeof t === "string") out.add(t);
  else if (Array.isArray(t)) {
    for (const sub of t) if (typeof sub === "string") out.add(sub);
  }
  if ("@graph" in obj) collectTypes(obj["@graph"], out);
}

function result(
  status: "pass" | "warn" | "fail",
  score: number,
  details: Record<string, unknown>,
  notes: string[],
): CheckResult {
  return {
    id: "jsonld",
    name: "JSON-LD structured data",
    status,
    score,
    weight: 20,
    details,
    notes,
  };
}
