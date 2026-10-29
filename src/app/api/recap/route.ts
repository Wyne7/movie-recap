import { getDossier } from "@/lib/dossier";
import { HttpError, jsonError } from "@/lib/http";
import { createRecap } from "@/lib/recap";
import { readRecapBody } from "@/lib/validate";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => {
      throw new HttpError("Send a JSON body.", 400, "bad_request");
    });
    const input = readRecapBody(body);
    const movie = await getDossier(input.movieId);
    const recap = await createRecap(movie, input.type, input.length, input.watchPercent);
    return Response.json(recap);
  } catch (error) {
    return jsonError(error);
  }
}
