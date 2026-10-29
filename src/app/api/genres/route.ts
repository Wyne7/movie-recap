import { jsonError } from "@/lib/http";
import { getGenres } from "@/lib/tmdb";

export async function GET() {
  try {
    const genres = await getGenres();
    return Response.json({ genres });
  } catch (error) {
    return jsonError(error);
  }
}
