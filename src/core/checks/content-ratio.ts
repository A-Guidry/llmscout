import type { CheckModule, Finding } from "../types.js";

export const contentRatio: CheckModule = {
  id: "content-ratio",
  label: "Content-to-markup ratio",
  what: "Real text vs. wrapper markup.",
  rationale:
    "Engines tokenize your raw HTML. Div soup and script-heavy shells bury the content; some JS-only pages ship no content at all.",
  fixability: 0.3,
  run(ctx) {
    const findings: Finding[] = [];
    const htmlBytes = Buffer.byteLength(ctx.html, "utf8");
    const textBytes = Buffer.byteLength(ctx.text, "utf8");
    const ratio = htmlBytes > 0 ? textBytes / htmlBytes : 0;
    const words = ctx.words.length;

    // JS-shell detection
    if (words < 50) {
      findings.push({
        severity: "error",
        message: `Only ${words} words of extractable text in ${(htmlBytes / 1024).toFixed(0)} KB of HTML — this looks like a JavaScript-rendered shell.`,
        fix: "Server-render (or pre-render) the primary content. Most AI crawlers do not execute JavaScript.",
      });
      return { score: 0.05, findings };
    }

    // Map ratio: ≥0.20 → 1.0, 0.02 → 0.0, linear between
    let score = Math.max(0, Math.min(1, (ratio - 0.02) / 0.18));
    if (words < 150) score = Math.min(score, 0.4);

    if (score >= 0.7) {
      findings.push({
        severity: "pass",
        message: `Healthy text-to-HTML ratio (${(ratio * 100).toFixed(1)}%, ${words} words).`,
      });
    } else {
      findings.push({
        severity: score >= 0.4 ? "warn" : "error",
        message: `Text-to-HTML ratio is ${(ratio * 100).toFixed(1)}% (${words} words in ${(htmlBytes / 1024).toFixed(0)} KB).`,
        fix: "Cut wrapper markup, inline scripts and boilerplate; more of each byte should be content an engine can use.",
      });
    }
    return { score, findings };
  },
};
