import type { CheckModule, Finding } from "../types.js";

export const llmsTxt: CheckModule = {
  id: "llms-txt",
  label: "llms.txt",
  what: "Optional AI-guidance manifest.",
  rationale:
    "Honestly weighted: we have not observed llms.txt moving citation behavior yet, so it carries the lowest weight in the rubric. Cheap to add, small upside, no penalty drama.",
  fixability: 1.0,
  run(ctx) {
    const findings: Finding[] = [];
    if (ctx.llmsTxt) {
      const looksMd = /^#\s/m.test(ctx.llmsTxt);
      findings.push({
        severity: "pass",
        message: `llms.txt present${looksMd ? " and markdown-formatted" : ""}. (Optional signal — low current yield.)`,
      });
      return { score: looksMd ? 1 : 0.7, findings };
    }
    findings.push({
      severity: "info",
      message:
        "No llms.txt. Optional / low current yield — small penalty only.",
      fix: "If you want it: add /llms.txt with a markdown summary of your site's key pages.",
      snippet: `# Your Site\n\n> One-line description of what the site is.\n\n## Key pages\n- [Product](https://example.com/product): what it does\n- [Pricing](https://example.com/pricing): plans`,
    });
    return { score: 0, findings };
  },
};
