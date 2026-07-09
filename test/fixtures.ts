import { parsePage } from "../src/core/parser.js";
import type { PageContext } from "../src/core/types.js";

export function ctxFromHtml(
  html: string,
  robotsTxt: string | null = null,
  llmsTxt: string | null = null,
): PageContext {
  return parsePage(
    {
      url: "https://example.com/page",
      finalUrl: "https://example.com/page",
      html,
      httpStatus: 200,
      durationMs: 100,
      bytes: Buffer.byteLength(html),
      redirected: false,
      contentType: "text/html",
    },
    robotsTxt,
    llmsTxt,
  );
}

export const GOOD_PAGE = `<!DOCTYPE html><html><head>
<title>What is answer engine optimization?</title>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Article","headline":"What is AEO?","author":{"@type":"Person","name":"Jane Okafor"},"datePublished":"2026-05-02","dateModified":"2026-07-01"}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is AEO?","acceptedAnswer":{"@type":"Answer","text":"AEO is the practice of structuring pages so AI engines can quote them."}}]}
</script>
</head><body>
<article>
<h1>What is answer engine optimization?</h1>
<p>Answer engine optimization (AEO) is the practice of structuring web pages so AI engines like ChatGPT and Perplexity can quote them. According to a 2026 survey, 41% of consumers now start product research in an AI assistant, up from 18% in 2024.</p>
<p>By Jane Okafor · <time datetime="2026-05-02">May 2, 2026</time></p>
<h2>How does AEO differ from SEO?</h2>
<p>SEO targets ranked lists of links; AEO targets being the quoted answer. The overlap is about 60% by most estimates.</p>
<h2>Why does answer placement matter?</h2>
<p>Engines lift self-contained passages. A direct answer in the first 150 words is 3x more likely to be cited.</p>
<h3>What the data shows</h3>
<p>Across 500 test prompts in 2026, pages with FAQPage schema were cited 27% more often.</p>
<h2>How do you measure answer readiness?</h2>
<p>Answer readiness is measured by scoring nine independent signals: crawler access, answer placement, structured data, authorship, question structure, statistic density, markup efficiency, heading hierarchy, and the optional llms.txt manifest. Each signal earns a fraction of its weight and the total is normalized to 100 points.</p>
<h2>Which signals matter most?</h2>
<p>Crawler access matters most, because a blocked page can never be cited. Answer placement and structured data follow, at 15 and 12 points respectively in the current rubric. Research from 2026 suggests that authorship and freshness together move citation likelihood by roughly 20% for informational queries.</p>
<p><a href="/about">About us</a> <a href="/contact">Contact</a></p>
</article>
</body></html>`;

export const BAD_PAGE = `<!DOCTYPE html><html><head><title>Home</title></head><body>
<div class="hero"><div><div><span>Welcome</span></div></div></div>
<div><h3>Stuff</h3><div>We are passionate about excellence and synergy. Our solutions empower stakeholders.</div></div>
<div><h1>One</h1></div><div><h1>Two</h1></div>
${'<div class="filler"><span>lorem ipsum filler text here</span></div>'.repeat(80)}
</body></html>`;

export const JS_SHELL = `<!DOCTYPE html><html><head><title>App</title></head><body>
<div id="root"></div>
<script src="/bundle.js"></script>
${"<script>var x = 1;</script>".repeat(50)}
</body></html>`;

export const ROBOTS_BLOCKING = `User-agent: GPTBot
Disallow: /

User-agent: ClaudeBot
Disallow: /

User-agent: *
Disallow: /admin
`;

export const ROBOTS_OPEN = `User-agent: *
Disallow: /admin
`;
