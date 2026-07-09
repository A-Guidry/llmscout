import { describe, it, expect } from "vitest";
import { toResult, totalScore, rankFixes } from "../src/core/aggregate.js";
import { gradeFor, WEIGHTS } from "../src/core/weights.js";
import { ALL_CHECKS } from "../src/core/checks/index.js";
import { ctxFromHtml, GOOD_PAGE, BAD_PAGE, ROBOTS_OPEN } from "./fixtures.js";

describe("aggregator", () => {
  it("normalizes to 0–100 and good pages beat bad pages", () => {
    const good = ALL_CHECKS.map((m) =>
      toResult(m, m.run(ctxFromHtml(GOOD_PAGE, ROBOTS_OPEN))),
    );
    const bad = ALL_CHECKS.map((m) =>
      toResult(m, m.run(ctxFromHtml(BAD_PAGE, ROBOTS_OPEN))),
    );
    const gs = totalScore(good);
    const bs = totalScore(bad);
    expect(gs).toBeGreaterThan(80);
    expect(bs).toBeLessThan(50);
    expect(gs).toBeLessThanOrEqual(100);
    expect(bs).toBeGreaterThanOrEqual(0);
  });

  it("every check id has a weight", () => {
    for (const m of ALL_CHECKS)
      expect(WEIGHTS[m.id], `missing weight for ${m.id}`).toBeGreaterThan(0);
  });

  it("rankFixes returns at most N, sorted by priority, with impact points", () => {
    const bad = ALL_CHECKS.map((m) =>
      toResult(m, m.run(ctxFromHtml(BAD_PAGE, ROBOTS_OPEN))),
    );
    const fixes = rankFixes(bad, ALL_CHECKS, 3);
    expect(fixes.length).toBe(3);
    expect(fixes[0].rank).toBe(1);
    expect(fixes[0].impactPts).toBeGreaterThan(0);
    // llms.txt (weight 3) should never outrank real problems on a bad page
    expect(fixes.map((f) => f.checkId)).not.toContain("llms-txt");
  });

  it("grade bands behave", () => {
    expect(gradeFor(95).grade).toBe("A");
    expect(gradeFor(91).grade).toBe("A-");
    expect(gradeFor(82).grade).toBe("B");
    expect(gradeFor(86).grade).toBe("B+");
    expect(gradeFor(60).grade).toBe("C-");
    expect(gradeFor(10).grade).toBe("F");
    expect(gradeFor(100).label).toBe("Answer-ready");
  });
});
