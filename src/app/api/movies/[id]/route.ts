import { getDossier, toPublicMovie } from "@/lib/dossier";
import { jsonError } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const movie = await getDossier(id);
    return Response.json({ movie: toPublicMovie(movie) });
  } catch (error) {
    return jsonError(error);
  }
}
