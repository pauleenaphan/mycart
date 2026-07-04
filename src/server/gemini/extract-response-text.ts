type GeminiPart = {
  text?: string;
  thought?: boolean;
};

type GeminiGenerateContentResponse = {
  text?: string;
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

export function extractResponseText(
  response: GeminiGenerateContentResponse,
): string | null {
  const direct = response.text?.trim();
  if (direct) {
    return direct;
  }

  const parts: string[] = [];

  for (const candidate of response.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const text = part.text?.trim();
      if (!text || part.thought) {
        continue;
      }
      parts.push(text);
    }
  }

  const joined = parts.join("\n").trim();
  return joined || null;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
