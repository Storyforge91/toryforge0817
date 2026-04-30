/**
 * Seed quotes for the @SetsandStruggles voice.
 * Each one follows the brand formula: stressor → reset.
 * Edit freely in the /quotes UI; the seed list is just a starting cadence.
 */
export const QUOTE_SEEDS: string[] = [
  "Couldn't sleep. Squat day anyway.",
  "Therapy is $200/hr. This is $40/month.",
  "Got bad news. Didn't tell anyone. Came here.",
  "Day that wouldn't end. 5x5 made it end.",
  "Showed up tired. Left less tired.",
  "Anger doesn't lift weights. Discipline does. But anger gets you in the car.",
  "Funeral was at 2. Gym was at 5.",
  "Lost the argument. Won the set.",
  "The weights ask nothing of you except to come back.",
  "Couldn't fix the problem at home. Could fix this rep.",
  "Iron is the cheapest therapist.",
  "Some days you don't lift to get stronger. You lift to keep going.",
];

/**
 * Default Leonardo prompt for generating atmospheric gym backgrounds.
 * No people. Empty rack, dim lighting, dust, chalk. Cinematic and moody.
 * The renderer composites the quote on top of this.
 */
export const QUOTE_BACKGROUND_PROMPT =
  "Empty squat rack in a dim industrial gym at dawn, single overhead light, chalk dust drifting in the air, weathered concrete floor, rusted iron plates stacked nearby, atmospheric haze, dramatic shadows, no people, cinematic film still, moody, 9:16 portrait composition";

/** Brand label rendered at the bottom of each card. */
export const QUOTE_BRAND_LABEL = "@SetsandStruggles";

/** Output dimensions — IG feed/Reels safe (1080×1920). */
export const QUOTE_CARD_WIDTH = 1080;
export const QUOTE_CARD_HEIGHT = 1920;
