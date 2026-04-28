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

  // Leonardo enforces a 1500-character limit on prompts.
  const LEONARDO_PROMPT_LIMIT = 1500;

  // Refine: pick references against Claude's moodTags and re-steer the image
  // prompt so Leonardo gets specific look notes. We degrade gracefully:
  //   1. Try base + 2 references.
  //   2. If too long, try base + 1 reference.
  //   3. If still too long, ship the base prompt alone and skip steering.
  const matched = pickReferencesForMood(concept.moodTags || [], 2);
  if (matched.length > 0) {
    const buildPrompt = (refs: typeof matched) =>
      `${concept.imagePrompt}\n\nLOOK REFERENCES (steer the rendering toward these):\n${formatReferencesAsNotes(refs)}`;

    const candidates = [matched, matched.slice(0, 1)];
    let appliedRefs: typeof matched = [];
    let finalPrompt = concept.imagePrompt;
    for (const refs of candidates) {
      const candidate = buildPrompt(refs);
      if (candidate.length <= LEONARDO_PROMPT_LIMIT) {
        finalPrompt = candidate;
        appliedRefs = refs;
        break;
      }
    }
    concept.imagePrompt = finalPrompt;
    if (appliedRefs.length > 0) {
      concept.appliedReferenceIds = appliedRefs.map((r) => r.id);
    }
  }

  // Final safety net: if the base prompt itself somehow exceeds the limit
  // (shouldn't happen with current Claude prompt instructions), trim with a
  // word boundary so we don't break syntax mid-word.
  if (concept.imagePrompt.length > LEONARDO_PROMPT_LIMIT) {
    const truncated = concept.imagePrompt
      .slice(0, LEONARDO_PROMPT_LIMIT)
      .replace(/\s+\S*$/, "");
    concept.imagePrompt = truncated;
  }

  // Lock duration to the series standard regardless of what the model returned.
  concept.duration = HERO_SHOT_TARGET_DURATION_SECONDS;

  return concept;
}
