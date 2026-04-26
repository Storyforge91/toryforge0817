"use client";

import { useState } from "react";
import Link from "next/link";
import { useEpisodeStore } from "@/stores/episode.store";
import { useStorylineStore } from "@/stores/storyline.store";
import type { Episode } from "@/types";

const statusColors: Record<Episode["status"], string> = {
  idea: "bg-zinc-800 text-zinc-300 border-zinc-600",
  generated: "bg-blue-900/60 text-blue-300 border-blue-700",
  produced: "bg-amber-900/60 text-amber-300 border-amber-700",
  posted: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EpisodesPage() {
  const { episodes } = useEpisodeStore();
  const { storylines } = useStorylineStore();
  const [filterStoryline, setFilterStoryline] = useState("all");

  const storylineMap = new Map(storylines.map((s) => [s.id, s.title]));

  const filtered =
    filterStoryline === "all"
      ? episodes
      : episodes.filter((e) => e.storylineId === filterStoryline);

  const sorted = [...filtered].sort((a, b) => {
    if (a.storylineId !== b.storylineId)
      return a.storylineId.localeCompare(b.storylineId);
    return a.number - b.number;
  });

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Episodes</h1>
            <p className="mt-2 text-zinc-400">
              Browse and manage episodes across all storylines.
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-8">
          <label className="mr-3 text-sm text-zinc-400">
            Filter by storyline:
          </label>
          <select
            value={filterStoryline}
            onChange={(e) => setFilterStoryline(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
          >
            <option value="all">All Storylines</option>
            {storylines.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Episodes list */}
        {sorted.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-16 text-center">
            <div className="mb-3 text-4xl text-zinc-700">&#127916;</div>
            <p className="text-sm text-zinc-500">
              No episodes yet. Generate your first episode from a storyline.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800">
            {/* Table header */}
            <div className="grid grid-cols-[60px_1fr_1fr_120px_80px_120px] gap-4 border-b border-zinc-800 bg-zinc-950 px-5 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
              <span>#</span>
              <span>Title</span>
              <span>Storyline</span>
              <span>Status</span>
              <span>Scenes</span>
              <span>Date</span>
            </div>

            {/* Table rows */}
            {sorted.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.id}`}
                className="grid grid-cols-[60px_1fr_1fr_120px_80px_120px] gap-4 border-b border-zinc-800/50 px-5 py-4 text-sm transition-colors hover:bg-zinc-900/60"
              >
                <span className="font-mono text-zinc-400">
                  {String(ep.number).padStart(2, "0")}
                </span>
                <span className="truncate font-medium text-white">
                  {ep.title}
                </span>
                <span className="truncate text-zinc-400">
                  {storylineMap.get(ep.storylineId) || "Unknown"}
                </span>
                <span>
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[ep.status]}`}
                  >
                    {ep.status}
                  </span>
                </span>
                <span className="text-zinc-500">
                  {ep.scenes.length} scene{ep.scenes.length !== 1 ? "s" : ""}
                </span>
                <span className="text-zinc-500">
                  {formatDate(ep.createdAt)}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Summary */}
        {sorted.length > 0 && (
          <p className="mt-4 text-xs text-zinc-600">
            Showing {sorted.length} episode{sorted.length !== 1 ? "s" : ""}
            {filterStoryline !== "all" && (
              <>
                {" "}
                in{" "}
                <span className="text-zinc-400">
                  {storylineMap.get(filterStoryline)}
                </span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
