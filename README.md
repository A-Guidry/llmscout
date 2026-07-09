# LLMScout

**Find out if AI search can quote you.** One page, one score, one prioritized to-do list — based on what ChatGPT, Claude and Perplexity actually reward.

```bash
npx llmscout https://example.com/page
```

## What it is

LLMScout scores a page's **AI answer-readiness** from 0–100 across nine checks: AI crawler access, answer-first structure, JSON-LD schema, heading hierarchy, author/E-E-A-T signals, extractable Q&A, named-statistic density, content-to-markup ratio, and llms.txt. Every finding comes with a concrete fix, ranked by impact × ease.

## What it is NOT

Not a rank tracker, not a monitoring platform, not a full SEO audit. It scores one thing: whether an AI engine that fetches your page can extract and cite an answer from it.

## Usage

```bash
llmscout <url>                     # human-readable report
llmscout <url> --json              # stable JSON (CI/programmatic)
llmscout <url> --min-score 75      # exit 1 below threshold (CI gate)
llmscout --explain                 # every check, weight and rationale
llmscout <url> --only json-ld,eeat-signals
llmscout <url> --fixes 5 --verbose
llmscout serve --port 3000         # local web report UI
```

Exit codes: `0` ok · `1` below `--min-score` · `2` fetch/URL error.

## One-click local web UI

Double-click **`scripts/start-llmscout.command`** (macOS). It installs dependencies on first run, builds, starts the server, and opens your browser at `http://127.0.0.1:3000` automatically. Or from the terminal:

```bash
npm start
```

## Add your LLM API key (optional, BYOK)

The upcoming AI narrative feature ("why you're not cited", v1.1) uses your own LLM key. Setup is two steps:

```bash
cp .env.example .env     # 1. create your local env file
# 2. open .env and paste your key:
#    LLMSCOUT_LLM_API_KEY=sk-...
```

Anthropic and OpenAI keys also work via their standard variables (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY`), either in `.env` or exported in your shell. Verify with:

```bash
llmscout key   # → ✓ LLM key found (sk-a…f3k2) via .env:LLMSCOUT_LLM_API_KEY
```

`.env` is gitignored — the key stays on your machine and is only ever sent to your own LLM provider.

## Methodology — honest by design

Weights live in one auditable file ([`src/core/weights.ts`](src/core/weights.ts)) and are **evidence-informed (v0.2, July 2026)**: each weight is tied to published research and to our own live citation tests. The full rationale, evidence table, and citation list are in [`METHODOLOGY.md`](METHODOLOGY.md). The short version of how weights are set:

- **Controlled experiments outrank correlations.** Three exist publicly: the GEO paper (KDD 2024 — adding statistics/citations/quotes lifted generative visibility 30–41%), Ahrefs' schema intervention test (May 2026 — newly added JSON-LD produced **no** citation uplift, so we weight schema at just 8), and the Vercel/MERJ crawler study (Dec 2024 — GPTBot/ClaudeBot/PerplexityBot execute zero JavaScript, so server-rendered content weighs 12).
- **We test our own tool against reality.** We run real queries through Perplexity, ChatGPT and Gemini, capture what they actually cite, and scan cited vs non-cited pages. Crawler access was the only signal positive in both test rounds — hence its top weight (25).
- **Nulls get weighted like nulls.** llms.txt sits at 2/100: Google says no AI system uses it, and two independent large-N studies (SE Ranking 300K domains, Trakkr 38K) found zero citation effect.
- **We publish what the score can't do.** Engines cite high-authority domains even when their on-page readiness scores an F (we watched Perplexity cite a bank page we score 31/100). LLMScout predicts citations among comparable-authority sites competing on the same topic — the on-page half you control.

Run `llmscout --explain` or see `/methodology` in the web UI for the same information.

## Development

```bash
npm install
npm test         # vitest
npm run build    # tsc → dist/
npm run dev -- https://example.com
```

MIT © Anthony Guidry / SCOAEONGEO
