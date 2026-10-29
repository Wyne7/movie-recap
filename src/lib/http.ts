export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function jsonError(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  const raw = error instanceof Error ? error.message : String(error);
  const cleaned = raw
    .replace(/api_key=[^&\s]+/gi, "api_key=redacted")
    .replace(/Bearer\s+\S+/gi, "Bearer redacted");
  console.error(cleaned);
  return Response.json(
    { error: "Something went wrong while reading sources.", code: "internal" },
    { status: 500 },
  );
}

const USER_AGENT = "UpToHere/0.1 (local movie recap prototype)";

export async function fetchJson(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<unknown> {
  const timeoutMs = init?.timeoutMs ?? 12000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": USER_AGENT,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const error = new Error(`Request failed (${response.status})`);
      (error as Error & { status: number }).status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
