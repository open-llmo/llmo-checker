import type { CheckContext, CheckResult } from "../types.js";

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "CCBot",
  "Google-Extended",
  "PerplexityBot",
  "Applebot-Extended",
  "cohere-ai",
] as const;

export async function checkRobotsAi(ctx: CheckContext): Promise<CheckResult> {
  const url = `${ctx.origin}/robots.txt`;
  const notes: string[] = [];
  const details: Record<string, unknown> = { url, knownAiBots: AI_BOTS };

  try {
    const res = await ctx.fetch(url, {
      headers: { "User-Agent": "llmo-checker/0.1.0 (+https://llmoframework.com)" },
    });
    details.httpStatus = res.status;

    if (res.status === 404) {
      notes.push(
        "No /robots.txt found. AI crawlers will use default allow, but explicit posture is recommended.",
      );
      return result("warn", 60, details, notes);
    }
    if (!res.ok) {
      notes.push(`/robots.txt returned HTTP ${res.status}`);
      return result("fail", 0, details, notes);
    }

    const body = await res.text();
    details.byteLength = body.length;

    const mentioned: string[] = [];
    const disallowed: string[] = [];

    const groups = parseRobotsGroups(body);
    for (const bot of AI_BOTS) {
      const lower = bot.toLowerCase();
      const group = groups.find((g) => g.userAgents.some((u) => u.toLowerCase() === lower));
      if (!group) continue;
      mentioned.push(bot);
      if (group.disallows.some((d) => d.trim() === "/")) {
        disallowed.push(bot);
      }
    }

    details.mentionedBots = mentioned;
    details.disallowedBots = disallowed;
    details.hasWildcardUserAgent = groups.some((g) => g.userAgents.includes("*"));

    let score = 70;
    if (mentioned.length >= 3) score += 20;
    else if (mentioned.length > 0) score += 10;
    else notes.push("No explicit AI-bot rules in robots.txt.");

    if (groups.length > 0 && details.hasWildcardUserAgent) score += 10;

    const status = score >= 85 ? "pass" : score >= 60 ? "warn" : "fail";
    return result(status, Math.min(score, 100), details, notes);
  } catch (err) {
    notes.push(`Fetch error: ${(err as Error).message}`);
    return result("fail", 0, details, notes);
  }
}

interface RobotsGroup {
  userAgents: string[];
  disallows: string[];
  allows: string[];
}

function parseRobotsGroups(body: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const rawLine of body.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === "user-agent") {
      if (!current || current.disallows.length > 0 || current.allows.length > 0) {
        current = { userAgents: [], disallows: [], allows: [] };
        groups.push(current);
      }
      current.userAgents.push(value);
    } else if (key === "disallow" && current) {
      current.disallows.push(value);
    } else if (key === "allow" && current) {
      current.allows.push(value);
    }
  }
  return groups;
}

function result(
  status: "pass" | "warn" | "fail",
  score: number,
  details: Record<string, unknown>,
  notes: string[],
): CheckResult {
  return {
    id: "robots-ai",
    name: "AI crawler posture (robots.txt)",
    status,
    score,
    weight: 15,
    details,
    notes,
  };
}
