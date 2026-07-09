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

Weights live in one auditable file ([`src/core/weights.ts`](src/core/weights.ts)) and are **pre-calibration drafts**: hypotheses being validated against observed citation behavior on real pages. Notably, `llms.txt` is weighted at 3/100 because we haven't observed it moving citations yet — we keep signals honest rather than fashionable. Run `llmscout --explain` or see `/methodology` in the web UI.

## Development

```bash
npm install
npm test         # vitest
npm run build    # tsc → dist/
npm run dev -- https://example.com
```

MIT © Anthony Guidry / SCOAEONGEO
