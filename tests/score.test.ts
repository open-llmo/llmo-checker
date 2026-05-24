import { describe, expect, it } from "vitest";
import { computeScore } from "../src/score.js";
import type { CheckResult } from "../src/types.js";

const mkCheck = (score: number, weight: number): CheckResult => ({
  id: "x",
  name: "x",
  status: "pass",
  score,
  weight,
  details: {},
  notes: [],
});

describe("computeScore", () => {
  it("returns 0 when no checks", () => {
    expect(computeScore([])).toBe(0);
  });

  it("returns the single check score when only one check", () => {
    expect(computeScore([mkCheck(72, 10)])).toBe(72);
  });

  it("computes a weighted average across checks", () => {
    const checks = [mkCheck(100, 20), mkCheck(50, 20), mkCheck(0, 10)];
    expect(computeScore(checks)).toBe(60);
  });

  it("ignores weight of zero gracefully", () => {
    const checks = [mkCheck(100, 0), mkCheck(50, 10)];
    expect(computeScore(checks)).toBe(50);
  });
});
