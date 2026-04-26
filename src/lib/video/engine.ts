/**
 * Multi-provider anime video engine.
 *
 * Strategy: "best-of" — tries providers in priority order, falls back on failure.
 * Priority: Wan2.1 (best anime style) → Minimax (best expressions) → Kling (best camera).
 * Or use a specific provider via the `provider` option.
 */

import {
  generateWithWan21,
  generateWithMinimax,
  generateWithKling,
  type VideoGenerationInput,
  type VideoGenerationResult,
} from "./providers";

export type VideoProvider = "wan21" | "minimax" | "kling" | "auto";

interface EngineOptions extends VideoGenerationInput {
  provider?: VideoProvider;
  // When `provider === "auto"`, this hints the engine to TRY this provider
  // first but still fall back to the others if it fails. Use this for
  // style-preferred routing without losing the auto-fallback safety net.
  preferredFirst?: Exclude<VideoProvider, "auto">;
}

const PROVIDER_FNS = {
  wan21: generateWithWan21,
  minimax: generateWithMinimax,
  kling: generateWithKling,
} as const;

// Priority order for "auto" mode
// Kling first (most reliable), then Wan2.1 (best anime), then Minimax (best expressions)
const AUTO_PRIORITY: (keyof typeof PROVIDER_FNS)[] = [
  "kling",
  "wan21",
  "minimax",
];

function getEnabledProviders(): (keyof typeof PROVIDER_FNS)[] {
  const enabled: (keyof typeof PROVIDER_FNS)[] = [];

  // Wan2.1 and Minimax both use FAL_KEY
  if (process.env.FAL_KEY) {
    enabled.push("wan21", "minimax");
  }

  // Kling uses its own key
  if (process.env.KLING_API_KEY) {
    enabled.push("kling");
  }

  return enabled;
}

export async function generateAnimeVideo(
  options: EngineOptions,
): Promise<VideoGenerationResult> {
  const { provider = "auto", preferredFirst, ...input } = options;
  const enabled = getEnabledProviders();

  if (enabled.length === 0) {
    throw new Error(
      "No video providers configured. Set FAL_KEY for Wan2.1/Minimax or KLING_API_KEY for Kling.",
    );
  }

  // Specific provider requested
  if (provider !== "auto") {
    if (!enabled.includes(provider)) {
      throw new Error(
        `Provider "${provider}" not configured. Check your API keys.`,
      );
    }
    console.log(`[VideoEngine] Using ${provider} (explicit)`);
    return PROVIDER_FNS[provider](input);
  }

  // Auto mode: try each enabled provider in priority order. If the caller
  // hinted a preferred provider for this style (e.g. "wan21" for
  // flat-cartoon), reorder so it's tried FIRST — but still fall back to
  // the rest if it fails (e.g. Fal balance exhausted).
  const baseOrder = AUTO_PRIORITY.filter((p) => enabled.includes(p));
  const orderedProviders =
    preferredFirst && baseOrder.includes(preferredFirst)
      ? [preferredFirst, ...baseOrder.filter((p) => p !== preferredFirst)]
      : baseOrder;

  const errors: string[] = [];
  for (const name of orderedProviders) {
    try {
      console.log(`[VideoEngine] Trying ${name}...`);
      const result = await PROVIDER_FNS[name](input);
      console.log(`[VideoEngine] ${name} succeeded: ${result.videoUrl.slice(0, 80)}...`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[VideoEngine] ${name} failed: ${msg}`);
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(
    `All video providers failed:\n${errors.join("\n")}`,
  );
}

export { getEnabledProviders };
