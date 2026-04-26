import { generateWithClaude } from "../providers";
import {
  STORYLINE_SYSTEM_PROMPT,
  buildGenerateStorylinePrompt,
} from "../prompts/storyline.prompt";
import {
  EPISODE_SYSTEM_PROMPT,
  buildGenerateEpisodePrompt,
} from "../prompts/episode.prompt";
import {
  CAPTION_SYSTEM_PROMPT,
  buildGenerateCaptionsPrompt,
} from "../prompts/caption.prompt";
import type {
  Storyline,
  Character,
  NarrativeArc,
  PlatformCaptions,
} from "@/types";

interface GeneratedStoryline {
  title: string;
  premise: string;
  genre: string;
  tone: string;
  narrativeArc: Omit<NarrativeArc, "currentStage">;
  characters: Omit<Character, "id" | "storylineId" | "consistencyPrompt" | "appearances" | "kind">[];
}

interface GeneratedEpisode {
  title: string;
  hook: string;
  synopsis: string;
  emotionalArc: string;
  cliffhanger: string;
  voiceScript: string;
  scenes: {
    order: number;
    environment: string;
    mood: string;
    cameraAngle: string;
    characterPresence: string[];
    cinematicDescription: string;
    duration: number;
    narrationText: string;
  }[];
  updatedStoryMemory: string;
}

export async function generateStoryline(params: {
  genre: string;
  tone: string;
  targetPlatform: string;
  premise?: string;
}): Promise<GeneratedStoryline> {
  return generateWithClaude<GeneratedStoryline>(
    STORYLINE_SYSTEM_PROMPT,
    buildGenerateStorylinePrompt(params),
  );
}

export async function generateEpisode(params: {
  storyline: Storyline;
  episodeNumber: number;
}): Promise<GeneratedEpisode> {
  const { storyline, episodeNumber } = params;

  return generateWithClaude<GeneratedEpisode>(
    EPISODE_SYSTEM_PROMPT,
    buildGenerateEpisodePrompt({
      storylineTitle: storyline.title,
      premise: storyline.premise,
      genre: storyline.genre,
      tone: storyline.tone,
      narrativeArc: storyline.narrativeArc,
      characters: storyline.characters.map((c) => ({
        name: c.name,
        role: c.role,
        personality: c.personality,
        visualDescription: c.visualDescription,
      })),
      episodeNumber,
      storyMemory: storyline.storyMemory,
    }),
  );
}

/**
 * Generate platform captions from flat fields. Works for both cinematic
 * episodes and 2D comedy skits — the prompt only needs title, hook, synopsis,
 * genre, tone, and an optional series/storyline title.
 */
export async function generateCaptions(params: {
  title: string;
  hook: string;
  synopsis: string;
  genre: string;
  tone: string;
  storylineTitle?: string;
  episodeNumber?: number;
}): Promise<PlatformCaptions> {
  return generateWithClaude<PlatformCaptions>(
    CAPTION_SYSTEM_PROMPT,
    buildGenerateCaptionsPrompt({
      storylineTitle: params.storylineTitle ?? params.title,
      episodeTitle: params.title,
      episodeNumber: params.episodeNumber ?? 1,
      hook: params.hook,
      synopsis: params.synopsis,
      genre: params.genre,
      tone: params.tone,
    }),
  );
}
