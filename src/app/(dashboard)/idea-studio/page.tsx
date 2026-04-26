"use client";

import { useState } from "react";
import { useStorylineStore } from "@/stores/storyline.store";
import { IdeaStudioTabs } from "@/components/idea-studio-tabs";

type Mode = "brainstorm" | "expand" | "riff";

const MODES: { value: Mode; label: string; description: string }[] = [
  {
    value: "brainstorm",
    label: "Brainstorm",
    description:
      "Turn a word, phrase, or idea into 3 fully different storyline concepts with episode breakdowns.",
  },
  {
    value: "expand",
    label: "Deep Dive",
    description:
      "Take a concept you like and expand it into a complete series bible with characters, episodes, and sample scripts.",
  },
  {
    value: "riff",
    label: "Free Riff",
    description:
      "Free-associate on a thought. Find unexpected angles, hidden stories, and surprising connections.",
  },
];

const STARTERS = [
  "What if the villain was right all along?",
  "A kid finds a phone that shows tomorrow's news",
  "Revenge served cold in a small town",
  "The last human on a planet of AI",
  "She deleted the message. That was her first mistake.",
  "A janitor at a tech company discovers the CEO's secret",
  "What if your shadow had its own agenda?",
  "Two strangers keep meeting in different timelines",
];

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function IdeaStudioPage() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("brainstorm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [expandedConcept, setExpandedConcept] = useState<number | null>(null);
  const [convertingIdx, setConvertingIdx] = useState<number | null>(null);

  const { addStoryline } = useStorylineStore();

  async function handleGenerate() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedConcept(null);

    try {
      const res = await fetch("/api/ai/idea-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }),
      });

      if (!res.ok) throw new Error(`Generation failed (${res.status})`);

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleConvertToStoryline(concept: any, idx: number) {
    setConvertingIdx(idx);
    addStoryline({
      title: concept.title,
      premise: concept.premise || concept.logline,
      genre: concept.genre || "dark-motivation",
      tone: concept.tone || "dark",
      targetPlatform: "all",
      narrativeArc: {
        type: concept.narrativeArc?.type || "three-act",
        stages: concept.narrativeArc?.stages || [
          "Setup",
          "Confrontation",
          "Resolution",
        ],
        currentStage: 0,
        totalEpisodes:
          concept.episodeBreakdown?.length ||
          concept.narrativeArc?.totalEpisodes ||
          8,
      },
      characters: concept.characters
        ? concept.characters.map((c: any) => ({
            name: c.name,
            role: c.role || "protagonist",
            personality: c.personality || c.archetype || "",
            emotionalWound: c.emotionalWound || "",
            motivation: c.motivation || c.hook || "",
            visualDescription: c.visualDescription || "",
          }))
        : concept.mainCharacter
          ? [
              {
                name: concept.mainCharacter.name,
                role: "protagonist" as const,
                personality: concept.mainCharacter.archetype || "",
                emotionalWound: "",
                motivation: concept.mainCharacter.hook || "",
                visualDescription: "",
              },
            ]
          : [],
    });
    setTimeout(() => setConvertingIdx(null), 1500);
  }

  // Deep dive uses expandedConcept wrapper
  function handleConvertExpanded(data: any) {
    const concept = data.expandedConcept || data;
    handleConvertToStoryline(concept, -1);
  }

  return (
    <div className="min-h-screen bg-black px-8 py-12 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white">Idea Studio</h1>
          <p className="mt-2 text-zinc-400">
            Your writers&apos; room. Drop in a word, a phrase, a &ldquo;what if&rdquo; — and
            watch it become a full series.
          </p>
        </div>

        <IdeaStudioTabs active="brainstorm" />

        {/* Mode Selector */}
        <div className="mb-6 flex gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => {
                setMode(m.value);
                setResult(null);
              }}
              className={`rounded-xl border px-4 py-3 text-left transition-all ${
                mode === m.value
                  ? "border-white bg-white/10 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              <div className="text-sm font-semibold">{m.label}</div>
              <div className="mt-1 text-xs leading-relaxed opacity-70">
                {m.description}
              </div>
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            {mode === "brainstorm"
              ? "What's your spark?"
              : mode === "expand"
                ? "Which concept do you want to develop?"
                : "Throw something out there..."}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder={
              mode === "brainstorm"
                ? 'A word, a phrase, a thought... e.g. "What if the villain was right?"'
                : mode === "expand"
                  ? "Paste a concept, logline, or describe the series you want to build..."
                  : 'Anything goes. A mood, an image, a question... e.g. "shadows that whisper"'
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500"
          />

          {/* Starter Prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            {STARTERS.slice(0, mode === "riff" ? 8 : 4).map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || !input.trim()}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? mode === "brainstorm"
                  ? "Brainstorming..."
                  : mode === "expand"
                    ? "Building series bible..."
                    : "Riffing..."
                : mode === "brainstorm"
                  ? "Brainstorm"
                  : mode === "expand"
                    ? "Deep Dive"
                    : "Riff on This"}
            </button>
            {loading && (
              <span className="text-xs text-zinc-500 animate-pulse">
                The writers&apos; room is cooking...
              </span>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        {result && mode === "brainstorm" && (
          <BrainstormResults
            result={result}
            expandedConcept={expandedConcept}
            setExpandedConcept={setExpandedConcept}
            onConvert={handleConvertToStoryline}
            convertingIdx={convertingIdx}
          />
        )}

        {result && mode === "expand" && (
          <ExpandResults
            result={result}
            onConvert={handleConvertExpanded}
            convertingIdx={convertingIdx}
          />
        )}

        {result && mode === "riff" && (
          <RiffResults
            result={result}
            onConvert={handleConvertToStoryline}
            convertingIdx={convertingIdx}
            onDiveDeeper={(pitch: string) => {
              setInput(pitch);
              setMode("expand");
              setResult(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Brainstorm Results ──────────────────── */

function BrainstormResults({
  result,
  expandedConcept,
  setExpandedConcept,
  onConvert,
  convertingIdx,
}: {
  result: any;
  expandedConcept: number | null;
  setExpandedConcept: (i: number | null) => void;
  onConvert: (concept: any, idx: number) => void;
  convertingIdx: number | null;
}) {
  return (
    <div className="mt-8 space-y-6">
      {/* Interpretation */}
      {result.interpretation && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4">
          <p className="text-sm font-medium text-zinc-300">
            What I see in this:
          </p>
          <p className="mt-1 text-sm text-zinc-400">{result.interpretation}</p>
        </div>
      )}

      {/* Concepts */}
      {result.concepts?.map((concept: any, i: number) => (
        <div
          key={i}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
        >
          {/* Concept Header */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    {concept.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm italic text-zinc-300">
                  {concept.logline}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {concept.genre}
                </span>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {concept.tone}
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm text-zinc-400">{concept.premise}</p>

            {concept.whyItWorks && (
              <p className="mt-2 text-xs text-emerald-400/80">
                Why it works: {concept.whyItWorks}
              </p>
            )}

            {/* Main Character */}
            {concept.mainCharacter && (
              <div className="mt-4 rounded-lg bg-zinc-800/50 px-4 py-3">
                <p className="text-xs font-medium text-zinc-400">
                  Lead Character
                </p>
                <p className="text-sm text-white">
                  {concept.mainCharacter.name}{" "}
                  <span className="text-zinc-500">
                    — {concept.mainCharacter.archetype}
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {concept.mainCharacter.hook}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={() =>
                  setExpandedConcept(expandedConcept === i ? null : i)
                }
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {expandedConcept === i
                  ? "Hide Episodes"
                  : `View ${concept.episodeBreakdown?.length || 0} Episodes`}
              </button>
              <button
                onClick={() => onConvert(concept, i)}
                disabled={convertingIdx === i}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-60"
              >
                {convertingIdx === i
                  ? "Added to Storylines!"
                  : "Convert to Storyline"}
              </button>
            </div>
          </div>

          {/* Episode Breakdown */}
          {expandedConcept === i && concept.episodeBreakdown && (
            <div className="border-t border-zinc-800 bg-zinc-950/50 p-6">
              <h4 className="mb-4 text-sm font-semibold text-zinc-300">
                Episode Breakdown
              </h4>
              <div className="space-y-3">
                {concept.episodeBreakdown.map((ep: any) => (
                  <div
                    key={ep.episodeNumber}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-700 text-[10px] font-bold text-zinc-300">
                        {ep.episodeNumber}
                      </span>
                      <h5 className="text-sm font-semibold text-white">
                        {ep.title}
                      </h5>
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">{ep.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                      <span className="text-amber-400/80">
                        Hook: {ep.hook}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                      <span className="text-red-400/80">
                        Cliffhanger: {ep.cliffhanger}
                      </span>
                    </div>
                    {ep.emotionalBeat && (
                      <div className="mt-1 text-[11px] text-purple-400/70">
                        Emotional beat: {ep.emotionalBeat}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Series Potential */}
              {concept.seriesPotential && (
                <div className="mt-4 rounded-lg bg-zinc-800/40 px-4 py-3">
                  <p className="text-xs font-medium text-zinc-400">
                    Series Potential
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    {concept.seriesPotential}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────── Expand / Deep Dive Results ──────────────────── */

function ExpandResults({
  result,
  onConvert,
  convertingIdx,
}: {
  result: any;
  onConvert: (data: any) => void;
  convertingIdx: number | null;
}) {
  const concept = result.expandedConcept || result;
  const [activeTab, setActiveTab] = useState<
    "episodes" | "characters" | "script"
  >("episodes");

  return (
    <div className="mt-8 space-y-6">
      {/* Series Header */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{concept.title}</h2>
            <p className="mt-1 text-sm italic text-zinc-300">
              {concept.logline}
            </p>
          </div>
          <button
            onClick={() => onConvert(result)}
            disabled={convertingIdx === -1}
            className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-60"
          >
            {convertingIdx === -1
              ? "Added to Storylines!"
              : "Convert to Storyline"}
          </button>
        </div>

        <p className="mt-3 text-sm text-zinc-400">{concept.premise}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
            {concept.genre}
          </span>
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
            {concept.tone}
          </span>
          {concept.themes?.map((t: string) => (
            <span
              key={t}
              className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>

        {concept.visualStyle && (
          <div className="mt-4 rounded-lg bg-zinc-800/40 px-4 py-3">
            <p className="text-xs font-medium text-zinc-400">Visual Style</p>
            <p className="mt-1 text-xs text-zinc-300">{concept.visualStyle}</p>
          </div>
        )}
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
        {(["episodes", "characters", "script"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-zinc-700 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {tab === "episodes"
              ? `Episodes (${concept.episodeBreakdown?.length || 0})`
              : tab === "characters"
                ? `Characters (${concept.characters?.length || 0})`
                : "Script Sample"}
          </button>
        ))}
      </div>

      {/* Episodes Tab */}
      {activeTab === "episodes" && concept.episodeBreakdown && (
        <div className="space-y-3">
          {concept.episodeBreakdown.map((ep: any) => (
            <div
              key={ep.episodeNumber}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                  {ep.episodeNumber}
                </span>
                <h4 className="text-sm font-bold text-white">{ep.title}</h4>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{ep.summary}</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-amber-400/80">Hook: {ep.hook}</p>
                <p className="text-xs text-red-400/80">
                  Cliffhanger: {ep.cliffhanger}
                </p>
                {ep.emotionalBeat && (
                  <p className="text-xs text-purple-400/70">
                    Emotional beat: {ep.emotionalBeat}
                  </p>
                )}
              </div>
              {ep.keyScenes && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ep.keyScenes.map((scene: string, si: number) => (
                    <span
                      key={si}
                      className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400"
                    >
                      {scene}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Characters Tab */}
      {activeTab === "characters" && concept.characters && (
        <div className="grid gap-4 sm:grid-cols-2">
          {concept.characters.map((char: any, i: number) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">{char.name}</h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    char.role === "protagonist"
                      ? "bg-emerald-900/60 text-emerald-300"
                      : char.role === "antagonist"
                        ? "bg-red-900/60 text-red-300"
                        : "bg-blue-900/60 text-blue-300"
                  }`}
                >
                  {char.role || char.archetype}
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-400">{char.personality}</p>
              {char.visualDescription && (
                <div className="mt-2 rounded bg-zinc-800/50 px-3 py-2">
                  <p className="text-[11px] text-zinc-500">Visual:</p>
                  <p className="text-xs text-zinc-300">
                    {char.visualDescription}
                  </p>
                </div>
              )}
              {char.characterArc && (
                <p className="mt-2 text-[11px] text-purple-400/70">
                  Arc: {char.characterArc}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Script Sample Tab */}
      {activeTab === "script" && concept.scriptSample && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-medium text-zinc-500">
              Episode {concept.scriptSample.episode} — Opening Narration
            </p>
            <p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-relaxed text-zinc-200">
              {concept.scriptSample.openingNarration}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs font-medium text-zinc-500">
              Closing Narration (Cliffhanger)
            </p>
            <p className="mt-3 whitespace-pre-wrap font-serif text-sm leading-relaxed text-zinc-200">
              {concept.scriptSample.closingNarration}
            </p>
          </div>

          {/* Marketing Angles */}
          {concept.marketingAngles && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <p className="text-xs font-medium text-zinc-400">
                Marketing Hooks
              </p>
              <ul className="mt-2 space-y-1">
                {concept.marketingAngles.map((angle: string, i: number) => (
                  <li key={i} className="text-xs text-zinc-300">
                    &bull; {angle}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Riff Results ──────────────────── */

function RiffResults({
  result,
  onConvert,
  convertingIdx,
  onDiveDeeper,
}: {
  result: any;
  onConvert: (concept: any, idx: number) => void;
  convertingIdx: number | null;
  onDiveDeeper: (pitch: string) => void;
}) {
  return (
    <div className="mt-8 space-y-6">
      {/* Riffs */}
      {result.riffs && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Riffs & Angles
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.riffs.map((riff: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <p className="text-sm font-medium text-white">{riff.angle}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {riff.whyItsInteresting}
                </p>
                <p className="mt-2 text-xs text-zinc-300">{riff.quickPitch}</p>
                <button
                  onClick={() => onDiveDeeper(riff.quickPitch)}
                  className="mt-3 text-xs font-medium text-zinc-400 underline transition-colors hover:text-white"
                >
                  Dive deeper into this
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Pick */}
      {result.topPick && (
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
              Top Pick
            </span>
            <h3 className="text-lg font-bold text-white">
              {result.topPick.title}
            </h3>
          </div>
          <p className="mt-2 text-sm italic text-zinc-300">
            {result.topPick.logline}
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            {result.topPick.premise}
          </p>

          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
              {result.topPick.genre}
            </span>
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
              {result.topPick.tone}
            </span>
          </div>

          {/* Episode Teasers */}
          {result.topPick.episodeTeaser && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-zinc-400">
                Episode Outline
              </p>
              {result.topPick.episodeTeaser.map((ep: any) => (
                <div
                  key={ep.episodeNumber}
                  className="flex items-start gap-2 rounded-lg bg-zinc-800/40 px-3 py-2"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-zinc-700 text-[9px] font-bold text-zinc-300">
                    {ep.episodeNumber}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-white">
                      {ep.title}
                    </span>
                    <span className="ml-2 text-xs text-zinc-400">
                      {ep.oneLiner}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => onConvert(result.topPick, 99)}
              disabled={convertingIdx === 99}
              className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-60"
            >
              {convertingIdx === 99
                ? "Added to Storylines!"
                : "Convert to Storyline"}
            </button>
            <button
              onClick={() =>
                onDiveDeeper(
                  `${result.topPick.title}: ${result.topPick.premise}`,
                )
              }
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Deep Dive This Concept
            </button>
          </div>
        </div>
      )}

      {/* Prompts to Explore */}
      {result.promptsToExplore && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-medium text-zinc-400">Keep exploring:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.promptsToExplore.map((p: string, i: number) => (
              <button
                key={i}
                onClick={() => onDiveDeeper(p)}
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
