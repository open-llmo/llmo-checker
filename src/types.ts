export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  score: number;
  weight: number;
  details: Record<string, unknown>;
  notes: string[];
}

export interface CheckerReport {
  url: string;
  origin: string;
  timestamp: string;
  checkerVersion: string;
  score: number;
  scoreVersion: "0.1";
  checks: CheckResult[];
}

export interface CheckContext {
  url: string;
  origin: string;
  html: string;
  fetch: typeof fetch;
}
