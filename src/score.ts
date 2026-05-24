import type { CheckResult } from "./types.js";

export function computeScore(checks: CheckResult[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = checks.reduce((sum, c) => sum + c.score * c.weight, 0);
  return Math.round(weighted / totalWeight);
}
