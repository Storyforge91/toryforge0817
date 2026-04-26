import { generateWithClaude } from "../providers";
import {
  CHARACTER_SYSTEM_PROMPT,
  buildGenerateCharacterPrompt,
} from "../prompts/character.prompt";

interface GeneratedCharacter {
  name: string;
  role: string;
  personality: string;
  emotionalWound: string;
  motivation: string;
  visualDescription: string;
}

export async function generateCharacter(params: {
  storylineTitle: string;
  premise: string;
  genre: string;
  tone: string;
  role: string;
  existingCharacters?: { name: string; role: string }[];
}): Promise<GeneratedCharacter> {
  return generateWithClaude<GeneratedCharacter>(
    CHARACTER_SYSTEM_PROMPT,
    buildGenerateCharacterPrompt(params),
  );
}
