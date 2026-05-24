import { describe, expect, it } from "vitest";
import { checkJsonLd } from "../src/checks/jsonld.js";
import type { CheckContext } from "../src/types.js";

const mkCtx = (html: string): CheckContext => ({
  url: "https://example.com/",
  origin: "https://example.com",
  html,
  fetch,
});

describe("checkJsonLd", () => {
  it("fails when no JSON-LD is present", () => {
    const result = checkJsonLd(mkCtx("<html><head></head><body></body></html>"));
    expect(result.status).toBe("fail");
    expect(result.score).toBe(0);
  });

  it("collects recognized @type values", () => {
    const html = `<html><head>
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "Organization", "name": "Acme" }
</script>
<script type="application/ld+json">
{ "@context": "https://schema.org", "@type": "WebSite", "name": "Acme site" }
</script>
</head></html>`;
    const result = checkJsonLd(mkCtx(html));
    expect((result.details.recognizedTypes as string[])).toEqual(
      expect.arrayContaining(["Organization", "WebSite"]),
    );
    expect(result.status).not.toBe("fail");
  });

  it("counts parse errors and applies a penalty", () => {
    const html = `<html><head>
<script type="application/ld+json">{ not valid json }</script>
</head></html>`;
    const result = checkJsonLd(mkCtx(html));
    expect(result.details.parseErrors).toBe(1);
  });

  it("walks @graph for type collection", () => {
    const html = `<html><head>
<script type="application/ld+json">
{ "@context": "https://schema.org", "@graph": [
  { "@type": "Person", "name": "Ken" },
  { "@type": "Article", "headline": "x" }
] }
</script>
</head></html>`;
    const result = checkJsonLd(mkCtx(html));
    expect((result.details.recognizedTypes as string[])).toEqual(
      expect.arrayContaining(["Person", "Article"]),
    );
  });
});
