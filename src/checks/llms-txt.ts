import type { CheckContext, CheckResult } from "../types.js";

export async function checkLlmsTxt(ctx: CheckContext): Promise<CheckResult> {
  const url = `${ctx.origin}/llms.txt`;
  const notes: string[] = [];
  const details: Record<string, unknown> = { url };

  try {
    const res = await ctx.fetch(url, {
      headers: { "User-Agent": "llmo-checker/0.1.0 (+https://llmoframework.com)" },
    });
    details.httpStatus = res.status;

    if (res.status === 404) {
      notes.push("No /llms.txt found. See https://llmstxt.org/ for the spec.");
      return result("fail", 0, details, notes);
    }
    if (!res.ok) {
      notes.push(`/llms.txt returned HTTP ${res.status}`);
      return result("fail", 0, details, notes);
    }

    const body = await res.text();
    const trimmed = body.trim();
    details.byteLength = body.length;
    details.lineCount = trimmed.split("\n").length;

    if (trimmed.length === 0) {
      notes.push("/llms.txt exists but is empty.");
      return result("fail", 10, details, notes);
    }

    const lines = trimmed.split("\n");
    const h1 = lines.find((l) => l.startsWith("# "));
    const linkCount = (body.match(/^- \[/gm) ?? []).length;
    const sectionCount = (body.match(/^## /gm) ?? []).length;
    details.hasH1Title = Boolean(h1);
    details.linkCount = linkCount;
    details.sectionCount = sectionCount;

    let score = 60;
    if (h1) score += 15;
    else notes.push("Missing top-level `# Title` line.");

    if (sectionCount > 0) score += 10;
    else notes.push("No `## Section` headings found — links should be grouped.");

    if (linkCount >= 3) score += 15;
    else if (linkCount > 0) score += 8;
    else {
      score += 5;
      notes.push(
        "No `- [Title](url)` link entries. Optional per spec, but link lists help retrieval.",
      );
    }

    const status = score >= 85 ? "pass" : score >= 60 ? "warn" : "fail";
    return result(status, score, details, notes);
  } catch (err) {
    notes.push(`Fetch error: ${(err as Error).message}`);
    return result("fail", 0, details, notes);
  }
}

function result(
  status: "pass" | "warn" | "fail",
  score: number,
  details: Record<string, unknown>,
  notes: string[],
): CheckResult {
  return {
    id: "llms-txt",
    name: "llms.txt presence and structure",
    status,
    score,
    weight: 20,
    details,
    notes,
  };
}
