/**
 * LLMScout weighting config — the single auditable source of truth.
 *
 * STATUS: v0.2 EVIDENCE-INFORMED DRAFT (updated 2026-07-09).
 * Weights are relative; the aggregator normalizes to 0–100.
 * Every change to this file should be reflected on the public methodology page.
 *
 * Evidence basis (see /methodology for full citations):
 * - CAUSAL: "GEO" paper (Aggarwal et al., KDD 2024, arXiv:2311.09735) — adding
 *   statistics/citations/quotes lifted generative visibility 30–41%; keyword
 *   stuffing null-to-negative.
 * - CAUSAL: Ahrefs schema intervention test (May 2026, n=1,885 + 4,000 controls)
 *   — newly added JSON-LD produced NO citation uplift on any platform.
 * - CAUSAL/MECHANICAL: Vercel+MERJ crawler study (Dec 2024) — GPTBot, ClaudeBot,
 *   PerplexityBot execute zero JavaScript; client-rendered content is invisible.
 * - NULL: llms.txt — Google's Mueller "no AI system currently uses llms.txt"
 *   (Jun 2025); SE Ranking 300K-domain study (Nov 2025): no citation effect.
 * - OFFICIAL: Google "Optimizing your website for generative AI features"
 *   (May 2026): no special files/markup/chunking needed for Google surfaces.
 * - OWN DATA: LLMScout quoted-vs-control Perplexity test (Jul 2026, n=13):
 *   total score separated quoted pages (+5.9); crawler-access was the largest
 *   single separator (+0.25); llms-txt separated NEGATIVELY (−0.35).
 */
export const WEIGHTS: Record<string, number> = {
  "crawler-access": 25, // Strong: mechanical gate + largest separator in our live test.
  "answer-first": 12, // Weak–moderate: RAG chunking mechanism; no isolated causal study.
  "stat-density": 12, // Moderate–strong: GEO paper's core causal result (+30–41%).
  "content-ratio": 12, // Strong: AI crawlers execute zero JS (Vercel/MERJ Dec 2024).
  "heading-hierarchy": 10, // Moderate: extraction mechanism + Google content-organization guidance.
  "qa-structure": 10, // Moderate (correlational): Q&A-shaped content dominates cited sources.
  "eeat-signals": 9, // Weak: consistent with guidance/authority correlations; no isolated study.
  "json-ld": 8, // Demoted: Ahrefs causal test found no uplift; kept nonzero (free machine-readability, non-Google engines unstudied).
  "llms-txt": 2, // Null in three studies and our own data — scored for transparency only.
};

export const GRADE_BANDS = [
  {
    min: 90,
    grade: "A",
    label: "Answer-ready",
    blurb: "engines cite you freely",
  },
  { min: 75, grade: "B", label: "Mostly ready", blurb: "minor gaps" },
  { min: 60, grade: "C", label: "Partly ready", blurb: "real gaps to close" },
  {
    min: 40,
    grade: "D",
    label: "Hard to quote",
    blurb: "structural work needed",
  },
  { min: 0, grade: "F", label: "Invisible", blurb: "engines skip you" },
] as const;

export function gradeFor(score: number): { grade: string; label: string } {
  const band =
    GRADE_BANDS.find((b) => score >= b.min) ??
    GRADE_BANDS[GRADE_BANDS.length - 1];
  // +/- within the band (thirds), no A+ and no F modifiers
  const next =
    band.min === 90
      ? 100
      : (GRADE_BANDS[GRADE_BANDS.indexOf(band as never) - 1]?.min ?? 100);
  const span = next - band.min;
  let mod = "";
  if (band.grade !== "F") {
    const pos = (score - band.min) / span;
    if (pos >= 2 / 3 && band.grade !== "A") mod = "+";
    else if (pos < 1 / 3) mod = "-";
  }
  return { grade: `${band.grade}${mod}`, label: band.label };
}
