"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useEpisodeStore } from "@/stores/episode.store";
import { useStorylineStore } from "@/stores/storyline.store";
import type { Episode, Scene, ImagePrompt, PlatformCaptions } from "@/types";

type CaptionTab = "instagram" | "tiktok" | "youtube";

const STATUS_COLORS: Record<Episode["status"], string> = {
  idea: "bg-zinc-700 text-zinc-300",
  generated: "bg-amber-900/60 text-amber-300",
  produced: "bg-blue-900/60 text-blue-300",
  posted: "bg-emerald-900/60 text-emerald-300",
};

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </span>
        <button
          onClick={copy}
          className="text-[11px] text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-300"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-300">
        <code>{text}</code>
      </pre>
    </div>
  );
}

function SceneCard({ scene }: { scene: Scene }) {
  const hasPrompts = scene.imagePrompt.universal.length > 0;
  const promptEntries = Object.entries(scene.imagePrompt).filter(
    ([, v]) => typeof v === "string" && v.length > 0,
  ) as [keyof ImagePrompt, string][];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
            {scene.order}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {scene.environment}
            </p>
            <p className="text-xs text-zinc-500">
              {scene.mood} &middot; {scene.cameraAngle}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
          {scene.duration}s
        </span>
      </div>

      {/* Characters */}
      {scene.characterPresence.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {scene.characterPresence.map((char) => (
            <span
              key={char}
              className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {char}
            </span>
          ))}
        </div>
      )}

      {/* Cinematic Description */}
      <p className="mb-3 text-sm leading-relaxed text-zinc-300">
        {scene.cinematicDescription}
      </p>

      {/* Narration */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
          Narration
        </p>
        <p className="text-sm italic leading-relaxed text-zinc-400">
          {scene.narrationText}
        </p>
      </div>

      {/* Image Prompts */}
      {hasPrompts && (
        <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Image Prompts
          </p>
          {promptEntries.map(([key, value]) => (
            <CopyBlock key={key} label={key} text={value} />
          ))}
        </div>
      )}
    </div>
  );
}

