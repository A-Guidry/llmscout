import type { CheckModule, Finding } from "../types.js";
import { jsonLdNodes, jsonLdTypes } from "../parser.js";

const HIGH_VALUE = [
  "Article",
  "NewsArticle",
  "BlogPosting",
  "FAQPage",
  "QAPage",
  "HowTo",
  "Product",
];
const SUPPORTING = [
  "Organization",
  "WebSite",
  "WebPage",
  "BreadcrumbList",
  "Person",
  "LocalBusiness",
];

export const jsonLd: CheckModule = {
  id: "json-ld",
  label: "JSON-LD schema",
  what: "Structured data an engine can parse.",
  rationale:
    "JSON-LD is the cleanest machine-readable statement of what a page is, who wrote it and when. High-value types (Article, FAQPage, Product) map directly onto answer surfaces.",
  fixability: 0.9,
  run(ctx) {
    const findings: Finding[] = [];
    const invalid = ctx.jsonLd.filter((b) => b.data === null);
    invalid.forEach((b) =>
      findings.push({
        severity: "error",
        message: `A JSON-LD block fails to parse (${b.error}). Broken schema is worse than none.`,
        fix: "Validate the block at validator.schema.org and fix the syntax.",
      }),
    );

    if (ctx.jsonLd.length === 0) {
      findings.push({
        severity: "error",
        message: "No JSON-LD structured data found.",
        fix: "Add Article schema on content pages and FAQPage wherever you answer real questions.",
        snippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "…",\n  "author": { "@type": "Person", "name": "…" },\n  "datePublished": "2026-01-01",\n  "dateModified": "2026-07-01"\n}\n</script>`,
      });
      return { score: 0, findings };
    }

    const types = jsonLdTypes(ctx);
    const high = HIGH_VALUE.filter((t) => types.includes(t));
    const supporting = SUPPORTING.filter((t) => types.includes(t));

    let score = 0;
    if (ctx.jsonLd.length > invalid.length) score += 0.3; // some valid schema exists
    if (high.length > 0) score += 0.4;
    else
      findings.push({
        severity: "warn",
        message: `Only supporting types found (${supporting.join(", ") || types.slice(0, 4).join(", ") || "unknown"}). No Article/FAQPage/Product markup.`,
        fix: "Add a high-value type that describes the page content itself, not just the site.",
        snippet: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [{\n    "@type": "Question",\n    "name": "…?",\n    "acceptedAnswer": { "@type": "Answer", "text": "…" }\n  }]\n}\n</script>`,
      });

    // completeness of the high-value node
    const articleLike = ["Article", "NewsArticle", "BlogPosting"].flatMap((t) =>
      jsonLdNodes(ctx, t),
    );
    if (articleLike.length > 0) {
      const node = articleLike[0];
      const hasAuthor = !!node["author"];
      const hasDates = !!node["datePublished"] || !!node["dateModified"];
      if (hasAuthor && hasDates) score += 0.3;
      else {
        score += 0.1;
        findings.push({
          severity: "warn",
          message: `Article schema present but missing ${[!hasAuthor && "author", !hasDates && "dates"].filter(Boolean).join(" and ")}.`,
          fix: "Add author and datePublished/dateModified to the Article node.",
        });
      }
    } else if (high.length > 0) {
      score += 0.3; // FAQPage/Product etc. present
    }

    if (score >= 0.7)
      findings.push({
        severity: "pass",
        message: `Valid schema found: ${[...high, ...supporting].join(", ")}.`,
      });
    return { score: Math.min(1, score), findings };
  },
};
