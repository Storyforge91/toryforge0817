import { NextRequest, NextResponse } from "next/server";
import { generateImagePrompts } from "@/lib/ai/services/scene.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenes, characters, tone, genre } = body;

    if (!scenes || !characters || !tone || !genre) {
      return NextResponse.json(
        { error: "scenes, characters, tone, and genre are required" },
        { status: 400 },
      );
    }

    const prompts = await generateImagePrompts({
      scenes,
      characters,
      tone,
      genre,
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Error generating image prompts:", error);
    return NextResponse.json(
      { error: "Failed to generate image prompts" },
      { status: 500 },
    );
  }
}
