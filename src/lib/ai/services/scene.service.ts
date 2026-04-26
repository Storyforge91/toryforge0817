import { generateWithClaude } from "../providers";
import {
  SCENE_SYSTEM_PROMPT,
  buildGenerateImagePromptsPrompt,
} from "../prompts/scene.prompt";
interface GeneratedImagePrompt {
  sceneOrder: number;
  universal: string;
  midjourney: string;
  leonardo: string;
  flux: string;
}

export async function generateImagePrompts(params: {
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
}): Promise<GeneratedImagePrompt[]> {
  return generateWithClaude<GeneratedImagePrompt[]>(
    SCENE_SYSTEM_PROMPT,
    buildGenerateImagePromptsPrompt(params),
  );
}
