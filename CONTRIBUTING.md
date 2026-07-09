# Contributing to LLMScout

Thanks for helping make the web more quotable.

## Quick start

```bash
git clone https://github.com/A-Guidry/llmscout.git
cd llmscout
npm install
npm test
npm run dev -- https://example.com
```

## Adding or changing a check

1. Each check is one module in `src/core/checks/` implementing `CheckModule` (`{ id, label, what, rationale, fixability, run(ctx) }`), returning a 0–1 score plus findings with concrete fixes.
2. Register it in `src/core/checks/index.ts` and give it a weight in `src/core/weights.ts` — with a one-line justification comment.
3. Add tests in `test/checks.test.ts` (a good and a bad fixture case minimum).
4. Weight changes must be argued from observed citation behavior, not vibes — that honesty is the product.

## Ground rules

- `npm test` and `npm run lint` must pass (CI enforces both).
- No new runtime dependencies without discussion — `npx llmscout` cold-start time is a feature.
- Findings must be verifiable in the page source; no black-box scoring.

## Good first issues

Look for the `good-first-issue` label — typically new fixtures, better fix snippets, or robots.txt edge cases.
