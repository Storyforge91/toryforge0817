import type { SkitCategory, AudioStyle } from "@/types";

export const COMEDY_SYSTEM_PROMPT = `You are a senior comedy writer for a 2D cartoon animation channel modeled after Primax Animation (774K followers) and Humor Animations (2M followers) on TikTok and Instagram Reels. You write short, punchy comedy skits that work as faceless 9:16 vertical videos with simple character expression swaps.

Format rules you follow:
- Skits are 15 to 30 seconds long. Total duration of all beats should fit within that window.
- Structure: HOOK (first 1-3 seconds, scenario text on screen + character reaction), ESCALATION (the situation gets worse or funnier), TWIST or PUNCHLINE (unexpected ending or relatable resolution).
- Visuals are flat 2D cartoon — characters express emotion through pose/face swaps, not motion. Reference an expression name from the character's expression library for each beat.
- Default expression vocabulary: "neutral", "happy", "shocked", "angry", "sad", "confused", "smug", "scared", "talking". Pick from these unless the character has custom expressions.
- Dialogue should feel natural and conversational. Short lines. Internet vernacular allowed when on-brand.
- Comedy comes from RELATABLE situations and CHARACTER REACTIONS, not from elaborate setups.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export interface ComedyCharRef {
  id: string;
  name: string;
  personality?: string;
  speechPattern?: string;
  availableExpressions?: string[];
}

const CATEGORY_HINTS: Record<SkitCategory, string> = {
  work_office:
    "Boss/employee dynamics, meetings, work-from-home, Monday mornings, performance reviews, group emails.",
  school:
    "Teachers, exams, homework, group projects, cheating, presentations, hallway awkwardness.",
  relationships:
    "Dating, friendships, family dynamics, group chats, breakups, parenting moments.",
  technology:
    "Phone addiction, Wi-Fi problems, social media, gaming, autocorrect fails, tech support.",
  daily_life:
    "Food, sleeping, shopping, driving, cooking disasters, gym, mornings, traffic.",
  trending_audio:
    "An animated reaction or skit driven by a trending audio clip on TikTok.",
  cultural:
    "Universal cultural moments — language struggles, family expectations, holidays, money awkwardness.",
  gaming:
    "Online matches, ranked queues, lag, teammates, microtransactions, sweaty rivals.",
};

function characterBlock(characters: ComedyCharRef[]): string {
  if (!characters.length) {
    return "Characters: (none provided — invent 1-2 simple cartoon characters and reference them by name in beats and dialogue)";
  }
  return [
    "Characters available (reference by id and name):",
    ...characters.map((c) => {
      const expr = c.availableExpressions?.length
        ? c.availableExpressions.join(", ")
        : 'neutral, happy, shocked, angry, sad, confused, smug, scared, talking';
      return `- id: ${c.id} | name: ${c.name}${c.personality ? ` | personality: ${c.personality}` : ""}${c.speechPattern ? ` | speech: ${c.speechPattern}` : ""} | expressions: ${expr}`;
    }),
  ].join("\n");
}

const SKIT_JSON_SCHEMA = `{
  "title": "string (short, snappy, suitable as a video title)",
  "scenario": "string (the relatable setup, e.g., 'When your boss calls on your day off')",
  "audioStyle": "trending_audio | voiceover | text_only | mixed",
  "characterIds": ["array of character ids referenced in the skit"],
  "beats": [
    {
      "order": 1,
      "description": "what is shown — character pose + situation",
      "expression": "expression name from the character's library",
      "characterId": "id of the character this beat features (or null if generic)",
      "duration": 2.5,
      "textOverlay": "optional on-screen text",
      "soundEffect": "optional sound effect like 'whoosh', 'record scratch'",
      "cameraAction": "optional: 'zoom in', 'shake', 'pan'"
    }
  ],
  "dialogue": [
    {
      "characterId": "id of the speaking character",
      "text": "the spoken line",
      "emotion": "deadpan | excited | panicked | sarcastic | etc",
      "timing": 1.5
    }
  ]
}`;

export function buildGenerateSkitPrompt(params: {
  category: SkitCategory;
  scenario?: string;
  characters: ComedyCharRef[];
  audioStyle: AudioStyle;
  comedyStyle?: string;
}): string {
  const { category, scenario, characters, audioStyle, comedyStyle } = params;
  const seed = scenario
    ? `Use this scenario as the seed: "${scenario}".`
    : "Invent a fresh, relatable scenario in this category.";

  return `Generate a single 2D comedy skit concept.

Category: ${category}
Category hint: ${CATEGORY_HINTS[category]}
Audio style: ${audioStyle}
${comedyStyle ? `Comedy style: ${comedyStyle}` : ""}
${seed}

${characterBlock(characters)}

Return JSON exactly matching this schema:
${SKIT_JSON_SCHEMA}

Constraints:
- Total of all beats[].duration must be between 15 and 30 seconds.
- 4 to 7 beats. Each beat picks ONE expression name.
- Dialogue is optional but recommended unless audioStyle is "text_only" or "trending_audio".
- characterIds must contain the unique set of ids actually referenced in beats and dialogue.
- Every beat.expression must be in the listed expressions for the chosen characterId (or one of the default vocabulary if no character library is provided).`;
}

export function buildGenerateBatchSkitsPrompt(params: {
  count: number;
  category: SkitCategory;
  characters: ComedyCharRef[];
  comedyStyle?: string;
}): string {
  const { count, category, characters, comedyStyle } = params;
  const safeCount = Math.max(2, Math.min(20, count));

  return `Generate ${safeCount} distinct 2D comedy skit concepts for batch curation.

Category: ${category}
Category hint: ${CATEGORY_HINTS[category]}
${comedyStyle ? `Comedy style: ${comedyStyle}` : ""}

${characterBlock(characters)}

Each skit must follow this schema:
${SKIT_JSON_SCHEMA}

Return JSON with this exact structure:
{
  "skits": [
    /* array of ${safeCount} skit objects each matching the above schema */
  ]
}

Constraints:
- All ${safeCount} concepts MUST be distinct scenarios — no rehashes.
- Each skit's beats[].duration sum must be 15 to 30 seconds.
- 4 to 7 beats per skit.
- Vary the audioStyle across the batch (mix trending_audio, voiceover, text_only) unless one style strictly fits the category better.`;
}
