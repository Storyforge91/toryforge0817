import { NextRequest, NextResponse } from "next/server";
import { classifyError } from "@/lib/errors/classify";
import { QUOTE_BACKGROUND_PROMPT } from "@/data/quote-seeds";

export const maxDuration = 120;

/**
 * POST /api/quote-card/background
 *
 * Wraps /api/images/generate with the @SetsandStruggles atmospheric-gym
 * preset. Caller can pass an optional `prompt` to override the default.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const customPrompt =
      typeof body?.prompt === "string" && body.prompt.trim().length > 0
        ? body.prompt.trim()
        : undefined;

    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/images/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: customPrompt || QUOTE_BACKGROUND_PROMPT,
        width: 832,
        height: 1472,
        numImages: 1,
        style: "photoreal",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error || `Image generation failed (HTTP ${res.status})` },
        { status: res.status },
      );
    }

    const url = Array.isArray(data?.imageUrls) ? data.imageUrls[0] : null;
    if (!url) {
      return NextResponse.json(
        { error: "No image URL returned from generator" },
        { status: 500 },
      );
    }

    return NextResponse.json({ imageUrl: url });
  } catch (error) {
    console.error("Error generating quote card background:", error);
    const classified = classifyError(error);
    return NextResponse.json(
      {
        error: classified.userMessage,
        kind: classified.kind,
        actionUrl: classified.actionUrl,
        actionLabel: classified.actionLabel,
      },
      { status: 500 },
    );
  }
}
