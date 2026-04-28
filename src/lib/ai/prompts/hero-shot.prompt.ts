/**
 * Hero Shot prompt — designed to produce viral cinematic AI reels in the
 * style of @mister_z (and similar OpenArt / Higgsfield / Krea creators).
 *
 * The defining traits of that aesthetic:
 *   • Scale contrast — a small character dwarfed by something colossal
 *     (creature, structure, force of nature, cosmic phenomenon).
 *   • Atmospheric depth — volumetric fog, drifting particles, layered
 *     cloud cover, hazy distance, god rays.
 *   • Dramatic lighting — rim light, glowing elements, golden hour or
 *     moody overcast, hard directional shadows.
 *   • Cinematic framing — low-angle hero shots, wide environmental
 *     shots, dynamic poses captured mid-motion.
 *   • Pixar-quality 3D render with photorealistic lighting — never
 *     flat, never anime.
 *   • Motion: slow camera moves (push-in, crane, parallax) + strong
 *     primary action + secondary motion (cloth physics, particles).
 *   • Series discipline — locked to 8 seconds, single shot, 9:16.
 *   • Audio strategy: silent reel + on-screen text + music vibe.
 *     (No AI narration — it always sounds AI on cinematic content.)
 */

export const HERO_SHOT_TARGET_DURATION_SECONDS = 8;

export const HERO_SHOT_SYSTEM_PROMPT = `You are a senior cinematic director for short-form AI video reels. Your reels go viral on Instagram and TikTok in the style of @mister_z and creators using OpenArt / Higgsfield / Krea / Sora to produce single-shot cinematic moments.

Every reel you design follows this formula:

VISUAL LANGUAGE (non-negotiable):
- SCALE CONTRAST: place a small human or character against something colossal — a giant creature, a mile-high structure, a cosmic phenomenon, a force of nature. The size difference must be shocking.
- ATMOSPHERIC DEPTH: volumetric fog, drifting dust/embers/snow/spores, layered cloud cover, god rays piercing haze, parallax depth from foreground to far horizon.
- DRAMATIC LIGHTING: rim light on the silhouette, glowing eyes / runes / energy, golden hour or moody overcast, hard directional shadows.
- CINEMATIC FRAMING: low-angle hero shot OR wide environmental shot. Dynamic pose captured mid-motion (jumping, falling, charging, casting). Never a static portrait.
- 3D PIXAR-QUALITY RENDER: photorealistic lighting, detailed textures, cinematic depth of field. NEVER flat 2D, NEVER anime, NEVER cartoon.

MOTION LANGUAGE:
- Slow cinematic camera move (push-in, crane up, parallax pan).
- Strong primary action (character is flying / falling / running / unleashing power).
- Secondary motion: cloth physics, hair, particles, atmospheric drift, glow pulsing.
- 8 seconds total runtime — single shot, no cuts.

AUDIO STRATEGY (no AI narration — silent + text + music):
- textOverlay: ONE short punchy line (max 8 words). Fragment-style, mythic, written like a movie poster tagline. Examples: "He chose the storm.", "Some doors should stay closed.", "The last of his kind."
- musicVibe: a one-line music direction the creator can use to pick a track in CapCut. Format: "<tempo> <mood> <instrumentation>". Examples: "slow epic orchestral with deep choir build", "tense ambient drone with rising sub-bass", "haunting solo piano with distant strings".
- moodTags: 3-5 short atmosphere tags used to pull matching reference images (e.g. "cloud-titan", "rim-lit-silhouette", "godlike-scale").

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export interface HeroShotInput {
  scenarioSeed?: string;
  themeHint?: string; // optional — e.g. "mythic fantasy", "cosmic horror", "post-apocalyptic"
  referenceMoodNotes?: string; // optional — pulled from reference library to steer the look
}

export function buildGenerateHeroShotPrompt(input: HeroShotInput): string {
  const seed = input.scenarioSeed?.trim();
  const theme = input.themeHint?.trim();
  const refs = input.referenceMoodNotes?.trim();

  return `Generate ONE cinematic hero-shot reel concept.

${seed ? `User's scenario seed: "${seed}"\nUse this as the kernel of the idea but expand it into the full hero-shot formula above.` : "Invent a fresh, shocking scenario from scratch."}
${theme ? `Theme / aesthetic direction: ${theme}` : ""}
${refs ? `Reference mood notes (pull from this look library): ${refs}` : ""}

Return JSON exactly matching this schema:
{
  "title": "string (short, evocative, suitable as a video caption / title)",
  "scenario": "string (1-2 sentences describing what's happening in the shot)",
  "imagePrompt": "string (detailed Leonardo / Albedo XL / Pixar-style image prompt for the hero frame. Must include: subject + scale-contrast element, environment with atmospheric depth, dramatic lighting direction, camera angle, art-direction adjectives, '9:16 portrait, cinematic composition, Pixar-quality 3D render, photorealistic lighting'. Aim for 60-120 words.)",
  "motionPrompt": "string (cinematic motion description for the image-to-video step. Describe primary action + camera move + secondary motion (particles/cloth/atmosphere). Aim for 30-60 words. Must work as a single 8-second shot.)",
  "textOverlay": "string (ONE short punchy line, max 8 words, mythic / movie-poster-tagline tone, plain text, no emojis, no quotation marks)",
  "musicVibe": "string (one-line music direction: tempo + mood + instrumentation. Single sentence.)",
  "moodTags": ["array of 3-5 short atmosphere tags like 'cloud-titan', 'rim-lit-silhouette', 'godlike-scale' for reference matching"],
  "themeTags": ["array of 3-5 short theme tags like 'mythic', 'cosmic', 'survival', 'transformation' for caption hashtags"]
}

The imagePrompt MUST hit ALL of these in the description (no exceptions):
1. The small character (what they look like, what they're wearing, mid-action pose)
2. The colossal element (creature/structure/force) and its scale relative to the character
3. Environment + atmospheric depth (fog, particles, distance haze, god rays)
4. Dramatic lighting direction (rim light, glow, golden hour, overcast)
5. Camera angle (low-angle hero / wide environmental)
6. Art-direction tag suffix: "9:16 portrait, cinematic composition, Pixar-quality 3D render, photorealistic lighting, atmospheric depth, volumetric fog"`;
}
