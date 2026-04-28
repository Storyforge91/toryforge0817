"use client";

import { useState } from "react";
import { useReferenceStore } from "@/stores/reference.store";
import { HERO_SHOT_REFERENCES } from "@/lib/references/hero-shot.references";

export default function ReferencesPage() {
  const userRefs = useReferenceStore((s) => s.references);
  const addReference = useReferenceStore((s) => s.addReference);
  const removeReference = useReferenceStore((s) => s.removeReference);

  const [draftId, setDraftId] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftMoodTags, setDraftMoodTags] = useState("");
  const [draftLookNotes, setDraftLookNotes] = useState("");
  const [draftSource, setDraftSource] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleAdd() {
    const id = draftId.trim().toLowerCase().replace(/\s+/g, "-");
    if (!id) {
      setFormError("ID is required (e.g. 'cloud-titan-sunset').");
      return;
    }
    const tags = draftMoodTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length === 0) {
      setFormError("Add at least one mood tag (comma-separated).");
      return;
    }
    if (!draftLookNotes.trim()) {
      setFormError("Look notes are required — describe lighting/palette/composition.");
      return;
    }
    if (draftImageUrl && !/^https?:\/\//.test(draftImageUrl.trim())) {
      setFormError("Image URL must start with http:// or https://");
      return;
    }
    addReference({
      id,
      imageUrl: draftImageUrl.trim() || undefined,
      moodTags: tags,
      lookNotes: draftLookNotes.trim(),
      source: draftSource.trim() || undefined,
    });
    setDraftId("");
    setDraftImageUrl("");
    setDraftMoodTags("");
    setDraftLookNotes("");
    setDraftSource("");
    setFormError(null);
  }

  return (
    <div className="min-h-screen bg-black px-8 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Reference Library</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Your hand-picked stills that define the look. The Hero Shot engine
            scores incoming concepts against these mood tags and steers the
            Leonardo prompt toward matches. Quality scales linearly with this
            library — aim for 30+ entries.
          </p>
        </div>

        {/* Add form */}
        <div className="mb-10 rounded-2xl border border-fuchsia-900/60 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">Add a Reference</h2>
          <p className="mt-1 text-xs text-zinc-500">
            ID and look notes are required. Image URL is optional today —
            mood tags + look notes already steer the prompt.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                ID (kebab-case)
              </label>
              <input
                value={draftId}
                onChange={(e) => setDraftId(e.target.value)}
                placeholder="cloud-titan-sunset"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Image URL <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                value={draftImageUrl}
                onChange={(e) => setDraftImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Mood tags (comma-separated, 3-6)
              </label>
              <input
                value={draftMoodTags}
                onChange={(e) => setDraftMoodTags(e.target.value)}
                placeholder="cloud-titan, godlike-scale, rim-lit-silhouette, mythic"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Look notes (one line: lighting + palette + composition + atmosphere)
              </label>
              <textarea
                value={draftLookNotes}
                onChange={(e) => setDraftLookNotes(e.target.value)}
                rows={3}
                placeholder="Tiny figure on cliff bottom-third, colossal cloud-titan in upper sky, sunrise rim light, deep blue-to-amber gradient, volumetric god rays."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-400">
                Source <span className="text-zinc-600">(optional credit / URL)</span>
              </label>
              <input
                value={draftSource}
                onChange={(e) => setDraftSource(e.target.value)}
                placeholder="@mister_z reel — Apr 2026"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-4 text-xs text-red-400">{formError}</p>
          )}

          <button
            onClick={handleAdd}
            className="mt-5 rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
          >
            Add Reference
          </button>
        </div>

        {/* User-added references */}
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Your Library ({userRefs.length})
          </h2>
          {userRefs.length === 0 ? (
            <p className="text-sm text-zinc-600">
              No user references yet. Add your first above.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {userRefs.map((ref) => (
                <div
                  key={ref.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{ref.id}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ref.moodTags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-fuchsia-950/40 px-2 py-0.5 text-[10px] text-fuchsia-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-zinc-400">{ref.lookNotes}</p>
                      {ref.imageUrl && (
                        <a
                          href={ref.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-[11px] text-zinc-500 underline hover:text-zinc-300"
                        >
                          View image
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => removeReference(ref.id)}
                      className="text-[11px] text-zinc-500 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Built-in seed library */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Seed Library ({HERO_SHOT_REFERENCES.length}) — read-only
          </h2>
          <p className="mb-3 text-xs text-zinc-600">
            Ships with the app and is used immediately by the Hero Shot engine.
            User references above are stored in your browser and intended to
            grow this set.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {HERO_SHOT_REFERENCES.map((ref) => (
              <div
                key={ref.id}
                className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4"
              >
                <p className="text-sm font-semibold text-zinc-200">{ref.id}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ref.moodTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-500">{ref.lookNotes}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
