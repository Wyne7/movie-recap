const DEFAULT_MODEL = "gpt-4o-mini";

export function llmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function llmModelName(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function parseModelJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : trimmed;
  return JSON.parse(body);
}

export async function completeJson(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = llmModelName();
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  try {
    const first = await post(base, key, { model, temperature: 0.2, response_format: { type: "json_object" }, messages });
    if (first.ok) return readContent(await first.json());
    if (first.status === 400) {
      const second = await post(base, key, { model, temperature: 0.2, messages });
      if (!second.ok) return null;
      return readContent(await second.json());
    }
    return null;
  } catch {
    return null;
  }
}

async function post(base: string, key: string, body: unknown): Promise<Response> {
  return fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

function readContent(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const choices = (payload as { choices?: { message?: { content?: unknown } }[] }).choices;
  const content = choices?.[0]?.message?.content;
  return typeof content === "string" && content.trim() ? content : null;
}
