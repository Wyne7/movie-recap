import type { MovieDossier, Moment, RecapLength, RecapType } from "./types";
import { momentsFromUnits, minuteEstimate, type PlotUnit, type PlotWindow } from "./spoiler";
import { firstSentence, trimWords, wordCount } from "./text";

function condense(units: PlotUnit[], maxWords: number): string {
  const full = units.map((unit) => unit.text).join(" ");
  if (wordCount(full) <= maxWords) return full;
  const stride = Math.max(1, Math.ceil(units.length / Math.max(3, Math.round(maxWords / 36))));
  const picked: string[] = [];
  for (let i = 0; i < units.length; i += stride) {
    picked.push(units[i].text);
    if (wordCount(picked.join(" ")) >= maxWords) break;
  }
  return trimWords(picked.join(" "), maxWords);
}

function beats(units: PlotUnit[], maxBeats: number, wordsPerBeat: number): string[] {
  if (units.length === 0) return [];
  const groups: PlotUnit[][] = [];
  if (units.length <= maxBeats) {
    for (const unit of units) groups.push([unit]);
  } else {
    const size = Math.ceil(units.length / maxBeats);
    for (let i = 0; i < units.length; i += size) {
      groups.push(units.slice(i, i + size));
    }
  }
  return groups.map((group) => trimWords(group.map((unit) => unit.text).join(" "), wordsPerBeat));
}

export function boundaryNote(
  type: RecapType,
  watchPercent: number,
  runtimeMinutes: number | null,
  hasPlot: boolean,
): string {
  const timing = minuteEstimate(watchPercent, runtimeMinutes);
  if (type === "spoiler-free") {
    return "This overview uses the public description and credits only. The plot source stays closed, wherever the slider sits. Studio overviews are usually written to avoid major spoilers, but that is not a guarantee.";
  }
  if (!hasPlot) {
    return "No plot text is available from the wired sources, so this cannot go past the public overview without inventing scenes.";
  }
  if (watchPercent <= 0) {
    return "The spoiler line is at the start, so the sourced plot stays closed.";
  }
  const reach =
    watchPercent >= 100
      ? "Your line is at the end of the film, so the full sourced plot is in play."
      : `Your line is at ${watchPercent}%. Later sourced scenes stay out.`;
  const approx =
    "Act markers and times are estimated from where a passage sits in the sourced plot, not from official timestamps.";
  return [reach, approx, timing].filter(Boolean).join(" ");
}

export function extractRecap(input: {
  movie: MovieDossier;
  type: RecapType;
  length: RecapLength;
  watchPercent: number;
  window: PlotWindow;
}): { recap: string; moments: Moment[]; boundaryNote: string } {
  const { movie, type, length, watchPercent, window } = input;
  const hasPlot = movie.plot.trim().length > 0;
  const note = boundaryNote(type, watchPercent, movie.runtimeMinutes, hasPlot);
  const momentCount = length === "quick" ? 2 : 3;

  if (type === "spoiler-free") {
    const overview = movie.overview.trim();
    const cast = movie.cast
      .slice(0, 5)
      .map((person) => `${person.name} as ${person.character}`)
      .join(", ");
    let recap = overview || "No public overview is available for this title.";
    if (length === "quick" && overview) recap = trimWords(overview, 80);
    if (length === "detailed") {
      const credits: string[] = [];
      if (movie.director) credits.push(`Directed by ${movie.director}.`);
      if (cast) credits.push(`People named in the credits: ${cast}.`);
      if (movie.genres.length > 0) credits.push(`Listed genres: ${movie.genres.join(", ")}.`);
      if (credits.length > 0) recap = `${recap}\n\n${credits.join(" ")}`;
    }
    const moments: Moment[] = overview
      ? [
          {
            label: "Public overview",
            text: firstSentence(overview),
            approximate: false,
          },
        ]
      : [];
    return {
      recap,
      moments,
      boundaryNote: boundaryNote(type, 0, movie.runtimeMinutes, false),
    };
  }

  if (window.allowed.length === 0) {
    const closed =
      input.window.totalChars === 0
        ? "There isn't a sourced plot for this title. The public overview is the only description on hand, and it is not a scene-by-scene recap."
        : "The spoiler line is at the start of the film, so the plot stays closed. Move it to the point you've watched, or switch to the spoiler-free overview.";
    const overview = movie.overview.trim();
    const recap = overview && input.window.totalChars === 0 ? `${closed}\n\nPublic overview: ${overview}` : closed;
    return {
      recap,
      moments: [],
      boundaryNote: note,
    };
  }

  if (type === "remind-me") {
    const lines = beats(window.allowed, length === "quick" ? 4 : 8, length === "quick" ? 36 : 70);
    const header =
      watchPercent < 100
        ? `What the sourced plot covers up to about ${watchPercent}%:`
        : "What the sourced plot covers through the end of the film:";
    const recap = [header, ...lines.map((line, index) => `${index + 1}. ${line}`)].join("\n");
    return {
      recap,
      moments: momentsFromUnits(window.allowed, momentCount, movie.runtimeMinutes),
      boundaryNote: note,
    };
  }

  const budget = length === "quick" ? 130 : 420;
  const body = condense(window.allowed, budget);
  const stop =
    watchPercent < 100
      ? `\n\nStopped at about ${watchPercent}% so later sourced scenes stay behind your line.`
      : "";
  return {
    recap: `${body}${stop}`,
    moments: momentsFromUnits(window.allowed, momentCount, movie.runtimeMinutes),
    boundaryNote: note,
  };
}

export function extractAnswer(focus: PlotUnit[], runtimeMinutes: number | null, length: RecapLength): {
  answer: string;
  moments: Moment[];
} {
  const budget = length === "quick" ? 90 : 180;
  const answer = `From the sourced plot, inside your spoiler line: ${condense(focus, budget)}`;
  return {
    answer,
    moments: momentsFromUnits(focus, length === "quick" ? 2 : 3, runtimeMinutes),
  };
}
