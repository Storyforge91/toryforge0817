import { NextRequest, NextResponse } from "next/server";
import { generateVoiceScript } from "@/lib/ai/services/voice.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episodeTitle, scenes, tone } = body;

    if (!episodeTitle || !scenes || !tone) {
      return NextResponse.json(
        { error: "episodeTitle, scenes, and tone are required" },
        { status: 400 },
      );
    }

    const result = await generateVoiceScript({ episodeTitle, scenes, tone });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating voice script:", error);
    return NextResponse.json(
      { error: "Failed to generate voice script" },
      { status: 500 },
    );
  }
}
