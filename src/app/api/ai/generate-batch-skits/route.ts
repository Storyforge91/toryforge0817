import { NextRequest, NextResponse } from "next/server";
import { generateBatchSkitConcepts } from "@/lib/ai/services/skit.service";
import type { SkitCategory } from "@/types";
import type { ComedyCharRef } from "@/lib/ai/prompts/skit.prompt";

export const maxDuration = 90;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count, category, characters, comedyStyle } = body as {
      count?: number;
      category?: string;
      characters?: ComedyCharRef[];
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

    const safeCount = Math.max(2, Math.min(20, Number(count) || 5));

    const skits = await generateBatchSkitConcepts({
      count: safeCount,
      category: category as SkitCategory,
      characters: Array.isArray(characters) ? characters : [],
      comedyStyle,
    });

    return NextResponse.json({ skits });
  } catch (error) {
    console.error("Error generating batch skits:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate batch skits",
      },
      { status: 500 },
    );
  }
}
