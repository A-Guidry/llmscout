import type {
  CheckModule,
  CheckOutcome,
  CheckResult,
  Fix,
  Severity,
} from "./types.js";
import { WEIGHTS, gradeFor } from "./weights.js";

export function statusFor(outcome: CheckOutcome, checkId: string): Severity {
  if (checkId === "llms-txt" && outcome.score < 1) return "info"; // honest labeling
  if (outcome.score >= 0.75) return "pass";
  if (outcome.score >= 0.45) return "warn";
  return "error";
}

export function toResult(mod: CheckModule, outcome: CheckOutcome): CheckResult {
  const weight = WEIGHTS[mod.id] ?? 0;
  return {
    id: mod.id,
    label: mod.label,
    what: mod.what,
    weight,
    score: Math.max(0, Math.min(1, outcome.score)),
    earned: Math.round(weight * outcome.score),
    status: statusFor(outcome, mod.id),
    findings: outcome.findings,
  };
}

export function totalScore(results: CheckResult[]): number {
  const totalWeight = results.reduce((s, r) => s + r.weight, 0);
  if (totalWeight === 0) return 0;
  const earned = results.reduce((s, r) => s + r.weight * r.score, 0);
  return Math.round((earned / totalWeight) * 100);
}

const EASE = (f: number): Fix["ease"] =>
  f >= 0.8 ? "Easy" : f >= 0.5 ? "Medium" : "Hard";

export function rankFixes(
  results: CheckResult[],
  modules: CheckModule[],
  limit = 3,
): Fix[] {
  const scored = results
    .filter((r) => r.score < 0.99 && r.findings.some((f) => f.fix))
    .map((r) => {
      const mod = modules.find((m) => m.id === r.id)!;
      const priority = r.weight * (1 - r.score) * mod.fixability;
      const finding = r.findings.find((f) => f.fix)!;
      return {
        priority,
        fix: {
          rank: 0,
          checkId: r.id,
          title: fixTitle(r),
          body: `${finding.message} ${finding.fix ?? ""}`.trim(),
          snippet: finding.snippet,
          impactPts: Math.round(r.weight * (1 - r.score)),
          ease: EASE(mod.fixability),
        } satisfies Fix,
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((x, i) => ({ ...x.fix, rank: i + 1 }));
  return scored;
}

function fixTitle(r: CheckResult): string {
  const titles: Record<string, string> = {
    "crawler-access": "Unblock the AI crawlers",
    "answer-first": "Lead with the answer",
    "json-ld": "Ship Article + FAQPage JSON-LD",
    "heading-hierarchy": "Repair the heading outline",
    "eeat-signals": "Add a visible byline and dates",
    "qa-structure": "Add extractable Q&A sections",
    "stat-density": "Add concrete, sourced statistics",
    "content-ratio": "Get real content into the raw HTML",
    "llms-txt": "Add an llms.txt (optional)",
  };
  return titles[r.id] ?? `Improve ${r.label}`;
}

export function summarize(score: number, results: CheckResult[]): string {
  const { label } = gradeFor(score);
  const worst = [...results]
    .filter((r) => r.id !== "llms-txt")
    .sort((a, b) => a.score * a.weight - b.score * b.weight)
    .slice(0, 2)
    .map((r) => r.label.toLowerCase());
  const best = [...results].sort(
    (a, b) => b.score * b.weight - a.score * a.weight,
  )[0];
  if (score >= 90)
    return `${label}: engines can reach, parse and quote this page. Keep it fresh.`;
  if (score >= 75)
    return `${label}: the fundamentals are in place, with room on ${worst[0]}. A short fix list closes the gap.`;
  if (score >= 60)
    return `${label}: ${best ? `${best.label.toLowerCase()} is solid` : "some foundations are here"}, but ${worst.join(" and ")} are holding the page back from being quoted.`;
  if (score >= 40)
    return `${label}: structural work needed — start with ${worst.join(" and ")} before polishing anything else.`;
  return `${label}: AI engines currently have almost nothing here they can fetch, parse or quote. Work the fix list top-down.`;
}
