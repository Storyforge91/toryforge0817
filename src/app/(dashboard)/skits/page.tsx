"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSkitStore } from "@/stores/skit.store";
import { useCharacterStore } from "@/stores/character.store";
import type { SkitCategory } from "@/types";
import type { GeneratedSkit } from "@/lib/ai/services/skit.service";

const CATEGORIES: { value: SkitCategory; label: string }[] = [
  { value: "work_office", label: "Work / Office" },
  { value: "school", label: "School" },
  { value: "relationships", label: "Relationships" },
  { value: "technology", label: "Technology" },
  { value: "daily_life", label: "Daily Life" },
  { value: "trending_audio", label: "Trending Audio" },
  { value: "cultural", label: "Cultural" },
  { value: "gaming", label: "Gaming" },
];

const COMEDY_STYLES = [
  "observational",
  "deadpan",
  "slapstick",
  "absurdist",
  "self-deprecating",
];

const categoryBadge: Record<SkitCategory, string> = {
  work_office: "bg-blue-900/60 text-blue-300",
  school: "bg-amber-900/60 text-amber-300",
  relationships: "bg-pink-900/60 text-pink-300",
  technology: "bg-cyan-900/60 text-cyan-300",
  daily_life: "bg-emerald-900/60 text-emerald-300",
  trending_audio: "bg-violet-900/60 text-violet-300",
  cultural: "bg-orange-900/60 text-orange-300",
  gaming: "bg-fuchsia-900/60 text-fuchsia-300",
};

