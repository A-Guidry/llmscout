# How LLMScout Sets Its Weights

**Weights version 0.2 · July 2026 · every change to the weights is published here and in [`src/core/weights.ts`](src/core/weights.ts)**

LLMScout scores a page 0–100 across nine checks. Each check's weight reflects the strength of the evidence that the signal actually influences whether AI engines (ChatGPT, Claude, Perplexity, Google AI Overviews/Mode, Gemini) cite a page — not what's fashionable in SEO. Three kinds of evidence feed the weights, in descending order of trust: **controlled experiments**, **our own live citation tests**, and **large-scale correlational studies**.

## The weights and their evidence

| Weight | Check                         | Evidence strength                    | Basis                                                                                                                                                                                                                                                                                                |
| ------ | ----------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25     | AI crawler access             | **Strong (mechanical + replicated)** | A page a retrieval bot can't fetch can never be cited. The only signal that separated cited from non-cited pages positively in **both** of our live test rounds.                                                                                                                                     |
| 12     | Answer-first (BLUF)           | Weak–moderate                        | RAG systems retrieve self-contained passages (mechanism); correlational vendor data; no isolated causal study. Google says chunking is unnecessary _for its surfaces_.                                                                                                                               |
| 12     | Named-statistic density       | **Moderate–strong (causal)**         | The only peer-reviewed controlled experiment in this space found adding statistics, citations and quotations lifted generative visibility 30–41%.                                                                                                                                                    |
| 12     | Content-to-markup ratio (SSR) | **Strong (mechanical)**              | GPTBot, ClaudeBot and PerplexityBot execute **zero JavaScript** — client-rendered content is invisible to them.                                                                                                                                                                                      |
| 10     | Heading hierarchy             | Moderate                             | Extraction/chunking mechanism plus Google's own content-organization guidance.                                                                                                                                                                                                                       |
| 10     | Extractable Q&A               | Moderate (correlational)             | Q&A-shaped content dominates cited sources across large industry datasets (with a platform-licensing confound).                                                                                                                                                                                      |
| 9      | Author / E-E-A-T              | Weak                                 | Consistent with Google's people-first guidance; in our live tests, _markup-level_ authorship did not separate cited pages — engines reward institutional authority, which no on-page markup grants. Kept because bylines/dates are what a site can actually control.                                 |
| 8      | JSON-LD schema                | **Demoted (causal null)**            | The only controlled intervention test (1,885 pages adding schema vs 4,000 controls) found **no citation uplift**. The famous "cited pages are 3× more likely to have schema" is a well-maintained-site confound. Kept non-zero: machine-readability is free and non-Google engines remain unstudied. |
| 2      | llms.txt                      | **None (triple null)**               | Google: "no AI system currently uses llms.txt." Two independent large-N studies found zero citation effect. Scored for transparency only.                                                                                                                                                            |

## Published sources

1. **Aggarwal, Murahari et al., "GEO: Generative Engine Optimization"** — KDD 2024, arXiv:2311.09735 (Nov 2023, rev. Jun 2024). Controlled experiments on 10K queries incl. live Perplexity: citations/quotes/statistics +30–41% visibility; sites ranked #5 gained up to +115%; keyword stuffing null-to-negative. https://arxiv.org/abs/2311.09735
2. **Vercel + MERJ, "The Rise of the AI Crawler"** — Dec 17, 2024. Network-level measurement: no major AI crawler executes JavaScript (Gemini and AppleBot excepted, via Google/Apple rendering infra). https://vercel.com/blog/the-rise-of-the-ai-crawler
3. **Ahrefs, "We Tracked 1,885 Pages Adding Schema. AI Citations Barely Moved."** — May 2026. Controlled intervention: no citation uplift from newly added JSON-LD on any platform; AI Overviews −4.6% vs controls. https://ahrefs.com/blog/schema-ai-citations/
4. **Google Search Central, "Optimizing your website for generative AI features"** — May 15, 2026. Official guidance incl. mythbusting: no llms.txt, no special markup, no chunking, don't overfocus on structured data. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
5. **Google Search Central, "Top ways to ensure your content performs well in Google's AI experiences"** — May 2025. https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search
6. **John Mueller (Google)** — June 2025: "no AI system currently uses llms.txt." https://www.seroundtable.com/google-ai-llms-txt-39607.html
7. **SE Ranking, llms.txt study (300K domains)** — Nov 2025. No statistical relationship between llms.txt and AI citations; 1 of the 50 most-cited domains has one. https://seranking.com/blog/llms-txt/
8. **Ahrefs, AI Overview citation overlap studies** — Jul 2025 (76% of AIO citations from top-10) and 2026 re-analysis (~38%, methodology-adjusted). https://ahrefs.com/blog/ai-overview-citations-top-10/
9. **Profound, AI platform citation patterns (680M citations)** — 2025. ~11% domain overlap between ChatGPT and Perplexity citations; per-engine source profiles diverge sharply. https://www.tryprofound.com/blog/ai-platform-citation-patterns
10. **Semrush citation studies** — 2025. Reddit ≈40% of AI citations in sampled sets; >50% of cited Reddit content is Q&A-shaped; citation shares are volatile (ChatGPT's Reddit share fell 60%→10% in six weeks). https://www.semrush.com/blog/most-cited-domains-ai/
11. **Search Engine Land, Claude ↔ Brave Search** — Jun 2026. Claude citations match Brave's top organic results 86.7% of the time; ChatGPT↔Bing only 26.7%. https://searchengineland.com/claude-visibility-brave-search-rankings-480053

## Our own live tests (July 2026)

We ran real queries through Perplexity, ChatGPT (search) and Gemini, captured which pages each engine actually quoted, and scanned quoted pages plus same-query non-quoted competitors with LLMScout (n=13 round one; n=42 with per-query controls round two). What we learned — including what worked against us:

- **Crawler access** was the only check that separated cited from non-cited pages positively in both rounds. Its top weight is earned.
- **Engines diverge**: on the same query, same day, ChatGPT cited .gov/institutional sources, Gemini cited manufacturers, Perplexity cited encyclopedic and niche specialist pages — roughly one overlapping domain per pair. There is no single "AI search" to optimize for.
- **Schema separated negatively** in round two, independently agreeing with Ahrefs' causal null.
- **Domain authority beats on-page readiness**: engines cited major banks, hospitals and .gov pages that scored F on our rubric. LLMScout measures the on-page half you control; it predicts citations best **among comparable-authority sites competing on the same topic** — which is where most sites actually compete. No on-page score outranks a household name, and any tool claiming otherwise is selling something.
- We did **not** re-tune weights on round-two data (n=42 would be overfitting); we updated the methodology scope instead.

Known limitation: some WAF-protected sites block our scanner while commercial AI crawlers get through; v1.1 will report these checks as "unverifiable" rather than failing.

## Changelog

- **v0.2 (2026-07-09):** evidence-informed calibration. crawler-access 20→25, content-ratio 8→12, stat-density 10→12, answer-first 15→12, json-ld 12→8, eeat-signals 10→9, llms-txt 3→2. Added authority-scope caveat after round-two tests.
- **v0.1 (2026-07-08):** initial hypothesis weights.
