import { type PriceLookupError } from "~/types/grocery";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function getPriceLookupError(error: unknown): PriceLookupError | null {
  const message = getErrorMessage(error);
  const status =
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : null;

  const isRateLimit =
    status === 429 ||
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota");

  if (isRateLimit) {
    return {
      kind: "rate_limit",
      message:
        "You've hit the Gemini API free tier limit (20 requests per day). Your item was still added to your list. Try again later or upgrade your API plan.",
    };
  }

  if (message.includes("empty response")) {
    return {
      kind: "lookup_failed",
      message:
        "Gemini did not return a price lookup result. Your item was still added to your list.",
    };
  }

  return {
    kind: "lookup_failed",
    message:
      "Price lookup failed. Your item was still added to your list. Try again later.",
  };
}
