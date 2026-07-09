#!/usr/bin/env node
/**
 * Static demo export for GitHub Pages.
 * Scans the DEMO_URLS live, then writes a fully static site to docs/:
 *   index.html, methodology.html, report-<slug>.html, report-<slug>.json
 * Run: npm run build && node scripts/export-static.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { scan, gradeFor } from "../dist/core/index.js";
import { landingPage, reportPage, methodologyPage } from "../dist/web/html.js";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DEMO_URLS = [
  {
    url: "https://en.wikipedia.org/wiki/Search_engine_optimization",
    slug: "wikipedia-seo",
    label: "Wikipedia · SEO article",
  },
  {
    url: "https://docs.stripe.com/",
    slug: "stripe-docs",
    label: "Stripe · docs home",
  },
  {
    url: "https://www.apple.com/",
    slug: "apple",
    label: "Apple · homepage",
  },
];

const OUT = fileURLToPath(new URL("../docs/", import.meta.url));
mkdirSync(OUT, { recursive: true });

const DEMO_BANNER = `<div style="background:#0F1729;color:#fff;border-radius:14px;padding:12px 20px;font-size:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
<span style="background:#FF6B4A;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 9px;border-radius:20px;">Static demo</span>
<span>Pre-scanned example reports. For live scans: <code style="font-family:'Space Mono',monospace;background:rgba(255,255,255,.1);padding:2px 8px;border-radius:6px;">npx llmscout serve</code></span></div>`;

/** Rewrite server routes to flat static files. */
function staticize(html, { scanJsonTo } = {}) {
  let out = html
    .replaceAll('href="/methodology"', 'href="./methodology.html"')
    .replaceAll('class="brand" href="/"', 'class="brand" href="./index.html"')
    .replaceAll(
      'class="pill primary" href="/"',
      'class="pill primary" href="./index.html"',
    );
  if (scanJsonTo)
    out = out.replace(
      /href="\/scan\.json\?url=[^"]*"/g,
      `href="${scanJsonTo}"`,
    );
  // inject demo banner right after the nav
  out = out.replace("</div>\n", "</div>\n" + DEMO_BANNER + "\n");
  return out;
}

const results = [];
for (const d of DEMO_URLS) {
  process.stdout.write(`scanning ${d.url} … `);
  const r = await scan(d.url, { userAgent: BROWSER_UA });
  results.push({ ...d, result: r });
  console.log(`${r.score}/100 ${r.grade}`);
  writeFileSync(`${OUT}report-${d.slug}.json`, JSON.stringify(r, null, 2));
  writeFileSync(
    `${OUT}report-${d.slug}.html`,
    staticize(reportPage(r), { scanJsonTo: `./report-${d.slug}.json` }),
  );
}

// Landing: replace the live form with demo report cards
const tickers = results.map((r) => ({
  site: new URL(r.result.finalUrl).hostname,
  grade: r.result.grade,
}));
let landing = landingPage(tickers);
const demoCards = results
  .map((r) => {
    const color =
      r.result.score >= 75
        ? "#2E7D53"
        : r.result.score >= 50
          ? "#B4770F"
          : "#C43D2A";
    return `<a href="./report-${r.slug}.html" style="flex:1;min-width:180px;background:#fff;border-radius:16px;padding:18px 22px;display:flex;align-items:center;gap:14px;color:#0F1729;">
    <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:34px;font-weight:800;color:${color};">${r.result.grade}</span>
    <span style="display:flex;flex-direction:column;"><strong style="font-size:15px;">${r.label}</strong><span style="font-size:13px;color:#8891a8;">${r.result.score} / 100 · view report →</span></span></a>`;
  })
  .join("\n");
landing = landing.replace(
  /<form action="\/scan"[\s\S]*?<\/form>/,
  `<div style="display:flex;gap:12px;margin:38px 0 0;flex-wrap:wrap;">${demoCards}</div>`,
);
landing = landing.replace(
  "No signup · shareable report · takes a few seconds",
  "Three pre-scanned demo reports · run it on your own pages with <code style=\"font-family:'Space Mono',monospace;\">npx llmscout &lt;url&gt;</code>",
);
// ticker links point at demo reports
results.forEach((r) => {
  const host = new URL(r.result.finalUrl).hostname;
  landing = landing.replaceAll(
    `href="/scan?url=${encodeURIComponent(host)}"`,
    `href="./report-${r.slug}.html"`,
  );
});
writeFileSync(`${OUT}index.html`, staticize(landing));
writeFileSync(`${OUT}methodology.html`, staticize(methodologyPage()));
writeFileSync(`${OUT}.nojekyll`, "");
console.log(`\nwrote ${OUT}`);
