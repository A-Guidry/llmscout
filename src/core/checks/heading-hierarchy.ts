import type { CheckModule, Finding } from "../types.js";

export const headingHierarchy: CheckModule = {
  id: "heading-hierarchy",
  label: "Heading hierarchy",
  what: "Clean, ordered H1–H3 outline.",
  rationale:
    "Headings are how engines chunk a page into liftable passages. A broken outline (multiple H1s, skipped levels) breaks that chunking.",
  fixability: 0.9,
  run(ctx) {
    const findings: Finding[] = [];
    const h1s = ctx.headings.filter((h) => h.level === 1);
    let score = 0;

    if (h1s.length === 1) {
      score += 0.4;
      findings.push({
        severity: "pass",
        message: `Single H1: "${h1s[0].text.slice(0, 70)}".`,
      });
    } else if (h1s.length === 0) {
      findings.push({
        severity: "error",
        message: "No H1 found — engines can't tell what this page is about.",
        fix: "Add exactly one H1 that states the page's topic (question-form works well).",
      });
    } else {
      findings.push({
        severity: "warn",
        message: `${h1s.length} H1s found — the page's topic is ambiguous.`,
        fix: "Keep one H1; demote the others to H2.",
      });
      score += 0.15;
    }

    // skipped levels
    const skips: string[] = [];
    for (let i = 1; i < ctx.headings.length; i++) {
      const prev = ctx.headings[i - 1];
      const cur = ctx.headings[i];
      if (cur.level > prev.level + 1)
        skips.push(
          `H${prev.level} → H${cur.level} at "${cur.text.slice(0, 40)}"`,
        );
    }
    if (ctx.headings.length > 0 && skips.length === 0) {
      score += 0.4;
      findings.push({
        severity: "pass",
        message: "No skipped heading levels.",
      });
    } else if (skips.length > 0) {
      score += Math.max(0, 0.4 - 0.15 * skips.length);
      findings.push({
        severity: "warn",
        message: `Skipped level${skips.length > 1 ? "s" : ""}: ${skips.slice(0, 3).join("; ")}.`,
        fix: "Never jump more than one level down (H2 → H3, not H2 → H4).",
      });
    }

    // has section structure at all
    if (ctx.headings.some((h) => h.level === 2)) {
      score += 0.2;
    } else {
      findings.push({
        severity: "warn",
        message:
          "No H2 sections — long unsectioned pages are hard to quote from.",
        fix: "Break content into H2 sections, ideally question-formed.",
      });
    }

    return { score: Math.min(1, score), findings };
  },
};
