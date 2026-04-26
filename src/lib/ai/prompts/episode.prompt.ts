export const EPISODE_SYSTEM_PROMPT = `You are the narrative engine for StoryForge AI. You generate individual episodes within a serialized animated story. Each episode must advance the plot, contain an emotional beat, and end with a hook that drives viewers to the next episode.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export function buildGenerateEpisodePrompt(params: {
  storylineTitle: string;
  premise: string;
  genre: string;
  tone: string;
  narrativeArc: { type: string; stages: string[]; currentStage: number };
  characters: { name: string; role: string; personality: string; visualDescription: string }[];
  episodeNumber: number;
  storyMemory: string;
}) {
  return `Generate episode ${params.episodeNumber} for the storyline "${params.storylineTitle}".

Premise: ${params.premise}
Genre: ${params.genre}
Tone: ${params.tone}
Arc type: ${params.narrativeArc.type}
Current arc stage: ${params.narrativeArc.stages[params.narrativeArc.currentStage]} (stage ${params.narrativeArc.currentStage + 1} of ${params.narrativeArc.stages.length})

Characters:
${params.characters.map((c) => `- ${c.name} (${c.role}): ${c.personality}`).join("\n")}

Story so far:
${params.storyMemory || "This is the first episode."}

Return JSON with this exact structure:
{
  "title": "string",
  "hook": "string (the first 1-3 seconds — must stop the scroll)",
  "synopsis": "string (2-3 sentence summary)",
  "emotionalArc": "string (the emotional journey of this episode)",
  "cliffhanger": "string (reason to watch the next episode)",
  "voiceScript": "string (full narration text. Plain text only \u2014 NO bracketed cues. Use natural punctuation (commas, periods, ellipses) for pacing.)",
  "scenes": [
    {
      "order": number,
      "environment": "string",
      "mood": "string",
      "cameraAngle": "string (e.g. close-up, wide shot, low angle)",
      "characterPresence": ["character names in this scene"],
      "cinematicDescription": "string (what the viewer sees)",
      "duration": number (seconds, 3-10),
      "narrationText": "string (narration for this scene)"
    }
  ],
  "updatedStoryMemory": "string (compressed summary of all events through this episode)"
}

Generate 4-6 scenes. Total episode duration should be 30-60 seconds.`;
}
