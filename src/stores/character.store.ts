"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { Character, CharacterExpression } from "@/types";

interface CharacterStore {
  characters: Character[];

  addCharacter: (
    data: Partial<Omit<Character, "id" | "consistencyPrompt" | "appearances">> & {
      name: string;
      kind: "cinematic" | "comedy";
    },
    id?: string,
  ) => string;

  updateCharacter: (id: string, data: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  getCharactersByStoryline: (storylineId: string) => Character[];
  getCharactersByKind: (kind: "cinematic" | "comedy") => Character[];
  getCharacter: (id: string) => Character | undefined;

  // Expression helpers (comedy characters only)
  addExpression: (characterId: string, expression: CharacterExpression) => void;
  updateExpression: (
    characterId: string,
    name: string,
    partial: Partial<CharacterExpression>,
  ) => void;
  removeExpression: (characterId: string, name: string) => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [],

      addCharacter: (data, existingId?) => {
        const id = existingId ?? uuid();
        const character: Character = {
          id,
          kind: data.kind,
          name: data.name,
          storylineId: data.storylineId,
          role: data.role ?? "recurring",
          personality: data.personality ?? "",
          emotionalWound: data.emotionalWound ?? "",
          motivation: data.motivation ?? "",
          visualDescription: data.visualDescription ?? "",
          consistencyPrompt: "",
          appearances: [],
          referenceImageUrl: data.referenceImageUrl,
          speechPattern: data.speechPattern,
          expressions: data.expressions,
        };
        set((state) => ({ characters: [...state.characters, character] }));
        return id;
      },

      updateCharacter: (id, data) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...data } : c,
          ),
        })),

      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
        })),

      getCharactersByStoryline: (storylineId) =>
        get().characters.filter((c) => c.storylineId === storylineId),

      getCharactersByKind: (kind) =>
        get().characters.filter((c) => c.kind === kind),

      getCharacter: (id) => get().characters.find((c) => c.id === id),

      addExpression: (characterId, expression) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            const existing = c.expressions ?? [];
            const filtered = existing.filter((e) => e.name !== expression.name);
            return { ...c, expressions: [...filtered, expression] };
          }),
        })),

      updateExpression: (characterId, name, partial) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            const existing = c.expressions ?? [];
            return {
              ...c,
              expressions: existing.map((e) =>
                e.name === name ? { ...e, ...partial } : e,
              ),
            };
          }),
        })),

      removeExpression: (characterId, name) =>
        set((state) => ({
          characters: state.characters.map((c) => {
            if (c.id !== characterId) return c;
            return {
              ...c,
              expressions: (c.expressions ?? []).filter((e) => e.name !== name),
            };
          }),
        })),
    }),
    {
      name: "storyforge-characters",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // v0/v1 → v2: stamp every existing character with kind "cinematic"
        if (version < 2 && persisted && typeof persisted === "object") {
          const state = persisted as { characters?: Partial<Character>[] };
          if (Array.isArray(state.characters)) {
            state.characters = state.characters.map((c) => ({
              ...c,
              kind: c.kind ?? "cinematic",
            }));
          }
          return state as CharacterStore;
        }
        return persisted as CharacterStore;
      },
    },
  ),
);
