import type { CheckModule, Finding } from "../types.js";

const DEFINITION_PATTERNS =
  /\b(is a|is an|is the|are the|means|refers to|allows|provides|helps|lets you|enables)\b/i;
const CONCRETE = /\d|%|\$|€|£/;

export const answerFirst: CheckModule = {
  id: "answer-first",
  label: "Answer-first (BLUF)",
  what: "Is the answer in the first 150 words?",
  rationale:
    "AI engines lift self-contained passages. Pages that state the answer up top get quoted; pages that bury it under a long intro get skipped or paraphrased without credit.",
  fixability: 0.6,
  run(ctx) {
    const findings: Finding[] = [];
    if (ctx.words.length < 40) {
      findings.push({
        severity: "warn",
        message:
          "Too little extractable text to evaluate (possible JS-rendered page).",
        fix: "Ensure the primary answer is present in the raw HTML, not injected by JavaScript.",
      });
      return { score: 0.2, findings };
    }

    // Text before the first H2 (or first 150 words if no H2)
    const firstH2 = ctx.headings.find((h) => h.level === 2);
    const first150 = ctx.words.slice(0, 150).join(" ");

    let score = 0;
    // 1. Substantive prose in the first 150 words (not just nav crumbs)
    const introSentences = first150
      .split(/[.!?]/)
      .filter((s) => s.trim().split(/\s+/).length >= 8);
    if (introSentences.length >= 1) score += 0.4;

    // 2. Definitional / declarative phrasing early
    if (DEFINITION_PATTERNS.test(first150)) score += 0.3;

    // 3. Concrete fact early
    if (CONCRETE.test(first150)) score += 0.3;

    if (score >= 0.7) {
      findings.push({
        severity: "pass",
        message:
          "A substantive, quotable answer appears within the first 150 words.",
      });
    } else {
      findings.push({
        severity: score >= 0.4 ? "warn" : "error",
        message: firstH2
          ? `The opening before "${firstH2.text.slice(0, 60)}" reads like preamble, not an answer.`
          : "The opening 150 words don't contain an extractable answer.",
        fix: "Move a one-to-two sentence direct answer to the page's implied question above the first H2. Lead with the conclusion; elaborate after.",
      });
    }
    return { score, findings };
  },
};
