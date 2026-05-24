#!/usr/bin/env node
import { Command } from "commander";
import pc from "picocolors";
import { CHECKER_VERSION, runChecks } from "./check.js";
import type { CheckResult, CheckerReport } from "./types.js";

const program = new Command();

program
  .name("llmo-checker")
  .description(
    "LLMO Score checker — measures AI-retrieval readiness of a URL.\n" +
      "Part of the Open LLMO Research Initiative (https://llmoframework.com).",
  )
  .version(CHECKER_VERSION)
  .argument("<url>", "URL to check (must include https://)")
  .option("--json", "output JSON report only (no pretty print)")
  .action(async (rawUrl: string, options: { json?: boolean }) => {
    try {
      const report = await runChecks(rawUrl);
      if (options.json) {
        process.stdout.write(JSON.stringify(report, null, 2) + "\n");
      } else {
        printPretty(report);
      }
      process.exit(report.score >= 50 ? 0 : 1);
    } catch (err) {
      console.error(pc.red(`Error: ${(err as Error).message}`));
      process.exit(2);
    }
  });

program.parseAsync(process.argv);

function printPretty(report: CheckerReport): void {
  const out = process.stdout;
  const band = scoreBand(report.score);
  out.write(`\n${pc.bold("LLMO Score")}  ${band.color(`${report.score}/100`)}  ${pc.dim(band.label)}\n`);
  out.write(`${pc.dim(`url: ${report.url}`)}\n`);
  out.write(`${pc.dim(`checker: v${report.checkerVersion}  score: v${report.scoreVersion}`)}\n\n`);

  for (const c of report.checks) {
    out.write(`${statusBadge(c)} ${pc.bold(c.name)}  ${pc.dim(`${c.score}/100 · weight ${c.weight}`)}\n`);
    for (const note of c.notes) {
      out.write(`    ${pc.dim("·")} ${note}\n`);
    }
  }
  out.write("\n");
}

function statusBadge(c: CheckResult): string {
  switch (c.status) {
    case "pass":
      return pc.green("PASS");
    case "warn":
      return pc.yellow("WARN");
    case "fail":
      return pc.red("FAIL");
    default:
      return pc.dim("SKIP");
  }
}

function scoreBand(score: number): { color: (s: string) => string; label: string } {
  if (score >= 85) return { color: pc.green, label: "well-grounded" };
  if (score >= 65) return { color: pc.yellow, label: "needs work" };
  if (score >= 40) return { color: pc.yellow, label: "poor" };
  return { color: pc.red, label: "critical" };
}
