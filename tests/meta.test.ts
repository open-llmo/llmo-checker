import { describe, expect, it } from "vitest";
import { checkMeta } from "../src/checks/meta.js";
import type { CheckContext } from "../src/types.js";

const mkCtx = (html: string): CheckContext => ({
  url: "https://example.com/",
  origin: "https://example.com",
  html,
  fetch,
});

describe("checkMeta", () => {
  it("flags a near-empty page as failing", () => {
    const result = checkMeta(mkCtx("<!doctype html><html><head><title>Hi</title></head><body></body></html>"));
    expect(result.status).toBe("fail");
    expect(result.notes.length).toBeGreaterThan(0);
  });

  it("scores a well-formed head as pass", () => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <title>A reasonably descriptive page title for testing</title>
  <meta name="description" content="${"x".repeat(120)}" />
  <meta property="og:title" content="OG title" />
  <meta property="og:description" content="OG description" />
  <meta property="og:type" content="website" />
</head>
<body><h1>Main heading</h1></body>
</html>`;
    const result = checkMeta(mkCtx(html));
    expect(result.status).toBe("pass");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("warns when there are multiple h1 elements", () => {
    const html = `<!doctype html>
<html lang="en">
<head>
  <title>Page with two h1 elements for testing</title>
  <meta name="description" content="${"x".repeat(120)}" />
  <meta property="og:title" content="x" />
  <meta property="og:description" content="x" />
</head>
<body><h1>One</h1><h1>Two</h1></body>
</html>`;
    const result = checkMeta(mkCtx(html));
    expect(result.notes.some((n) => n.includes("h1"))).toBe(true);
  });
});
