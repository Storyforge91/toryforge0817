import { generateWithClaude } from "../providers";
import {
  HERO_SHOT_SYSTEM_PROMPT,
  HERO_SHOT_TARGET_DURATION_SECONDS,
  buildGenerateHeroShotPrompt,
  type HeroShotInput,
} from "../prompts/hero-shot.prompt";
import {
  formatReferencesAsNotes,
  pickReferencesForMood,
  HERO_SHOT_REFERENCES,
} from "@/lib/references/hero-shot.references";

export interface GeneratedHeroShot {
  title: string;
  scenario: string;
  imagePrompt: string;
  motionPrompt: string;
  textOverlay: string;
  musicVibe: string;
  duration: number;
  moodTags: string[];
  themeTags: string[];
  /** References used to steer this concept (for transparency / future reuse). */
  appliedReferenceIds?: string[];
}

/**
 * Two-step pipeline:
 *   1. Seed Claude with a small initial reference set chosen from theme tags
 *      (so the very first concept already has look-direction).
 *   2. After Claude returns moodTags, re-score the library and append the
 *      best-matching references' lookNotes onto the imagePrompt for stronger
 *      style steering on the Leonardo step.
 */
export async function generateHeroShotConcept(
  input: HeroShotInput,
): Promise<GeneratedHeroShot> {
  // Seed: derive 2 references from the theme hint so the first generation
  // already has visual steering.
  const themeSeedTags = (input.themeHint || "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 4);
  const seedRefs =
    themeSeedTags.length > 0
      ? pickReferencesForMood(themeSeedTags, 2)
      : HERO_SHOT_REFERENCES.slice(0, 2);
  const seedNotes = formatReferencesAsNotes(seedRefs);

  const concept = await generateWithClaude<GeneratedHeroShot>(
    HERO_SHOT_SYSTEM_PROMPT,
    buildGenerateHeroShotPrompt({
      ...input,
      referenceMoodNotes: seedNotes || undefined,
    }),
  );

  // Refine: pick references against Claude's moodTags and re-steer the image
  // prompt so Leonardo gets specific look notes.
  const matched = pickReferencesForMood(concept.moodTags || [], 2);
  if (matched.length > 0) {
    const refNotes = formatReferencesAsNotes(matched);
    concept.imagePrompt = `${concept.imagePrompt}\n\nLOOK REFERENCES (steer the rendering toward these):\n${refNotes}`;
    concept.appliedReferenceIds = matched.map((r) => r.id);
  }

  // Lock duration to the series standard regardless of what the model returned.
  concept.duration = HERO_SHOT_TARGET_DURATION_SECONDS;

  return concept;
}
