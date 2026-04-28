"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HeroShotReference } from "@/lib/references/hero-shot.references";

/**
 * User-added Hero Shot references. Persisted in localStorage.
 *
 * The built-in seed library lives in src/lib/references/hero-shot.references.ts
 * and ships with the code. This store layers user-added references on top so
 * the user can grow the library without editing source files.
 *
 * The hero-shot service still only reads the seed library directly today.
 * Once the user has added enough references via the UI, the next iteration
 * will read merged seed + user references in the service. Keeping this in a
 * store first lets the user start curating without a second deploy step.
 */

export interface UserReference extends HeroShotReference {
  createdAt: string; // ISO timestamp
}

interface ReferenceStore {
  references: UserReference[];
  addReference: (input: Omit<UserReference, "createdAt">) => void;
  updateReference: (id: string, partial: Partial<UserReference>) => void;
  removeReference: (id: string) => void;
}

export const useReferenceStore = create<ReferenceStore>()(
  persist(
    (set) => ({
      references: [],
      addReference: (input) =>
        set((state) => ({
          references: [
            ...state.references.filter((r) => r.id !== input.id),
            { ...input, createdAt: new Date().toISOString() },
          ],
        })),
      updateReference: (id, partial) =>
        set((state) => ({
          references: state.references.map((r) =>
            r.id === id ? { ...r, ...partial } : r,
          ),
        })),
      removeReference: (id) =>
        set((state) => ({
          references: state.references.filter((r) => r.id !== id),
        })),
    }),
    {
      name: "storyforge-references",
      version: 1,
    },
  ),
);
