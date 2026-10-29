import type { PlotUnit, PlotWindow } from "./spoiler";
import { queryWords } from "./text";

export type QuestionAssessment =
  | { action: "answer"; focus: PlotUnit[] }
  | { action: "block-spoiler" }
  | { action: "unanswered" };

const ENDING_INTENT =
  /\b(the ending|finale|final scene|last scene|how (?:does|did) it end|how it ends|what happens at the end|explain the end(?:ing)?|after the credits|the twist)\b/i;

const GENERIC =
  /^(what happened|what happens|what should i remember|remind me|catch me up|so far|what did i miss|who are the main (?:people|characters))\b/i;

function scoreUnit(questionWords: string[], unitText: string): number {
  if (questionWords.length === 0) return 0;
  const haystack = new Set(queryWords(unitText));
  let hits = 0;
  for (const word of questionWords) {
    if (haystack.has(word)) hits += 1;
  }
  return hits / questionWords.length;
}

function best(units: PlotUnit[], words: string[]): { unit: PlotUnit | null; score: number } {
  let winner: PlotUnit | null = null;
  let score = 0;
  for (const unit of units) {
    const next = scoreUnit(words, unit.text);
    if (next > score) {
      score = next;
      winner = unit;
    }
  }
  return { unit: winner, score };
}

function spread(units: PlotUnit[], count = 3): PlotUnit[] {
  if (units.length <= count) return units;
  const indexes = new Set<number>([0, units.length - 1, Math.floor((units.length - 1) / 2)]);
  return [...indexes].sort((a, b) => a - b).map((index) => units[index]);
}

export function assessQuestion(
  question: string,
  window: PlotWindow,
  watchPercent: number,
): QuestionAssessment {
  const trimmed = question.trim();
  const ending = ENDING_INTENT.test(trimmed);
  if (ending && watchPercent < 95 && window.units.length > 0) {
    return { action: "block-spoiler" };
  }
  if (window.allowed.length === 0) {
    return { action: "unanswered" };
  }
  if (ending && watchPercent >= 95) {
    const late = window.allowed.filter((unit) => unit.startRatio >= 0.72);
    return { action: "answer", focus: late.length > 0 ? late : window.allowed.slice(-3) };
  }
  if (GENERIC.test(trimmed)) {
    return { action: "answer", focus: spread(window.allowed) };
  }

  const words = queryWords(trimmed);
  if (words.length === 0) {
    return { action: "answer", focus: spread(window.allowed) };
  }

  const allowed = best(window.allowed, words);
  const excluded = best(window.excluded, words);
  if (excluded.score >= 0.45 && allowed.score < 0.34 && excluded.score > allowed.score + 0.2) {
    return { action: "block-spoiler" };
  }
  if (allowed.score < 0.34 || !allowed.unit) {
    return { action: "unanswered" };
  }

  const ranked = window.allowed
    .map((unit) => ({ unit, score: scoreUnit(words, unit.text) }))
    .filter((item) => item.score >= 0.34)
    .sort((a, b) => b.score - a.score || a.unit.startRatio - b.unit.startRatio)
    .slice(0, 3)
    .map((item) => item.unit)
    .sort((a, b) => a.startRatio - b.startRatio);

  return { action: "answer", focus: ranked.length > 0 ? ranked : [allowed.unit] };
}

export function spoilerLineMessage(watchPercent: number): string {
  if (watchPercent <= 0) {
    return "Your spoiler line is at the start of the film, so plot answers stay closed. Move the slider to the point you've watched.";
  }
  return `That's past your spoiler line. You're at ${watchPercent}%, so this stays inside the sourced plot up to that point. Move the slider forward if you want later scenes included.`;
}
