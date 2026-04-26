"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TikTokAuth } from "@/types";

/**
 * Stores OAuth credentials for connected social platforms.
 *
 * SECURITY NOTE (dev / MVP):
 * Tokens are persisted to localStorage via Zustand. Acceptable for a
 * single-user development build. For production:
 *   1. Move to server-side encrypted storage (DB row keyed by user).
 *   2. Use HTTP-only cookies for the refresh token.
 *   3. Refresh access tokens server-side only.
 */
interface SocialStore {
  tiktok: TikTokAuth | null;

  setTikTokAuth: (auth: TikTokAuth | null) => void;
  isTikTokConnected: () => boolean;
  isTikTokExpired: () => boolean;
}

export const useSocialStore = create<SocialStore>()(
  persist(
    (set, get) => ({
      tiktok: null,

      setTikTokAuth: (auth) => set({ tiktok: auth }),

      isTikTokConnected: () => Boolean(get().tiktok?.accessToken),

      isTikTokExpired: () => {
        const t = get().tiktok;
        if (!t) return false;
        return Date.now() >= t.expiresAt;
      },
    }),
    {
      name: "storyforge-social",
      version: 1,
    },
  ),
);
