import { NextRequest, NextResponse } from "next/server";
import { generateSkitConcept } from "@/lib/ai/services/skit.service";
import type { SkitCategory, AudioStyle } from "@/types";
import type { ComedyCharRef } from "@/lib/ai/prompts/skit.prompt";

export const maxDuration = 60;

const VALID_CATEGORIES: SkitCategory[] = [
  "work_office",
  "school",
  "relationships",
  "technology",
  "daily_life",
  "trending_audio",
  "cultural",
  "gaming",
];

const VALID_AUDIO_STYLES: AudioStyle[] = [
  "trending_audio",
  "voiceover",
  "text_only",
  "mixed",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category,
      scenario,
      characters,
      audioStyle,
      comedyStyle,
    } = body as {
      category?: string;
      scenario?: string;
      characters?: ComedyCharRef[];
      audioStyle?: string;
      comedyStyle?: string;
    };

    if (!category || !VALID_CATEGORIES.includes(category as SkitCategory)) {
      return NextResponse.json(
        {
          error: `category is required and must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const safeAudioStyle: AudioStyle =
      audioStyle && VALID_AUDIO_STYLES.includes(audioStyle as AudioStyle)
        ? (audioStyle as AudioStyle)
        : "voiceover";

    const skit = await generateSkitConcept({
      category: category as SkitCategory,
      scenario,
      characters: Array.isArray(characters) ? characters : [],
      audioStyle: safeAudioStyle,
      comedyStyle,
    });

    return NextResponse.json(skit);
  } catch (error) {
    console.error("Error generating skit:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate skit",
      },
      { status: 500 },
    );
  }
}
