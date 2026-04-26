import { NextRequest, NextResponse } from "next/server";
import {
  generateAnimeVideo,
  getEnabledProviders,
  type VideoProvider,
} from "@/lib/video/engine";
import {
  composeMotionPrompt,
  preferredProviderFor,
  type AnimationStyle,
  type MotionFluidity,
} from "@/lib/video/style-presets";

export const maxDuration = 300; // Video generation can take several minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      motionPrompt,
      duration = 5,
      provider = "auto",
      animationStyle,
      motionFluidity,
    } = body as {
      imageUrl?: string;
      motionPrompt?: string;
      duration?: number;
      provider?: VideoProvider;
      animationStyle?: AnimationStyle;
      motionFluidity?: MotionFluidity;
    };

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    // Clamp duration to valid range (1-10 seconds)
    const safeDuration = Math.max(1, Math.min(10, Number(duration) || 5));

    const enabled = getEnabledProviders();
    if (enabled.length === 0) {
      return NextResponse.json(
        {
          error:
            "No video API keys configured. Add FAL_KEY (for Wan2.1 + Minimax) or KLING_API_KEY (for Kling) to your environment.",
        },
        { status: 500 },
      );
    }

    // Compose the motion prompt with style + fluidity hints.
    const composedPrompt = composeMotionPrompt({
      motionPrompt:
        motionPrompt ||
        "Character moves naturally with fluid animation, subtle expressions change, gentle ambient motion in the environment",
      animationStyle,
      motionFluidity,
    });

    // When provider is "auto" and the style has a preferred provider, pass
    // it as `preferredFirst`. The engine tries it FIRST but still falls
    // back to the others if it fails (so a locked Fal balance won't kill
    // the whole pipeline — Kling can still pick it up).
    const resolvedProvider: VideoProvider = provider ?? "auto";
    const preferredFirst =
      resolvedProvider === "auto" && animationStyle
        ? preferredProviderFor(animationStyle)
        : undefined;

    console.log(
      `[Video API] Generating animated video: provider=${resolvedProvider}, preferredFirst=${preferredFirst ?? "none"}, duration=${safeDuration}s, style=${animationStyle ?? "default"}, fluidity=${motionFluidity ?? "default"}`,
    );

    const result = await generateAnimeVideo({
      imageUrl,
      motionPrompt: composedPrompt,
      duration: safeDuration,
      aspectRatio: "9:16",
      provider: resolvedProvider,
      preferredFirst,
    });

    console.log(
      `[Video API] Success via ${result.provider}: ${result.videoUrl.slice(0, 80)}...`,
    );

    return NextResponse.json({
      videoUrl: result.videoUrl,
      provider: result.provider,
      duration: result.duration,
    });
  } catch (error) {
    console.error("[Video API] Error:", error);

    // Surface a more actionable message when a provider returns a known
    // "out of credits / locked account" error so the UI can prompt the
    // user to top up the right service instead of just saying "Forbidden".
    let message =
      error instanceof Error ? error.message : "Failed to generate video";
    let actionable: string | null = null;

    if (/exhausted balance|user is locked|insufficient.*balance/i.test(message)) {
      actionable =
        "Fal.ai balance exhausted — top up at fal.ai/dashboard/billing or set Animation Engine to 'Kling AI' to bypass Fal.";
    } else if (/quota_exceeded/i.test(message)) {
      actionable =
        "Provider quota exceeded — top up your account or pick a different Animation Engine.";
    } else if (/Forbidden/i.test(message) && /403/i.test(message)) {
      actionable =
        "Provider returned 403 (Forbidden). Likely an out-of-credits or invalid API key issue.";
    }

    if (actionable) {
      message = `${actionable}\n\nDetails: ${message}`;
    }

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

// GET: Return which video providers are configured
export async function GET() {
  const enabled = getEnabledProviders();
  return NextResponse.json({
    providers: {
      wan21: enabled.includes("wan21"),
      minimax: enabled.includes("minimax"),
      kling: enabled.includes("kling"),
    },
    count: enabled.length,
  });
}
