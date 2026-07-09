/**
 * SSR templates — "Signal" design direction.
 * Server-rendered on purpose: LLMScout's own report pages must be AI-answer-ready.
 */
import type { ScanResult, CheckResult } from "../core/index.js";
import { ALL_CHECKS, WEIGHTS, GRADE_BANDS } from "../core/index.js";

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const STATUS = {
  pass: { label: "Pass", color: "#2E7D53", bg: "rgba(46,125,83,.14)" },
  warn: { label: "Warn", color: "#B4770F", bg: "rgba(180,119,15,.16)" },
  error: { label: "Fail", color: "#C43D2A", bg: "rgba(196,61,42,.14)" },
  info: { label: "Info", color: "#7A7A7A", bg: "rgba(120,120,120,.14)" },
} as const;

const gradeColor = (g: string) =>
  g[0] === "A" || g[0] === "B"
    ? "#2E7D53"
    : g[0] === "C"
      ? "#B4770F"
      : "#C43D2A";

function layout(title: string, description: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #E7ECF9; color: #0F1729; font-family: 'Figtree', sans-serif; }
  input, button, textarea { font-family: inherit; }
  a { color: #3B5BFF; text-decoration: none; }
  a:hover { opacity: .7; }
  ::placeholder { color: #9aa3bd; }
  pre { margin: 0; }
  summary { list-style: none; cursor: pointer; }
  summary::-webkit-details-marker { display: none; }
  h1,h2,h3 { font-family: 'Bricolage Grotesque', sans-serif; }
  .wrap { max-width: 1280px; margin: 0 auto; padding: 24px 24px 100px; }
  .panel { background: #F5F7FE; border-radius: 24px; box-shadow: 0 30px 60px -30px rgba(59,91,255,.4); padding: 22px; display: flex; flex-direction: column; gap: 18px; }
  .nav { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; flex-wrap: wrap; gap: 10px; }
  .brand { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: #0F1729; }
  .pill { padding: 9px 16px; border-radius: 20px; background: #fff; border: 1px solid #E4E9F7; color: #59617A; font-size: 14px; display: inline-block; }
  .pill.primary { background: #3B5BFF; color: #fff; font-weight: 600; border: none; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  @media (max-width: 900px) { .grid3 { grid-template-columns: 1fr; } .hero-flex { flex-direction: column; } }
</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>`;
}

function nav(right: string): string {
  return `<div class="nav"><a class="brand" href="/">LLMScout</a><div style="display:flex;gap:10px;align-items:center;">${right}</div></div>`;
}

export function landingPage(
  tickers: { site: string; grade: string }[] = [],
): string {
  const tickerHtml = tickers
    .map(
      (t) =>
        `<a href="/scan?url=${encodeURIComponent(t.site)}" style="display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #E4E9F7;padding:7px 14px;border-radius:20px;font-size:14px;color:#59617A;font-weight:500;">${esc(t.site)}<span style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;color:${gradeColor(t.grade)};">${esc(t.grade)}</span></a>`,
    )
    .join("");
  const body = `
<div class="panel">
  ${nav(`<a class="pill" href="/methodology">Methodology</a><a class="pill primary" href="https://github.com/A-Guidry/llmscout">GitHub</a>`)}
  <div style="border-radius:22px;background:linear-gradient(118deg,#3B5BFF 0%,#17C0E0 58%,#7A5BFF 100%);color:#fff;padding:72px 56px;">
    <span style="display:inline-block;background:rgba(255,255,255,.18);font-size:13px;font-weight:600;letter-spacing:.06em;padding:7px 14px;border-radius:20px;">AI answer-readiness scanner</span>
    <h1 style="font-weight:700;font-size:clamp(36px,5vw,62px);line-height:1.02;margin:22px 0 0;max-width:820px;letter-spacing:-.02em;">Find out if AI search can quote you.</h1>
    <p style="font-size:20px;line-height:1.5;color:rgba(255,255,255,.9);max-width:560px;margin:20px 0 0;">One page, one score, one prioritized to-do list. We check what ChatGPT, Claude and Perplexity actually reward.</p>
    <form action="/scan" method="get" style="display:flex;gap:8px;background:#fff;border-radius:999px;padding:8px;max-width:660px;margin:38px 0 0;">
      <input name="url" placeholder="https://example.com/page" required style="flex:1;border:none;outline:none;background:transparent;padding:14px 22px;font-size:17px;color:#0F1729;min-width:0;">
      <button type="submit" style="border:none;background:#FF6B4A;color:#fff;font-weight:700;font-size:16px;padding:14px 32px;border-radius:999px;cursor:pointer;">Scan free</button>
    </form>
    <p style="font-size:14px;color:rgba(255,255,255,.8);margin:16px 0 0;">No signup · shareable report · takes a few seconds</p>
  </div>
  ${tickers.length ? `<div style="display:flex;align-items:center;gap:14px;padding:12px 8px 4px;flex-wrap:wrap;"><span style="font-size:13px;font-weight:600;color:#8891a8;">Recently scanned</span>${tickerHtml}</div>` : ""}
</div>`;
  return layout(
    "LLMScout — Find out if AI search can quote you",
    "Free AI answer-readiness scanner. One page, one score, one prioritized fix list — based on what ChatGPT, Claude and Perplexity actually reward.",
    body,
  );
}

function checkCard(c: CheckResult): string {
  const s = STATUS[c.status];
  const note = c.findings[0]?.message ?? "";
  return `<div style="background:#fff;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;"><span style="font-size:15px;font-weight:700;line-height:1.2;">${esc(c.label)}</span><span style="background:${s.bg};color:${s.color};font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:4px 9px;border-radius:20px;flex:none;">${s.label}</span></div>
  <p style="font-size:13px;line-height:1.45;color:#8891a8;margin:0;flex:1;">${esc(note)}</p>
  <div style="height:7px;background:#EEF1FA;border-radius:99px;overflow:hidden;"><div style="height:100%;width:${Math.round(c.score * 100)}%;background:linear-gradient(90deg,#3B5BFF,#7A5BFF);border-radius:99px;"></div></div>
  <div style="display:flex;justify-content:space-between;font-size:12px;color:#8891a8;font-weight:600;"><span>weight ${c.weight}</span><span>${c.earned} pts earned</span></div>
</div>`;
}

export function reportPage(r: ScanResult): string {
  const deg = Math.round((r.score / 100) * 360);
  const host = (() => {
    try {
      return new URL(r.finalUrl).hostname;
    } catch {
      return r.finalUrl;
    }
  })();
  const statusChip =
    r.score >= 75
      ? { bg: "rgba(46,125,83,.14)", color: "#2E7D53" }
      : r.score >= 60
        ? { bg: "rgba(180,119,15,.14)", color: "#B4770F" }
        : { bg: "rgba(196,61,42,.14)", color: "#C43D2A" };

  const fixesHtml = r.topFixes
    .map(
      (
        f,
      ) => `<details style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:14px;overflow:hidden;"${f.rank === 1 ? " open" : ""}>
  <summary style="display:flex;align-items:center;gap:16px;padding:18px 22px;flex-wrap:wrap;">
    <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:20px;font-weight:800;color:#8FA6FF;">0${f.rank}</span>
    <span style="font-size:18px;font-weight:600;flex:1;min-width:200px;">${esc(f.title)}</span>
    <span style="background:linear-gradient(135deg,#3B5BFF,#7A5BFF);color:#fff;font-size:12px;font-weight:700;padding:5px 11px;border-radius:20px;">+${f.impactPts} pts</span>
    <span style="border:1px solid rgba(255,255,255,.3);color:#c9d0e2;font-size:12px;padding:5px 11px;border-radius:20px;">${f.ease}</span>
  </summary>
  <div style="padding:0 22px 22px 58px;">
    <p style="font-size:15px;line-height:1.55;color:#c9d0e2;margin:0;">${esc(f.body)}</p>
    ${
      f.snippet
        ? `<details style="margin-top:16px;border:1px solid rgba(255,255,255,.14);border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03);">
      <summary style="display:flex;align-items:center;gap:10px;padding:12px 16px;font-size:13px;font-weight:600;color:#8FA6FF;"><span style="display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;border:1px solid rgba(143,166,255,.5);border-radius:5px;font-family:'Space Mono',monospace;font-size:13px;line-height:1;">&lt;/&gt;</span>Advanced · show the code<span style="font-size:12px;font-weight:500;color:#6b7391;">copy-paste ready</span></summary>
      <pre style="background:rgba(0,0,0,.35);padding:16px;font-family:'Space Mono',monospace;font-size:13px;line-height:1.5;color:#a9e5c9;overflow:auto;">${esc(f.snippet)}</pre>
    </details>`
        : ""
    }
  </div>
</details>`,
    )
    .join("\n");

  const warningsHtml = r.warnings.length
    ? `<div style="background:rgba(180,119,15,.1);border:1px solid rgba(180,119,15,.3);border-radius:14px;padding:14px 20px;font-size:14px;color:#8a5c0c;">${r.warnings.map((w) => `⚠ ${esc(w)}`).join("<br>")}</div>`
    : "";

  const body = `
<div class="panel">
  ${nav(`<a class="pill" href="/scan.json?url=${encodeURIComponent(r.finalUrl)}">JSON</a><a class="pill" href="/methodology">Methodology</a><a class="pill primary" href="/">Scan another</a>`)}

  <div class="hero-flex" style="background:#fff;border-radius:20px;padding:44px 48px;display:flex;align-items:center;gap:48px;">
    <div style="width:210px;height:210px;flex:none;border-radius:50%;background:conic-gradient(from -90deg,#3B5BFF 0deg,#7A5BFF ${deg}deg,#E4E9F7 ${deg}deg 360deg);display:flex;align-items:center;justify-content:center;">
      <div style="width:160px;height:160px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:72px;font-weight:800;line-height:.9;background:linear-gradient(135deg,#3B5BFF,#7A5BFF);-webkit-background-clip:text;background-clip:text;color:transparent;">${esc(r.grade)}</span>
        <span style="font-size:14px;color:#8891a8;font-weight:600;">${r.score} / 100</span>
      </div>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><h1 style="font-size:34px;font-weight:700;margin:0;overflow-wrap:anywhere;">${esc(host)}</h1><span style="background:${statusChip.bg};color:${statusChip.color};font-size:13px;font-weight:700;padding:5px 11px;border-radius:20px;">${esc(r.gradeLabel)}</span></div>
      <div style="font-size:13px;color:#8891a8;margin:8px 0 16px;">Scanned ${new Date(r.fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${r.meta.httpStatus} OK · ${r.meta.durationMs}ms · ${(r.meta.bytes / 1024).toFixed(0)} KB · <a href="${esc(r.finalUrl)}" rel="nofollow">${esc(r.finalUrl.slice(0, 80))}</a></div>
      <p style="font-size:19px;line-height:1.55;color:#3a4358;margin:0;max-width:600px;">${esc(r.summary)}</p>
    </div>
  </div>

  ${warningsHtml}

  <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;">
    <h2 style="font-size:22px;font-weight:700;margin:0;">Category breakdown</h2>
  </div>
  <div class="grid3">
    ${r.checks.map(checkCard).join("\n")}
  </div>

  ${
    r.topFixes.length
      ? `<div style="background:#0F1729;border-radius:20px;padding:40px 44px;color:#fff;margin-top:4px;">
    <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;"><h2 style="font-size:26px;font-weight:700;margin:0;">Fix these ${r.topFixes.length} first</h2><span style="font-size:14px;color:#8891a8;">tap to expand · sorted by impact</span></div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-top:20px;">${fixesHtml}</div>
  </div>`
      : ""
  }

  <div style="border-radius:20px;background:linear-gradient(118deg,#3B5BFF,#7A5BFF);color:#fff;padding:40px 44px;display:flex;justify-content:space-between;align-items:center;gap:40px;flex-wrap:wrap;">
    <div style="max-width:600px;"><div style="font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:700;">Auditing a whole site?</div><p style="font-size:16px;color:rgba(255,255,255,.9);margin:8px 0 0;">Batch mode scores every page and rolls it into one agency-ready summary.</p></div>
    <a href="/scan.json?url=${encodeURIComponent(r.finalUrl)}" download="llmscout-report.json" style="background:#fff;color:#3B5BFF;font-weight:700;font-size:15px;padding:15px 26px;border-radius:999px;">Download JSON</a>
  </div>
</div>`;
  return layout(
    `${host} scores ${r.score}/100 (${r.grade}) — LLMScout AI answer-readiness report`,
    `${host} is ${r.gradeLabel.toLowerCase()} for AI search: ${r.score}/100. ${r.summary}`,
    body,
  );
}

export function methodologyPage(): string {
  const maxW = Math.max(...Object.values(WEIGHTS));
  const rows = ALL_CHECKS.map((m) => {
    const w = WEIGHTS[m.id] ?? 0;
    return `<div style="display:grid;grid-template-columns:1fr 54px 150px;gap:16px;align-items:center;padding:12px 0;border-top:1px solid #EEF1FA;">
    <div><div style="font-size:15px;font-weight:700;">${esc(m.label)}</div><div style="font-size:12.5px;color:#8891a8;margin-top:1px;">${esc(m.what)}</div></div>
    <div style="font-family:'Space Mono',monospace;font-size:15px;font-weight:700;color:#3B5BFF;">${w}</div>
    <div style="height:8px;background:#EEF1FA;border-radius:99px;overflow:hidden;"><div style="height:100%;width:${Math.round((w / maxW) * 100)}%;background:linear-gradient(90deg,#3B5BFF,#7A5BFF);border-radius:99px;"></div></div>
  </div>
  <p style="font-size:13px;line-height:1.5;color:#59617A;margin:2px 0 10px;">${esc(m.rationale)}</p>`;
  }).join("\n");

  const bandColors: Record<string, string> = {
    A: "#4ADE80",
    B: "#8FA6FF",
    C: "#FBBF24",
    D: "#FB923C",
    F: "#F87171",
  };
  const bands = GRADE_BANDS.map(
    (
      b,
    ) => `<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-top:1px solid rgba(255,255,255,.1);">
    <span style="font-family:'Bricolage Grotesque',sans-serif;font-size:26px;font-weight:800;width:44px;color:${bandColors[b.grade]};">${b.grade}</span>
    <div style="flex:1;"><div style="font-size:14px;font-weight:600;">${b.label}</div><div style="font-size:12.5px;color:#8891a8;">${b.min}–${b.min === 90 ? 100 : ""} · ${b.blurb}</div></div>
  </div>`,
  ).join("\n");

  const steps = [
    {
      n: "STEP 1",
      title: "Fetch as a bot",
      body: "We request the page the way an AI crawler would — no JavaScript execution — and check whether we even get in.",
    },
    {
      n: "STEP 2",
      title: "Parse the raw HTML",
      body: "Headings, schema, dates, authorship and text are pulled straight from source, not a rendered screenshot.",
    },
    {
      n: "STEP 3",
      title: "Score each check",
      body: "Every check returns a 0–1 quality score, multiplied by its weight. Nothing is subjective or model-guessed.",
    },
    {
      n: "STEP 4",
      title: "Rank the fixes",
      body: "We sort gaps by impact × effort so the top of your list is always the fastest route to a higher grade.",
    },
  ]
    .map(
      (s) => `<div style="border-radius:16px;background:#F5F7FE;padding:22px;">
    <div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:#3B5BFF;">${s.n}</div>
    <div style="font-size:16px;font-weight:700;margin:10px 0 6px;">${s.title}</div>
    <p style="font-size:13.5px;line-height:1.5;color:#8891a8;margin:0;">${s.body}</p>
  </div>`,
    )
    .join("\n");

  const body = `
<div class="panel">
  ${nav(`<a class="pill" href="https://github.com/A-Guidry/llmscout">GitHub</a><a class="pill primary" href="/">Scan a page</a>`)}
  <div style="border-radius:20px;background:linear-gradient(118deg,#3B5BFF 0%,#17C0E0 58%,#7A5BFF 100%);color:#fff;padding:52px 48px;">
    <span style="display:inline-block;background:rgba(255,255,255,.18);font-size:13px;font-weight:600;letter-spacing:.06em;padding:7px 14px;border-radius:20px;">How the score works</span>
    <h1 style="font-weight:700;font-size:clamp(32px,4vw,46px);line-height:1.04;margin:20px 0 0;max-width:760px;letter-spacing:-.02em;">Nine checks, weighted to 100. Nothing secret.</h1>
    <p style="font-size:19px;line-height:1.5;color:rgba(255,255,255,.9);max-width:640px;margin:18px 0 0;">Weights v0.2 (July 2026) are grounded in the published evidence — the GEO paper (KDD 2024), Ahrefs' schema intervention test (May 2026), the Vercel/MERJ crawler study (Dec 2024), Google's generative-AI guidance (May 2026), the SE Ranking llms.txt null result (Nov 2025) — plus our own quoted-vs-control citation tests. We publish every change, including the signals that turned out not to matter.</p>
  </div>
  <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;" class="grid-methodology">
    <div style="background:#fff;border-radius:20px;padding:32px 36px;">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 6px;">The 9 checks &amp; their weight</h2>
      <p style="font-size:14px;color:#8891a8;margin:0 0 18px;">Each check earns a fraction of its weight based on how well the page performs. Weights are normalized to a 0–100 score.</p>
      ${rows}
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;">
      <div style="background:#0F1729;color:#fff;border-radius:20px;padding:28px 30px;">
        <h2 style="font-size:19px;font-weight:700;margin:0 0 16px;">Grade bands</h2>
        ${bands}
      </div>
      <div style="background:#fff;border-radius:20px;padding:28px 30px;">
        <h2 style="font-size:19px;font-weight:700;margin:0 0 10px;">What we don't do</h2>
        <p style="font-size:14.5px;line-height:1.55;color:#59617A;margin:0;">No keyword stuffing advice, no backlink games, no black-box AI score. We only report signals you can verify in your own page source — and we show you exactly where each one came from.</p>
        <h2 style="font-size:19px;font-weight:700;margin:18px 0 10px;">What the score can't measure</h2>
        <p style="font-size:14.5px;line-height:1.55;color:#59617A;margin:0;">Domain authority. In our live tests, engines cited major banks, hospitals and .gov sites even when their on-page readiness scored an F. LLMScout measures the on-page half you control; it predicts citations best among comparable-authority sites competing on the same topic — which is exactly where most sites compete.</p>
      </div>
    </div>
  </div>
  <div style="background:#fff;border-radius:20px;padding:32px 36px;">
    <h2 style="font-size:22px;font-weight:700;margin:0 0 20px;">How a scan runs</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;" class="grid3">${steps}</div>
  </div>
</div>`;
  return layout(
    "LLMScout methodology — nine checks, weighted to 100, nothing secret",
    "How LLMScout scores AI answer-readiness: the nine checks, their weights, the grade bands, and the honest rationale behind each — including which popular signals carry little weight.",
    body,
  );
}

export function errorPage(message: string, hint?: string): string {
  const body = `
<div class="panel">
  ${nav(`<a class="pill primary" href="/">Scan a page</a>`)}
  <div style="background:#fff;border-radius:20px;padding:64px 48px;text-align:center;">
    <div style="font-size:44px;">🛰️</div>
    <h1 style="font-size:30px;margin:14px 0 8px;">That scan didn't make it back.</h1>
    <p style="font-size:16px;color:#59617A;max-width:520px;margin:0 auto;">${esc(message)}</p>
    ${hint ? `<p style="font-size:14px;color:#8891a8;max-width:520px;margin:10px auto 0;">${esc(hint)}</p>` : ""}
    <form action="/scan" method="get" style="display:flex;gap:8px;background:#F5F7FE;border:1px solid #E4E9F7;border-radius:999px;padding:8px;max-width:520px;margin:28px auto 0;">
      <input name="url" placeholder="https://example.com/page" required style="flex:1;border:none;outline:none;background:transparent;padding:12px 20px;font-size:15px;color:#0F1729;min-width:0;">
      <button type="submit" style="border:none;background:#FF6B4A;color:#fff;font-weight:700;font-size:15px;padding:12px 26px;border-radius:999px;cursor:pointer;">Try again</button>
    </form>
  </div>
</div>`;
  return layout(
    "Scan failed — LLMScout",
    "The scan could not be completed.",
    body,
  );
}
