import { GoogleGenAI } from "@google/genai";

import { env } from "~/env";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!env.GOOGLE_GENAI_API_KEY) {
    throw new Error(
      "GOOGLE_GENAI_API_KEY is not set. Add it to your .env file.",
    );
  }

  client ??= new GoogleGenAI({ apiKey: env.GOOGLE_GENAI_API_KEY });
  return client;
}

export const GEMINI_MODEL = "gemini-2.5-flash";
