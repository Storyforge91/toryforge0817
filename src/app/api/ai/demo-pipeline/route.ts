import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/ai/providers";

export const maxDuration = 120;

const DEMO_SYSTEM_PROMPT = `You are the full production engine for StoryForge AI. You generate complete, production-ready episode packages for faceless animated short-form content. Every output must be immediately usable — no placeholders, no TODOs.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, data } = body;

    if (step === "storyline") {
      const { genre, tone, premise } = data;
      const prompt = `Generate a complete storyline for a faceless animated series.

Genre: ${genre || "dark-motivation"}
Tone: ${tone || "dark and cinematic"}
${premise ? `Premise hint: ${premise}` : "Create an original, compelling premise that would captivate TikTok/Reels/Shorts audiences."}

Return JSON:
{
  "title": "string (catchy, memorable series title)",
  "premise": "string (2-3 sentences)",
  "genre": "string",
  "tone": "string",
  "visualStyle": "string (describe the animation aesthetic — cinematic, anime, stylized, etc.)",
  "narrativeArc": {
    "type": "string",
    "stages": ["string array of 4-6 arc stages"],
    "totalEpisodes": 6
  },
  "characters": [
    {
      "name": "string",
      "role": "protagonist | antagonist | supporting",
      "personality": "string (2-3 sentences)",
      "emotionalWound": "string",
      "motivation": "string",
      "visualDescription": "string (VERY detailed: age, ethnicity, build, hair color/style, eye color, skin tone, facial features, typical clothing, distinctive marks — must be specific enough for AI image generation to produce consistent results across multiple images)"
    }
  ],
  "seriesHook": "string (the one-line pitch that sells the whole series)"
}

Create 2-3 characters. Make visual descriptions extremely detailed and specific.`;

      const result = await generateWithClaude(DEMO_SYSTEM_PROMPT, prompt);
      return NextResponse.json(result);
    }

    if (step === "episode") {
      const { storyline, episodeNumber, storyMemory } = data;
      const prompt = `Generate episode ${episodeNumber} for "${storyline.title}".

Premise: ${storyline.premise}
Genre: ${storyline.genre}
Tone: ${storyline.tone}
Visual style: ${storyline.visualStyle || "cinematic dark animation"}
Arc stage: ${storyline.narrativeArc.stages[Math.min(episodeNumber - 1, storyline.narrativeArc.stages.length - 1)]}

Characters:
${storyline.characters.map((c: { name: string; role: string; personality: string; visualDescription: string }) => `- ${c.name} (${c.role}): ${c.personality}. Visual: ${c.visualDescription}`).join("\n")}

${storyMemory ? `Story so far: ${storyMemory}` : "This is the first episode."}

Return JSON:
{
  "title": "string",
  "hook": "string (the first 2-3 seconds — MUST stop the scroll)",
  "synopsis": "string (2-3 sentences)",
  "emotionalArc": "string",
  "cliffhanger": "string",
  "scenes": [
    {
      "order": number,
      "environment": "string (specific setting)",
      "mood": "string",
      "cameraAngle": "string",
      "characterPresence": ["character names"],
      "cinematicDescription": "string (exactly what the viewer sees — vivid and specific)",
      "narrationText": "string (the voiceover for this scene)",
      "duration": number (3-8 seconds),
      "imagePrompt": "string (complete, detailed AI image generation prompt: include character visual details, environment, lighting, mood, camera angle, art style. Must be a standalone prompt that produces the correct image without needing any other context. Format: 9:16 vertical, cinematic animation style)",
      "motionPrompt": "string (animation direction for turning this still image into a video clip. Describe: what the character physically DOES — walks, turns head, clenches fist, looks up; how their EXPRESSION changes — eyes widen, smirk forms, tears well up; CAMERA movement — slow push in, pan left, crane up; ENVIRONMENT motion — wind blowing hair, rain falling, lights flickering, shadows shifting. Be specific and cinematic. Example: 'Character slowly turns to face camera, expression shifting from calm to determined. Wind picks up, hair and coat billowing. Slow camera push-in to close-up. Atmospheric dust particles drift through volumetric light.')"
    }
  ],
  "fullVoiceScript": "string (complete narration for the entire episode. Plain narration text only \u2014 NO bracketed cues like [pause] or [emphasis]. Use natural punctuation (commas, periods, ellipses) for pacing.)",
  "captions": {
    "instagram": { "caption": "string (storytelling format, up to 2200 chars)", "hashtags": ["20-25 hashtags"], "cta": "string" },
    "tiktok": { "caption": "string (punchy, under 300 chars)", "hashtags": ["3-5 hashtags"], "cta": "string" },
    "youtube": { "title": "string (under 100 chars)", "description": "string", "tags": ["10-15 tags"] }
  },
  "storyMemory": "string (compressed summary of everything that has happened through this episode)"
}

Generate 4-6 scenes. Total duration 30-60 seconds. Make every image prompt self-contained and ultra-detailed.`;

      const result = await generateWithClaude(DEMO_SYSTEM_PROMPT, prompt);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  } catch (error) {
    console.error("Demo pipeline error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pipeline failed" },
      { status: 500 },
    );
  }
}
