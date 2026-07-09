#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { scan, FetchError } from "../core/index.js";
import { renderResult, renderExplain } from "./render.js";

const program = new Command();

program
  .name("llmscout")
  .description(
    "AI answer-readiness scorer — find out if AI search can quote your page.",
  )
  .version("0.1.0");

program
  .argument("[url]", "page URL to score")
  .option("--json", "structured JSON output (stable schema for CI)")
  .option(
    "--min-score <n>",
    "exit non-zero when score is below threshold",
    parseFloat,
  )
  .option("--explain", "print every check, weight and rationale")
  .option("--only <ids>", "comma-separated check ids to run")
  .option("--skip <ids>", "comma-separated check ids to exclude")
  .option(
    "--timeout <ms>",
    "fetch timeout in milliseconds",
    (v) => parseInt(v, 10),
    15000,
  )
  .option("--user-agent <ua>", "override the fetch user agent")
  .option("--quiet", "score and top fixes only")
  .option("--verbose", "show all findings including passes")
  .option(
    "--fixes <n>",
    "number of prioritized fixes to show",
    (v) => parseInt(v, 10),
    3,
  )
  .option("-o, --output <file>", "write output to file instead of stdout")
  .action(async (url: string | undefined, opts) => {
    if (opts.explain) {
      process.stdout.write(renderExplain());
      return;
    }
    if (!url) {
      program.help();
      return;
    }
    try {
      const result = await scan(url, {
        timeoutMs: opts.timeout,
        userAgent: opts.userAgent,
        only: opts.only?.split(",").map((s: string) => s.trim()),
        skip: opts.skip?.split(",").map((s: string) => s.trim()),
        fixes: opts.fixes,
      });
      const text = opts.json
        ? JSON.stringify(result, null, 2) + "\n"
        : renderResult(result, { quiet: opts.quiet, verbose: opts.verbose });
      if (opts.output) writeFileSync(opts.output, text);
      else process.stdout.write(text);

      if (typeof opts.minScore === "number" && result.score < opts.minScore) {
        process.stderr.write(
          `\nScore ${result.score} is below --min-score ${opts.minScore}\n`,
        );
        process.exitCode = 1;
      }
    } catch (err) {
      if (err instanceof FetchError) {
        process.stderr.write(`\n  ✗ ${err.message}\n`);
        if (err.kind === "bad-url")
          process.stderr.write(
            "    Tip: pass a full URL like https://example.com/page\n",
          );
        if (err.kind === "timeout")
          process.stderr.write(
            "    Tip: raise --timeout, or the site may be blocking bots\n",
          );
        process.exitCode = 2;
      } else {
        process.stderr.write(
          `\n  ✗ Unexpected error: ${err instanceof Error ? err.message : String(err)}\n`,
        );
        process.exitCode = 2;
      }
    }
  });

program
  .command("serve")
  .description("serve the LLMScout web report UI")
  .option("-p, --port <n>", "port", (v) => parseInt(v, 10), 3000)
  .option("--host <host>", "bind host", "127.0.0.1")
  .action(async (opts) => {
    const { startServer } = await import("../web/server.js");
    await startServer({ port: opts.port, host: opts.host });
  });

program
  .command("key")
  .description(
    "check whether an LLM API key is configured (BYOK, for v1.1 AI narrative)",
  )
  .action(async () => {
    const { getLlmKey } = await import("../core/config.js");
    const info = getLlmKey();
    if (info) {
      const masked =
        info.key.length > 8
          ? `${info.key.slice(0, 4)}…${info.key.slice(-4)}`
          : "•••";
      process.stdout.write(`✓ LLM key found (${masked}) via ${info.source}\n`);
    } else {
      process.stdout.write(
        "✗ No LLM key found.\n  Add one with either:\n" +
          "    cp .env.example .env   # then paste your key into .env\n" +
          "    export LLMSCOUT_LLM_API_KEY=sk-…\n",
      );
      process.exitCode = 1;
    }
  });

program.parseAsync();
