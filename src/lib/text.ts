const STOP = new Set([
  "the",
  "and",
  "that",
  "this",
  "with",
  "from",
  "have",
  "has",
  "had",
  "for",
  "but",
  "you",
  "your",
  "about",
  "into",
  "when",
  "where",
  "which",
  "were",
  "was",
  "are",
  "been",
  "their",
  "them",
  "his",
  "her",
  "she",
  "he",
  "they",
  "its",
  "it's",
  "who",
  "what",
  "why",
  "how",
  "did",
  "does",
  "not",
  "out",
  "off",
  "over",
  "under",
  "after",
  "before",
  "while",
  "would",
  "could",
  "should",
  "there",
  "then",
  "than",
  "also",
  "just",
  "only",
  "into",
  "onto",
  "because",
  "through",
  "those",
  "these",
  "other",
  "another",
  "people",
  "something",
  "nothing",
  "without",
  "against",
  "between",
  "around",
  "still",
  "until",
  "again",
  "never",
  "every",
  "being",
  "where",
  "here",
  "film",
  "movie",
  "scene",
  "story",
]);

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function trimWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= max) return words.join(" ");
  return `${words.slice(0, max).join(" ")}…`;
}

export function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[\s\S]+?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

export function contentWords(text: string): string[] {
  return tokenize(text).filter((word) => word.length > 3 && !STOP.has(word));
}

export function queryWords(text: string): string[] {
  return tokenize(text).filter((word) => word.length > 2 && !STOP.has(word));
}

export function overlapRatio(text: string, corpus: string): number {
  const words = contentWords(text);
  if (words.length === 0) return 1;
  const pool = new Set(contentWords(corpus));
  let hits = 0;
  for (const word of words) {
    if (pool.has(word)) hits += 1;
  }
  return hits / words.length;
}

function contentTrigrams(text: string): string[] {
  const words = contentWords(text);
  const grams: string[] = [];
  for (let i = 0; i < words.length - 2; i += 1) {
    grams.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }
  return grams;
}

export function leaksExcluded(
  text: string,
  allowedCorpus: string,
  excluded: string,
): boolean {
  if (!excluded.trim() || !text.trim()) return false;
  const allowed = new Set(contentWords(allowedCorpus));
  const excludedWords = new Set(
    contentWords(excluded).filter((word) => word.length >= 6 && !allowed.has(word)),
  );
  const seen = new Set<string>();
  let rareHits = 0;
  for (const word of contentWords(text)) {
    if (excludedWords.has(word) && !seen.has(word)) {
      seen.add(word);
      rareHits += 1;
    }
  }
  if (rareHits >= 3) return true;

  const allowedGrams = new Set(contentTrigrams(allowedCorpus));
  const excludedGrams = new Set(contentTrigrams(excluded));
  let leakedGrams = 0;
  const seenGrams = new Set<string>();
  for (const gram of contentTrigrams(text)) {
    if (seenGrams.has(gram)) continue;
    seenGrams.add(gram);
    if (excludedGrams.has(gram) && !allowedGrams.has(gram)) leakedGrams += 1;
  }
  return leakedGrams >= 1;
}

export function plainText(text: string): string {
  return text.replace(/<[^>]+>/g, "").replace(/\s+\n/g, "\n").trim();
}

export function capText(text: string, maxChars: number): { text: string; trimmed: boolean } {
  if (text.length <= maxChars) return { text, trimmed: false };
  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxChars * 0.8 ? slice.slice(0, lastSpace) : slice;
  return { text: cut.trim(), trimmed: true };
}
