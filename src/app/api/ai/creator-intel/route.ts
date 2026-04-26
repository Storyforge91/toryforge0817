import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/ai/providers";

export const maxDuration = 60;

const CREATOR_INTEL_SYSTEM_PROMPT = `You are a social media strategist and competitive analyst specializing in faceless animated content on TikTok, Instagram Reels, and YouTube Shorts. You have deep knowledge of what makes faceless animation channels succeed or fail, including content strategy, posting tactics, audience psychology, monetization, and growth hacking.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type } = body;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    let prompt = "";

    if (type === "analyze-niche") {
      prompt = `Analyze the faceless animated content niche "${query}" on short-form platforms.

Return JSON:
{
  "niche": "string",
  "marketOverview": "string (2-3 sentences on current state of this niche)",
  "saturationLevel": "low | medium | high",
  "revenueEstimate": "string (typical monthly revenue range for channels with 50K-500K followers)",
  "topTactics": [
    {
      "tactic": "string",
      "whyItWorks": "string",
      "howToImplement": "string",
      "difficultyLevel": "easy | medium | hard"
    }
  ],
  "commonMistakes": [
    {
      "mistake": "string",
      "whyItsHarmful": "string",
      "whatToDoInstead": "string"
    }
  ],
  "contentFormulas": [
    {
      "name": "string (e.g. 'The Revenge Loop')",
      "structure": "string (step by step hook → build → payoff formula)",
      "whyItPerforms": "string",
      "exampleHook": "string"
    }
  ],
  "growthStrategy": {
    "first1000Followers": "string (2-3 sentences)",
    "first10000Followers": "string (2-3 sentences)",
    "scaling": "string (2-3 sentences)"
  }
}

Generate 4-6 tactics, 4-5 mistakes, and 3-4 content formulas.`;
    } else if (type === "strategy-session") {
      prompt = `I'm starting a faceless animated channel with this focus: "${query}"

Act as my content strategist. Give me a complete launch playbook.

Return JSON:
{
  "assessment": "string (honest evaluation of this idea's potential — be real, not just encouraging)",
  "positioning": {
    "uniqueAngle": "string (how to stand out in this space)",
    "targetAudience": "string (specific demographics and psychographics)",
    "contentPillars": ["string array of 3-4 recurring themes/formats"]
  },
  "launchPlan": {
    "week1": {
      "focus": "string",
      "actions": ["string array of specific tasks"],
      "contentCount": "number",
      "keyMetric": "string"
    },
    "week2to4": {
      "focus": "string",
      "actions": ["string array"],
      "contentCount": "number",
      "keyMetric": "string"
    },
    "month2to3": {
      "focus": "string",
      "actions": ["string array"],
      "contentCount": "number",
      "keyMetric": "string"
    }
  },
  "hookFormulas": [
    {
      "template": "string (fill-in-the-blank hook template)",
      "example": "string",
      "whyItWorks": "string"
    }
  ],
  "postingSchedule": {
    "frequency": "string",
    "bestTimes": "string",
    "platformPriority": ["string array ordered by importance"]
  },
  "monetizationPath": [
    {
      "milestone": "string (e.g. '1K followers')",
      "revenueStream": "string",
      "estimatedRevenue": "string"
    }
  ],
  "warningsAndPitfalls": ["string array of things that could derail this"]
}

Generate 4-5 hook formulas and 4-5 monetization milestones.`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const result = await generateWithClaude(CREATOR_INTEL_SYSTEM_PROMPT, prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in Creator Intel:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 },
    );
  }
}
