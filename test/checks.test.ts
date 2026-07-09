import { describe, it, expect } from "vitest";
import {
  ctxFromHtml,
  GOOD_PAGE,
  BAD_PAGE,
  JS_SHELL,
  ROBOTS_BLOCKING,
  ROBOTS_OPEN,
} from "./fixtures.js";
import {
  crawlerAccess,
  botBlocked,
} from "../src/core/checks/crawler-access.js";
import { answerFirst } from "../src/core/checks/answer-first.js";
import { headingHierarchy } from "../src/core/checks/heading-hierarchy.js";
import { jsonLd } from "../src/core/checks/json-ld.js";
import { eeatSignals } from "../src/core/checks/eeat-signals.js";
import { qaStructure } from "../src/core/checks/qa-structure.js";
import { statDensity } from "../src/core/checks/stat-density.js";
import { contentRatio } from "../src/core/checks/content-ratio.js";
import { llmsTxt } from "../src/core/checks/llms-txt.js";

describe("crawler-access", () => {
  it("passes with open robots.txt", () => {
    const r = crawlerAccess.run(ctxFromHtml(GOOD_PAGE, ROBOTS_OPEN));
    expect(r.score).toBe(1);
  });
  it("penalizes blocked AI bots", () => {
    const r = crawlerAccess.run(ctxFromHtml(GOOD_PAGE, ROBOTS_BLOCKING));
    expect(r.score).toBeLessThan(1);
    expect(r.score).toBeCloseTo(3 / 5, 5);
    expect(r.findings.some((f) => f.snippet?.includes("GPTBot"))).toBe(true);
  });
  it("passes when robots.txt is absent", () => {
    expect(crawlerAccess.run(ctxFromHtml(GOOD_PAGE, null)).score).toBe(1);
  });
  it("hard-fails on meta noindex", () => {
    const html = GOOD_PAGE.replace(
      "<title>",
      '<meta name="robots" content="noindex"><title>',
    );
    expect(crawlerAccess.run(ctxFromHtml(html, ROBOTS_OPEN)).score).toBe(0);
  });
  it("botBlocked understands specific groups vs *", () => {
    expect(botBlocked(ROBOTS_BLOCKING, "GPTBot", "/")).toBe(true);
    expect(botBlocked(ROBOTS_BLOCKING, "PerplexityBot", "/")).toBe(false);
    expect(botBlocked(ROBOTS_BLOCKING, "PerplexityBot", "/admin/x")).toBe(true);
  });
});

describe("answer-first", () => {
  it("rewards an up-top definitional answer with facts", () => {
    expect(
      answerFirst.run(ctxFromHtml(GOOD_PAGE)).score,
    ).toBeGreaterThanOrEqual(0.7);
  });
  it("flags JS shells", () => {
    const r = answerFirst.run(ctxFromHtml(JS_SHELL));
    expect(r.score).toBeLessThanOrEqual(0.2);
  });
});

describe("heading-hierarchy", () => {
  it("rewards a clean outline", () => {
    expect(
      headingHierarchy.run(ctxFromHtml(GOOD_PAGE)).score,
    ).toBeGreaterThanOrEqual(0.9);
  });
  it("penalizes multiple H1s and skips", () => {
    const r = headingHierarchy.run(ctxFromHtml(BAD_PAGE));
    expect(r.score).toBeLessThan(0.6);
  });
});

describe("json-ld", () => {
  it("rewards Article + FAQPage with author and dates", () => {
    expect(jsonLd.run(ctxFromHtml(GOOD_PAGE)).score).toBeGreaterThanOrEqual(
      0.9,
    );
  });
  it("zero when absent, with a snippet fix", () => {
    const r = jsonLd.run(ctxFromHtml(BAD_PAGE));
    expect(r.score).toBe(0);
    expect(r.findings[0].snippet).toContain("ld+json");
  });
  it("flags invalid JSON", () => {
    const html = `<html><head><script type="application/ld+json">{not json}</script></head><body><h1>x</h1><p>text</p></body></html>`;
    const r = jsonLd.run(ctxFromHtml(html));
    expect(
      r.findings.some(
        (f) => f.severity === "error" && f.message.includes("parse"),
      ),
    ).toBe(true);
  });
});

describe("eeat-signals", () => {
  it("rewards schema author + dates + org links", () => {
    expect(
      eeatSignals.run(ctxFromHtml(GOOD_PAGE)).score,
    ).toBeGreaterThanOrEqual(0.9);
  });
  it("fails anonymous undated pages", () => {
    expect(eeatSignals.run(ctxFromHtml(BAD_PAGE)).score).toBeLessThan(0.3);
  });
});

describe("qa-structure", () => {
  it("rewards question headings + FAQ schema + tight answers", () => {
    expect(
      qaStructure.run(ctxFromHtml(GOOD_PAGE)).score,
    ).toBeGreaterThanOrEqual(0.8);
  });
  it("fails pages with no Q&A shape", () => {
    expect(qaStructure.run(ctxFromHtml(BAD_PAGE)).score).toBeLessThanOrEqual(
      0.2,
    );
  });
});

describe("stat-density", () => {
  it("rewards concrete figures and attribution", () => {
    expect(
      statDensity.run(ctxFromHtml(GOOD_PAGE)).score,
    ).toBeGreaterThanOrEqual(0.6);
  });
  it("penalizes vague prose", () => {
    expect(statDensity.run(ctxFromHtml(BAD_PAGE)).score).toBeLessThan(0.4);
  });
});

describe("content-ratio", () => {
  it("detects JS shells as near-zero", () => {
    expect(contentRatio.run(ctxFromHtml(JS_SHELL)).score).toBeLessThanOrEqual(
      0.1,
    );
  });
  it("scores real content pages reasonably", () => {
    expect(contentRatio.run(ctxFromHtml(GOOD_PAGE)).score).toBeGreaterThan(0.5);
  });
});

describe("llms-txt", () => {
  it("is info-severity, low stakes when absent", () => {
    const r = llmsTxt.run(ctxFromHtml(GOOD_PAGE, null, null));
    expect(r.score).toBe(0);
    expect(r.findings[0].severity).toBe("info");
  });
  it("full credit for markdown llms.txt", () => {
    expect(
      llmsTxt.run(
        ctxFromHtml(GOOD_PAGE, null, "# Site\n\n## Pages\n- [a](https://a)"),
      ).score,
    ).toBe(1);
  });
});
