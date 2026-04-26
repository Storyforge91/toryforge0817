/**
 * Animation style + motion fluidity presets.
 *
 * The user picks a style (what it looks like) and a fluidity (how it moves).
 * The API route composes a prompt from these two presets + the per-beat
 * motion description, and routes to the best-fit provider.
 */

import type { VideoProvider } from "./engine";

export type AnimationStyle =
  | "flat-cartoon"
  | "anime"
  | "storybook"
  | "cinematic";

export type MotionFluidity = "limited" | "smooth" | "mixed";

interface StyleConfig {
  label: string;
  description: string;
  promptPrefix: string;
  // The provider that produces the best results for this style. The API
  // route uses this when `provider === "auto"` to override the default
  // priority order.
  preferredProvider: Exclude<VideoProvider, "auto">;
}

interface FluidityConfig {
  label: string;
  description: string;
  promptHint: string;
}

export const ANIMATION_STYLES: Record<AnimationStyle, StyleConfig> = {
  "flat-cartoon": {
    label: "Flat 2D Cartoon",
    description:
      "Bold black outlines, flat colors, expressive pose changes. Primax / Humor Animations style.",
    promptPrefix:
      "2D cartoon animation, bold black outlines, flat colors, expressive pose changes, animated webcomic style, simple backgrounds, no shading gradients.",
    preferredProvider: "wan21",
  },
  anime: {
    label: "Anime",
    description:
      "Cel-shaded anime / manga look with soft shading and dynamic camera.",
    promptPrefix:
      "anime cel-shaded animation, soft shading, dynamic camera, expressive eyes, manga style, vibrant colors.",
    preferredProvider: "wan21",
  },
  storybook: {
    label: "Storybook",
    description: "Painted illustration with soft brushwork and gentle motion.",
    promptPrefix:
      "painted illustration style, soft brushwork, gentle motion, watercolor textures, storybook art.",
    preferredProvider: "minimax",
  },
  cinematic: {
    label: "Cinematic",
    description: "Realistic motion with atmospheric lighting.",
    promptPrefix:
      "cinematic motion, atmospheric lighting, professional cinematography, natural movement.",
    preferredProvider: "kling",
  },
};

export const MOTION_FLUIDITY: Record<MotionFluidity, FluidityConfig> = {
  limited: {
    label: "Limited (pose swaps)",
    description:
      "Discrete pose changes and lip flaps — the classic 2D cartoon comedy timing. Cheaper and faster.",
    promptHint:
      "Use limited animation with discrete pose changes, lip flaps, and minimal in-betweens. Classic 2D cartoon comedy timing.",
  },
  smooth: {
    label: "Smooth full motion",
    description:
      "Continuous fluid motion throughout. Most expensive, takes longest per scene.",
    promptHint:
      "Use fluid continuous motion: smooth in-betweens, dynamic full-body movement, natural physics.",
  },
  mixed: {
    label: "Mix (limited + smooth highlights)",
    description:
      "Limited animation by default, smooth motion on key dramatic moments. Best balance.",
    promptHint:
      "Use mostly limited animation with discrete pose changes, but apply smooth fluid motion on key dramatic or comedic moments for emphasis.",
  },
};

export function composeMotionPrompt(params: {
  motionPrompt: string;
  animationStyle?: AnimationStyle;
  motionFluidity?: MotionFluidity;
}): string {
  const { motionPrompt, animationStyle, motionFluidity } = params;
  const parts: string[] = [];
  if (animationStyle && ANIMATION_STYLES[animationStyle]) {
    parts.push(ANIMATION_STYLES[animationStyle].promptPrefix);
  }
  if (motionFluidity && MOTION_FLUIDITY[motionFluidity]) {
    parts.push(MOTION_FLUIDITY[motionFluidity].promptHint);
  }
  parts.push(motionPrompt);
  return parts.filter((p) => p && p.trim()).join(" ");
}

export function preferredProviderFor(
  style?: AnimationStyle,
): Exclude<VideoProvider, "auto"> | undefined {
  if (!style) return undefined;
  return ANIMATION_STYLES[style]?.preferredProvider;
}

export const ANIMATION_STYLE_VALUES = Object.keys(
  ANIMATION_STYLES,
) as AnimationStyle[];
export const MOTION_FLUIDITY_VALUES = Object.keys(
  MOTION_FLUIDITY,
) as MotionFluidity[];
