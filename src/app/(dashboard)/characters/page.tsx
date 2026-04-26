"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCharacterStore } from "@/stores/character.store";
import { useStorylineStore } from "@/stores/storyline.store";
import type { Character, CharacterExpression } from "@/types";

interface VoiceOption {
  id: string;
  name: string;
  gender?: string;
  accent?: string;
}

const roleBadgeColors: Record<Character["role"], string> = {
  protagonist: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  antagonist: "bg-red-900/60 text-red-300 border-red-700",
  supporting: "bg-blue-900/60 text-blue-300 border-blue-700",
  recurring: "bg-amber-900/60 text-amber-300 border-amber-700",
};

const DEFAULT_EXPRESSIONS = [
  "neutral",
  "happy",
  "shocked",
  "angry",
  "confused",
  "talking",
];

const emptyCinematicForm = {
  storylineId: "",
  name: "",
  role: "supporting" as Character["role"],
  personality: "",
  emotionalWound: "",
  motivation: "",
  visualDescription: "",
};

const emptyComedyForm = {
  name: "",
  personality: "",
  speechPattern: "",
  visualDescription: "",
};

type ExpressionState = {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
};

export default function CharactersPage() {
  const characters = useCharacterStore((s) => s.characters);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const addExpression = useCharacterStore((s) => s.addExpression);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const storylines = useStorylineStore((s) => s.storylines);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  useEffect(() => {
    if (voicesLoaded) return;
    fetch("/api/voice/generate")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data: { voices?: VoiceOption[] }) => {
        setVoices(data.voices ?? []);
        setVoicesLoaded(true);
      })
      .catch(() => setVoicesLoaded(true));
  }, [voicesLoaded]);

  function setCharacterVoice(characterId: string, voiceId: string) {
    if (!voiceId) {
      updateCharacter(characterId, {
        voiceId: undefined,
        voiceName: undefined,
      });
      return;
    }
    const v = voices.find((x) => x.id === voiceId);
    updateCharacter(characterId, {
      voiceId,
      voiceName: v?.name,
    });
  }

  const [mode, setMode] = useState<"cinematic" | "comedy">("comedy");
  const [showForm, setShowForm] = useState(false);
  const [cinematicForm, setCinematicForm] = useState(emptyCinematicForm);
  const [comedyForm, setComedyForm] = useState(emptyComedyForm);
  const [confirmGenFor, setConfirmGenFor] = useState<string | null>(null);
  const [exprState, setExprState] = useState<
    Record<string, Record<string, ExpressionState>>
  >({});

  const storylineMap = useMemo(
    () => new Map(storylines.map((s) => [s.id, s.title])),
    [storylines],
  );

  const cinematicCharacters = useMemo(
    () => characters.filter((c) => c.kind === "cinematic" && c.storylineId),
    [characters],
  );
  const comedyCharacters = useMemo(
    () => characters.filter((c) => c.kind === "comedy"),
    [characters],
  );

  const grouped = useMemo(
    () =>
      cinematicCharacters.reduce<Record<string, Character[]>>((acc, c) => {
        const key = c.storylineId as string;
        if (!acc[key]) acc[key] = [];
        acc[key].push(c);
        return acc;
      }, {}),
    [cinematicCharacters],
  );

  function handleCinematicSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cinematicForm.storylineId || !cinematicForm.name) return;
    addCharacter({
      kind: "cinematic",
      storylineId: cinematicForm.storylineId,
      name: cinematicForm.name,
      role: cinematicForm.role,
      personality: cinematicForm.personality,
      emotionalWound: cinematicForm.emotionalWound,
      motivation: cinematicForm.motivation,
      visualDescription: cinematicForm.visualDescription,
      referenceImageUrl: undefined,
    });
    setCinematicForm(emptyCinematicForm);
    setShowForm(false);
  }

  function handleComedySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comedyForm.name) return;
    addCharacter({
      kind: "comedy",
      name: comedyForm.name,
      personality: comedyForm.personality,
      speechPattern: comedyForm.speechPattern,
      visualDescription: comedyForm.visualDescription,
    });
    setComedyForm(emptyComedyForm);
    setShowForm(false);
  }

  async function generateExpressionsFor(character: Character) {
    setConfirmGenFor(null);
    const expressions = DEFAULT_EXPRESSIONS.filter(
      (name) => !character.expressions?.find((e) => e.name === name),
    );
    if (expressions.length === 0) return;

    // Initialize loading state for each requested expression
    setExprState((prev) => ({
      ...prev,
      [character.id]: {
        ...(prev[character.id] || {}),
        ...Object.fromEntries(
          expressions.map((name) => [name, { status: "loading" as const }]),
        ),
      },
    }));

    try {
      // Step 1: Get prompts from Claude
      const promptRes = await fetch("/api/ai/generate-character-expressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: {
            name: character.name,
            visualDescription: character.visualDescription,
            personality: character.personality,
          },
          expressions,
        }),
      });

      if (!promptRes.ok) {
        const err = await promptRes.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${promptRes.status}`);
      }

      const { expressions: promptPairs } = (await promptRes.json()) as {
        expressions: { name: string; prompt: string }[];
      };

      // Step 2: Fan-out to image generation in parallel
      await Promise.allSettled(
        promptPairs.map(async (pair) => {
          try {
            const imgRes = await fetch("/api/images/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: pair.prompt,
                width: 832,
                height: 1472,
                numImages: 1,
              }),
            });

            if (!imgRes.ok) {
              const err = await imgRes.json().catch(() => ({}));
              throw new Error(err.error || `HTTP ${imgRes.status}`);
            }

            const data = (await imgRes.json()) as {
              imageUrls: string[];
            };
            const url = data.imageUrls?.[0];
            if (!url) throw new Error("No image URL returned");

            const expression: CharacterExpression = {
              name: pair.name,
              assetUrl: url,
              prompt: pair.prompt,
              tags: [],
            };

            addExpression(character.id, expression);
            setExprState((prev) => ({
              ...prev,
              [character.id]: {
                ...(prev[character.id] || {}),
                [pair.name]: { status: "success" },
              },
            }));
          } catch (err) {
            setExprState((prev) => ({
              ...prev,
              [character.id]: {
                ...(prev[character.id] || {}),
                [pair.name]: {
                  status: "error",
                  error: err instanceof Error ? err.message : String(err),
                },
              },
            }));
          }
        }),
      );
    } catch (err) {
      // Whole prompt-gen step failed — mark all as error
      setExprState((prev) => ({
        ...prev,
        [character.id]: {
          ...(prev[character.id] || {}),
          ...Object.fromEntries(
            expressions.map((name) => [
              name,
              {
                status: "error" as const,
                error: err instanceof Error ? err.message : String(err),
              },
            ]),
          ),
        },
      }));
    }
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Characters</h1>
            <p className="mt-2 text-zinc-400">
              {mode === "comedy"
                ? "Recurring 2D cartoon personas with reusable expression libraries."
                : "Persistent characters across cinematic storylines."}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            {showForm ? "Cancel" : "+ Add Character"}
          </button>
        </div>

        {/* Mode tabs */}
        <div className="mt-6 inline-flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            onClick={() => setMode("comedy")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === "comedy"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Comedy
          </button>
          <button
            onClick={() => setMode("cinematic")}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === "cinematic"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Cinematic
          </button>
        </div>

        {/* Inline Add Form — Cinematic */}
        {showForm && mode === "cinematic" && (
          <form
            onSubmit={handleCinematicSubmit}
            className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">
              New Cinematic Character
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Storyline
                </label>
                <select
                  value={cinematicForm.storylineId}
                  onChange={(e) =>
                    setCinematicForm({
                      ...cinematicForm,
                      storylineId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                  required
                >
                  <option value="">Select a storyline...</option>
                  {storylines.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">Name</label>
                <input
                  type="text"
                  value={cinematicForm.name}
                  onChange={(e) =>
                    setCinematicForm({ ...cinematicForm, name: e.target.value })
                  }
                  placeholder="Character name"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">Role</label>
                <select
                  value={cinematicForm.role}
                  onChange={(e) =>
                    setCinematicForm({
                      ...cinematicForm,
                      role: e.target.value as Character["role"],
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                >
                  <option value="protagonist">Protagonist</option>
                  <option value="antagonist">Antagonist</option>
                  <option value="supporting">Supporting</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Motivation
                </label>
                <input
                  type="text"
                  value={cinematicForm.motivation}
                  onChange={(e) =>
                    setCinematicForm({
                      ...cinematicForm,
                      motivation: e.target.value,
                    })
                  }
                  placeholder="What drives this character?"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Emotional Wound
                </label>
                <input
                  type="text"
                  value={cinematicForm.emotionalWound}
                  onChange={(e) =>
                    setCinematicForm({
                      ...cinematicForm,
                      emotionalWound: e.target.value,
                    })
                  }
                  placeholder="Core emotional wound or internal conflict"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Personality
                </label>
                <textarea
                  value={cinematicForm.personality}
                  onChange={(e) =>
                    setCinematicForm({
                      ...cinematicForm,
                      personality: e.target.value,
                    })
                  }
                  placeholder="Personality traits, mannerisms, speech patterns..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Visual Description
                </label>
                <textarea
                  value={cinematicForm.visualDescription}
                  onChange={(e) =>
                    setCinematicForm({
                      ...cinematicForm,
                      visualDescription: e.target.value,
                    })
                  }
                  placeholder="Physical appearance, clothing style, distinguishing features..."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Add Character
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setCinematicForm(emptyCinematicForm);
                }}
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Inline Add Form — Comedy */}
        {showForm && mode === "comedy" && (
          <form
            onSubmit={handleComedySubmit}
            className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">
              New Comedy Character
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Name</label>
                <input
                  type="text"
                  value={comedyForm.name}
                  onChange={(e) =>
                    setComedyForm({ ...comedyForm, name: e.target.value })
                  }
                  placeholder="e.g. Karen, The Boss, Friend Zone Mike"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Speech Pattern
                </label>
                <input
                  type="text"
                  value={comedyForm.speechPattern}
                  onChange={(e) =>
                    setComedyForm({
                      ...comedyForm,
                      speechPattern: e.target.value,
                    })
                  }
                  placeholder="e.g. uses lots of slang, trails off mid-sentence"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Personality
                </label>
                <textarea
                  value={comedyForm.personality}
                  onChange={(e) =>
                    setComedyForm({
                      ...comedyForm,
                      personality: e.target.value,
                    })
                  }
                  placeholder="e.g. sarcastic, overworked, dramatic; always one step from snapping"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Visual Description
                </label>
                <textarea
                  value={comedyForm.visualDescription}
                  onChange={(e) =>
                    setComedyForm({
                      ...comedyForm,
                      visualDescription: e.target.value,
                    })
                  }
                  placeholder="Hair, outfit, body type, signature accessories. Keep it simple — this anchors the cartoon design."
                  rows={3}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Add Character
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setComedyForm(emptyComedyForm);
                }}
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Cinematic list */}
        {mode === "cinematic" && (
          <>
            {cinematicCharacters.length === 0 && !showForm ? (
              <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-16 text-center">
                <p className="text-sm text-zinc-500">
                  No cinematic characters yet. Create a storyline first, then
                  add characters.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([storylineId, chars]) => (
                <div key={storylineId} className="mt-10">
                  <h2 className="mb-4 text-lg font-semibold text-zinc-300">
                    {storylineMap.get(storylineId) || "Unknown Storyline"}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {chars.map((c) => (
                      <div
                        key={c.id}
                        className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition-colors hover:border-zinc-700"
                      >
                        <button
                          onClick={() => deleteCharacter(c.id)}
                          className="absolute right-3 top-3 hidden rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400 group-hover:block"
                          title="Delete character"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">
                            {c.name}
                          </h3>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[c.role]}`}
                          >
                            {c.role}
                          </span>
                        </div>
                        {c.personality && (
                          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                            {c.personality}
                          </p>
                        )}
                        {c.visualDescription && (
                          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                            {c.visualDescription}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3">
                          <span className="text-xs text-zinc-600">
                            {storylineMap.get(c.storylineId ?? "") || "—"}
                          </span>
                          {c.storylineId && (
                            <Link
                              href={`/storylines/${c.storylineId}`}
                              className="text-[10px] font-medium text-emerald-400 underline hover:text-emerald-300"
                            >
                              Generate Episode &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Comedy list */}
        {mode === "comedy" && (
          <>
            {comedyCharacters.length === 0 && !showForm ? (
              <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 p-16 text-center">
                <p className="text-sm text-zinc-500">
                  No comedy characters yet. Add a recurring cartoon persona to
                  feature in your skits.
                </p>
              </div>
            ) : (
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {comedyCharacters.map((c) => {
                  const expressions = c.expressions ?? [];
                  const exprMap = new Map(expressions.map((e) => [e.name, e]));
                  const slotState = exprState[c.id] || {};
                  const hasAllDefaults = DEFAULT_EXPRESSIONS.every((name) =>
                    exprMap.has(name),
                  );

                  return (
                    <div
                      key={c.id}
                      className="group relative rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition-colors hover:border-zinc-700"
                    >
                      <button
                        onClick={() => deleteCharacter(c.id)}
                        className="absolute right-3 top-3 hidden rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400 group-hover:block"
                        title="Delete character"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>

                      <h3 className="text-base font-semibold text-white">
                        {c.name}
                      </h3>
                      {c.personality && (
                        <p className="mt-2 text-sm text-zinc-400">
                          {c.personality}
                        </p>
                      )}
                      {c.speechPattern && (
                        <p className="mt-1 text-xs italic text-zinc-500">
                          Speech: {c.speechPattern}
                        </p>
                      )}
                      {c.visualDescription && (
                        <p className="mt-2 text-xs text-zinc-500">
                          {c.visualDescription}
                        </p>
                      )}

                      {/* Voice picker */}
                      <div className="mt-3 border-t border-zinc-800 pt-3">
                        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                          Voice
                        </label>
                        <select
                          value={c.voiceId ?? ""}
                          onChange={(e) =>
                            setCharacterVoice(c.id, e.target.value)
                          }
                          disabled={!voicesLoaded}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-zinc-500 disabled:opacity-50"
                        >
                          <option value="">
                            {voicesLoaded
                              ? "Default voice"
                              : "Loading voices..."}
                          </option>
                          {voices.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                              {v.gender ? ` · ${v.gender}` : ""}
                              {v.accent ? ` · ${v.accent}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Expression gallery */}
                      <div className="mt-4 border-t border-zinc-800 pt-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-medium text-zinc-300">
                            Expressions
                          </p>
                          <span className="text-[10px] text-zinc-600">
                            {expressions.length}/{DEFAULT_EXPRESSIONS.length}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {DEFAULT_EXPRESSIONS.map((name) => {
                            const expr = exprMap.get(name);
                            const state = slotState[name];
                            return (
                              <div
                                key={name}
                                className="aspect-[9/16] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                              >
                                {expr?.assetUrl ? (
                                  <div className="relative h-full w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={expr.assetUrl}
                                      alt={name}
                                      className="h-full w-full object-cover"
                                    />
                                    <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[9px] text-white">
                                      {name}
                                    </span>
                                  </div>
                                ) : state?.status === "loading" ? (
                                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[9px] text-zinc-500">
                                    <span className="animate-pulse">...</span>
                                    <span>{name}</span>
                                  </div>
                                ) : state?.status === "error" ? (
                                  <div
                                    className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center text-[9px] text-red-400"
                                    title={state.error}
                                  >
                                    <span>!</span>
                                    <span>{name}</span>
                                  </div>
                                ) : (
                                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[9px] text-zinc-600">
                                    <span>{name}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {!hasAllDefaults && (
                          <button
                            onClick={() => setConfirmGenFor(c.id)}
                            disabled={Object.values(slotState).some(
                              (s) => s.status === "loading",
                            )}
                            className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {Object.values(slotState).some(
                              (s) => s.status === "loading",
                            )
                              ? "Generating..."
                              : `Generate ${DEFAULT_EXPRESSIONS.length - expressions.length} Missing Expression${
                                  DEFAULT_EXPRESSIONS.length - expressions.length === 1
                                    ? ""
                                    : "s"
                                }`}
                          </button>
                        )}

                        {/* Cost confirmation */}
                        {confirmGenFor === c.id && (
                          <div className="mt-3 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
                            <p className="text-xs text-amber-300">
                              This will generate{" "}
                              {DEFAULT_EXPRESSIONS.length - expressions.length}{" "}
                              images via Leonardo AI (Anime XL). Each call uses
                              ~30 credits. Continue?
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => generateExpressionsFor(c)}
                                className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-500"
                              >
                                Generate
                              </button>
                              <button
                                onClick={() => setConfirmGenFor(null)}
                                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-zinc-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Next step: use in a skit */}
                        <div className="mt-3 border-t border-zinc-800 pt-3 text-right">
                          <Link
                            href="/skits/new"
                            className="text-[10px] font-medium text-violet-400 underline hover:text-violet-300"
                          >
                            Use in a Skit &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
