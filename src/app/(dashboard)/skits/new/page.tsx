"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSkitStore } from "@/stores/skit.store";
import { useCharacterStore } from "@/stores/character.store";
import type { SkitCategory, AudioStyle } from "@/types";
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

const AUDIO_STYLES: { value: AudioStyle; label: string }[] = [
  { value: "voiceover", label: "AI Voiceover" },
  { value: "trending_audio", label: "Trending Audio" },
  { value: "text_only", label: "Text Only" },
  { value: "mixed", label: "Mixed" },
];

const COMEDY_STYLES = [
  "observational",
  "deadpan",
  "slapstick",
  "absurdist",
  "self-deprecating",
];

export default function NewSkitPage() {
  const router = useRouter();
  const { addSkit } = useSkitStore();
  const { characters } = useCharacterStore();
  const comedyChars = characters.filter((c) => c.kind === "comedy");

  const [category, setCategory] = useState<SkitCategory>("work_office");
  const [comedyStyle, setComedyStyle] = useState("observational");
  const [audioStyle, setAudioStyle] = useState<AudioStyle>("voiceover");
  const [scenario, setScenario] = useState("");
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function characterRefs() {
    return characterIds
      .map((id) => comedyChars.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map((c) => ({
        id: c.id,
        name: c.name,
        personality: c.personality || undefined,
        speechPattern: c.speechPattern || undefined,
        availableExpressions: c.expressions?.map((e) => e.name),
      }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/generate-skit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          comedyStyle,
          audioStyle,
          scenario: scenario.trim() || undefined,
          characters: characterRefs(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const g = (await res.json()) as GeneratedSkit;
      const id = addSkit({
        title: g.title,
        category,
        scenario: g.scenario,
        beats: g.beats,
        dialogue: g.dialogue,
        audioStyle: g.audioStyle,
        characterIds: g.characterIds || characterIds,
      });
      router.push(`/skits/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">New Skit</h1>
        <p className="mt-2 text-zinc-400">
          Generate one comedy concept. We&apos;ll do beats and dialogue in a
          single pass.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SkitCategory)}
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
                value={comedyStyle}
                onChange={(e) => setComedyStyle(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                {COMEDY_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Audio Style
              </label>
              <select
                value={audioStyle}
                onChange={(e) => setAudioStyle(e.target.value as AudioStyle)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                {AUDIO_STYLES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Scenario seed (optional)
            </label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={2}
              placeholder='e.g. "When your boss replies-all to a private DM"'
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
            />
          </div>

          {comedyChars.length > 0 && (
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Feature characters (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {comedyChars.map((c) => {
                  const selected = characterIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setCharacterIds((prev) =>
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

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Skit"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/skits")}
              className="rounded-full border border-zinc-700 px-6 py-2.5 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
