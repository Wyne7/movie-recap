import { HttpError } from "./http";
import { clampPercent } from "./spoiler";
import { RECAP_LENGTHS, RECAP_TYPES, type RecapLength, type RecapType } from "./types";

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    throw new HttpError("Missing request body.", 400, "bad_request");
  }
  return body as Record<string, unknown>;
}

function movieId(value: unknown): string {
  const id = typeof value === "string" ? value : "";
  if (id !== "sample" && !/^\d{1,10}$/.test(id)) {
    throw new HttpError("Missing film.", 400, "bad_request");
  }
  return id;
}

export function readRecapBody(body: unknown): {
  movieId: string;
  type: RecapType;
  length: RecapLength;
  watchPercent: number;
} {
  const value = asRecord(body);
  const type = value.type;
  const length = value.length;
  if (!RECAP_TYPES.includes(type as RecapType)) {
    throw new HttpError("Choose a recap type.", 400, "bad_request");
  }
  if (!RECAP_LENGTHS.includes(length as RecapLength)) {
    throw new HttpError("Choose a length.", 400, "bad_request");
  }
  return {
    movieId: movieId(value.movieId),
    type: type as RecapType,
    length: length as RecapLength,
    watchPercent: clampPercent(Number(value.watchPercent)),
  };
}

export function readAskBody(body: unknown): {
  movieId: string;
  question: string;
  watchPercent: number;
  length: RecapLength;
} {
  const value = asRecord(body);
  const question = typeof value.question === "string" ? value.question.trim() : "";
  if (question.length < 2) {
    throw new HttpError("Ask a question about the film.", 400, "bad_request");
  }
  if (question.length > 400) {
    throw new HttpError("Keep the question under 400 characters.", 400, "bad_request");
  }
  const length = value.length;
  if (length !== undefined && !RECAP_LENGTHS.includes(length as RecapLength)) {
    throw new HttpError("Choose a length.", 400, "bad_request");
  }
  return {
    movieId: movieId(value.movieId),
    question,
    watchPercent: clampPercent(Number(value.watchPercent)),
    length: (RECAP_LENGTHS.includes(length as RecapLength) ? length : "detailed") as RecapLength,
  };
}
