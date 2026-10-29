import { HttpError, jsonError } from "@/lib/http";
import { searchMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query")?.trim() ?? "";
    const yearRaw = url.searchParams.get("year")?.trim() ?? "";
    const genreRaw = url.searchParams.get("genre")?.trim() ?? "";
    if (query.length < 2) {
      throw new HttpError("Enter at least two letters of a title.", 400, "bad_query");
    }
    if (query.length > 120) {
      throw new HttpError("That title search is too long.", 400, "bad_query");
    }
    let year: string | null = null;
    if (yearRaw) {
      const yearNumber = Number(yearRaw);
      if (!/^\d{4}$/.test(yearRaw) || yearNumber < 1870 || yearNumber > 2035) {
        throw new HttpError("Year should be a four-digit year between 1870 and 2035.", 400, "bad_year");
      }
      year = yearRaw;
    }
    let genreId: number | null = null;
    if (genreRaw) {
      if (!/^\d{1,6}$/.test(genreRaw)) {
        throw new HttpError("Unknown genre.", 400, "bad_genre");
      }
      genreId = Number(genreRaw);
    }
    const results = await searchMovies({ query, year, genreId });
    const message =
      genreId && results.length === 0
        ? "Nothing on the first page of TMDB results matched that title and genre. Try clearing the genre."
        : null;
    return Response.json({ results, tmdb: true, message });
  } catch (error) {
    return jsonError(error);
  }
}
