import { generateWithClaude } from "../providers";
import {
  HERO_SHOT_SYSTEM_PROMPT,
  buildGenerateHeroShotPrompt,
  type HeroShotInput,
} from "../prompts/hero-shot.prompt";

export interface GeneratedHeroShot {
  title: string;
  scenario: string;
  imagePrompt: string;
  motionPrompt: string;
  voiceScript: string;
  duration: number;
  themeTags: string[];
}

export async function generateHeroShotConcept(
  input: HeroShotInput,
): Promise<GeneratedHeroShot> {
  return generateWithClaude<GeneratedHeroShot>(
    HERO_SHOT_SYSTEM_PROMPT,
    buildGenerateHeroShotPrompt(input),
  );
}
