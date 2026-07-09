import { describe, it, expect, afterEach } from "vitest";
import { parseDotEnv, getLlmKey } from "../src/core/config.js";

const CLEAR = ["LLMSCOUT_LLM_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY"];
const saved: Record<string, string | undefined> = {};
for (const k of CLEAR) saved[k] = process.env[k];

afterEach(() => {
  for (const k of CLEAR) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("parseDotEnv", () => {
  it("parses keys, quotes, and ignores comments", () => {
    const parsed = parseDotEnv(
      `# comment\nLLMSCOUT_LLM_API_KEY="sk-abc123"\nOPENAI_API_KEY=sk-plain\n\nBAD LINE\n`,
    );
    expect(parsed.LLMSCOUT_LLM_API_KEY).toBe("sk-abc123");
    expect(parsed.OPENAI_API_KEY).toBe("sk-plain");
    expect(Object.keys(parsed)).toHaveLength(2);
  });
});

describe("getLlmKey", () => {
  it("prefers LLMSCOUT_LLM_API_KEY from env", () => {
    for (const k of CLEAR) delete process.env[k];
    process.env.LLMSCOUT_LLM_API_KEY = "sk-test-1";
    process.env.OPENAI_API_KEY = "sk-test-2";
    const info = getLlmKey("/nonexistent");
    expect(info?.key).toBe("sk-test-1");
    expect(info?.source).toBe("env:LLMSCOUT_LLM_API_KEY");
  });
  it("returns null when nothing is configured", () => {
    for (const k of CLEAR) delete process.env[k];
    expect(getLlmKey("/nonexistent")).toBeNull();
  });
});
