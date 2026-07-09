/**
 * LLM API key loading (BYOK — bring your own key).
 * Used by the upcoming "why you're not cited" AI narrative (v1.1).
 * Sources, in priority order:
 *   1. LLMSCOUT_LLM_API_KEY env var
 *   2. ANTHROPIC_API_KEY / OPENAI_API_KEY env vars
 *   3. A .env file in the current working directory
 * The key never leaves your machine except in calls you make to your own LLM provider.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const KEY_VARS = [
  "LLMSCOUT_LLM_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
] as const;

export interface LlmKeyInfo {
  key: string;
  source: string;
}

/** Parse a minimal .env file (KEY=value lines, # comments, optional quotes). */
export function parseDotEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || m[1].startsWith("#")) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    )
      val = val.slice(1, -1);
    out[m[1]] = val;
  }
  return out;
}

export function getLlmKey(cwd = process.cwd()): LlmKeyInfo | null {
  for (const v of KEY_VARS) {
    const val = process.env[v];
    if (val) return { key: val, source: `env:${v}` };
  }
  const envPath = join(cwd, ".env");
  if (existsSync(envPath)) {
    try {
      const parsed = parseDotEnv(readFileSync(envPath, "utf8"));
      for (const v of KEY_VARS) {
        if (parsed[v]) return { key: parsed[v], source: `.env:${v}` };
      }
    } catch {
      /* unreadable .env is not fatal */
    }
  }
  return null;
}
