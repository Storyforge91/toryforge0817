import { generateWithClaude } from "../providers";

const VOICE_SYSTEM_PROMPT = `You are a voice director for StoryForge AI. You generate narration-ready voice scripts with pacing, emphasis, and emotion cues formatted for text-to-speech systems like ElevenLabs.

You MUST respond with valid JSON. No markdown, no explanation — only JSON.`;

interface VoiceScriptScene {
  order: number;
  narrationText: string;
  mood: string;
}

interface GeneratedVoiceScript {
  fullScript: string;
  perScene: {
    sceneOrder: number;
    script: string;
    emotionDirection: string;
    estimatedDuration: number;
  }[];
  totalEstimatedDuration: number;
}

export async function generateVoiceScript(params: {
  episodeTitle: string;
  scenes: VoiceScriptScene[];
  tone: string;
}): Promise<GeneratedVoiceScript> {
  const { episodeTitle, scenes, tone } = params;

  const prompt = `Generate a narration-ready voice script for the episode "${episodeTitle}".

Tone: ${tone}

Scenes:
${scenes.map((s) => `Scene ${s.order} (${s.mood}): ${s.narrationText}`).join("\n")}

Return JSON:
{
  "fullScript": "string (clean narration text only — no bracketed cues. Use natural punctuation (commas, periods, ellipses) for pacing instead.)",
  "perScene": [
    {
      "sceneOrder": number,
      "script": "string (clean scene narration with natural punctuation only — no bracketed cues)",
      "emotionDirection": "string (direction for TTS voice — e.g. 'soft and contemplative', 'building intensity')",
      "estimatedDuration": number (seconds)
    }
  ],
  "totalEstimatedDuration": number (seconds)
}`;

  return generateWithClaude<GeneratedVoiceScript>(
    VOICE_SYSTEM_PROMPT,
    prompt,
  );
}
