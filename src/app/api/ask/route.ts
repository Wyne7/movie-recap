import { answerQuestion } from "@/lib/answer";
import { getDossier } from "@/lib/dossier";
import { HttpError, jsonError } from "@/lib/http";
import { readAskBody } from "@/lib/validate";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => {
      throw new HttpError("Send a JSON body.", 400, "bad_request");
    });
    const input = readAskBody(body);
    const movie = await getDossier(input.movieId);
    const answer = await answerQuestion(movie, input.question, input.watchPercent, input.length);
    return Response.json(answer);
  } catch (error) {
    return jsonError(error);
  }
}