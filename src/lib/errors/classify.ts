/**
 * Classify upstream API errors into user-friendly categories so the UI can
 * show actionable guidance (e.g. "top up credits") instead of raw stacks.
 */

export type ErrorKind =
  | "anthropic_credits"
  | "leonardo_credits"
  | "fal_credits"
  | "elevenlabs_quota"
  | "rate_limit"
  | "auth"
  | "timeout"
  | "network"
  | "unknown";

export interface ClassifiedError {
  kind: ErrorKind;
  /** Short, actionable message for the user. */
  userMessage: string;
  /** A URL the user can click to fix the issue, if applicable. */
  actionUrl?: string;
  actionLabel?: string;
  /** Original raw message — kept so we can also log the full detail. */
  raw: string;
}

export function classifyError(input: unknown): ClassifiedError {
  const raw =
    input instanceof Error
      ? input.message
      : typeof input === "string"
        ? input
        : JSON.stringify(input);
  const lc = raw.toLowerCase();

  // Anthropic credits
  if (
    lc.includes("credit balance is too low") ||
    (lc.includes("anthropic") && lc.includes("credit"))
  ) {
    return {
      kind: "anthropic_credits",
      userMessage:
        "Your Claude API credits are exhausted. Top up at console.anthropic.com to keep generating concepts.",
      actionUrl: "https://console.anthropic.com/settings/billing",
      actionLabel: "Top up Claude credits",
      raw,
    };
  }

  // Leonardo credits
  if (
    lc.includes("leonardo") &&
    (lc.includes("credit") || lc.includes("token") || lc.includes("balance"))
  ) {
    return {
      kind: "leonardo_credits",
      userMessage:
        "Your Leonardo AI tokens are exhausted. Top up at app.leonardo.ai to keep generating images.",
      actionUrl: "https://app.leonardo.ai/account",
      actionLabel: "Top up Leonardo tokens",
      raw,
    };
  }

  // Fal credits / locked balance
  if (
    lc.includes("user is locked") ||
    (lc.includes("fal") && lc.includes("balance")) ||
    lc.includes("exhausted balance")
  ) {
    return {
      kind: "fal_credits",
      userMessage:
        "Your Fal.ai balance is exhausted. Add credits at fal.ai/dashboard. The system will fall back to Kling automatically once you retry.",
      actionUrl: "https://fal.ai/dashboard/billing",
      actionLabel: "Top up Fal.ai",
      raw,
    };
  }

  // ElevenLabs quota
  if (lc.includes("elevenlabs") && (lc.includes("quota") || lc.includes("limit"))) {
    return {
      kind: "elevenlabs_quota",
      userMessage:
        "ElevenLabs monthly quota reached. Voice narration is disabled until next reset.",
      actionUrl: "https://elevenlabs.io/app/subscription",
      actionLabel: "Manage ElevenLabs",
      raw,
    };
  }

  // Rate limit
  if (lc.includes("rate limit") || lc.includes("429") || lc.includes("too many requests")) {
    return {
      kind: "rate_limit",
      userMessage:
        "Hit a rate limit on the upstream provider. Wait 30-60 seconds and try again.",
      raw,
    };
  }

  // Auth
  if (
    lc.includes("401") ||
    lc.includes("unauthorized") ||
    lc.includes("invalid api key") ||
    lc.includes("authentication")
  ) {
    return {
      kind: "auth",
      userMessage:
        "An API key is invalid or missing. Check your Vercel environment variables.",
      actionUrl: "https://vercel.com/dashboard",
      actionLabel: "Open Vercel dashboard",
      raw,
    };
  }

  // Timeout
  if (lc.includes("timeout") || lc.includes("etimedout") || lc.includes("aborted")) {
    return {
      kind: "timeout",
      userMessage:
        "The request timed out. The upstream provider is slow or overloaded — try again.",
      raw,
    };
  }

  // Network
  if (
    lc.includes("fetch failed") ||
    lc.includes("network") ||
    lc.includes("econnrefused") ||
    lc.includes("enotfound")
  ) {
    return {
      kind: "network",
      userMessage:
        "Network error contacting the AI provider. Check your connection and try again.",
      raw,
    };
  }

  return {
    kind: "unknown",
    userMessage: raw || "Something went wrong. Try again.",
    raw,
  };
}
