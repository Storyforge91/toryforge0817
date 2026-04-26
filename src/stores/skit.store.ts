"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  Skit,
  SkitBeat,
  DialogueLine,
  SkitCategory,
  AudioStyle,
  PlatformCaptions,
} from "@/types";

interface SkitStore {
  skits: Skit[];

  addSkit: (data: {
    title: string;
    category: SkitCategory;
    scenario: string;
    beats: SkitBeat[];
    dialogue: DialogueLine[];
    audioStyle: AudioStyle;
    characterIds: string[];
    trendingAudioRef?: string;
    captions?: PlatformCaptions;
  }) => string;

  updateSkit: (id: string, data: Partial<Skit>) => void;
  updateSkitBeat: (
    skitId: string,
    beatOrder: number,
    partial: Partial<SkitBeat>,
  ) => void;
  deleteSkit: (id: string) => void;
  getSkit: (id: string) => Skit | undefined;
  getSkitsByCategory: (category: SkitCategory) => Skit[];
  getSkitsByCharacter: (characterId: string) => Skit[];
}

export const useSkitStore = create<SkitStore>()(
  persist(
    (set, get) => ({
      skits: [],

      addSkit: (data) => {
        const id = uuid();
        const skit: Skit = {
          id,
          title: data.title,
          category: data.category,
          scenario: data.scenario,
          beats: data.beats,
          dialogue: data.dialogue,
          audioStyle: data.audioStyle,
          trendingAudioRef: data.trendingAudioRef,
          captions: data.captions,
          characterIds: data.characterIds,
          status: "scripted",
          createdAt: new Date(),
        };
        set((state) => ({ skits: [...state.skits, skit] }));
        return id;
      },

      updateSkit: (id, data) =>
        set((state) => ({
          skits: state.skits.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),

      updateSkitBeat: (skitId, beatOrder, partial) =>
        set((state) => ({
          skits: state.skits.map((s) =>
            s.id === skitId
              ? {
                  ...s,
                  beats: s.beats.map((b) =>
                    b.order === beatOrder ? { ...b, ...partial } : b,
                  ),
                }
              : s,
          ),
        })),

      deleteSkit: (id) =>
        set((state) => ({
          skits: state.skits.filter((s) => s.id !== id),
        })),

      getSkit: (id) => get().skits.find((s) => s.id === id),

      getSkitsByCategory: (category) =>
        get().skits.filter((s) => s.category === category),

      getSkitsByCharacter: (characterId) =>
        get().skits.filter((s) => s.characterIds.includes(characterId)),
    }),
    {
      name: "storyforge-skits",
      version: 1,
      migrate: (persisted: unknown) => {
        // Defensive default-fill for skits stored before this version.
        // Safe to run on any persisted shape — only fills missing fields.
        if (persisted && typeof persisted === "object") {
          const state = persisted as { skits?: Partial<Skit>[] };
          if (Array.isArray(state.skits)) {
            state.skits = state.skits.map((s) => ({
              ...s,
              characterIds: s.characterIds ?? [],
              beats: s.beats ?? [],
              dialogue: s.dialogue ?? [],
              status: s.status ?? "scripted",
            }));
          }
          return state as SkitStore;
        }
        return persisted as SkitStore;
      },
    },
  ),
);
