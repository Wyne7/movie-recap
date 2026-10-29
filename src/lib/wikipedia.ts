import { fetchJson } from "./http";
import { stripWiki } from "./wiki-text";

const WIKI = "https://en.wikipedia.org/w/api.php";
const WIKIDATA = "https://www.wikidata.org/w/api.php";

type WikiSection = {
  line?: string;
  index?: string;
  toclevel?: number;
};

export type WikipediaPlot = {
  title: string;
  url: string;
  plot: string;
  matchedVia: "wikidata" | "search";
};

function wikiUrl(params: Record<string, string>): string {
  const url = new URL(WIKI);
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("redirects", "1");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

function articleUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function sectionIndex(sections: WikiSection[]): string | null {
  const clean = (value: string | undefined) =>
    (value ?? "")
      .replace(/<[^>]+>/g, "")
      .trim()
      .toLowerCase();
  const plot = sections.find((section) => clean(section.line) === "plot" && section.toclevel === 1);
  if (plot?.index) return plot.index;
  const synopsis = sections.find(
    (section) => clean(section.line) === "synopsis" && section.toclevel === 1,
  );
  if (synopsis?.index) return synopsis.index;
  const anyPlot = sections.find((section) => clean(section.line) === "plot");
  return anyPlot?.index ?? null;
}

async function plotFromTitle(title: string): Promise<{ title: string; plot: string } | null> {
  const sectionsPayload = (await fetchJson(
    wikiUrl({ action: "parse", page: title, prop: "sections" }),
  )) as { parse?: { title?: string; sections?: WikiSection[] } };
  const resolvedTitle = sectionsPayload.parse?.title || title;
  const index = sectionIndex(sectionsPayload.parse?.sections ?? []);
  if (!index) return null;
  const textPayload = (await fetchJson(
    wikiUrl({ action: "parse", page: resolvedTitle, prop: "wikitext", section: index }),
  )) as { parse?: { title?: string; wikitext?: string } };
  const raw = textPayload.parse?.wikitext;
  if (typeof raw !== "string") return null;
  const plot = stripWiki(raw);
  if (plot.length < 200) return null;
  return { title: textPayload.parse?.title || resolvedTitle, plot };
}

async function titleFromWikidata(wikidataId: string): Promise<string | null> {
  if (!/^Q\d+$/i.test(wikidataId)) return null;
  const url = new URL(WIKIDATA);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", wikidataId);
  url.searchParams.set("props", "sitelinks");
  url.searchParams.set("sitefilter", "enwiki");
  url.searchParams.set("format", "json");
  const payload = (await fetchJson(url.toString())) as {
    entities?: Record<string, { sitelinks?: { enwiki?: { title?: string } } }>;
  };
  return payload.entities?.[wikidataId]?.sitelinks?.enwiki?.title ?? null;
}

function scoreTitle(result: string, title: string, year: string | null): number {
  const candidate = result.toLowerCase();
  const wanted = title.toLowerCase();
  let score = 0;
  if (year && candidate === `${wanted} (${year} film)`) score += 100;
  if (year && candidate.includes(`(${year} film)`)) score += 40;
  if (candidate === `${wanted} (film)`) score += 50;
  if (candidate.includes("(film)")) score += 15;
  if (candidate.startsWith(wanted)) score += 10;
  if (candidate.includes("disambiguation")) score -= 40;
  if (/\((?:album|song|novel|book|tv series|series|episode)\)/.test(candidate)) score -= 30;
  return score;
}

async function searchTitles(title: string, year: string | null): Promise<string[]> {
  const query = year ? `${title} (${year} film)` : `${title} film`;
  const payload = (await fetchJson(
    wikiUrl({
      action: "query",
      list: "search",
      srsearch: query,
      srlimit: "5",
    }),
  )) as { query?: { search?: { title?: string }[] } };
  const titles = (payload.query?.search ?? [])
    .map((item) => item.title)
    .filter((item): item is string => Boolean(item));
  return titles.sort((a, b) => scoreTitle(b, title, year) - scoreTitle(a, title, year));
}

export async function findWikipediaPlot(input: {
  title: string;
  year: string | null;
  wikidataId: string | null;
}): Promise<WikipediaPlot | null> {
  try {
    if (input.wikidataId) {
      const linked = await titleFromWikidata(input.wikidataId);
      if (linked) {
        const plot = await plotFromTitle(linked);
        if (plot) {
          return {
            title: plot.title,
            url: articleUrl(plot.title),
            plot: plot.plot,
            matchedVia: "wikidata",
          };
        }
      }
    }
  } catch {
    // Search is the fallback when Wikidata or the linked article fails.
  }

  const titles = await searchTitles(input.title, input.year);
  for (const title of titles.slice(0, 3)) {
    if (scoreTitle(title, input.title, input.year) < 10) continue;
    const plot = await plotFromTitle(title);
    if (!plot) continue;
    return {
      title: plot.title,
      url: articleUrl(plot.title),
      plot: plot.plot,
      matchedVia: "search",
    };
  }
  return null;
}
