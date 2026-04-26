export const CHARACTER_SYSTEM_PROMPT = `You are the character designer for StoryForge AI. You create detailed character profiles with visual descriptions optimized for AI image generation consistency. Characters must feel real, with clear motivations and visual identities.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export function buildGenerateCharacterPrompt(params: {
  storylineTitle: string;
  premise: string;
  genre: string;
  tone: string;
  role: string;
  existingCharacters?: { name: string; role: string }[];
}) {
  return `Create a new character for the storyline "${params.storylineTitle}".

Premise: ${params.premise}
Genre: ${params.genre}
Tone: ${params.tone}
Desired role: ${params.role}
${
  params.existingCharacters?.length
    ? `Existing characters: ${params.existingCharacters.map((c) => `${c.name} (${c.role})`).join(", ")}`
    : ""
}

Return JSON:
{
  "name": "string",
  "role": "${params.role}",
  "personality": "string (2-3 sentences describing temperament and behavior)",
  "emotionalWound": "string (1 sentence — the core pain that drives them)",
  "motivation": "string (1 sentence — what they want most)",
  "visualDescription": "string (detailed physical appearance: age, build, skin tone, hair color/style, eye color, distinctive features, typical clothing — specific enough for consistent AI image generation)"
}`;
}
