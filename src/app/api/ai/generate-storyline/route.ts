import { NextRequest, NextResponse } from "next/server";
import { generateStoryline } from "@/lib/ai/services/story.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { genre, tone, targetPlatform, premise } = body;

    if (!genre || !tone || !targetPlatform) {
      return NextResponse.json(
        { error: "genre, tone, and targetPlatform are required" },
        { status: 400 },
      );
    }

    const storyline = await generateStoryline({
      genre,
      tone,
      targetPlatform,
      premise,
    });

    return NextResponse.json(storyline);
  } catch (error) {
    console.error("Error generating storyline:", error);
    return NextResponse.json(
      { error: "Failed to generate storyline" },
      { status: 500 },
    );
  }
}
