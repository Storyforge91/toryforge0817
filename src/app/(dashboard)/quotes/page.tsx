"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuoteCardStore, type QuoteCard } from "@/stores/quote-card.store";
import { renderQuoteCard } from "@/lib/quote-card/render";

interface RenderError {
  cardId: string;
  message: string;
}

function safeFilename(quote: string): string {
  return (
    quote
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "quote-card"
  );
}

function todayIsoDate(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(iso?: string): string {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unscheduled";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function QuotesPage() {
  const ensureSeeded = useQuoteCardStore((s) => s.ensureSeeded);
  const cards = useQuoteCardStore((s) => s.cards);
  const addCard = useQuoteCardStore((s) => s.addCard);
  const updateCard = useQuoteCardStore((s) => s.updateCard);
  const removeCard = useQuoteCardStore((s) => s.removeCard);

  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [generatingBgFor, setGeneratingBgFor] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<RenderError | null>(null);
  const [newQuote, setNewQuote] = useState("");

  // Seed on first load. Idempotent — only runs if the store is empty.
  useEffect(() => {
    ensureSeeded();
  }, [ensureSeeded]);

  // Whenever a card's quote or background changes, rebuild its preview.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const card of cards) {
        if (previews[card.id]) continue;
        try {
          const blob = await renderQuoteCard({
            quote: card.quote,
            backgroundUrl: card.backgroundUrl,
          });
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          setPreviews((prev) => ({ ...prev, [card.id]: url }));
        } catch (err) {
          if (cancelled) return;
          console.error("Preview render failed:", err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // We intentionally re-run when cards change. previews is intentionally
    // omitted from deps — we'd loop forever — and we gate inside the loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  // Free object URLs when cards leave the list to avoid blob-leak.
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayCards = useMemo(() => {
    const today = todayIsoDate();
    return cards.filter(
      (c) => !c.posted && c.scheduledAt && c.scheduledAt.slice(0, 10) === today,
    );
  }, [cards]);

  const upcomingCards = useMemo(() => {
    const today = todayIsoDate();
    return cards
      .filter(
        (c) => !c.posted && c.scheduledAt && c.scheduledAt.slice(0, 10) > today,
      )
      .sort((a, b) => (a.scheduledAt! < b.scheduledAt! ? -1 : 1));
  }, [cards]);

  const unscheduledCards = useMemo(
    () => cards.filter((c) => !c.posted && !c.scheduledAt),
    [cards],
  );

  function invalidatePreview(cardId: string) {
    setPreviews((prev) => {
      const url = prev[cardId];
      if (url) URL.revokeObjectURL(url);
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  }

  function handleQuoteEdit(card: QuoteCard, value: string) {
    updateCard(card.id, { quote: value });
    invalidatePreview(card.id);
  }

  function handleSchedule(card: QuoteCard, isoDate: string) {
    updateCard(card.id, { scheduledAt: isoDate || undefined });
  }

  async function handleGenerateBackground(card: QuoteCard) {
    setRenderError(null);
    setGeneratingBgFor(card.id);
    try {
      const res = await fetch("/api/quote-card/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(
          data?.error || `Background generation failed (HTTP ${res.status})`,
        );
      }
      updateCard(card.id, { backgroundUrl: data.imageUrl });
      invalidatePreview(card.id);
    } catch (err) {
      setRenderError({
        cardId: card.id,
        message: err instanceof Error ? err.message : "Background failed",
      });
    } finally {
      setGeneratingBgFor(null);
    }
  }

  async function handleDownload(card: QuoteCard) {
    try {
      const blob = await renderQuoteCard({
        quote: card.quote,
        backgroundUrl: card.backgroundUrl,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeFilename(card.quote)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setRenderError({
        cardId: card.id,
        message: err instanceof Error ? err.message : "Render failed",
      });
    }
  }

  async function copyQuote(card: QuoteCard) {
    try {
      await navigator.clipboard.writeText(card.quote);
    } catch {
      /* ignore */
    }
  }

  function handleAddCustom() {
    const text = newQuote.trim();
    if (!text) return;
    addCard(text);
    setNewQuote("");
  }

  function renderCard(card: QuoteCard) {
    const previewUrl = previews[card.id];
    const isGenerating = generatingBgFor === card.id;

    return (
      <div
        key={card.id}
        className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
      >
        <div
          className="relative bg-black"
          style={{ aspectRatio: "9 / 16" }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={card.quote}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-700 animate-pulse">
              Rendering preview...
            </div>
          )}
        </div>

        <div className="space-y-3 p-4">
          <textarea
            value={card.quote}
            onChange={(e) => handleQuoteEdit(card, e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => handleGenerateBackground(card)}
              disabled={isGenerating}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? "Generating..."
                : card.backgroundUrl
                  ? "Regenerate background"
                  : "Generate background"}
            </button>
            <button
              onClick={() => handleDownload(card)}
              className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Download PNG
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={card.scheduledAt?.slice(0, 10) || ""}
              onChange={(e) => handleSchedule(card, e.target.value)}
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-600"
            />
            <button
              onClick={() => copyQuote(card)}
              className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
              title="Copy quote text"
            >
              Copy text
            </button>
            <button
              onClick={() => updateCard(card.id, { posted: !card.posted })}
              className={`rounded-lg border px-2 py-1.5 text-[11px] transition-colors ${
                card.posted
                  ? "border-emerald-700 bg-emerald-950/30 text-emerald-300"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
              }`}
            >
              {card.posted ? "Posted" : "Mark posted"}
            </button>
            <button
              onClick={() => {
                invalidatePreview(card.id);
                removeCard(card.id);
              }}
              className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-red-800 hover:text-red-300"
              title="Remove card"
            >
              ✕
            </button>
          </div>

          {renderError?.cardId === card.id && (
            <p className="text-[11px] text-red-400">{renderError.message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-8 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quote Cards</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Daily-cadence content for @SetsandStruggles. Twelve seed quotes
              are pre-loaded; edit any of them, generate atmospheric gym
              backgrounds, schedule a target date, and download the PNG when
              it&apos;s ready to post.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-zinc-900 bg-zinc-950/50 p-3 text-[11px] text-zinc-500">
          <span className="font-semibold text-zinc-400">Heads up:</span> the
          schedule date is for your queue, not for auto-posting. Use Buffer or
          Later to actually auto-publish to IG, or check the &ldquo;Today&rdquo;
          section each morning and post manually.
        </div>

        {/* Today */}
        {todayCards.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-400">
              Today ({todayCards.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {todayCards.map(renderCard)}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcomingCards.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Upcoming ({upcomingCards.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingCards.map((c) => (
                <div key={c.id}>
                  <p className="mb-1 text-[11px] text-zinc-500">
                    {formatDateLabel(c.scheduledAt)}
                  </p>
                  {renderCard(c)}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Unscheduled / library */}
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Library ({unscheduledCards.length})
            </h2>
          </div>

          {/* Add custom quote */}
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <input
              type="text"
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCustom();
              }}
              placeholder="Add a custom quote..."
              className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
            />
            <button
              onClick={handleAddCustom}
              disabled={!newQuote.trim()}
              className="rounded-full bg-white px-5 py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add
            </button>
          </div>

          {unscheduledCards.length === 0 ? (
            <p className="text-sm text-zinc-600">
              All cards are scheduled or posted. Add a new one above.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {unscheduledCards.map(renderCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
