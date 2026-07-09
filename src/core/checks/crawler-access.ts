import type { CheckModule, Finding } from "../types.js";

export const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

interface RobotsGroup {
  agents: string[];
  disallow: string[];
  allow: string[];
}

export function parseRobots(txt: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (!current) continue;
      if (key === "disallow") current.disallow.push(val);
      if (key === "allow") current.allow.push(val);
    }
  }
  return groups;
}

/** Is `bot` blocked from `path` by this robots.txt? Most-specific group wins. */
export function botBlocked(txt: string, bot: string, path = "/"): boolean {
  const groups = parseRobots(txt);
  const botLc = bot.toLowerCase();
  let group = groups.find((g) =>
    g.agents.some((a) => a === botLc || (botLc.includes(a) && a !== "*")),
  );
  if (!group) group = groups.find((g) => g.agents.includes("*"));
  if (!group) return false;
  const matches = (rule: string) =>
    rule !== "" && path.startsWith(rule.replace(/\*.*$/, ""));
  const dis = group.disallow
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];
  const allow = group.allow
    .filter(matches)
    .sort((a, b) => b.length - a.length)[0];
  if (!dis) return false;
  if (allow && allow.length >= dis.length) return false;
  return true;
}

export const crawlerAccess: CheckModule = {
  id: "crawler-access",
  label: "AI crawler access",
  what: "Can AI bots fetch the page at all?",
  rationale:
    "Gate condition: a page that GPTBot, ClaudeBot or PerplexityBot cannot fetch can never be cited, regardless of quality. Highest weight in the rubric.",
  fixability: 1.0,
  run(ctx) {
    const findings: Finding[] = [];
    const path = (() => {
      try {
        return new URL(ctx.finalUrl).pathname || "/";
      } catch {
        return "/";
      }
    })();

    // meta robots noindex is a hard fail
    const metaRobots = ctx
      .$('meta[name="robots"], meta[name="googlebot"]')
      .map((_, el) => ctx.$(el).attr("content") ?? "")
      .get()
      .join(",")
      .toLowerCase();
    if (metaRobots.includes("noindex")) {
      findings.push({
        severity: "error",
        message:
          'Page carries meta robots "noindex" — it is invisible to every engine.',
        fix: "Remove the noindex directive (or confirm this page is intentionally private).",
      });
      return { score: 0, findings };
    }

    if (ctx.robotsTxt === null) {
      findings.push({
        severity: "pass",
        message:
          "No robots.txt found — all AI crawlers are allowed by default.",
      });
      return { score: 1, findings };
    }

    const blocked = AI_BOTS.filter((b) =>
      botBlocked(ctx.robotsTxt as string, b, path),
    );
    const allowed = AI_BOTS.filter((b) => !blocked.includes(b));
    if (blocked.length === 0) {
      findings.push({
        severity: "pass",
        message: `robots.txt allows ${AI_BOTS.join(", ")}.`,
      });
    } else {
      findings.push({
        severity: blocked.length >= 3 ? "error" : "warn",
        message: `robots.txt blocks ${blocked.join(", ")}${allowed.length ? ` (allows ${allowed.join(", ")})` : ""}.`,
        fix: "Allow the AI crawlers you want citations from in robots.txt.",
        snippet: blocked.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n"),
      });
    }
    return { score: allowed.length / AI_BOTS.length, findings };
  },
};
