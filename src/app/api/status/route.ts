import { llmConfigured, llmModelName } from "@/lib/llm";
import { tmdbConfigured } from "@/lib/tmdb";

export async function GET() {
  return Response.json({
    tmdb: tmdbConfigured(),
    llm: llmConfigured(),
    model: llmModelName(),
  });
}