function CaptionsSection({ captions }: { captions: PlatformCaptions }) {
  const [tab, setTab] = useState<CaptionTab>("instagram");

  const tabs: { key: CaptionTab; label: string }[] = [
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
    { key: "youtube", label: "YouTube" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Instagram */}
      {tab === "instagram" && (
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
              Caption
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {captions.instagram.caption || "Not generated yet"}
            </p>
          </div>
          {captions.instagram.hashtags.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                Hashtags
              </p>
              <p className="text-sm text-zinc-400">
                {captions.instagram.hashtags.map((h) => `#${h}`).join(" ")}
              </p>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
              CTA
            </p>
            <p className="text-sm text-zinc-400">
              {captions.instagram.cta || "---"}
            </p>
          </div>
          {captions.instagram.pinnedComment && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                Pinned Comment
              </p>
              <p className="text-sm text-zinc-400">
                {captions.instagram.pinnedComment}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TikTok */}
      {tab === "tiktok" && (
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
              Caption
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {captions.tiktok.caption || "Not generated yet"}
            </p>
          </div>
          {captions.tiktok.hashtags.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                Hashtags
              </p>
              <p className="text-sm text-zinc-400">
                {captions.tiktok.hashtags.map((h) => `#${h}`).join(" ")}
              </p>
            </div>
          )}
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
              CTA
            </p>
            <p className="text-sm text-zinc-400">
              {captions.tiktok.cta || "---"}
            </p>
          </div>
        </div>
      )}

      {/* YouTube */}
      {tab === "youtube" && (
        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
              Title
            </p>
            <p className="text-sm font-medium text-zinc-300">
              {captions.youtube.title || "Not generated yet"}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
              {captions.youtube.description || "---"}
            </p>
          </div>
          {captions.youtube.tags.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase text-zinc-500">
                Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {captions.youtube.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EpisodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const getEpisode = useEpisodeStore((s) => s.getEpisode);
  const updateEpisode = useEpisodeStore((s) => s.updateEpisode);
  const getStoryline = useStorylineStore((s) => s.getStoryline);

  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingCaptions, setLoadingCaptions] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const episode = getEpisode(id);
  const storyline = episode ? getStoryline(episode.storylineId) : undefined;

  // ----- AI actions -----

  async function handleGenerateImagePrompts() {
    if (!episode || !storyline) return;
    setLoadingPrompts(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-image-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenes: episode.scenes.map((s) => ({
            order: s.order,
            environment: s.environment,
            mood: s.mood,
            cameraAngle: s.cameraAngle,
            characterPresence: s.characterPresence,
            cinematicDescription: s.cinematicDescription,
          })),
          characters: storyline.characters.map((c) => ({
            name: c.name,
            visualDescription: c.visualDescription,
          })),
          tone: storyline.tone,
          genre: storyline.genre,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate image prompts");

      const prompts: {
        sceneOrder: number;
        universal: string;
        midjourney: string;
        leonardo: string;
        flux: string;
      }[] = await res.json();

      const updatedScenes = episode.scenes.map((scene) => {
        const match = prompts.find((p) => p.sceneOrder === scene.order);
        if (!match) return scene;
        return {
          ...scene,
          imagePrompt: {
            universal: match.universal,
            midjourney: match.midjourney,
            leonardo: match.leonardo,
            flux: match.flux,
          },
        };
      });

      updateEpisode(episode.id, { scenes: updatedScenes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingPrompts(false);
    }
  }

  async function handleGenerateCaptions() {
    if (!episode || !storyline) return;
    setLoadingCaptions(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storylineTitle: storyline.title,
          episode: {
            title: episode.title,
            hook: episode.hook,
            synopsis: episode.synopsis,
            emotionalArc: episode.emotionalArc,
          },
          genre: storyline.genre,
          tone: storyline.tone,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate captions");

      const captions: PlatformCaptions = await res.json();
      updateEpisode(episode.id, { captions });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingCaptions(false);
    }
  }

  async function handleGenerateVoiceScript() {
    if (!episode || !storyline) return;
    setLoadingVoice(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate-voice-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeTitle: episode.title,
          scenes: episode.scenes.map((s) => ({
            order: s.order,
            narrationText: s.narrationText,
            mood: s.mood,
          })),
          tone: storyline.tone,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate voice script");

      const data: { fullScript: string } = await res.json();
      updateEpisode(episode.id, { voiceScript: data.fullScript });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingVoice(false);
    }
  }

  // ----- Not-found state -----

  if (!episode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-lg text-zinc-400">Episode not found</p>
          <Link
            href="/episodes"
            className="mt-4 inline-block text-sm text-zinc-500 underline underline-offset-4 hover:text-white"
          >
            Back to episodes
          </Link>
        </div>
      </div>
    );
  }

  // ----- Render -----

  const sortedScenes = [...episode.scenes].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/episodes"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-white"
        >
          <span aria-hidden>&larr;</span> Back to Episodes
        </Link>

        {/* ---- Header ---- */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-zinc-500">
              Episode {episode.number}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[episode.status]}`}
            >
              {episode.status}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">
            {episode.title}
          </h1>
          {storyline && (
            <p className="mt-1 text-sm text-zinc-500">
              Part of{" "}
              <Link
                href={`/storylines`}
                className="underline underline-offset-2 hover:text-zinc-300"
              >
                {storyline.title}
              </Link>
            </p>
          )}

          {/* Next-step CTA */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/calendar"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Schedule on Calendar &rarr;
            </Link>
            <span className="text-xs text-zinc-500">
              Pick a date and a platform to add this episode to your posting
              schedule.
            </span>
          </div>
        </div>

        {/* ---- Error banner ---- */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* ---- AI Actions ---- */}
        <div className="mb-10 flex flex-wrap gap-3">
          <button
            onClick={handleGenerateImagePrompts}
            disabled={loadingPrompts}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingPrompts ? "Generating..." : "Generate Image Prompts"}
          </button>
          <button
            onClick={handleGenerateCaptions}
            disabled={loadingCaptions}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingCaptions ? "Generating..." : "Generate Captions"}
          </button>
          <button
            onClick={handleGenerateVoiceScript}
            disabled={loadingVoice}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingVoice ? "Generating..." : "Generate Voice Script"}
          </button>
        </div>

        {/* ---- Story Metadata ---- */}
        <section className="mb-10 grid gap-6 sm:grid-cols-2">
          {/* Hook */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Hook
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {episode.hook}
            </p>
          </div>

          {/* Cliffhanger */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cliffhanger
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {episode.cliffhanger}
            </p>
          </div>

          {/* Synopsis */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:col-span-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Synopsis
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {episode.synopsis}
            </p>
          </div>

          {/* Emotional Arc */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:col-span-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Emotional Arc
            </p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {episode.emotionalArc}
            </p>
          </div>
        </section>

        {/* ---- Scenes ---- */}
        <section className="mb-10">
          <h2 className="mb-5 text-xl font-bold text-white">Scenes</h2>
          {sortedScenes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center">
              <p className="text-sm text-zinc-500">
                No scenes yet. Generate scenes for this episode.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {sortedScenes.map((scene) => (
                <SceneCard key={scene.id} scene={scene} />
              ))}
            </div>
          )}
        </section>

        {/* ---- Voice Script ---- */}
        <section className="mb-10">
          <h2 className="mb-5 text-xl font-bold text-white">Voice Script</h2>
          {episode.voiceScript ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                <code>{episode.voiceScript}</code>
              </pre>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-700 p-10 text-center">
              <p className="text-sm text-zinc-500">
                No voice script yet. Click &ldquo;Generate Voice Script&rdquo;
                to create one.
              </p>
            </div>
          )}
        </section>

        {/* ---- Captions ---- */}
        <section className="mb-10">
          <h2 className="mb-5 text-xl font-bold text-white">Captions</h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <CaptionsSection captions={episode.captions} />
          </div>
        </section>
      </div>
    </div>
  );
}
