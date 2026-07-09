import type { CheckModule, Finding } from "../types.js";
import { jsonLdNodes } from "../parser.js";

export const eeatSignals: CheckModule = {
  id: "eeat-signals",
  label: "Author / E-E-A-T",
  what: "Named author, dates, credentials.",
  rationale:
    "Engines deciding whom to quote lean on named authorship and freshness. Anonymous, undated pages are quoted last.",
  fixability: 0.85,
  run(ctx) {
    const findings: Finding[] = [];
    let score = 0;

    // Author: schema first, then visible byline heuristics
    const hasSchemaAuthor =
      ["Article", "NewsArticle", "BlogPosting"].some((t) =>
        jsonLdNodes(ctx, t).some((n) => n["author"]),
      ) || jsonLdNodes(ctx, "Person").length > 0;
    const bylineEl = ctx
      .$('[rel="author"], [class*="author" i], [itemprop="author"], .byline')
      .first();
    const bylineText = bylineEl.text().replace(/\s+/g, " ").trim().slice(0, 60);
    const textByline = /\bby [A-Z][a-z]+ [A-Z][a-z]+/.exec(
      ctx.words.slice(0, 400).join(" "),
    );
    if (hasSchemaAuthor) {
      score += 0.4;
      findings.push({
        severity: "pass",
        message: "Author present in structured data.",
      });
    } else if (bylineText || textByline) {
      score += 0.25;
      findings.push({
        severity: "warn",
        message: `Visible byline found (${(bylineText || textByline?.[0] || "").slice(0, 50)}) but not mirrored in schema.`,
        fix: "Add the author to your Article JSON-LD so machines see it too.",
      });
    } else {
      findings.push({
        severity: "error",
        message: "No author anywhere — not in schema, not as a visible byline.",
        fix: "Add a visible byline and an author node in schema.",
        snippet: `"author": { "@type": "Person", "name": "Jane Okafor", "url": "https://example.com/about/jane" }`,
      });
    }

    // Dates: schema or <time> or visible
    const hasSchemaDates = [
      "Article",
      "NewsArticle",
      "BlogPosting",
      "WebPage",
    ].some((t) =>
      jsonLdNodes(ctx, t).some((n) => n["datePublished"] || n["dateModified"]),
    );
    const hasTimeEl = ctx.$("time[datetime]").length > 0;
    const visibleDate =
      /\b(20[12]\d)[-/. ]|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2},? 20[12]\d/.test(
        ctx.words.slice(0, 500).join(" "),
      );
    if (hasSchemaDates) {
      score += 0.4;
      findings.push({
        severity: "pass",
        message: "Published/modified dates present in structured data.",
      });
    } else if (hasTimeEl || visibleDate) {
      score += 0.25;
      findings.push({
        severity: "warn",
        message: "A date is visible but not declared in schema.",
        fix: "Add datePublished and dateModified to your Article JSON-LD.",
        snippet: `"datePublished": "2026-05-02",\n"dateModified": "2026-07-01"`,
      });
    } else {
      findings.push({
        severity: "error",
        message: "No published or modified date anywhere in the markup.",
        fix: "Show a visible date and mirror it in schema — freshness is a citation signal.",
      });
    }

    // Organization identity
    const hasOrg = jsonLdNodes(ctx, "Organization").length > 0;
    const hasAbout =
      ctx.$('a[href*="about" i], a[href*="contact" i]').length > 0;
    if (hasOrg || hasAbout) {
      score += 0.2;
    } else {
      findings.push({
        severity: "info",
        message:
          "No organization identity signals (Organization schema, about/contact links).",
        fix: "Add Organization schema site-wide and link to an about page.",
      });
    }

    return { score: Math.min(1, score), findings };
  },
};
