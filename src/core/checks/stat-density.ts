import type { CheckModule, Finding } from "../types.js";

const STAT_RE = /(\$|€|£)?\d[\d,.]*\s?(%|percent|million|billion|k\b|x\b)?/g;
const YEAR_RE = /\b(19|20)\d{2}\b/g;
const ATTRIBUTION_RE =
  /\b(according to|study|survey|report(ed|s)?|research(ers)?|data from|per\s+[A-Z])\b/gi;

export const statDensity: CheckModule = {
  id: "stat-density",
  label: "Named-statistic density",
  what: "Concrete, quotable facts and figures.",
  rationale:
    "When an engine cites a page it usually quotes a concrete claim — a number, a date, a named finding. Vague prose gives it nothing to quote.",
  fixability: 0.5,
  run(ctx) {
    const findings: Finding[] = [];
    const words = ctx.words.length;
    if (words < 40) {
      findings.push({
        severity: "warn",
        message: "Too little text to evaluate statistic density.",
      });
      return { score: 0.2, findings };
    }

    const text = ctx.text;
    const numbers = (text.match(STAT_RE) ?? []).filter((m) =>
      /\d/.test(m),
    ).length;
    const years = (text.match(YEAR_RE) ?? []).length;
    const attributions = (text.match(ATTRIBUTION_RE) ?? []).length;

    // Density per 100 words; healthy content sits around 1.5–4
    const density = ((numbers + years) / words) * 100;
    let score = Math.max(0, Math.min(0.8, (density / 2.5) * 0.8));
    if (attributions > 0) score += Math.min(0.2, attributions * 0.05);
    score = Math.min(1, score);

    if (score >= 0.7) {
      findings.push({
        severity: "pass",
        message: `Strong: ~${numbers + years} concrete figures across ${words} words${attributions ? `, ${attributions} attributed claims` : ""}.`,
      });
    } else if (score >= 0.4) {
      findings.push({
        severity: "warn",
        message: `Some concrete facts (${numbers + years} figures in ${words} words) but the prose leans vague.`,
        fix: "Replace hedged claims with named, dated, sourced figures — those are what engines quote.",
      });
    } else {
      findings.push({
        severity: "error",
        message:
          "Almost nothing citable — no meaningful figures, dates or attributed claims.",
        fix: 'Add 3–5 concrete statistics with sources ("According to X\'s 2026 report, 41% …").',
      });
    }
    return { score, findings };
  },
};
