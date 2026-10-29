import { HttpError } from "./http";
import { sampleDossier } from "./sample-film";
import { getTmdbMovie, posterUrl } from "./tmdb";
import type { MovieDossier, PublicMovie } from "./types";
import { findWikipediaPlot } from "./wikipedia";

const cache = new Map<string, { at: number; dossier: MovieDossier }>();
const TTL_MS = 10 * 60 * 1000;

export function isMovieId(id: string): boolean {
  return id === "sample" || /^\d{1,10}$/.test(id);
}

export function toPublicMovie(movie: MovieDossier): PublicMovie {
  const plotChars = movie.plot.trim().length;
  return {
    id: movie.id,
    kind: movie.kind,
    title: movie.title,
    year: movie.year,
    runtimeMinutes: movie.runtimeMinutes,
    genres: movie.genres,
    overview: movie.overview,
    tagline: movie.tagline,
    posterUrl: movie.posterUrl,
    voteAverage: movie.voteAverage,
    director: movie.director,
    cast: movie.cast,
    tmdbUrl: movie.tmdbUrl,
    wikipedia: movie.wikipedia,
    plotOrigin: movie.plotOrigin,
    plotChars,
    thin: plotChars < 400,
    sourceWarning: movie.sourceWarning,
  };
}

async function loadTmdbDossier(id: string): Promise<MovieDossier> {
  const movie = await getTmdbMovie(id);
  const year = movie.release_date?.slice(0, 4) || null;
  const directors = (movie.credits?.crew ?? [])
    .filter((person) => person.job === "Director" && person.name)
    .map((person) => person.name as string)
    .slice(0, 2);
  const cast = (movie.credits?.cast ?? [])
    .filter((person) => person.name)
    .slice(0, 8)
    .map((person) => ({
      name: person.name as string,
      character: person.character?.trim() || "Unlisted role",
    }));

  let plot = "";
  let plotOrigin: MovieDossier["plotOrigin"] = "none";
  let wikipedia: MovieDossier["wikipedia"] = null;
  let sourceWarning: string | null = null;

  try {
    const found = await findWikipediaPlot({
      title: movie.title?.trim() || "Untitled",
      year,
      wikidataId: movie.external_ids?.wikidata_id ?? null,
    });
    if (found && found.plot.length >= 400) {
      plot = found.plot;
      plotOrigin = "wikipedia";
      wikipedia = { title: found.title, url: found.url, matchedVia: found.matchedVia };
    } else if (found) {
      plot = found.plot;
      plotOrigin = "wikipedia";
      wikipedia = { title: found.title, url: found.url, matchedVia: found.matchedVia };
      sourceWarning =
        "The Wikipedia plot section is only a short stub, so the recap stays conservative and will not fill the gaps.";
    } else {
      sourceWarning =
        "No English Wikipedia plot is linked for this title. Full recaps and answers stay inside the public overview instead of guessing the story.";
    }
  } catch {
    sourceWarning =
      "Wikipedia could not be reached. Full recaps and answers stay inside the public overview instead of guessing the story.";
  }

  return {
    id: String(movie.id),
    kind: "tmdb",
    title: movie.title?.trim() || "Untitled",
    year,
    runtimeMinutes: movie.runtime && movie.runtime > 0 ? movie.runtime : null,
    genres: (movie.genres ?? []).map((genre) => genre.name).filter(Boolean),
    overview: movie.overview?.trim() || "",
    tagline: movie.tagline?.trim() || null,
    posterUrl: posterUrl(movie.poster_path),
    voteAverage:
      movie.vote_average && movie.vote_average > 0 ? Math.round(movie.vote_average * 10) / 10 : null,
    director: directors.length > 0 ? directors.join(", ") : null,
    cast,
    tmdbUrl: `https://www.themoviedb.org/movie/${movie.id}`,
    wikipedia,
    plot,
    plotOrigin,
    sourceWarning,
  };
}

export async function getDossier(id: string): Promise<MovieDossier> {
  if (!isMovieId(id)) {
    throw new HttpError("That film id doesn't look right.", 400, "bad_id");
  }
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.dossier;
  const dossier = id === "sample" ? sampleDossier() : await loadTmdbDossier(id);
  cache.set(id, { at: Date.now(), dossier });
  return dossier;
}
