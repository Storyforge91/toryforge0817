"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Episode, Scene, PlatformCaptions, ImagePrompt } from "@/types";

interface EpisodeStore {
  episodes: Episode[];

  addEpisode: (data: {
    storylineId: string;
    number: number;
    title: string;
    hook: string;
    synopsis: string;
    emotionalArc: string;
    cliffhanger: string;
    voiceScript: string;
    scenes: Omit<Scene, "id" | "episodeId" | "imagePrompt">[];
    captions?: PlatformCaptions;
  }) => string;

  updateEpisode: (id: string, data: Partial<Episode>) => void;
  deleteEpisode: (id: string) => void;
  getEpisodesByStoryline: (storylineId: string) => Episode[];
  getEpisode: (id: string) => Episode | undefined;
}

const emptyCaptions: PlatformCaptions = {
  instagram: { caption: "", hashtags: [], cta: "", pinnedComment: "" },
  tiktok: { caption: "", hashtags: [], cta: "" },
  youtube: { title: "", description: "", tags: [] },
};

const emptyImagePrompt: ImagePrompt = { universal: "" };

export const useEpisodeStore = create<EpisodeStore>()(
  persist(
    (set, get) => ({
      episodes: [],

      addEpisode: (data) => {
        const episodeId = uuid();
        const scenes: Scene[] = data.scenes.map((s, i) => ({
          ...s,
          id: uuid(),
          episodeId,
          order: s.order ?? i + 1,
          imagePrompt: emptyImagePrompt,
        }));

        const episode: Episode = {
          id: episodeId,
          storylineId: data.storylineId,
          number: data.number,
          title: data.title,
          hook: data.hook,
          synopsis: data.synopsis,
          scenes,
          voiceScript: data.voiceScript,
          captions: data.captions ?? emptyCaptions,
          emotionalArc: data.emotionalArc,
          cliffhanger: data.cliffhanger,
          status: "generated",
          previousEpisodeSummary: "",
          createdAt: new Date(),
        };

        set((state) => ({ episodes: [...state.episodes, episode] }));
        return episodeId;
      },

      updateEpisode: (id, data) =>
        set((state) => ({
          episodes: state.episodes.map((e) =>
            e.id === id ? { ...e, ...data } : e,
          ),
        })),

      deleteEpisode: (id) =>
        set((state) => ({
          episodes: state.episodes.filter((e) => e.id !== id),
        })),

      getEpisodesByStoryline: (storylineId) =>
        get().episodes.filter((e) => e.storylineId === storylineId),

      getEpisode: (id) => get().episodes.find((e) => e.id === id),
    }),
    {
      name: "storyforge-episodes",
      version: 1,
      migrate: (persisted: unknown) => {
        if (persisted && typeof persisted === "object") {
          const state = persisted as { episodes?: Partial<Episode>[] };
          if (Array.isArray(state.episodes)) {
            state.episodes = state.episodes.map((e) => ({
              ...e,
              scenes: e.scenes ?? [],
              captions: e.captions ?? emptyCaptions,
              status: e.status ?? "generated",
              previousEpisodeSummary: e.previousEpisodeSummary ?? "",
            }));
          }
          return state as EpisodeStore;
        }
        return persisted as EpisodeStore;
      },
    },
  ),
);
