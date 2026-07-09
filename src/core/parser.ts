import * as cheerio from "cheerio";
import type { Heading, PageContext } from "./types.js";
import type { FetchedPage } from "./fetcher.js";

export function parsePage(
  page: FetchedPage,
  robotsTxt: string | null,
  llmsTxt: string | null,
): PageContext {
  const $ = cheerio.load(page.html);

  // JSON-LD first (before stripping scripts)
  const jsonLd: PageContext["jsonLd"] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text().trim();
    if (!raw) return;
    try {
      jsonLd.push({ raw, data: JSON.parse(raw) });
    } catch (e) {
      jsonLd.push({
        raw,
        data: null,
        error: e instanceof Error ? e.message : "invalid JSON",
      });
    }
  });

  const headings: Heading[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text) headings.push({ level: Number(el.tagName[1]), text });
  });

  // Visible text: clone body, drop non-content elements
  const $body = $("body").clone();
  $body.find("script, style, noscript, svg, template, iframe").remove();
  const text = $body.text().replace(/\s+/g, " ").trim();
  const words = text ? text.split(/\s+/) : [];

  return {
    url: page.url,
    finalUrl: page.finalUrl,
    html: page.html,
    $,
    text,
    words,
    headings,
    jsonLd,
    robotsTxt,
    llmsTxt,
    meta: {
      httpStatus: page.httpStatus,
      durationMs: page.durationMs,
      bytes: page.bytes,
      redirected: page.redirected,
      contentType: page.contentType,
    },
  };
}

/** Collect all @type values from parsed JSON-LD (handles @graph and arrays). */
export function jsonLdTypes(ctx: PageContext): string[] {
  const types: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      const t = o["@type"];
      if (typeof t === "string") types.push(t);
      if (Array.isArray(t))
        t.forEach((x) => typeof x === "string" && types.push(x));
      if (o["@graph"]) walk(o["@graph"]);
      if (o["mainEntity"]) walk(o["mainEntity"]);
    }
  };
  ctx.jsonLd.forEach((b) => b.data && walk(b.data));
  return types;
}

/** Find all JSON-LD nodes of a given @type. */
export function jsonLdNodes(
  ctx: PageContext,
  type: string,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      const t = o["@type"];
      if (t === type || (Array.isArray(t) && t.includes(type))) out.push(o);
      if (o["@graph"]) walk(o["@graph"]);
      if (o["mainEntity"]) walk(o["mainEntity"]);
    }
  };
  ctx.jsonLd.forEach((b) => b.data && walk(b.data));
  return out;
}
