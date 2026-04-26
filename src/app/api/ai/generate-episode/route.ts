import { NextRequest, NextResponse } from "next/server";
import { generateEpisode } from "@/lib/ai/services/story.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyline, episodeNumber } = body;

    if (!storyline || !episodeNumber) {
      return NextResponse.json(
        { error: "storyline and episodeNumber are required" },
        { status: 400 },
      );
    }

    const episode = await generateEpisode({ storyline, episodeNumber });

    return NextResponse.json(episode);
  } catch (error) {
    console.error("Error generating episode:", error);
    return NextResponse.json(
      { error: "Failed to generate episode" },
      { status: 500 },
    );
  }
}
