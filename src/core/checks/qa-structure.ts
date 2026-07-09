import type { CheckModule, Finding } from "../types.js";
import { jsonLdNodes } from "../parser.js";

const QUESTION_WORDS =
  /^(what|how|why|when|where|which|who|can|does|do|is|are|should|will)\b/i;

export const qaStructure: CheckModule = {
  id: "qa-structure",
  label: "Extractable Q&A",
  what: "Question headings with tight answers.",
  rationale:
    "Question-shaped sections map one-to-one onto the questions people ask AI engines. A question heading followed by a tight answer is the most liftable unit on the web.",
  fixability: 0.7,
  run(ctx) {
    const findings: Finding[] = [];
    let score = 0;

    const subHeadings = ctx.headings.filter(
      (h) => h.level >= 2 && h.level <= 3,
    );
    const questionHeadings = subHeadings.filter(
      (h) => QUESTION_WORDS.test(h.text) || h.text.trim().endsWith("?"),
    );

    const hasFaqSchema =
      jsonLdNodes(ctx, "FAQPage").length > 0 ||
      jsonLdNodes(ctx, "Question").length > 0;
    if (hasFaqSchema) {
      score += 0.4;
      findings.push({
        severity: "pass",
        message: "FAQPage/Question schema present.",
      });
    }

    if (subHeadings.length > 0 && questionHeadings.length > 0) {
      const frac = questionHeadings.length / subHeadings.length;
      score += Math.min(0.4, 0.4 * (frac / 0.4)); // full credit at ≥40% question-formed
      findings.push({
        severity: frac >= 0.25 ? "pass" : "warn",
        message: `${questionHeadings.length} of ${subHeadings.length} section headings are question-formed.`,
        ...(frac < 0.25 && {
          fix: 'Rephrase key H2s as the questions users actually ask (e.g. "How much does X cost?").',
        }),
      });
    } else if (subHeadings.length > 0) {
      findings.push({
        severity: "warn",
        message: "No question-formed headings found.",
        fix: "Turn at least your key sections into question headings with a direct answer in the first paragraph below.",
      });
    }

    // Tight answers: first paragraph after a question heading ≤ ~90 words
    if (questionHeadings.length > 0) {
      let tight = 0;
      questionHeadings.forEach((qh) => {
        const el = ctx
          .$("h2, h3")
          .filter(
            (_, e) => ctx.$(e).text().replace(/\s+/g, " ").trim() === qh.text,
          )
          .first();
        const para = el.nextAll("p").first().text().trim();
        if (para && para.split(/\s+/).length <= 90) tight++;
      });
      if (tight / questionHeadings.length >= 0.5) {
        score += 0.2;
        findings.push({
          severity: "pass",
          message: "Most question sections answer within one tight paragraph.",
        });
      } else {
        findings.push({
          severity: "warn",
          message:
            "Answers under question headings sprawl across multiple paragraphs.",
          fix: "Open each question section with a self-contained 1–3 sentence answer; elaborate below it.",
        });
      }
    }

    if (score === 0) {
      findings.push({
        severity: "error",
        message:
          "No Q&A-shaped content at all — nothing here maps onto a user's question.",
        fix: "Add a FAQ section (with FAQPage schema) covering the 3–5 questions this page should win.",
      });
    }
    return { score: Math.min(1, score), findings };
  },
};
