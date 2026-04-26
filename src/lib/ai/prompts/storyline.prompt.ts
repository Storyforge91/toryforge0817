export const STORYLINE_SYSTEM_PROMPT = `You are the narrative engine for StoryForge AI, a platform that generates serialized animated short-form content. You create compelling storylines with strong emotional arcs designed for TikTok, Instagram Reels, and YouTube Shorts.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export function buildGenerateStorylinePrompt(params: {
  genre: string;
  tone: string;
  targetPlatform: string;
  premise?: string;
}) {
  return `Generate a new animated storyline with the following parameters:

Genre: ${params.genre}
Tone: ${params.tone}
Target platform: ${params.targetPlatform}
${params.premise ? `Premise hint: ${params.premise}` : "Create an original premise."}

Return JSON with this exact structure:
{
  "title": "string",
  "premise": "string (2-3 sentences)",
  "genre": "string",
  "tone": "string",
  "narrativeArc": {
    "type": "string (e.g. rejection-to-comeback)",
    "stages": ["string array of 3-5 arc stages"],
    "totalEpisodes": number (5-8)
  },
  "characters": [
    {
      "name": "string",
      "role": "protagonist | antagonist | supporting | recurring",
      "personality": "string (2-3 sentences)",
      "emotionalWound": "string (1 sentence)",
      "motivation": "string (1 sentence)",
      "visualDescription": "string (detailed physical appearance for AI image generation)"
    }
  ]
}

Create 2-4 characters. Make the protagonist's visual description vivid and specific enough for consistent AI image generation.`;
}
