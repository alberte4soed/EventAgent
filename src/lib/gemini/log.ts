import { ApiError } from "@google/genai";
import type { Content, Part } from "@google/genai";

/** Structured server-side error log for Gemini / agent debugging. */
export function logAgentError(
  tag: string,
  err: unknown,
  context?: Record<string, unknown>
): void {
  const entry: Record<string, unknown> = { ...context };

  if (err instanceof ApiError) {
    entry.status = err.status;
    entry.message = err.message;
  } else if (err instanceof Error) {
    entry.message = err.message;
    entry.stack = err.stack;
  } else {
    entry.message = String(err);
  }

  console.error(`[${tag}]`, entry);
}

/** Summarize conversation contents without logging full message text. */
export function summarizeContents(contents: Content[]): {
  length: number;
  roles: string[];
  functionCalls: { index: number; name?: string; hasThoughtSignature: boolean }[];
} {
  const functionCalls: { index: number; name?: string; hasThoughtSignature: boolean }[] = [];
  contents.forEach((content, index) => {
    for (const part of content.parts ?? []) {
      if (part.functionCall) {
        functionCalls.push({
          index,
          name: part.functionCall.name,
          hasThoughtSignature: Boolean(part.thoughtSignature),
        });
      }
    }
  });
  return {
    length: contents.length,
    roles: contents.map((c) => c.role ?? "?"),
    functionCalls,
  };
}

export function summarizeFunctionCallParts(parts: Part[] | undefined): {
  names: (string | undefined)[];
  hasThoughtSignature: boolean[];
} {
  const names: (string | undefined)[] = [];
  const hasThoughtSignature: boolean[] = [];
  for (const part of parts ?? []) {
    if (part.functionCall) {
      names.push(part.functionCall.name);
      hasThoughtSignature.push(Boolean(part.thoughtSignature));
    }
  }
  return { names, hasThoughtSignature };
}
