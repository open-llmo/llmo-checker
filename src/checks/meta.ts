import * as cheerio from "cheerio";
import type { CheckContext, CheckResult } from "../types.js";

export function checkMeta(ctx: CheckContext): CheckResult {
  const $ = cheerio.load(ctx.html);
  const notes: string[] = [];

  const title = $("head > title").first().text().trim();
  const description = $('meta[name="description"]').attr("content")?.trim() ?? "";
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? "";
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() ?? "";
  const ogType = $('meta[property="og:type"]').attr("content")?.trim() ?? "";
  const h1Count = $("h1").length;
  const lang = $("html").attr("lang")?.trim() ?? "";

  const details: Record<string, unknown> = {
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    ogTitle,
    ogDescription,
    ogType,
    h1Count,
    htmlLang: lang,
  };

  let score = 0;

  if (title) {
    if (title.length >= 20 && title.length <= 70) score += 20;
    else {
      score += 10;
      notes.push(`Title length ${title.length} is outside the 20-70 sweet spot.`);
    }
  } else {
    notes.push("Missing <title>.");
  }

  if (description) {
    if (description.length >= 80 && description.length <= 200) score += 20;
    else {
      score += 10;
      notes.push(
        `Description length ${description.length} is outside the 80-200 sweet spot.`,
      );
    }
  } else {
    notes.push("Missing <meta name=\"description\">.");
  }

  if (ogTitle && ogDescription) score += 20;
  else notes.push("Missing OpenGraph title/description.");

  if (ogType) score += 10;

  if (h1Count === 1) score += 20;
  else notes.push(`Found ${h1Count} <h1> elements (recommended: exactly 1).`);

  if (lang) score += 10;
  else notes.push("Missing <html lang=\"...\"> attribute.");

  score = Math.min(score, 100);
  const status = score >= 85 ? "pass" : score >= 60 ? "warn" : "fail";
  return {
    id: "meta",
    name: "Semantic metadata and headings",
    status,
    score,
    weight: 15,
    details,
    notes,
  };
}
