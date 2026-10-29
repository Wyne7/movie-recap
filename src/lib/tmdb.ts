import { HttpError, fetchJson } from "./http";
import type { MovieSummary } from "./types";

const API = "https://api.themoviedb.org/3";
const IMAGE = "https://image.tmdb.org/t/p/w342";

type Genre = { id: number; name: string };

let genreCache: Genre[] | null = null;

export function tmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_API_KEY?.trim());
}

function requireKey(): string {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) {
    throw new HttpError(
      "Add TMDB_API_KEY to search live films. The sample film still works without it.",
      503,
      "tmdb_unconfigured",
    );
  }
  return key;
}

function isReadToken(key: string): boolean {
  return key.startsWith("ey");
}

async function tmdbGet(path: string, params: Record<string, string>): Promise<unknown> {
  const key = requireKey();
  const url = new URL(API + path);
  for (const [name, value] of Object.entries(params)) {
    if (value) url.searchParams.set(name, value);
  }
  if (!isReadToken(key)) url.searchParams.set("api_key", key);
  try {
    return await fetchJson(url.toString(), {
      headers: isReadToken(key) ? { authorization: `Bearer ${key}` } : {},
    });
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 401 || status === 403) {
      throw new HttpError("TMDB rejected the API key.", 401, "tmdb_unauthorized");
    }
    if (status === 404) {
      throw new HttpError("TMDB has no film with that id.", 404, "not_found");
    }
    if (status === 429) {
      throw new HttpError("TMDB is rate-limiting requests. Try again in a moment.", 429, "tmdb_rate_limit");
    }
    throw new HttpError("Could not reach TMDB.", 502, "tmdb_unreachable");
  }
}

export function posterUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${IMAGE}${path}`;
}

export async function getGenres(): Promise<Genre[]> {
  if (genreCache) return genreCache;
  const data = (await tmdbGet("/genre/movie/list", { language: "en-US" })) as {
    genres?: Genre[];
  };
  genreCache = Array.isArray(data.genres) ? data.genres : [];
  return genreCache;
}

type TmdbSearchMovie = {
  id: number;
  title?: string;
  release_date?: string;
  overview?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  vote_average?: number;
};

export async function searchMovies(input: {
  query: string;
  year: string | null;
  genreId: number | null;
}): Promise<MovieSummary[]> {
  const genres = await getGenres();
  const names = new Map(genres.map((genre) => [genre.id, genre.name]));
  const data = (await tmdbGet("/search/movie", {
    query: input.query,
    include_adult: "false",
    language: "en-US",
    page: "1",
    primary_release_year: input.year ?? "",
  })) as { results?: TmdbSearchMovie[] };
  const results = Array.isArray(data.results) ? data.results : [];
  return results
    .filter((movie) => (input.genreId ? movie.genre_ids?.includes(input.genreId) : true))
    .slice(0, 12)
    .map((movie) => ({
      id: String(movie.id),
      title: movie.title?.trim() || "Untitled",
      year: movie.release_date?.slice(0, 4) || null,
      overview: movie.overview?.trim() || "",
      posterUrl: posterUrl(movie.poster_path),
      genres: (movie.genre_ids ?? [])
        .map((id) => names.get(id))
        .filter((name): name is string => Boolean(name))
        .slice(0, 3),
      voteAverage: movie.vote_average && movie.vote_average > 0 ? Math.round(movie.vote_average * 10) / 10 : null,
    }));
}

export type TmdbMoviePayload = {
  id: number;
  title?: string;
  overview?: string;
  tagline?: string;
  runtime?: number | null;
  release_date?: string;
  poster_path?: string | null;
  vote_average?: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: { name?: string; character?: string; order?: number }[];
    crew?: { name?: string; job?: string }[];
  };
  external_ids?: { wikidata_id?: string | null };
};

export async function getTmdbMovie(id: string): Promise<TmdbMoviePayload> {
  const data = (await tmdbGet(`/movie/${id}`, {
    append_to_response: "credits,external_ids",
    language: "en-US",
  })) as TmdbMoviePayload;
  if (!data || typeof data.id !== "number") {
    throw new HttpError("TMDB returned an unexpected movie payload.", 502, "tmdb_payload");
  }
  return data;
}
