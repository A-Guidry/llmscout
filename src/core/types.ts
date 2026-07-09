import type { CheerioAPI } from "cheerio";

export type Severity = "error" | "warn" | "info" | "pass";

export interface Finding {
  severity: Severity;
  message: string;
  /** Concrete how-to-fix guidance */
  fix?: string;
  /** Copy-paste-ready code snippet */
  snippet?: string;
}

export interface Heading {
  level: number;
  text: string;
}

export interface PageContext {
  url: string;
  finalUrl: string;
  html: string;
  $: CheerioAPI;
  /** Visible body text, whitespace-normalized */
  text: string;
  words: string[];
  headings: Heading[];
  /** Parsed JSON-LD blocks (invalid blocks recorded as errors) */
  jsonLd: { raw: string; data: unknown | null; error?: string }[];
  robotsTxt: string | null;
  llmsTxt: string | null;
  meta: {
    httpStatus: number;
    durationMs: number;
    bytes: number;
    redirected: boolean;
    contentType: string;
  };
}

export interface CheckOutcome {
  /** 0..1 */
  score: number;
  findings: Finding[];
}

export interface CheckModule {
  id: string;
  label: string;
  /** One-line "what this measures" */
  what: string;
  /** Why this is weighted the way it is (methodology / --explain) */
  rationale: string;
  /** 0..1 — how easy the typical fix is (used for fix ranking) */
  fixability: number;
  run(ctx: PageContext): CheckOutcome;
}

export interface CheckResult extends CheckOutcome {
  id: string;
  label: string;
  what: string;
  weight: number;
  /** weight × score, rounded */
  earned: number;
  status: Severity;
}

export interface Fix {
  rank: number;
  checkId: string;
  title: string;
  body: string;
  snippet?: string;
  /** projected points gained if fully fixed */
  impactPts: number;
  ease: "Easy" | "Medium" | "Hard";
}

export interface ScanResult {
  schemaVersion: 1;
  url: string;
  finalUrl: string;
  fetchedAt: string;
  score: number;
  grade: string;
  gradeLabel: string;
  summary: string;
  checks: CheckResult[];
  topFixes: Fix[];
  warnings: string[];
  meta: PageContext["meta"];
}

export interface ScanOptions {
  timeoutMs?: number;
  userAgent?: string;
  only?: string[];
  skip?: string[];
  fixes?: number;
}
