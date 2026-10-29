import type { Moment } from "./types";
import { trimWords } from "./text";

export type PlotUnit = {
  text: string;
  startRatio: number;
  endRatio: number;
};

export type PlotWindow = {
  units: PlotUnit[];
  allowed: PlotUnit[];
  excluded: PlotUnit[];
  allowedText: string;
  excludedText: string;
  totalChars: number;
  allowedChars: number;
};

function splitSentences(paragraph: string): string[] {
  const protectedText = paragraph
    .replace(/\b(Mr|Mrs|Ms|Dr|St|Sr|Jr|vs|Prof|Gen|Col|Sgt|Lt|Capt)\./g, "$1\u0000")
    .replace(/\b([A-Z])\./g, "$1\u0000");
  const parts = protectedText.split(/(?<=[.!?])\s+(?=[A-Z“"'])/);
  return parts
    .map((part) => part.replace(/\u0000/g, ".").trim())
    .filter((part) => part.length > 0);
}

export function plotUnits(plot: string): PlotUnit[] {
  const paragraphs = plot
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const sentences = paragraphs.flatMap((paragraph) => {
    const split = splitSentences(paragraph);
    return split.length > 0 ? split : [paragraph];
  });
  const total = sentences.reduce((sum, sentence) => sum + sentence.length, 0);
  if (total === 0) return [];
  let cursor = 0;
  return sentences.map((sentence) => {
    const startRatio = cursor / total;
    cursor += sentence.length;
    return {
      text: sentence,
      startRatio,
      endRatio: cursor / total,
    };
  });
}

export function slicePlot(plot: string, watchPercent: number): PlotWindow {
  const percent = clampPercent(watchPercent);
  const units = plotUnits(plot);
  const allowed =
    percent <= 0
      ? []
      : percent >= 100
        ? units
        : units.filter((unit) => unit.startRatio * 100 < percent - 1e-6);
  const allowedSet = new Set(allowed);
  const excluded = units.filter((unit) => !allowedSet.has(unit));
  const allowedText = allowed.map((unit) => unit.text).join(" ");
  const excludedText = excluded.map((unit) => unit.text).join(" ");
  const totalChars = units.reduce((sum, unit) => sum + unit.length, 0);
  return {
    units,
    allowed,
    excluded,
    allowedText,
    excludedText,
    totalChars,
    allowedChars: allowedText.length,
  };
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function momentLabel(startRatio: number, runtimeMinutes: number | null): string {
  const pct = Math.round(startRatio * 100);
  const act =
    pct < 20 ? "Opening" : pct < 45 ? "Act I" : pct < 70 ? "Act II" : pct < 88 ? "Late film" : "Ending stretch";
  if (runtimeMinutes && runtimeMinutes > 0) {
    const minute = Math.round(runtimeMinutes * startRatio);
    if (minute < 1) return `${act} · start of the sourced plot (approximate)`;
    return `${act} · ~${minute} min (approximate)`;
  }
  return `${act} · ~${pct}% in (approximate)`;
}

export function momentsFromUnits(
  units: PlotUnit[],
  count: number,
  runtimeMinutes: number | null,
): Moment[] {
  if (units.length === 0 || count <= 0) return [];
  const indexes = new Set<number>();
  if (count === 1 || units.length === 1) {
    indexes.add(0);
  } else {
    indexes.add(0);
    indexes.add(units.length - 1);
    if (count >= 3 && units.length > 2) {
      indexes.add(Math.floor((units.length - 1) / 2));
    }
  }
  return [...indexes]
    .sort((a, b) => a - b)
    .slice(0, count)
    .map((index) => {
      const unit = units[index];
      return {
        label: momentLabel(unit.startRatio, runtimeMinutes),
        text: trimWords(unit.text, 42),
        approximate: true,
      };
    });
}

export function minuteEstimate(watchPercent: number, runtimeMinutes: number | null): string | null {
  if (!runtimeMinutes || runtimeMinutes <= 0 || watchPercent <= 0) return null;
  const minute = Math.round((runtimeMinutes * watchPercent) / 100);
  return `If the sourced plot tracks the film evenly, ${watchPercent}% is about minute ${minute} of ${runtimeMinutes}. That mapping is approximate.`;
}
