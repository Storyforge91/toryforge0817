/**
 * Hero Shot reference library.
 *
 * Each entry is a hand-picked still that exemplifies the look you want to
 * recreate (mister_z reels, Beeple stills, real cinematography, etc.).
 *
 * How this is used:
 *   1. Claude generates a hero-shot concept and emits `moodTags`.
 *   2. We pick the references whose `moodTags` overlap with the concept's
 *      tags, take the top 2-3 by overlap score, and append their
 *      `lookNotes` into the concept's image prompt.
 *   3. (Future) we also pass the reference image URLs to Leonardo's
 *      image-prompts feature on Albedo Base XL for style transfer.
 *
 * To grow this library:
 *   - Save 30-50 stills you love.
 *   - Host them somewhere public (Vercel Blob, S3, Imgur direct link).
 *   - Add an entry below with descriptive moodTags and a 1-line lookNote.
 *
 * The library starts as a tag/notes-only catalog so the prompt steering
 * works immediately. Image-prompt URLs can be added incrementally.
 */

export interface HeroShotReference {
  id: string;
  /** Public URL of the reference still. Optional until you upload. */
  imageUrl?: string;
  /** 3-6 atmosphere tags. Match against concept.moodTags for selection. */
  moodTags: string[];
  /**
   * One-line description of the look — fed into the image prompt as steering.
   * Be specific about lighting, palette, composition, and atmosphere.
   */
  lookNotes: string;
  /** Optional source for credit / future re-fetch. */
  source?: string;
}

export const HERO_SHOT_REFERENCES: HeroShotReference[] = [
  {
    id: "cloud-titan-dawn",
    moodTags: ["cloud-titan", "godlike-scale", "rim-lit-silhouette", "mythic"],
    lookNotes:
      "Tiny lone figure on a cliff bottom-third of frame, colossal humanoid cloud-form filling the upper sky, sunrise rim light along the titan's shoulder, deep blue-to-amber gradient sky, volumetric god rays, parallax cloud layers.",
  },
  {
    id: "leviathan-emerge",
    moodTags: ["sea-monster", "ocean-vast", "cold-light", "cosmic-horror"],
    lookNotes:
      "Single fishing boat dwarfed by an emerging leviathan eye breaching the ocean surface, low-angle hero shot, cold cyan and slate-grey palette, mist over water, hard directional moonlight, salt spray particles.",
  },
  {
    id: "ember-warrior",
    moodTags: ["warrior", "ash-storm", "ember-particles", "dark-fantasy"],
    lookNotes:
      "Lone armored warrior walking forward through ember-filled wind, distant burning citadel silhouetted in haze, low-angle ground shot, deep red and charcoal palette, hard rim light from above, slow-motion ash drifting.",
  },
  {
    id: "void-cathedral",
    moodTags: ["megastructure", "void", "scale-architecture", "sci-fi-mythic"],
    lookNotes:
      "Single human silhouette at the entrance of a kilometer-tall obsidian cathedral hovering in deep space, hard rim light from a distant star, micro-detail on the structure, parallax dust, deep teal-and-violet void palette.",
  },
  {
    id: "kaiju-ridge",
    moodTags: ["kaiju", "mountain-scale", "monsoon", "epic"],
    lookNotes:
      "Mountain-sized creature on a ridgeline at sunset, tiny figure on a cliff edge in the foreground watching, monsoon clouds, layered atmospheric haze, gold-to-violet sky gradient, parallax rain.",
  },
  {
    id: "ancient-god-glow",
    moodTags: ["ancient-god", "rune-glow", "ruins", "biblical"],
    lookNotes:
      "Towering humanoid deity made of stone and glowing runes rising over ruined temple, single robed figure prostrate at its feet, godlight from above, dust motes, deep umber palette, low-angle reverence shot.",
  },
  {
    id: "post-apoc-pilgrim",
    moodTags: ["wasteland", "pilgrim", "dust-storm", "post-apocalyptic"],
    lookNotes:
      "Cloaked pilgrim crossing a vast salt-flat wasteland toward a half-buried mech the size of a skyscraper, hot-orange dust storm in distance, hard backlight, washed sepia palette, particulate haze.",
  },
  {
    id: "cyberpunk-spire",
    moodTags: ["cyberpunk", "megacity", "neon-rain", "dystopia"],
    lookNotes:
      "Single figure on a rooftop dwarfed by a holographic deity floating between megacity spires, neon magenta and cyan palette, heavy rain, volumetric haze, low-angle crane shot, glowing logographic signage.",
  },
];

/**
 * Pick the most relevant references for a generated concept by scoring tag
 * overlap. Returns the top N references (default 2) — kept small so the prompt
 * stays focused and Leonardo's reference budget (when wired up) stays bounded.
 */
export function pickReferencesForMood(
  conceptMoodTags: string[],
  limit = 2,
): HeroShotReference[] {
  if (!conceptMoodTags || conceptMoodTags.length === 0) {
    return HERO_SHOT_REFERENCES.slice(0, limit);
  }
  const normalized = conceptMoodTags.map((t) =>
    t.toLowerCase().replace(/^#/, "").trim(),
  );
  const scored = HERO_SHOT_REFERENCES.map((ref) => {
    const refTags = ref.moodTags.map((t) => t.toLowerCase());
    const overlap = refTags.filter((t) =>
      normalized.some((n) => n === t || n.includes(t) || t.includes(n)),
    ).length;
    return { ref, overlap };
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  return scored
    .filter((s) => s.overlap > 0)
    .slice(0, limit)
    .map((s) => s.ref);
}

/**
 * Format a list of references as a steering note that can be appended to the
 * Claude prompt or the Leonardo image prompt.
 */
export function formatReferencesAsNotes(refs: HeroShotReference[]): string {
  if (refs.length === 0) return "";
  return refs
    .map((r, i) => `${i + 1}. [${r.moodTags.join(", ")}] ${r.lookNotes}`)
    .join("\n");
}
