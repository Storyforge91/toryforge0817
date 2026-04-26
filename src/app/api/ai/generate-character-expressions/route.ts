import { NextRequest, NextResponse } from "next/server";
import { generateExpressionPrompts } from "@/lib/ai/services/character-expression.service";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { character, expressions } = body as {
      character?: {
        name: string;
        visualDescription?: string;
        personality?: string;
      };
      expressions?: string[];
    };

    if (!character?.name) {
      return NextResponse.json(
        { error: "character.name is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(expressions) || expressions.length === 0) {
      return NextResponse.json(
        { error: "expressions must be a non-empty string array" },
        { status: 400 },
      );
    }

    const result = await generateExpressionPrompts({
      character: {
        name: character.name,
        visualDescription: character.visualDescription,
        personality: character.personality,
      },
      expressions: expressions.slice(0, 12),
    });

    return NextResponse.json({ expressions: result });
  } catch (error) {
    console.error("Error generating character expression prompts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate character expression prompts",
      },
      { status: 500 },
    );
  }
}
