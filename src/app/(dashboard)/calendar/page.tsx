"use client";

import { useState, useMemo } from "react";
import { useCalendarStore } from "@/stores/calendar.store";
import { useEpisodeStore } from "@/stores/episode.store";
import { useStorylineStore } from "@/stores/storyline.store";
import { useSkitStore } from "@/stores/skit.store";
import { useSocialStore } from "@/stores/social.store";
import type { CalendarItem } from "@/types";

const platformColors: Record<CalendarItem["platform"], string> = {
  tiktok: "bg-cyan-900/60 text-cyan-300 border-cyan-700",
  instagram: "bg-pink-900/60 text-pink-300 border-pink-700",
  youtube: "bg-red-900/60 text-red-300 border-red-700",
};

const platformIcons: Record<CalendarItem["platform"], string> = {
  tiktok: "TT",
  instagram: "IG",
  youtube: "YT",
};

const contentTypeAccent: Record<CalendarItem["contentType"], string> = {
  episode: "border-l-2 border-l-zinc-500",
  skit: "border-l-2 border-l-violet-500",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const emptyScheduleForm = {
  contentType: "skit" as CalendarItem["contentType"],
  contentId: "",
  platform: "tiktok" as CalendarItem["platform"],
  scheduledDate: "",
};

export default function CalendarPage() {
  const items = useCalendarStore((s) => s.items);
  const addItem = useCalendarStore((s) => s.addItem);
  const updateItem = useCalendarStore((s) => s.updateItem);
  const episodes = useEpisodeStore((s) => s.episodes);
  const storylines = useStorylineStore((s) => s.storylines);
  const skits = useSkitStore((s) => s.skits);
  const tiktokAuth = useSocialStore((s) => s.tiktok);

  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyScheduleForm);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const storylineMap = useMemo(
    () => new Map(storylines.map((s) => [s.id, s.title])),
    [storylines],
  );
  const episodeMap = useMemo(
    () =>
      new Map(
        episodes.map((e) => [
          e.id,
          { title: e.title, storylineId: e.storylineId },
        ]),
      ),
    [episodes],
  );
  const skitMap = useMemo(
    () => new Map(skits.map((s) => [s.id, { title: s.title }])),
    [skits],
  );

  const monday = useMemo(() => {
    return addDays(getMonday(new Date()), weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [monday]);

  const today = new Date();

  function getItemsForDay(day: Date): CalendarItem[] {
    return items.filter((item) => isSameDay(new Date(item.scheduledDate), day));
  }

  function titleFor(item: CalendarItem): string {
    if (item.contentType === "episode") {
      const ep = episodeMap.get(item.contentId);
      return ep?.title ?? "Unknown episode";
    }
    const s = skitMap.get(item.contentId);
    return s?.title ?? "Unknown skit";
  }

  /**
   * Resolve the video URL + caption for a calendar item by looking up its
   * underlying skit/episode in the local stores. Returns null if the
   * content can't be posted yet (missing video, missing skit data, etc.).
   */
  function resolvePostable(item: CalendarItem): {
    videoUrl: string;
    title: string;
  } | null {
    if (item.contentType === "skit") {
      const skit = skits.find((s) => s.id === item.contentId);
      if (!skit) return null;
      // Use the first beat with a video as the post asset for now.
      // (A future step is concatenating beats into one final clip.)
      const beatVideo = skit.beats.find((b) => b.videoUrl)?.videoUrl;
      if (!beatVideo) return null;
      const caption =
        skit.captions?.tiktok?.caption ||
        `${skit.title} — ${skit.scenario}`;
      return { videoUrl: beatVideo, title: caption.slice(0, 2200) };
    }
    // Episode posting requires a final assembled video, which the app
    // doesn't produce yet (Phase 4 work). Return null so the UI shows
    // a clear "no video" state instead of trying to post nothing.
    return null;
  }

  async function postNow(item: CalendarItem) {
    if (item.platform !== "tiktok") {
      alert(
        `Auto-posting to ${item.platform} isn't implemented yet. Only TikTok is wired up.`,
      );
      return;
    }
    if (!tiktokAuth?.accessToken) {
      alert("Connect TikTok on the Settings page first.");
      return;
    }
    const postable = resolvePostable(item);
    if (!postable) {
      alert(
        "This item has no posted-ready video. Open the skit/episode and generate beat videos first.",
      );
      return;
    }

    updateItem(item.id, { status: "uploading", attemptedAt: new Date() });
    try {
      const res = await fetch("/api/social/tiktok/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: tiktokAuth.accessToken,
          videoUrl: postable.videoUrl,
          title: postable.title,
          // Default to drafts until full Content Posting API approval
          // is granted (avoids "permission not granted" errors).
          postToDraftsOnly: true,
        }),
      });
      const data = (await res.json()) as { publishId?: string; error?: string };
      if (!res.ok || !data.publishId) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      updateItem(item.id, {
        status: "posted",
        publishId: data.publishId,
        postedAt: new Date(),
      });
    } catch (err) {
      updateItem(item.id, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
        attemptCount: (item.attemptCount ?? 0) + 1,
      });
    }
  }

  /**
   * Walk every "scheduled" calendar item whose date has passed and post
   * each one. Reports a summary at the end.
   */
  async function runScheduleNow() {
    setRunning(true);
    setRunResult(null);
    try {
      const now = Date.now();
      const due = items.filter(
        (i) =>
          i.status === "scheduled" &&
          new Date(i.scheduledDate).getTime() <= now,
      );
      if (due.length === 0) {
        setRunResult("No items are due right now.");
        return;
      }

      let posted = 0;
      let failed = 0;
      for (const item of due) {
        await postNow(item);
        // Re-read the item from store to see what happened (postNow updates it)
        const updated = useCalendarStore
          .getState()
          .items.find((i) => i.id === item.id);
        if (updated?.status === "posted") posted++;
        else if (updated?.status === "failed") failed++;
      }
      setRunResult(
        `Processed ${due.length} due item${due.length === 1 ? "" : "s"} \u2014 ${posted} posted, ${failed} failed.`,
      );
    } finally {
      setRunning(false);
    }
  }

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contentId || !form.scheduledDate) return;

    addItem({
      contentType: form.contentType,
      contentId: form.contentId,
      platform: form.platform,
      // Parse as local date (not UTC) to prevent day-shift after serialization
      scheduledDate: new Date(form.scheduledDate + "T12:00:00"),
    });

    setForm(emptyScheduleForm);
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
            <p className="mt-2 text-zinc-400">
              Schedule skits and episodes across platforms.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runScheduleNow}
              disabled={running}
              className="rounded-full border border-cyan-700 bg-cyan-950/40 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-500 hover:text-white disabled:opacity-50"
              title={
                tiktokAuth
                  ? "Post all due scheduled items right now"
                  : "Connect TikTok on Settings first"
              }
            >
              {running ? "Posting..." : "Run Schedule Now"}
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              {showForm ? "Cancel" : "+ Schedule Content"}
            </button>
          </div>
        </div>

        {/* TikTok connection status banner */}
        <div className="mt-3">
          {tiktokAuth ? (
            <p className="text-xs text-emerald-400/80">
              TikTok connected as @{tiktokAuth.username || tiktokAuth.displayName || "creator"} \u2014 auto-posting ready.
            </p>
          ) : (
            <p className="text-xs text-amber-400/80">
              TikTok not connected. <a href="/settings" className="underline hover:text-amber-300">Connect on Settings</a> to enable auto-posting.
            </p>
          )}
          {runResult && (
            <p className="mt-1 text-xs text-zinc-400">{runResult}</p>
          )}
        </div>

        {/* Schedule Form */}
        {showForm && (
          <form
            onSubmit={handleSchedule}
            className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">
              Schedule Content
            </h2>

            {/* Content type radio */}
            <div className="mb-4 flex gap-2">
              {(["skit", "episode"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, contentType: type, contentId: "" })
                  }
                  className={`rounded-lg border px-4 py-2 text-sm capitalize transition-colors ${
                    form.contentType === type
                      ? "border-white bg-zinc-900 text-white"
                      : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Content select */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400 capitalize">
                  {form.contentType}
                </label>
                <select
                  value={form.contentId}
                  onChange={(e) =>
                    setForm({ ...form, contentId: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                  required
                >
                  <option value="">Select...</option>
                  {form.contentType === "episode"
                    ? episodes.map((ep) => (
                        <option key={ep.id} value={ep.id}>
                          Ep {ep.number}: {ep.title} (
                          {storylineMap.get(ep.storylineId) || "Unknown"})
                        </option>
                      ))
                    : skits.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                </select>
              </div>

              {/* Platform select */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Platform
                </label>
                <select
                  value={form.platform}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      platform: e.target.value as CalendarItem["platform"],
                    })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              {/* Date picker */}
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Date</label>
                <input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) =>
                    setForm({ ...form, scheduledDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyScheduleForm);
                }}
                className="rounded-lg border border-zinc-700 px-5 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Week Navigation */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            &#8592; Prev
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Next &#8594;
          </button>
          <span className="ml-2 text-sm text-zinc-500">
            {formatShortDate(monday)} &mdash;{" "}
            {formatShortDate(addDays(monday, 6))}
          </span>
          <span className="ml-auto flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-1 bg-violet-500" /> Skit
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-1 bg-zinc-500" /> Episode
            </span>
          </span>
        </div>

        {/* Week Grid */}
        <div className="mt-6 grid grid-cols-7 gap-2">
          {weekDays.map((day, i) => {
            const dayItems = getItemsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className={`min-h-[180px] rounded-xl border p-3 ${
                  isToday
                    ? "border-zinc-600 bg-zinc-900/80"
                    : "border-zinc-800 bg-zinc-950"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    {DAY_LABELS[i]}
                  </span>
                  <span
                    className={`text-xs ${
                      isToday
                        ? "rounded-full bg-white px-1.5 py-0.5 font-bold text-black"
                        : "text-zinc-500"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {dayItems.map((item) => {
                    const statusBadge =
                      item.status === "posted"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : item.status === "uploading"
                          ? "bg-amber-500/20 text-amber-300 animate-pulse"
                          : item.status === "failed"
                            ? "bg-red-500/20 text-red-300"
                            : null;
                    return (
                      <div
                        key={item.id}
                        className={`group rounded-lg border px-2 py-1.5 ${platformColors[item.platform]} ${contentTypeAccent[item.contentType]}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold opacity-70">
                            {platformIcons[item.platform]}
                          </span>
                          <span className="truncate text-xs font-medium">
                            {titleFor(item)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-1 text-[10px]">
                          <span className="capitalize opacity-60">
                            {item.contentType}
                          </span>
                          {statusBadge && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-medium capitalize ${statusBadge}`}
                              title={item.errorMessage}
                            >
                              {item.status}
                            </span>
                          )}
                        </div>
                        {item.status !== "posted" &&
                          item.status !== "uploading" && (
                            <button
                              onClick={() => postNow(item)}
                              className="mt-1 hidden w-full rounded bg-black/40 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide hover:bg-black/60 group-hover:block"
                            >
                              Post Now
                            </button>
                          )}
                        {item.status === "failed" && item.errorMessage && (
                          <p className="mt-0.5 line-clamp-2 text-[9px] opacity-70">
                            {item.errorMessage}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {dayItems.length === 0 && (
                  <p className="mt-4 text-center text-[10px] text-zinc-700">
                    No content
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {items.length === 0 && !showForm && (
          <div className="mt-8 rounded-2xl border border-dashed border-zinc-700 p-10 text-center">
            <p className="text-sm text-zinc-500">
              No scheduled content yet. Generate a skit or episode and schedule
              it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
