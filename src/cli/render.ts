import pc from "picocolors";
import type { ScanResult, CheckResult } from "../core/index.js";
import { ALL_CHECKS, WEIGHTS, GRADE_BANDS } from "../core/index.js";

const BAR_W = 18;

function bar(score: number): string {
  const filled = Math.round(score * BAR_W);
  const color = score >= 0.75 ? pc.green : score >= 0.45 ? pc.yellow : pc.red;
  return color("█".repeat(filled)) + pc.dim("░".repeat(BAR_W - filled));
}

function scoreColor(score: number): (s: string) => string {
  return score >= 80 ? pc.green : score >= 50 ? pc.yellow : pc.red;
}

function statusIcon(c: CheckResult): string {
  switch (c.status) {
    case "pass":
      return pc.green("✓");
    case "warn":
      return pc.yellow("▲");
    case "info":
      return pc.dim("○");
    default:
      return pc.red("✗");
  }
}

export function renderResult(
  r: ScanResult,
  opts: { quiet?: boolean; verbose?: boolean } = {},
): string {
  const out: string[] = [];
  const c = scoreColor(r.score);

  out.push("");
  out.push(
    `  ${pc.bold("LLMScout")} ${pc.dim("· AI answer-readiness")} ${pc.dim(r.finalUrl)}`,
  );
  out.push(
    pc.dim(
      `  scanned ${new Date(r.fetchedAt).toUTCString()} · HTTP ${r.meta.httpStatus} · ${r.meta.durationMs}ms · ${(r.meta.bytes / 1024).toFixed(0)} KB`,
    ),
  );
  out.push("");
  out.push(
    `  ${c(pc.bold(`${r.score} / 100`))}  ${pc.bold(r.grade)} ${pc.dim(`· ${r.gradeLabel}`)}`,
  );
  out.push(`  ${pc.dim(r.summary)}`);
  out.push("");

  if (!opts.quiet) {
    for (const check of r.checks) {
      const w = pc.dim(`w${String(check.weight).padStart(2)}`);
      out.push(
        `  ${statusIcon(check)} ${check.label.padEnd(26)} ${bar(check.score)} ${String(check.earned).padStart(2)}/${check.weight} ${w}`,
      );
      const toShow = opts.verbose
        ? check.findings
        : check.findings.filter((f) => f.severity !== "pass");
      for (const f of toShow) {
        out.push(pc.dim(`      ${f.message}`));
      }
    }
    out.push("");
  }

  if (r.topFixes.length > 0) {
    out.push(
      `  ${pc.bold(`Fix these ${r.topFixes.length} first`)} ${pc.dim("(sorted by impact × ease)")}`,
    );
    for (const fix of r.topFixes) {
      out.push(
        `  ${pc.bold(String(fix.rank))}. ${fix.title} ${pc.cyan(`+${fix.impactPts} pts`)} ${pc.dim(`· ${fix.ease}`)}`,
      );
      out.push(`     ${wrap(fix.body, 88).join("\n     ")}`);
      if (fix.snippet && !opts.quiet) {
        out.push(pc.dim("     " + fix.snippet.split("\n").join("\n     ")));
      }
    }
    out.push("");
  }

  for (const w of r.warnings) out.push(pc.yellow(`  ⚠ ${w}`));
  if (r.warnings.length) out.push("");
  out.push(
    pc.dim(
      "  Methodology: run `llmscout --explain` · weights v0.2, evidence-informed",
    ),
  );
  out.push("");
  return out.join("\n");
}

export function renderExplain(): string {
  const out: string[] = [];
  out.push("");
  out.push(
    `  ${pc.bold("LLMScout methodology")} ${pc.dim("— nine checks, weighted to 100. Nothing secret.")}`,
  );
  out.push(
    pc.dim(
      "  Status: v0.2 evidence-informed draft (Jul 2026). Sources: GEO/KDD 2024 (causal), Ahrefs schema test May 2026 (causal null), Vercel/MERJ Dec 2024 (JS), Google AI guide May 2026, SE Ranking llms.txt Nov 2025 (null), plus our own Perplexity quoted-vs-control test.",
    ),
  );
  out.push("");
  for (const mod of ALL_CHECKS) {
    const w = WEIGHTS[mod.id] ?? 0;
    out.push(
      `  ${pc.bold(String(w).padStart(2))}  ${pc.bold(mod.label)} ${pc.dim(`(${mod.id})`)}`,
    );
    out.push(`      ${wrap(mod.rationale, 84).join("\n      ")}`);
    out.push("");
  }
  out.push(`  ${pc.bold("Grade bands")}`);
  for (const b of GRADE_BANDS) {
    out.push(
      `  ${pc.bold(b.grade)}  ${String(b.min).padStart(2)}–${b.min === 90 ? 100 : ""}  ${b.label} ${pc.dim(`· ${b.blurb}`)}`,
    );
  }
  out.push("");
  return out.join("\n");
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}
