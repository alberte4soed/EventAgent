/* Thin client for the Jina Reader API (https://r.jina.ai). */

const JINA_READER_URL = "https://r.jina.ai/";

export interface JinaReaderData {
  title?: string;
  description?: string;
  url?: string;
  content?: string;
  images?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface JinaReaderResponse {
  code: number;
  status?: number;
  data: JinaReaderData | null;
  message?: string;
}

export interface JinaReadOptions {
  url: string;
  apiKey: string;
  respondWith?: string;
  jsonSchema?: Record<string, unknown>;
  instruction?: string;
  engine?: "auto" | "browser" | "curl" | "cf-browser-rendering";
  timeout?: number;
  withImagesSummary?: boolean;
}

/** POST a URL to Jina Reader and return the parsed `data` payload. */
export async function readUrl(options: JinaReadOptions): Promise<JinaReaderData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), (options.timeout ?? 30) * 1000);

  try {
    const res = await fetch(JINA_READER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: options.url,
        respondWith: options.respondWith ?? "readerlm-v2",
        jsonSchema: options.jsonSchema,
        instruction: options.instruction,
        engine: options.engine ?? "browser",
        timeout: options.timeout ?? 30,
        withImagesSummary: options.withImagesSummary ?? true,
      }),
    });

    const body = (await res.json()) as JinaReaderResponse;
    if (!res.ok || body.code !== 200 || !body.data) return null;
    return body.data;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
