"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStorylineStore } from "@/stores/storyline.store";
import { useEpisodeStore } from "@/stores/episode.store";
import type { Character, Storyline } from "@/types";

const roleColor: Record<Character["role"], string> = {
  protagonist: "bg-emerald-500/20 text-emerald-400",
  antagonist: "bg-red-500/20 text-red-400",
  supporting: "bg-blue-500/20 text-blue-400",
  recurring: "bg-amber-500/20 text-amber-400",
};

const statusColor: Record<Storyline["status"], string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-amber-500/20 text-amber-400",
  completed: "bg-blue-500/20 text-blue-400",
};

const episodeStatusColor: Record<string, string> = {
  idea: "bg-zinc-500/20 text-zinc-400",
  generated: "bg-purple-500/20 text-purple-400",
  produced: "bg-blue-500/20 text-blue-400",
  posted: "bg-emerald-500/20 text-emerald-400",
};

export default function StorylineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getStoryline, updateStoryline } = useStorylineStore();
  const { addEpisode, getEpisodesByStoryline } = useEpisodeStore();

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storyline = getStoryline(id);
  const episodes = getEpisodesByStoryline(id);

  if (!storyline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white">
            Storyline not found
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            This storyline may have been deleted or does not exist.
          </p>
          <Link
            href="/storylines"
            className="mt-4 inline-block text-sm text-zinc-400 underline underline-offset-4 hover:text-white"
          >
            Back to Storylines
          </Link>
        </div>
      </div>
    );
  }

  async function handleGenerateEpisode() {
    if (!storyline) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storylineId: storyline.id,
          title: storyline.title,
          premise: storyline.premise,
          genre: storyline.genre,
          tone: storyline.tone,
          targetPlatform: storyline.targetPlatform,
          characters: storyline.characters,
          narrativeArc: storyline.narrativeArc,
          storyMemory: storyline.storyMemory,
          existingEpisodeCount: episodes.length,
        }),
      });

      if (!res.ok) {
        throw new Error(`Episode generation failed (${res.status})`);
      }

      const data = await res.json();

      addEpisode({
        storylineId: storyline.id,
        number: data.number ?? episodes.length + 1,
        title: data.title ?? `Episode ${episodes.length + 1}`,
        hook: data.hook ?? "",
        synopsis: data.synopsis ?? "",
        emotionalArc: data.emotionalArc ?? "",
        cliffhanger: data.cliffhanger ?? "",
        voiceScript: data.voiceScript ?? "",
        scenes: data.scenes ?? [],
        captions: data.captions,
      });

      if (data.storyMemory) {
        updateStoryline(storyline.id, {
          storyMemory: data.storyMemory,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-4xl">
        {/* Back link */}
        <Link
          href="/storylines"
          className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white"
        >
          &larr; Back to Storylines
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{storyline.title}</h1>
            <p className="mt-2 max-w-2xl text-zinc-400">{storyline.premise}</p>
          </div>
          <span
            className={`shrink-0 self-start rounded-full px-3 py-1 text-xs font-medium ${
              statusColor[storyline.status]
            }`}
          >
            {storyline.status}
          </span>
        </div>

        {/* Meta chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
            {storyline.genre}
          </span>
          <span className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
            {storyline.tone}
          </span>
          <span className="rounded bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
            {storyline.targetPlatform === "all"
              ? "All Platforms"
              : storyline.targetPlatform.toUpperCase()}
          </span>
        </div>

        {/* Next-step CTAs */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <button
            onClick={handleGenerateEpisode}
            disabled={generating}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {generating
              ? "Generating..."
              : `Generate Episode ${episodes.length + 1} \u2192`}
          </button>
          <Link
            href="/characters"
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Manage Characters
          </Link>
          <Link
            href="/calendar"
            className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Schedule Episodes
          </Link>
          <p className="text-[11px] text-zinc-500">
            Each episode builds on previous ones &mdash; story memory carries
            forward automatically.
          </p>
        </div>

        {/* Narrative Arc */}
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Narrative Arc
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
              {storyline.narrativeArc.type}
            </span>
            <span className="text-xs text-zinc-500">
              Stage {storyline.narrativeArc.currentStage + 1} of{" "}
              {storyline.narrativeArc.stages.length}
            </span>
            <span className="text-xs text-zinc-500">
              {storyline.narrativeArc.totalEpisodes} total episodes planned
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {storyline.narrativeArc.stages.map((stage, i) => (
              <div key={stage} className="flex flex-col items-center gap-1">
                <div
                  className={`h-1.5 w-16 rounded-full ${
                    i <= storyline.narrativeArc.currentStage
                      ? "bg-white"
                      : "bg-zinc-700"
                  }`}
                />
                <span className="text-[10px] text-zinc-500">{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Characters section */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white">Characters</h2>

          {storyline.characters.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No characters yet. Generate an episode with AI to populate
                characters.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {storyline.characters.map((character) => (
                <div
                  key={character.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">
                      {character.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        roleColor[character.role]
                      }`}
                    >
                      {character.role}
                    </span>
                  </div>
                  {character.personality && (
                    <p className="mt-2 text-sm text-zinc-400">
                      <span className="font-medium text-zinc-300">
                        Personality:{" "}
                      </span>
                      {character.personality}
                    </p>
                  )}
                  {character.visualDescription && (
                    <p className="mt-1 text-sm text-zinc-400">
                      <span className="font-medium text-zinc-300">
                        Visual:{" "}
                      </span>
                      {character.visualDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Episodes section */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Episodes</h2>
            <button
              onClick={handleGenerateEpisode}
              disabled={generating}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Next Episode"}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {episodes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No episodes yet. Click &quot;Generate Next Episode&quot; to
                create the first one.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {episodes
                .sort((a, b) => a.number - b.number)
                .map((episode) => (
                  <Link
                    key={episode.id}
                    href={`/episodes/${episode.id}`}
                    className="group rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-zinc-300">
                          {episode.number}
                        </span>
                        <h3 className="font-semibold text-white group-hover:text-zinc-100">
                          {episode.title}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          episodeStatusColor[episode.status] ??
                          "bg-zinc-500/20 text-zinc-400"
                        }`}
                      >
                        {episode.status}
                      </span>
                    </div>

                    {episode.hook && (
                      <p className="mt-2 text-sm italic text-zinc-400">
                        &quot;{episode.hook}&quot;
                      </p>
                    )}

                    {episode.synopsis && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                        {episode.synopsis}
                      </p>
                    )}
                  </Link>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
