import { NextRequest, NextResponse } from "next/server";
import { generateCaptions } from "@/lib/ai/services/story.service";

export const maxDuration = 60;

interface LegacyEpisodeShape {
  title?: string;
  number?: number;
  hook?: string;
  synopsis?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support both legacy {storylineTitle, episode, genre, tone}
    // and new flat shape {title, hook, synopsis, genre, tone, storylineTitle?, episodeNumber?}
    const genre = body.genre as string | undefined;
    const tone = body.tone as string | undefined;
    if (!genre || !tone) {
      return NextResponse.json(
        { error: "genre and tone are required" },
        { status: 400 },
      );
    }

    let title: string | undefined = body.title;
    let hook: string | undefined = body.hook;
    let synopsis: string | undefined = body.synopsis;
    let episodeNumber: number | undefined = body.episodeNumber;
    const storylineTitle: string | undefined = body.storylineTitle;

    if (!title && body.episode) {
      const ep = body.episode as LegacyEpisodeShape;
      title = ep.title;
      hook = ep.hook;
      synopsis = ep.synopsis;
      episodeNumber = ep.number;
    }

    if (!title || !hook || !synopsis) {
      return NextResponse.json(
        {
          error:
            "title, hook, and synopsis are required (or pass legacy { episode, storylineTitle })",
        },
        { status: 400 },
      );
    }

    const captions = await generateCaptions({
      title,
      hook,
      synopsis,
      genre,
      tone,
      storylineTitle,
      episodeNumber,
    });

    return NextResponse.json(captions);
  } catch (error) {
    console.error("Error generating captions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate captions",
      },
      { status: 500 },
    );
  }
}