export default function SkitsPage() {
  // Use Zustand selectors so this component only re-renders when these
  // specific slices change, not when unrelated store properties update.
  const skits = useSkitStore((s) => s.skits);
  const addSkit = useSkitStore((s) => s.addSkit);
  const deleteSkit = useSkitStore((s) => s.deleteSkit);
  const characters = useCharacterStore((s) => s.characters);

  const [filter, setFilter] = useState<"all" | SkitCategory>("all");
  const [showBatch, setShowBatch] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const [batchCategory, setBatchCategory] =
    useState<SkitCategory>("work_office");
  const [batchComedyStyle, setBatchComedyStyle] = useState("observational");
  const [batchCharacterIds, setBatchCharacterIds] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchResults, setBatchResults] = useState<GeneratedSkit[]>([]);

  const comedyChars = useMemo(
    () => characters.filter((c) => c.kind === "comedy"),
    [characters],
  );

  const characterMap = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters],
  );

  const visible = useMemo(
    () =>
      filter === "all" ? skits : skits.filter((s) => s.category === filter),
    [skits, filter],
  );

  function characterRefsFor(ids: string[]) {
    return ids
      .map((id) => comedyChars.find((c) => c.id === id))
      .filter(
        (c): c is NonNullable<typeof c> => Boolean(c),
      )
      .map((c) => ({
        id: c.id,
        name: c.name,
        personality: c.personality || undefined,
        speechPattern: c.speechPattern || undefined,
        availableExpressions: c.expressions?.map((e) => e.name),
      }));
  }

  async function runBatch() {
    setBatchLoading(true);
    setBatchError(null);
    setBatchResults([]);
    try {
      const res = await fetch("/api/ai/generate-batch-skits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: batchCount,
          category: batchCategory,
          comedyStyle: batchComedyStyle,
          characters: characterRefsFor(batchCharacterIds),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { skits: GeneratedSkit[] };
      setBatchResults(data.skits ?? []);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : String(err));
    } finally {
      setBatchLoading(false);
    }
  }

  function commitSkit(g: GeneratedSkit) {
    addSkit({
      title: g.title,
      category: batchCategory,
      scenario: g.scenario,
      beats: g.beats,
      dialogue: g.dialogue,
      audioStyle: g.audioStyle,
      characterIds: g.characterIds || [],
    });
    setBatchResults((prev) => prev.filter((s) => s !== g));
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Skits</h1>
            <p className="mt-2 text-zinc-400">
              2D cartoon comedy concepts. Curate the best, ship daily.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBatch(!showBatch)}
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              {showBatch ? "Cancel Batch" : "Generate Batch"}
            </button>
            <Link
              href="/skits/new"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              + New Skit
            </Link>
          </div>
        </div>

        {/* Batch panel */}
        {showBatch && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Batch Generate Concepts
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Count
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={batchCount}
                  onChange={(e) =>
                    setBatchCount(Math.max(2, Math.min(20, +e.target.value)))
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Category
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) =>
                    setBatchCategory(e.target.value as SkitCategory)
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Comedy Style
                </label>
                <select
                  value={batchComedyStyle}
                  onChange={(e) => setBatchComedyStyle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {COMEDY_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Character multi-select */}
            {comedyChars.length > 0 && (
              <div className="mt-4">
                <label className="mb-1 block text-sm text-zinc-400">
                  Feature characters (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {comedyChars.map((c) => {
                    const selected = batchCharacterIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() =>
                          setBatchCharacterIds((prev) =>
                            selected
                              ? prev.filter((id) => id !== c.id)
                              : [...prev, c.id],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected
                            ? "border-emerald-600 bg-emerald-950/40 text-emerald-300"
                            : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={runBatch}
                disabled={batchLoading}
                className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
              >
                {batchLoading ? "Generating..." : "Generate"}
              </button>
              {batchError && (
                <span className="text-xs text-red-400">{batchError}</span>
              )}
            </div>

            {/* Batch results — curate */}
            {batchResults.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {batchResults.length} concept{batchResults.length === 1 ? "" : "s"} generated — keep the best
                </p>
                {batchResults.map((g, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {g.title}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-400">
                          {g.scenario}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400">
                            {g.beats?.length || 0} beats
                          </span>
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400">
                            {g.dialogue?.length || 0} dialogue lines
                          </span>
                          <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400">
                            audio: {g.audioStyle}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          onClick={() => commitSkit(g)}
                          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() =>
                            setBatchResults((prev) =>
                              prev.filter((s) => s !== g),
                            )
                          }
                          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter row */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs ${
              filter === "all"
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-400 hover:text-white"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`rounded-full px-3 py-1 text-xs ${
                filter === c.value
                  ? "bg-white text-black"
                  : "border border-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Skit cards */}
        {visible.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-16 text-center">
            <p className="text-sm text-zinc-500">
              No skits yet. Generate a batch or create one from scratch.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) => {
              const featured = s.characterIds
                .map((id) => characterMap.get(id))
                .filter(
                  (c): c is NonNullable<typeof c> => Boolean(c),
                );
              return (
                <Link
                  key={s.id}
                  href={`/skits/${s.id}`}
                  className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition-colors hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {s.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryBadge[s.category]}`}
                    >
                      {s.category.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                    {s.scenario}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
                    <span>{s.beats.length} beats</span>
                    <span>·</span>
                    <span>{s.dialogue.length} lines</span>
                    <span>·</span>
                    <span>{s.audioStyle}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.captions && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-300">
                        captions
                      </span>
                    )}
                    {s.voiceUrl && (
                      <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-[9px] text-amber-300">
                        voice
                      </span>
                    )}
                    {s.beats.some((b) => b.videoUrl) && (
                      <span className="rounded bg-violet-900/40 px-1.5 py-0.5 text-[9px] text-violet-300">
                        {s.beats.filter((b) => b.videoUrl).length}/
                        {s.beats.length} animated
                      </span>
                    )}
                  </div>
                  {featured.length > 0 && (
                    <div className="mt-3 flex items-center gap-1 border-t border-zinc-800 pt-3">
                      {featured.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          className="h-6 w-6 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900"
                          title={c.name}
                        >
                          {c.expressions?.[0]?.assetUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={c.expressions[0].assetUrl}
                              alt={c.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[8px] text-zinc-500">
                              {c.name.charAt(0)}
                            </span>
                          )}
                        </div>
                      ))}
                      <span className="ml-1 text-[10px] text-zinc-600">
                        {featured.map((c) => c.name).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] capitalize text-zinc-600">
                      {s.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm(`Delete "${s.title}"?`)) deleteSkit(s.id);
                      }}
                      className="hidden text-[10px] text-zinc-600 hover:text-red-400 group-hover:inline"
                    >
                      Delete
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
