import { fetchPage, fetchRootFile, DEFAULT_UA, FetchError } from "./fetcher.js";
import { parsePage } from "./parser.js";
import { ALL_CHECKS } from "./checks/index.js";
import { rankFixes, summarize, toResult, totalScore } from "./aggregate.js";
import { gradeFor, WEIGHTS, GRADE_BANDS } from "./weights.js";
import type { ScanOptions, ScanResult } from "./types.js";

export { FetchError, DEFAULT_UA, ALL_CHECKS, WEIGHTS, GRADE_BANDS, gradeFor };
export * from "./types.js";

export async function scan(
  url: string,
  opts: ScanOptions = {},
): Promise<ScanResult> {
  const ua = opts.userAgent ?? DEFAULT_UA;
  const timeoutMs = opts.timeoutMs ?? 15000;

  const page = await fetchPage(url, ua, timeoutMs);
  // robots.txt + llms.txt fetched once per run, shared across checks
  const [robotsTxt, llmsTxt] = await Promise.all([
    fetchRootFile(page.finalUrl, "robots.txt", ua),
    fetchRootFile(page.finalUrl, "llms.txt", ua),
  ]);
  const ctx = parsePage(page, robotsTxt, llmsTxt);

  let modules = ALL_CHECKS;
  if (opts.only?.length)
    modules = modules.filter((m) => opts.only!.includes(m.id));
  if (opts.skip?.length)
    modules = modules.filter((m) => !opts.skip!.includes(m.id));

  const results = modules.map((m) => toResult(m, m.run(ctx)));
  const score = totalScore(results);
  const { grade, label } = gradeFor(score);

  const warnings: string[] = [];
  if (ctx.words.length < 50)
    warnings.push(
      "Very little text in raw HTML — likely a JS-rendered page. Scores reflect what AI crawlers actually see.",
    );
  if (page.redirected) warnings.push(`Followed redirect to ${page.finalUrl}`);
  if (!ctx.meta.contentType.includes("html"))
    warnings.push(`Unexpected content-type: ${ctx.meta.contentType}`);

  return {
    schemaVersion: 1,
    url: page.url,
    finalUrl: page.finalUrl,
    fetchedAt: new Date().toISOString(),
    score,
    grade,
    gradeLabel: label,
    summary: summarize(score, results),
    checks: results,
    topFixes: rankFixes(results, modules, opts.fixes ?? 3),
    warnings,
    meta: ctx.meta,
  };
}
