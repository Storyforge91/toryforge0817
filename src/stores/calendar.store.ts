"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type { CalendarItem } from "@/types";

interface CalendarStore {
  items: CalendarItem[];

  addItem: (data: Omit<CalendarItem, "id" | "status" | "postUrl">) => string;
  updateItem: (id: string, data: Partial<CalendarItem>) => void;
  deleteItem: (id: string) => void;
  getItemsByDate: (date: Date) => CalendarItem[];
  getItemsByContent: (
    contentType: "episode" | "skit",
    contentId: string,
  ) => CalendarItem[];
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (data) => {
        const id = uuid();
        const item: CalendarItem = { ...data, id, status: "scheduled" };
        set((state) => ({ items: [...state.items, item] }));
        return id;
      },

      updateItem: (id, data) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      deleteItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      getItemsByDate: (date) =>
        get().items.filter(
          (i) =>
            new Date(i.scheduledDate).toDateString() === date.toDateString(),
        ),

      getItemsByContent: (contentType, contentId) =>
        get().items.filter(
          (i) => i.contentType === contentType && i.contentId === contentId,
        ),
    }),
    {
      name: "storyforge-calendar",
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        // v0/v1 → v2: convert {episodeId, storylineId} → {contentType: "episode", contentId}
        if (version < 2 && persisted && typeof persisted === "object") {
          const state = persisted as {
            items?: Array<
              Partial<CalendarItem> & {
                episodeId?: string;
                storylineId?: string;
              }
            >;
          };
          if (Array.isArray(state.items)) {
            state.items = state.items.map((item) => {
              if (item.contentType && item.contentId) return item;
              const legacyEpisodeId = item.episodeId;
              return {
                ...item,
                contentType: "episode",
                contentId: legacyEpisodeId ?? "",
              };
            });
          }
          return state as CalendarStore;
        }
        return persisted as CalendarStore;
      },
    },
  ),
);
