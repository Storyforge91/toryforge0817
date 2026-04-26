"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Storyline, Character, NarrativeArc } from "@/types";
import { useCharacterStore } from "./character.store";

interface StorylineStore {
  storylines: Storyline[];
  activeStorylineId: string | null;

  addStoryline: (data: {
    title: string;
    premise: string;
    genre: string;
    tone: string;
    targetPlatform: Storyline["targetPlatform"];
    narrativeArc: NarrativeArc;
    characters: Omit<Character, "id" | "storylineId" | "consistencyPrompt" | "appearances">[];
  }) => string;

  updateStoryline: (id: string, data: Partial<Storyline>) => void;
  deleteStoryline: (id: string) => void;
  setActive: (id: string | null) => void;
  getStoryline: (id: string) => Storyline | undefined;
}

export const useStorylineStore = create<StorylineStore>()(
  persist(
    (set, get) => ({
      storylines: [],
      activeStorylineId: null,

      addStoryline: (data) => {
        const storylineId = uuid();
        const characters: Character[] = data.characters.map((c) => ({
          ...c,
          id: uuid(),
          storylineId,
          consistencyPrompt: "",
          appearances: [],
        }));

        const storyline: Storyline = {
          id: storylineId,
          title: data.title,
          premise: data.premise,
          genre: data.genre,
          tone: data.tone,
          targetPlatform: data.targetPlatform,
          narrativeArc: {
            ...data.narrativeArc,
            currentStage: data.narrativeArc.currentStage ?? 0,
          },
          characters,
          episodes: [],
          storyMemory: "",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({ storylines: [...state.storylines, storyline] }));

        // Sync characters to the character store so they are globally accessible
        const { addCharacter } = useCharacterStore.getState();
        for (const char of characters) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, consistencyPrompt, appearances, ...charData } = char;
          addCharacter(charData, id);
        }

        return storylineId;
      },

      updateStoryline: (id, data) =>
        set((state) => ({
          storylines: state.storylines.map((s) =>
            s.id === id ? { ...s, ...data, updatedAt: new Date() } : s,
          ),
        })),

      deleteStoryline: (id) =>
        set((state) => ({
          storylines: state.storylines.filter((s) => s.id !== id),
          activeStorylineId:
            state.activeStorylineId === id ? null : state.activeStorylineId,
        })),

      setActive: (id) => set({ activeStorylineId: id }),

      getStoryline: (id) => get().storylines.find((s) => s.id === id),
    }),
    { name: "storyforge-storylines" },
  ),
);
