"use client";

import { useMemo, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSkitStore } from "@/stores/skit.store";
import { useCharacterStore } from "@/stores/character.store";
import type { PlatformCaptions } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  work_office: "Work / Office",
  school: "School",
  relationships: "Relationships",
  technology: "Technology",
  daily_life: "Daily Life",
  trending_audio: "Trending Audio",
  cultural: "Cultural",
  gaming: "Gaming",
};

type BeatStatus = {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
};

export default function SkitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Selector subscriptions — only re-render when these specific values change
  const skit = useSkitStore((s) => s.skits.find((x) => x.id === id));
  const updateSkit = useSkitStore((s) => s.updateSkit);
  const updateSkitBeat = useSkitStore((s) => s.updateSkitBeat);
  const deleteSkit = useSkitStore((s) => s.deleteSkit);
  const characters = useCharacterStore((s) => s.characters);

  const [captionPlatform, setCaptionPlatform] = useState<
    "instagram" | "tiktok" | "youtube"
  >("tiktok");
  const [captionsLoading, setCaptionsLoading] = useState(false);
  const [captionsError, setCaptionsError] = useState<string | null>(null);

  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [beatStates, setBeatStates] = useState<Record<number, BeatStatus>>({});
  const [animateAllLoading, setAnimateAllLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Memoized derived state — declared before early return so hook order stays
  // stable. They safely no-op when `skit` is undefined.
  const characterMap = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters],
  );
  const featuredCharacters = useMemo(
    () =>
      (skit?.characterIds ?? [])
        .map((cid) => characterMap.get(cid))
        .filter((c): c is NonNullable<typeof c> => Boolean(c)),
    [skit?.characterIds, characterMap],
  );
  const totalDuration = useMemo(
    () => (skit?.beats ?? []).reduce((sum, b) => sum + (b.duration || 0), 0),
    [skit?.beats],
  );
  const sortedBeats = useMemo(
    () => [...(skit?.beats ?? [])].sort((a, b) => a.order - b.order),
    [skit?.beats],
  );
  const sortedDialogue = useMemo(
    () => [...(skit?.dialogue ?? [])].sort((a, b) => a.timing - b.timing),
    [skit?.dialogue],
  );

  if (!skit) {
    return (
      <div className="min-h-screen bg-black px-8 py-16 font-sans">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-zinc-500">Skit not found.</p>
          <Link
            href="/skits"
            className="mt-4 inline-block text-sm text-zinc-400 underline hover:text-white"
          >
            Back to Skits
          </Link>
        </div>
      </div>
    );
  }

  function expressionUrlFor(beat: { characterId?: string; expression: string }) {
    if (!beat.characterId) return null;
    const c = characterMap.get(beat.characterId);
    return c?.expressions?.find((e) => e.name === beat.expression)?.assetUrl;
  }

  async function generateCaptions() {
    if (!skit) return;
    setCaptionsLoading(true);
    setCaptionsError(null);
    try {
      const synopsis = skit.beats
        .map((b) => `${b.order}. ${b.description}`)
        .join(" ");
      const res = await fetch("/api/ai/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: skit.title,
          hook: skit.scenario,
          synopsis,
          genre: "comedy",
          tone: skit.category.replace("_", " "),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const captions = (await res.json()) as PlatformCaptions;
      updateSkit(skit.id, { captions });
    } catch (err) {
      setCaptionsError(err instanceof Error ? err.message : String(err));
    } finally {
      setCaptionsLoading(false);
    }
  }

  function buildVoiceScript(): string {
    if (!skit) return "";
    if (skit.dialogue.length > 0) {
      return [...skit.dialogue]
        .sort((a, b) => a.timing - b.timing)
        .map((line) => {
          const char = characterMap.get(line.characterId);
          return `${char?.name ?? "Voice"}: ${line.text}`;
        })
        .join(" ");
    }
    return skit.beats
      .map((b) => b.textOverlay || b.description)
      .filter(Boolean)
      .join(". ");
  }

  async function generateVoice() {
    if (!skit) return;
    setVoiceLoading(true);
    setVoiceError(null);
    try {
      const text = buildVoiceScript();
      if (!text.trim()) throw new Error("No text to narrate.");

      // Use the first featured character's voiceId if set, else default
      const firstChar = featuredCharacters[0];
      const voiceId = firstChar?.voiceId;

      const res = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { audioUrl: string };
      updateSkit(skit.id, {
        voiceUrl: data.audioUrl,
        voiceScript: text,
      });
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : String(err));
    } finally {
      setVoiceLoading(false);
    }
  }

  async function animateBeat(beatOrder: number) {
    if (!skit) return;
    const beat = skit.beats.find((b) => b.order === beatOrder);
    if (!beat) return;
    const exprUrl = expressionUrlFor(beat);
    if (!exprUrl) {
      setBeatStates((prev) => ({
        ...prev,
        [beatOrder]: {
          status: "error",
          error: "No expression image for this beat. Generate the character expression first.",
        },
      }));
      return;
    }

    setBeatStates((prev) => ({
      ...prev,
      [beatOrder]: { status: "loading" },
    }));

    try {
      const motionPrompt = beat.description;
      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: exprUrl,
          motionPrompt,
          duration: Math.max(1, Math.min(10, beat.duration || 5)),
          provider: "auto",
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: { videoUrl?: string; error?: string };
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const txt = await res.text();
        data = { error: `Server returned non-JSON: ${txt.substring(0, 100)}` };
      }

      if (!res.ok || !data.videoUrl) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      updateSkitBeat(skit.id, beatOrder, { videoUrl: data.videoUrl });
      setBeatStates((prev) => ({
        ...prev,
        [beatOrder]: { status: "success" },
      }));
    } catch (err) {
      setBeatStates((prev) => ({
        ...prev,
        [beatOrder]: {
          status: "error",
          error: err instanceof Error ? err.message : String(err),
        },
      }));
    }
  }

  async function animateAll() {
    if (!skit) return;
    setAnimateAllLoading(true);
    try {
      await Promise.allSettled(
        skit.beats
          .filter((b) => !b.videoUrl)
          .map((b) => animateBeat(b.order)),
      );
    } finally {
      setAnimateAllLoading(false);
    }
  }

  async function downloadProductionPack() {
    if (!skit) return;
    setExportLoading(true);
    setExportError(null);
    try {
      const featuredChars = featuredCharacters.map((c) => ({
        id: c.id,
        name: c.name,
        visualDescription: c.visualDescription,
        expressions: c.expressions?.map((e) => ({
          name: e.name,
          assetUrl: e.assetUrl,
        })),
      }));

      const res = await fetch("/api/skits/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skit: {
            title: skit.title,
            scenario: skit.scenario,
            category: skit.category,
            audioStyle: skit.audioStyle,
            beats: skit.beats,
            dialogue: skit.dialogue,
            captions: skit.captions,
            voiceUrl: skit.voiceUrl,
            voiceScript: skit.voiceScript,
          },
          characters: featuredChars,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as {
        manifest: unknown;
        brief: string;
      };

      const safeName = skit.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

      // Trigger two downloads: manifest.json and brief.md
      const manifestBlob = new Blob([JSON.stringify(data.manifest, null, 2)], {
        type: "application/json",
      });
      const briefBlob = new Blob([data.brief], { type: "text/markdown" });

      function trigger(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      trigger(manifestBlob, `${safeName}-manifest.json`);
      trigger(briefBlob, `${safeName}-brief.md`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err));
    } finally {
      setExportLoading(false);
    }
  }

  function handleSchedule() {
    if (!skit) return;
    // Stash the skit ID in sessionStorage so /calendar can pre-fill (light coupling)
    sessionStorage.setItem(
      "calendar:prefill",
      JSON.stringify({ contentType: "skit", contentId: skit.id }),
    );
    router.push("/calendar");
  }

  function handleDelete() {
    if (!skit) return;
    if (confirm(`Delete "${skit.title}"?`)) {
      deleteSkit(skit.id);
      router.push("/skits");
    }
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-4xl">
        <Link href="/skits" className="text-xs text-zinc-500 hover:text-white">
          &#8592; All skits
        </Link>

        {/* Header */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
              {CATEGORY_LABELS[skit.category] || skit.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold text-white">{skit.title}</h1>
            <p className="mt-2 text-base text-zinc-400">{skit.scenario}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
              <span>{skit.beats.length} beats</span>
              <span>·</span>
              <span>{totalDuration.toFixed(1)}s total</span>
              <span>·</span>
              <span className="capitalize">audio: {skit.audioStyle}</span>
              <span>·</span>
              <span className="capitalize">{skit.status}</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              onClick={handleSchedule}
              className="rounded-lg border border-violet-700 bg-violet-950/40 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-900/40"
            >
              Schedule on Calendar
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-red-700 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Featured characters */}
        {featuredCharacters.length > 0 && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">
              Featured Characters
            </h2>
            <div className="flex flex-wrap gap-3">
              {featuredCharacters.map((c) => {
                const firstExpr = c.expressions?.[0];
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-full bg-zinc-800">
                      {firstExpr ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={firstExpr.assetUrl}
                          alt={c.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                          {c.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-white">{c.name}</p>
                      {c.voiceName && (
                        <p className="text-[9px] text-zinc-500">
                          Voice: {c.voiceName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Beats timeline with animation controls */}
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Beats Timeline
            </h2>
            <button
              onClick={animateAll}
              disabled={animateAllLoading}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {animateAllLoading ? "Animating..." : "Animate All Beats"}
            </button>
          </div>
          <div className="space-y-3">
            {sortedBeats.map((beat) => {
                const url = expressionUrlFor(beat);
                const character = beat.characterId
                  ? characterMap.get(beat.characterId)
                  : undefined;
                const beatState = beatStates[beat.order];
                return (
                  <div
                    key={beat.order}
                    className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    {/* Visual: video clip if animated, expression image otherwise */}
                    <div className="h-32 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                      {beat.videoUrl ? (
                        <video
                          src={beat.videoUrl}
                          controls
                          loop
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={url}
                          alt={beat.expression}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-1 text-center text-[9px] text-zinc-600">
                          <span>{beat.expression}</span>
                          {!character && <span>(no char)</span>}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                          Beat {beat.order}
                        </span>
                        <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300">
                          {beat.expression}
                        </span>
                        {character && (
                          <span className="text-[10px] text-zinc-500">
                            {character.name}
                          </span>
                        )}
                        {beat.videoUrl && (
                          <span className="rounded bg-violet-900/40 px-2 py-0.5 text-[10px] text-violet-300">
                            animated
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-zinc-500">
                          {beat.duration}s
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-200">
                        {beat.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                        {beat.textOverlay && (
                          <span className="rounded bg-violet-900/40 px-2 py-0.5 text-violet-300">
                            text: {beat.textOverlay}
                          </span>
                        )}
                        {beat.soundEffect && (
                          <span className="rounded bg-cyan-900/40 px-2 py-0.5 text-cyan-300">
                            sfx: {beat.soundEffect}
                          </span>
                        )}
                        {beat.cameraAction && (
                          <span className="rounded bg-amber-900/40 px-2 py-0.5 text-amber-300">
                            camera: {beat.cameraAction}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        {!beat.videoUrl && (
                          <button
                            onClick={() => animateBeat(beat.order)}
                            disabled={beatState?.status === "loading"}
                            className="rounded-lg border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:border-emerald-700 hover:text-emerald-300 disabled:opacity-50"
                          >
                            {beatState?.status === "loading"
                              ? "Animating..."
                              : "Animate this beat"}
                          </button>
                        )}
                        {beat.videoUrl && (
                          <button
                            onClick={() => animateBeat(beat.order)}
                            disabled={beatState?.status === "loading"}
                            className="rounded-lg border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-white disabled:opacity-50"
                          >
                            Re-animate
                          </button>
                        )}
                        {beatState?.status === "error" && (
                          <span className="text-[10px] text-red-400">
                            {beatState.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Dialogue */}
        {skit.dialogue.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">
              Dialogue
            </h2>
            <div className="space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              {sortedDialogue.map((line, i) => {
                  const c = characterMap.get(line.characterId);
                  return (
                    <div key={i} className="flex gap-3">
                      <span className="shrink-0 text-[10px] text-zinc-600">
                        {line.timing.toFixed(1)}s
                      </span>
                      <div>
                        <span className="text-xs font-medium text-emerald-400">
                          {c?.name || "?"}
                        </span>
                        <span className="ml-2 text-[10px] italic text-zinc-500">
                          ({line.emotion})
                        </span>
                        <p className="text-sm text-zinc-200">{line.text}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Voice narration */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Voice Narration
            </h2>
            <button
              onClick={generateVoice}
              disabled={voiceLoading}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {voiceLoading
                ? "Generating..."
                : skit.voiceUrl
                  ? "Regenerate"
                  : "Generate Narration"}
            </button>
          </div>
          {voiceError && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {voiceError}
            </p>
          )}
          {skit.voiceUrl ? (
            <div className="mt-3">
              <audio src={skit.voiceUrl} controls className="w-full" />
              <a
                href={skit.voiceUrl}
                download={`${skit.title.replace(/\s+/g, "-")}-narration.mp3`}
                className="mt-2 inline-block text-xs text-zinc-400 underline hover:text-white"
              >
                Download MP3
              </a>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-600">
              {voiceLoading
                ? "Generating narration..."
                : 'Click "Generate Narration" to produce voice audio. Uses the first featured character\'s voice if set.'}
            </p>
          )}
        </div>

        {/* Captions */}
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Platform Captions
            </h2>
            <button
              onClick={generateCaptions}
              disabled={captionsLoading}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {captionsLoading
                ? "Generating..."
                : skit.captions
                  ? "Regenerate"
                  : "Generate Captions"}
            </button>
          </div>

          {captionsError && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {captionsError}
            </p>
          )}

          {skit.captions && (
            <div className="mt-4">
              <div className="flex gap-1 rounded-lg bg-zinc-800 p-1">
                {(["tiktok", "instagram", "youtube"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCaptionPlatform(p)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      captionPlatform === p
                        ? p === "tiktok"
                          ? "bg-cyan-600 text-white"
                          : p === "instagram"
                            ? "bg-pink-600 text-white"
                            : "bg-red-600 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-zinc-900 p-4">
                {captionPlatform === "tiktok" && skit.captions.tiktok && (
                  <div>
                    <p className="text-sm text-white">
                      {skit.captions.tiktok.caption}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {skit.captions.tiktok.hashtags?.map((h, i) => (
                        <span key={i} className="text-xs text-cyan-400">
                          {h.startsWith("#") ? h : `#${h}`}
                        </span>
                      ))}
                    </div>
                    {skit.captions.tiktok.cta && (
                      <p className="mt-2 text-xs text-amber-400">
                        CTA: {skit.captions.tiktok.cta}
                      </p>
                    )}
                  </div>
                )}
                {captionPlatform === "instagram" &&
                  skit.captions.instagram && (
                    <div>
                      <p className="whitespace-pre-wrap text-sm text-white">
                        {skit.captions.instagram.caption}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {skit.captions.instagram.hashtags?.map((h, i) => (
                          <span key={i} className="text-xs text-pink-400">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                      {skit.captions.instagram.pinnedComment && (
                        <p className="mt-2 text-xs text-zinc-400">
                          Pinned comment:{" "}
                          {skit.captions.instagram.pinnedComment}
                        </p>
                      )}
                    </div>
                  )}
                {captionPlatform === "youtube" && skit.captions.youtube && (
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {skit.captions.youtube.title}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-300">
                      {skit.captions.youtube.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {skit.captions.youtube.tags?.map((t, i) => (
                        <span
                          key={i}
                          className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Production pack export */}
        <div className="mt-8 rounded-2xl border border-violet-900/50 bg-violet-950/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-violet-300">
                Production Pack
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Download a JSON manifest with all asset URLs and a markdown
                production brief for CapCut/manual assembly.
              </p>
            </div>
            <button
              onClick={downloadProductionPack}
              disabled={exportLoading}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {exportLoading ? "Building..." : "Download Pack"}
            </button>
          </div>
          {exportError && (
            <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {exportError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
