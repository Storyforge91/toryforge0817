"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QUOTE_SEEDS } from "@/data/quote-seeds";

export interface QuoteCard {
  id: string;
  quote: string;
  /** Public URL of the generated/imported background image, if any. */
  backgroundUrl?: string;
  /** ISO date string for when this card should be posted (UI-only, no auto-post). */
  scheduledAt?: string;
  /** Whether the user has marked this card as posted. */
  posted: boolean;
  createdAt: string;
}

interface QuoteCardStore {
  cards: QuoteCard[];
  /** Initialize the store with seed quotes if it's empty. Idempotent. */
  ensureSeeded: () => void;
  addCard: (quote: string) => string;
  updateCard: (id: string, partial: Partial<QuoteCard>) => void;
  removeCard: (id: string) => void;
  clearAll: () => void;
}

function makeId() {
  return `qc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useQuoteCardStore = create<QuoteCardStore>()(
  persist(
    (set, get) => ({
      cards: [],
      ensureSeeded: () => {
        if (get().cards.length > 0) return;
        const now = new Date().toISOString();
        set({
          cards: QUOTE_SEEDS.map((quote) => ({
            id: makeId(),
            quote,
            posted: false,
            createdAt: now,
          })),
        });
      },
      addCard: (quote) => {
        const id = makeId();
        set((state) => ({
          cards: [
            {
              id,
              quote,
              posted: false,
              createdAt: new Date().toISOString(),
            },
            ...state.cards,
          ],
        }));
        return id;
      },
      updateCard: (id, partial) =>
        set((state) => ({
          cards: state.cards.map((c) =>
            c.id === id ? { ...c, ...partial } : c,
          ),
        })),
      removeCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        })),
      clearAll: () => set({ cards: [] }),
    }),
    {
      name: "storyforge-quote-cards",
      version: 1,
    },
  ),
);
