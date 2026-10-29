export const RECAP_TYPES = ["spoiler-free", "full-plot", "remind-me"] as const;
export const RECAP_LENGTHS = ["quick", "detailed"] as const;

export type RecapType = (typeof RECAP_TYPES)[number];
export type RecapLength = (typeof RECAP_LENGTHS)[number];
export type PlotOrigin = "wikipedia" | "sample" | "none";
export type MovieKind = "tmdb" | "sample";
export type GenerationMode = "model" | "extract" | "guard";

export type CastMember = {
  name: string;
  character: string;
};

export type WikipediaRef = {
  title: string;
  url: string;
  matchedVia: "wikidata" | "search";
};

export type MovieDossier = {
  id: string;
  kind: MovieKind;
  title: string;
  year: string | null;
  runtimeMinutes: number | null;
  genres: string[];
  overview: string;
  tagline: string | null;
  posterUrl: string | null;
  voteAverage: number | null;
  director: string | null;
  cast: CastMember[];
  tmdbUrl: string | null;
  wikipedia: WikipediaRef | null;
  plot: string;
  plotOrigin: PlotOrigin;
  sourceWarning: string | null;
};

export type PublicMovie = {
  id: string;
  kind: MovieKind;
  title: string;
  year: string | null;
  runtimeMinutes: number | null;
  genres: string[];
  overview: string;
  tagline: string | null;
  posterUrl: string | null;
  voteAverage: number | null;
  director: string | null;
  cast: CastMember[];
  tmdbUrl: string | null;
  wikipedia: WikipediaRef | null;
  plotOrigin: PlotOrigin;
  plotChars: number;
  thin: boolean;
  sourceWarning: string | null;
};

export type MovieSummary = {
  id: string;
  title: string;
  year: string | null;
  overview: string;
  posterUrl: string | null;
  genres: string[];
  voteAverage: number | null;
};

export type Moment = {
  label: string;
  text: string;
  approximate: boolean;
};

export type SourceReport = {
  kind: MovieKind;
  plotOrigin: PlotOrigin;
  thin: boolean;
  wikipediaTitle: string | null;
  wikipediaUrl: string | null;
  wikipediaMatchedVia: "wikidata" | "search" | null;
  totalPlotChars: number;
  allowedPlotChars: number;
  watchPercent: number;
  generation: Exclude<GenerationMode, "guard">;
  generationNote: string;
  note: string;
  excerpt: string;
  timesAreApproximate: boolean;
};

export type RecapResponse = {
  recapType: RecapType;
  length: RecapLength;
  watchPercent: number;
  recap: string;
  moments: Moment[];
  boundaryNote: string;
  source: SourceReport;
};

export type AskResponse = {
  answer: string;
  blocked: boolean;
  watchPercent: number;
  moments: Moment[];
  generation: GenerationMode;
  note: string;
};

export type ServiceStatus = {
  tmdb: boolean;
  llm: boolean;
  model: string;
};
