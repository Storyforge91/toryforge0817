"use client";

import Link from "next/link";
import { useSocialStore } from "@/stores/social.store";

export default function CalendarPage() {
  const tiktokAuth = useSocialStore((s) => s.tiktok);

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">Calendar</h1>
        <p className="mt-2 text-zinc-400">
          Hero shot scheduling is on the roadmap. For now, generate reels in
          the Studio and post manually after editing in CapCut.
        </p>

        {/* TikTok status */}
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-semibold text-zinc-300">
            TikTok Connection
          </h2>
          {tiktokAuth ? (
            <p className="mt-1 text-xs text-emerald-400/80">
              Connected as @
              {tiktokAuth.username || tiktokAuth.displayName || "creator"}.
              Auto-posting will become available once Hero Shot scheduling
              ships.
            </p>
          ) : (
            <p className="mt-1 text-xs text-amber-400/80">
              TikTok not connected.{" "}
              <Link
                href="/settings"
                className="underline hover:text-amber-300"
              >
                Connect on Settings
              </Link>
              .
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/50 p-10 text-center">
          <p className="text-sm text-zinc-500">
            No scheduled content yet.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Today&apos;s workflow: Studio → Download MP4 → CapCut (text +
            music) → post manually.
          </p>
          <Link
            href="/demo"
            className="mt-5 inline-block rounded-full bg-white px-6 py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200"
          >
            Open the Studio &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
