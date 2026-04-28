import { NextRequest, NextResponse } from "next/server";
import { generateHeroShotConcept } from "@/lib/ai/services/hero-shot.service";
import { classifyError } from "@/lib/errors/classify";

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
