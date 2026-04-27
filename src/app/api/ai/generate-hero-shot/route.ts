import { NextRequest, NextResponse } from "next/server";
import { generateHeroShotConcept } from "@/lib/ai/services/hero-shot.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioSeed, themeHint } = body as {
      scenarioSeed?: string;
      themeHint?: string;
    };

    const concept = await generateHeroShotConcept({
      scenarioSeed,
      themeHint,
    });

    return NextResponse.json(concept);
  } catch (error) {
    console.error("Error generating hero shot concept:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate hero shot",
      },
      { status: 500 },
    );
  }
}
