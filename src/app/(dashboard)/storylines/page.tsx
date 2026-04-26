"use client";

import { useState } from "react";
import Link from "next/link";
import { useStorylineStore } from "@/stores/storyline.store";
import type { Storyline } from "@/types";

const GENRES = [
  { value: "dark-motivation", label: "Dark Motivation" },
  { value: "mystery-thriller", label: "Mystery / Thriller" },
  { value: "wholesome-transformation", label: "Wholesome Transformation" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "horror", label: "Horror" },
  { value: "comedy", label: "Comedy" },
];

const TONES = [
  { value: "dark", label: "Dark" },
  { value: "intense", label: "Intense" },
  { value: "suspenseful", label: "Suspenseful" },
  { value: "heartwarming", label: "Heartwarming" },
  { value: "comedic", label: "Comedic" },
  { value: "epic", label: "Epic" },
];

const PLATFORMS: { value: Storyline["targetPlatform"]; label: string }[] = [
  { value: "tiktok", label: "TikTok" },
  { value: "reels", label: "Reels" },
  { value: "shorts", label: "Shorts" },
  { value: "all", label: "All Platforms" },
];

const statusColor: Record<Storyline["status"], string> = {
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-amber-500/20 text-amber-400",
  completed: "bg-blue-500/20 text-blue-400",
};

export default function StorylinesPage() {
  const { storylines, addStoryline } = useStorylineStore();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [premise, setPremise] = useState("");
  const [genre, setGenre] = useState(GENRES[0].value);
  const [tone, setTone] = useState(TONES[0].value);
  const [targetPlatform, setTargetPlatform] = useState<
    Storyline["targetPlatform"]
  >("all");

  function resetForm() {
    setTitle("");
    setPremise("");
    setGenre(GENRES[0].value);
    setTone(TONES[0].value);
    setTargetPlatform("all");
    setError(null);
  }

  async function handleGenerateAI() {
    if (!title.trim() || !premise.trim()) {
      setError("Title and premise are required.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-storyline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, premise, genre, tone, targetPlatform }),
      });

      if (!res.ok) {
        throw new Error(`AI generation failed (${res.status})`);
      }

      const data = await res.json();

      addStoryline({
        title: data.title ?? title,
        premise: data.premise ?? premise,
        genre: data.genre ?? genre,
        tone: data.tone ?? tone,
        targetPlatform: data.targetPlatform ?? targetPlatform,
        narrativeArc: data.narrativeArc ?? {
          type: "three-act",
          stages: ["Setup", "Confrontation", "Resolution"],
          currentStage: 0,
          totalEpisodes: 10,
        },
        characters: data.characters ?? [],
      });

      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateManually() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    addStoryline({
      title,
      premise,
      genre,
      tone,
      targetPlatform,
      narrativeArc: {
        type: "three-act",
        stages: ["Setup", "Confrontation", "Resolution"],
        currentStage: 0,
        totalEpisodes: 10,
      },
      characters: [],
    });

    resetForm();
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Storylines</h1>
            <p className="mt-2 text-zinc-400">
              Create and manage your serialized story arcs.
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm((prev) => !prev);
              if (showForm) resetForm();
            }}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            {showForm ? "Cancel" : "+ New Storyline"}
          </button>
        </div>

        {/* Inline creation form */}
        {showForm && (
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              New Storyline
            </h2>

            {error && (
              <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Last Witness"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                />
              </div>

              {/* Premise */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Premise
                </label>
                <textarea
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  rows={3}
                  placeholder="Describe the core idea of your storyline..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {GENRES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Platform */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Target Platform
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) =>
                    setTargetPlatform(
                      e.target.value as Storyline["targetPlatform"]
                    )
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleGenerateAI}
                disabled={loading}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate with AI"}
              </button>
              <button
                onClick={handleCreateManually}
                disabled={loading}
                className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Create Manually
              </button>
            </div>
          </div>
        )}

        {/* Storyline grid */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {storylines.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-10 text-center sm:col-span-2 lg:col-span-3">
              <p className="text-sm text-zinc-500">
                No storylines yet. Create your first one to get started.
              </p>
            </div>
          )}

          {storylines.map((storyline) => (
            <Link
              key={storyline.id}
              href={`/storylines/${storyline.id}`}
              className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600"
            >
              {/* Status badge + genre */}
              <div className="flex items-center justify-between">
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                  {storyline.genre}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColor[storyline.status]
                  }`}
                >
                  {storyline.status}
                </span>
              </div>

              {/* Title */}
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-zinc-100">
                {storyline.title}
              </h3>

              {/* Premise (truncated) */}
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                {storyline.premise || "No premise provided."}
              </p>

              {/* Meta row */}
              <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-zinc-500">
                <span className="rounded bg-zinc-800/60 px-2 py-0.5">
                  {storyline.tone}
                </span>
                <span>{storyline.characters.length} characters</span>
                <span>{storyline.episodes.length} episodes</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
