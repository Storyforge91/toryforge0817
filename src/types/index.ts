// Storyline — a series with its own narrative arc
export interface Storyline {
  id: string;
  title: string;
  premise: string;
  genre: string;
  tone: string;
  targetPlatform: "tiktok" | "reels" | "shorts" | "all";
  narrativeArc: NarrativeArc;
  characters: Character[];
  episodes: Episode[];
  storyMemory: string;
  status: "active" | "paused" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

// Episode — a single piece of content within a storyline
export interface Episode {
  id: string;
  storylineId: string;
  number: number;
  title: string;
  hook: string;
  synopsis: string;
  scenes: Scene[];
  voiceScript: string;
  captions: PlatformCaptions;
  emotionalArc: string;
  cliffhanger: string;
  status: "idea" | "generated" | "produced" | "posted";
  previousEpisodeSummary: string;
  createdAt: Date;
}

// Character — recurring persona. Used by both cinematic storylines and comedy skits.
export interface Character {
  id: string;
  kind: "cinematic" | "comedy";
  storylineId?: string; // required for cinematic, undefined for comedy
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "recurring";
  personality: string;
  emotionalWound: string;
  motivation: string;
  visualDescription: string;
  consistencyPrompt: string;
  referenceImageUrl?: string;
  appearances: string[];
  // Comedy-only fields
  speechPattern?: string;
  expressions?: CharacterExpression[];
  voiceId?: string; // ElevenLabs voice ID for this character
  voiceName?: string; // ElevenLabs voice display name
}

// CharacterExpression — a single pose/expression asset for comedy characters
export interface CharacterExpression {
  name: string; // "happy", "shocked", "angry", "neutral", "talking", etc.
  assetUrl: string;
  prompt?: string;
  tags: string[];
}

// Scene — a single visual moment within an episode
export interface Scene {
  id: string;
  episodeId: string;
  order: number;
  environment: string;
  mood: string;
  cameraAngle: string;
  characterPresence: string[];
  cinematicDescription: string;
  imagePrompt: ImagePrompt;
  motionPrompt?: string;
  duration: number;
  narrationText: string;
}

// ImagePrompt — model-specific image generation prompt
export interface ImagePrompt {
  universal: string;
  midjourney?: string;
  leonardo?: string;
  dalle?: string;
  flux?: string;
}

// PlatformCaptions — per-platform optimized captions
export interface PlatformCaptions {
  instagram: {
    caption: string;
    hashtags: string[];
    cta: string;
    pinnedComment: string;
  };
  tiktok: {
    caption: string;
    hashtags: string[];
    cta: string;
  };
  youtube: {
    title: string;
    description: string;
    tags: string[];
  };
}

// NarrativeArc — the story structure template
export interface NarrativeArc {
  type: string;
  stages: string[];
  currentStage: number;
  totalEpisodes: number;
}

// CalendarItem — content scheduling. Polymorphic over episodes and skits.
export interface CalendarItem {
  id: string;
  contentType: "episode" | "skit";
  contentId: string;
  platform: "tiktok" | "instagram" | "youtube";
  scheduledDate: Date;
  status: "scheduled" | "uploading" | "posted" | "failed";
  postUrl?: string;
  // Auto-poster fields
  publishId?: string; // The provider's publish_id (TikTok) for status polling
  errorMessage?: string;
  postedAt?: Date;
  attemptedAt?: Date;
  attemptCount?: number;
}

// TikTokAuth — credentials returned by TikTok's OAuth flow.
// Stored client-side via Zustand persist for now (move to server-side
// encrypted storage in production).
export interface TikTokAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
  refreshExpiresAt: number; // Unix ms
  scope: string;
  openId: string;
  tokenType: string;
  // Profile info (fetched once after auth)
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Comedy skit domain
// ────────────────────────────────────────────────────────────────────────────

// SkitCategory — content categories for 2D comedy
export type SkitCategory =
  | "work_office"
  | "school"
  | "relationships"
  | "technology"
  | "daily_life"
  | "trending_audio"
  | "cultural"
  | "gaming";

// AudioStyle — how audio is handled for the skit
export type AudioStyle =
  | "trending_audio"
  | "voiceover"
  | "text_only"
  | "mixed";

// SkitBeat — a single moment/expression change in the skit
export interface SkitBeat {
  order: number;
  description: string; // "Character looks confident"
  expression: string; // maps to CharacterExpression.name
  characterId?: string; // which character this beat features
  duration: number; // seconds
  textOverlay?: string;
  soundEffect?: string;
  cameraAction?: string;
  videoUrl?: string; // animated clip for this beat (Phase 3)
}

// DialogueLine — a single line of character dialogue
export interface DialogueLine {
  characterId: string;
  text: string;
  emotion: string;
  timing: number; // seconds from skit start
}

// Skit — a single comedy video concept
export interface Skit {
  id: string;
  title: string;
  category: SkitCategory;
  scenario: string;
  beats: SkitBeat[];
  dialogue: DialogueLine[];
  audioStyle: AudioStyle;
  trendingAudioRef?: string;
  captions?: PlatformCaptions;
  characterIds: string[];
  status: "idea" | "scripted" | "animated" | "produced" | "posted";
  performanceNotes?: string;
  voiceUrl?: string; // full narration audio (Phase 2)
  voiceScript?: string; // assembled script that was sent to TTS
  createdAt: Date;
}
