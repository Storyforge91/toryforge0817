import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/ai/providers";

export const maxDuration = 60;

const IDEA_STUDIO_SYSTEM_PROMPT = `You are a veteran writers' room partner for StoryForge AI — a platform that creates serialized animated short-form content for TikTok, Instagram Reels, and YouTube Shorts.

Your job is to take raw creative sparks (a word, a phrase, a half-formed idea, a mood, a "what if") and expand them into fully fleshed-out storyline concepts with episode breakdowns. Think like a showrunner brainstorming with a collaborator — push ideas further, find unexpected angles, and always think about what makes an audience come back for the next episode.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, mode } = body;

    if (!input?.trim()) {
      return NextResponse.json(
        { error: "Creative input is required" },
        { status: 400 },
      );
    }

    let prompt = "";

    if (mode === "brainstorm") {
      prompt = `A creator walks into the writers' room and says:

"${input}"

Take this raw creative spark and generate 3 distinct storyline concepts. Each should be a completely different take on the input — different genres, tones, angles. Think about what would make audiences binge a serialized animated series on TikTok/Reels/Shorts.

Return JSON:
{
  "interpretation": "string (1-2 sentences — what you see in this spark, the emotional core)",
  "concepts": [
    {
      "title": "string (catchy series title)",
      "logline": "string (1 sentence pitch — the hook that sells the series)",
      "genre": "string",
      "tone": "string",
      "targetAudience": "string (who this is for)",
      "whyItWorks": "string (1-2 sentences — why this would perform on short-form platforms)",
      "premise": "string (2-3 sentences expanding the concept)",
      "mainCharacter": {
        "name": "string",
        "archetype": "string (e.g. reluctant hero, fallen king, quiet genius)",
        "hook": "string (what makes viewers root for or obsess over them)"
      },
      "narrativeArc": {
        "type": "string (e.g. revenge, transformation, mystery, rise-and-fall)",
        "stages": ["string array of 4-6 arc stages"]
      },
      "episodeBreakdown": [
        {
          "episodeNumber": 1,
          "title": "string",
          "summary": "string (2-3 sentences — what happens)",
          "hook": "string (the scroll-stopping opening)",
          "cliffhanger": "string (why they watch the next one)",
          "emotionalBeat": "string (what the audience feels)"
        }
      ],
      "seriesPotential": "string (where this goes after the first arc — spin-offs, sequels, expansions)"
    }
  ]
}

Generate 5-8 episodes per concept. Make each concept genuinely different — if one is dark revenge, make another wholesome, and another a mystery.`;
    } else if (mode === "expand") {
      prompt = `A creator has a storyline concept they want to develop deeper:

"${input}"

Take this concept and build it into a complete writers' room breakdown. Think about every detail a showrunner would need to greenlight this series.

Return JSON:
{
  "expandedConcept": {
    "title": "string",
    "logline": "string",
    "genre": "string",
    "tone": "string",
    "premise": "string (3-4 sentences, richer than the input)",
    "themes": ["string array of 2-4 thematic threads"],
    "visualStyle": "string (what the animation should look and feel like)",
    "narrativeArc": {
      "type": "string",
      "stages": ["string array of 4-6 arc stages"],
      "totalEpisodes": "number"
    },
    "characters": [
      {
        "name": "string",
        "role": "protagonist | antagonist | supporting | recurring",
        "archetype": "string",
        "personality": "string (2-3 sentences)",
        "visualDescription": "string (detailed for AI image generation)",
        "emotionalWound": "string",
        "motivation": "string",
        "characterArc": "string (how they change across the series)"
      }
    ],
    "episodeBreakdown": [
      {
        "episodeNumber": "number",
        "title": "string",
        "summary": "string (2-3 sentences)",
        "hook": "string",
        "cliffhanger": "string",
        "emotionalBeat": "string",
        "keyScenes": ["string array of 2-3 pivotal visual moments"]
      }
    ],
    "scriptSample": {
      "episode": 1,
      "openingNarration": "string (the first 15-20 seconds of narration, written in the series voice)",
      "closingNarration": "string (the last 10 seconds — the cliffhanger delivery)"
    },
    "marketingAngles": [
      "string (hook/caption ideas that would go viral)"
    ]
  }
}

Generate 3-4 characters and 6-8 episodes. Make the script sample feel cinematic and bingeable.`;
    } else {
      // "riff" mode — free association
      prompt = `A creator throws out this raw thought for a writers' room riff session:

"${input}"

Riff on this. Free-associate. Find the unexpected connections. What stories hide inside this idea? Think laterally — what genres could this live in? What emotions does it tap? What characters emerge?

Return JSON:
{
  "riffs": [
    {
      "angle": "string (the unexpected connection or twist)",
      "whyItsInteresting": "string (1 sentence)",
      "quickPitch": "string (2-3 sentence concept that could become a series)"
    }
  ],
  "topPick": {
    "title": "string",
    "logline": "string",
    "genre": "string",
    "tone": "string",
    "premise": "string (2-3 sentences)",
    "episodeTeaser": [
      {
        "episodeNumber": "number",
        "title": "string",
        "oneLiner": "string (1 sentence summary)"
      }
    ]
  },
  "promptsToExplore": [
    "string (follow-up questions or prompts the creator could use to dig deeper)"
  ]
}

Generate 5-8 riffs, and 5-8 episode teasers for the top pick. Be bold and creative — surprise the creator.`;
    }

    const result = await generateWithClaude(IDEA_STUDIO_SYSTEM_PROMPT, prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in Idea Studio:", error);
    return NextResponse.json(
      { error: "Failed to generate ideas" },
      { status: 500 },
    );
  }
}
