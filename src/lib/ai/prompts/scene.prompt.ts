export const SCENE_SYSTEM_PROMPT = `You are the visual director for StoryForge AI. You break episodes into cinematic scenes optimized for short-form animated video. Each scene must be visually distinct and narratively purposeful.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export function buildGenerateImagePromptsPrompt(params: {
  scenes: {
    order: number;
    environment: string;
    mood: string;
    cameraAngle: string;
    characterPresence: string[];
    cinematicDescription: string;
  }[];
  characters: { name: string; visualDescription: string }[];
  tone: string;
  genre: string;
}) {
  return `Generate AI image generation prompts for each scene below. Create prompts optimized for multiple image generation models.

Tone: ${params.tone}
Genre: ${params.genre}

Characters:
${params.characters.map((c) => `- ${c.name}: ${c.visualDescription}`).join("\n")}

Scenes:
${params.scenes.map((s) => `Scene ${s.order}: ${s.cinematicDescription} (Environment: ${s.environment}, Mood: ${s.mood}, Camera: ${s.cameraAngle}, Characters: ${s.characterPresence.join(", ")})`).join("\n")}

Return JSON array:
[
  {
    "sceneOrder": number,
    "universal": "string (model-agnostic description, detailed and specific)",
    "midjourney": "string (Midjourney v7 optimized with --ar 9:16 --style raw)",
    "leonardo": "string (Leonardo AI optimized with style tokens)",
    "flux": "string (FLUX optimized, natural language)"
  }
]`;
}
