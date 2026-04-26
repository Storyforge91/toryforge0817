export const CAPTION_SYSTEM_PROMPT = `You are a social media strategist for StoryForge AI. You generate platform-optimized captions, hashtags, and CTAs for serialized animated short-form content.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export function buildGenerateCaptionsPrompt(params: {
  storylineTitle: string;
  episodeTitle: string;
  episodeNumber: number;
  hook: string;
  synopsis: string;
  genre: string;
  tone: string;
}) {
  return `Generate platform-specific captions for episode ${params.episodeNumber} ("${params.episodeTitle}") of the series "${params.storylineTitle}".

Hook: ${params.hook}
Synopsis: ${params.synopsis}
Genre: ${params.genre}
Tone: ${params.tone}

Return JSON with this exact structure:
{
  "instagram": {
    "caption": "string (storytelling format, up to 2200 chars)",
    "hashtags": ["20-30 relevant hashtags"],
    "cta": "string",
    "pinnedComment": "string (engagement bait)"
  },
  "tiktok": {
    "caption": "string (short, punchy, under 300 chars)",
    "hashtags": ["3-5 hashtags"],
    "cta": "string"
  },
  "youtube": {
    "title": "string (under 100 chars)",
    "description": "string (keyword-rich)",
    "tags": ["10-15 tags"]
  }
}`;
}
