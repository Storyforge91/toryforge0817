"use client";

import { useRef, useState } from "react";

const HERO_SHOT_DURATION_SECONDS = 8;

const THEME_OPTIONS = [
  { value: "mythic fantasy", label: "Mythic Fantasy" },
  { value: "cosmic horror", label: "Cosmic Horror" },
  { value: "post-apocalyptic", label: "Post-Apocalyptic" },
  { value: "epic superhero", label: "Epic Superhero" },
  { value: "dark sci-fi", label: "Dark Sci-Fi" },
  { value: "ancient civilization", label: "Ancient Civilization" },
  { value: "cyberpunk dystopia", label: "Cyberpunk Dystopia" },
  { value: "surreal dreamscape", label: "Surreal Dreamscape" },
  { value: "elemental forces of nature", label: "Elemental Forces of Nature" },
  { value: "biblical / spiritual", label: "Biblical / Spiritual" },
];

type Step = "idle" | "concept" | "image" | "video" | "complete";

const STEP_LABELS: Record<Step, string> = {
  idle: "Ready",
  concept: "Designing the shot",
  image: "Generating hero frame",
  video: "Animating 8s cinematic shot",
  complete: "Reel ready",
};

interface HeroShot {
  title: string;
  scenario: string;
  imagePrompt: string;
  motionPrompt: string;
  textOverlay: string;
  musicVibe: string;
  duration: number;
  moodTags?: string[];
  themeTags?: string[];
}

interface HeroError {
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}

export default function StudioPage() {
  // Inputs
  const [scenarioSeed, setScenarioSeed] = useState("");
  const [themeHint, setThemeHint] = useState(THEME_OPTIONS[0].value);
  const [externalImageUrl, setExternalImageUrl] = useState("");

  // Pipeline state
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState("");
  const [heroError, setHeroError] = useState<HeroError | null>(null);

  // Outputs
  const [data, setData] = useState<HeroShot | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // UI niceties
  const [copiedField, setCopiedField] = useState<"text" | "music" | null>(null);

  const runningRef = useRef(false);
  const isRunning = step !== "idle" && step !== "complete";

  function reset() {
    setStep("idle");
    setProgress("");
    setHeroError(null);
    setData(null);
    setImageUrl(null);
    setVideoUrl(null);
    setCopiedField(null);
  }

  async function run() {
    if (runningRef.current) return;
    runningRef.current = true;

    reset();

    try {
      // Step 1 — concept
      setStep("concept");
      setProgress("Designing the shot...");
      const conceptRes = await fetch("/api/ai/generate-hero-shot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioSeed: scenarioSeed.trim() || undefined,
          themeHint: themeHint.trim() || undefined,
        }),
      });
      if (!conceptRes.ok) {
        const err = await conceptRes.json().catch(() => ({}));
        if (err && err.actionUrl) {
          setHeroError({
            message:
              err.error ||
              `Hero shot concept failed (HTTP ${conceptRes.status})`,
            actionUrl: err.actionUrl,
            actionLabel: err.actionLabel,
          });
          throw new Error(err.error || "Hero shot concept failed");
        }
        throw new Error(
          err.error || `Hero shot concept failed (HTTP ${conceptRes.status})`,
        );
      }
      const concept: HeroShot = await conceptRes.json();
      setData(concept);

      // Step 2 — image (own URL or generated)
      setStep("image");
      let resolvedImageUrl: string | null = null;
      const ext = externalImageUrl.trim();
      if (ext) {
        if (!/^https?:\/\//.test(ext)) {
          throw new Error(
            "External image URL must start with http:// or https://",
          );
        }
        resolvedImageUrl = ext;
        setImageUrl(ext);
        setProgress("Using your image — skipping generation");
      } else {
        setProgress("Generating hero frame (3D cinematic)...");
        const imgRes = await fetch("/api/images/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: concept.imagePrompt,
            width: 832,
            height: 1472,
            numImages: 1,
            style: "3d-cinematic",
          }),
        });
        if (!imgRes.ok) {
          const err = await imgRes.json().catch(() => ({}));
          throw new Error(
            err.error || `Image generation failed (HTTP ${imgRes.status})`,
          );
        }
        const imgData = await imgRes.json();
        resolvedImageUrl = imgData.imageUrls?.[0] || null;
        if (!resolvedImageUrl) throw new Error("No image URL returned");
        setImageUrl(resolvedImageUrl);
      }

      // Step 3 — animate (silent)
      setStep("video");
      setProgress("Animating 8s cinematic shot...");
      const vidRes = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: resolvedImageUrl,
          motionPrompt: concept.motionPrompt,
          duration: HERO_SHOT_DURATION_SECONDS,
          provider: "kling",
          animationStyle: "cinematic",
          motionFluidity: "smooth",
        }),
      });
      if (!vidRes.ok) {
        const err = await vidRes.json().catch(() => ({}));
        throw new Error(
          err.error || `Animation failed (HTTP ${vidRes.status})`,
        );
      }
      const vidData = await vidRes.json();
      if (vidData.videoUrl) setVideoUrl(vidData.videoUrl);

      setProgress("");
      setStep("complete");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Hero shot failed";
      setHeroError((prev) => prev ?? { message: msg });
      setStep("idle");
    } finally {
      runningRef.current = false;
    }
  }

  async function copy(value: string, field: "text" | "music") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(
        () =>
          setCopiedField((cur) => (cur === field ? null : cur)),
        1500,
      );
    } catch {
      /* ignore non-secure-context clipboard failures */
    }
  }

  function safeFilename(title?: string | null) {
    return (title || "hero-shot")
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /**
   * Build the human-readable sidecar that gets saved next to the MP4. Captures
   * everything the creator needs in CapCut: text overlay, music vibe, caption,
   * hashtags, full prompts, and the source image URL.
   */
  function buildMetadataText(): string {
    if (!data) return "";
    const lines: string[] = [];
    lines.push(`# ${data.title}`);
    lines.push("");
    lines.push(`Scenario: ${data.scenario}`);
    lines.push(`Duration: ${data.duration}s`);
    lines.push("");
    lines.push("## On-Screen Text Overlay");
    lines.push(data.textOverlay || "—");
    lines.push("");
    lines.push("## Music Vibe");
    lines.push(data.musicVibe || "—");
    lines.push("");
    if (Array.isArray(data.themeTags) && data.themeTags.length > 0) {
      lines.push("## Hashtags");
      lines.push(
        data.themeTags
          .map((t) => `#${t.replace(/^#/, "").replace(/\s+/g, "")}`)
          .join(" ") + " #aiart #aianimation #cinematic #ai",
      );
      lines.push("");
    }
    if (Array.isArray(data.moodTags) && data.moodTags.length > 0) {
      lines.push("## Mood Tags");
      lines.push(data.moodTags.join(", "));
      lines.push("");
    }
    lines.push("## Image Prompt");
    lines.push(data.imagePrompt);
    lines.push("");
    lines.push("## Motion Prompt");
    lines.push(data.motionPrompt);
    lines.push("");
    if (imageUrl) {
      lines.push("## Source Image URL");
      lines.push(imageUrl);
      lines.push("");
    }
    if (videoUrl) {
      lines.push("## Source Video URL (expires)");
      lines.push(videoUrl);
      lines.push("");
    }
    lines.push(`Generated: ${new Date().toISOString()}`);
    return lines.join("\n");
  }

  function triggerBlobDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadVideo() {
    if (!videoUrl) return;
    const filename = `${safeFilename(data?.title)}.mp4`;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      triggerBlobDownload(blob, filename);
    } catch {
      window.open(videoUrl, "_blank", "noopener");
    }
  }

  /**
   * Save the full bundle (MP4 + metadata.txt) to a folder of the user's choice.
   *
   * On Chromium-based browsers the File System Access API lets the user pick a
   * directory and we write directly into it. On Safari / Firefox / older
   * browsers we fall back to two regular downloads (the user's default
   * Downloads folder).
   */
  async function saveBundle() {
    if (!data || !videoUrl) return;
    const base = safeFilename(data.title);
    const videoFilename = `${base}.mp4`;
    const metaFilename = `${base}.txt`;
    const metadataText = buildMetadataText();

    let videoBlob: Blob;
    try {
      const res = await fetch(videoUrl);
      videoBlob = await res.blob();
    } catch {
      // Couldn't fetch the video (CORS or network). Fall back to opening it
      // in a new tab so the user can save it manually, then download metadata.
      window.open(videoUrl, "_blank", "noopener");
      triggerBlobDownload(
        new Blob([metadataText], { type: "text/plain" }),
        metaFilename,
      );
      return;
    }

    // Modern path: File System Access API — directory picker.
    const w = window as unknown as {
      showDirectoryPicker?: (opts?: {
        mode?: "read" | "readwrite";
      }) => Promise<FileSystemDirectoryHandle>;
    };
    if (typeof w.showDirectoryPicker === "function") {
      try {
        const dirHandle = await w.showDirectoryPicker({ mode: "readwrite" });

        const videoHandle = await dirHandle.getFileHandle(videoFilename, {
          create: true,
        });
        const videoWriter = await videoHandle.createWritable();
        await videoWriter.write(videoBlob);
        await videoWriter.close();

        const metaHandle = await dirHandle.getFileHandle(metaFilename, {
          create: true,
        });
        const metaWriter = await metaHandle.createWritable();
        await metaWriter.write(metadataText);
        await metaWriter.close();
        return;
      } catch (err) {
        // User cancelled the picker — silently bail. Anything else, fall
        // through to the dual-download fallback so they still get the files.
        if (
          err instanceof DOMException &&
          (err.name === "AbortError" || err.name === "NotAllowedError")
        ) {
          return;
        }
      }
    }

    // Fallback: two regular downloads to the default Downloads folder.
    triggerBlobDownload(videoBlob, videoFilename);
    triggerBlobDownload(
      new Blob([metadataText], { type: "text/plain" }),
      metaFilename,
    );
  }

  return (
    <div className="min-h-screen bg-black px-8 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Studio</h1>
        <p className="mt-2 text-sm text-zinc-400">
          One click. Single cinematic hero-shot reel — the @mister_z / OpenArt
          aesthetic. Locked to 8 seconds, single shot, 9:16. Silent video +
          on-screen text + music vibe (no AI narration).
        </p>

        {/* Error banner */}
        {heroError && (
          <div className="mt-6 rounded-2xl border border-red-900/60 bg-red-950/30 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-900/60 text-xs font-bold text-red-200">
                !
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-100">
                  {heroError.message}
                </p>
                {heroError.actionUrl && heroError.actionLabel && (
                  <a
                    href={heroError.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200"
                  >
                    {heroError.actionLabel} &rarr;
                  </a>
                )}
              </div>
              <button
                onClick={() => setHeroError(null)}
                className="text-xs text-red-300/60 hover:text-red-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Configure */}
        {step === "idle" && !data && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-lg font-semibold">Configure Your Hero Shot</h2>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Scenario seed (optional)
                </label>
                <textarea
                  value={scenarioSeed}
                  onChange={(e) => setScenarioSeed(e.target.value)}
                  rows={3}
                  placeholder='e.g. "A child standing on a cliff facing a god made of storm clouds with glowing eyes" — leave blank for AI to invent something fresh'
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Theme / aesthetic
                </label>
                <select
                  value={themeHint}
                  onChange={(e) => setThemeHint(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {THEME_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-fuchsia-900/40 bg-fuchsia-950/10 p-4">
                <label className="mb-1 block text-sm font-medium text-fuchsia-300">
                  Use my own image URL{" "}
                  <span className="text-zinc-500">(optional)</span>
                </label>
                <p className="mb-2 text-[11px] text-zinc-500">
                  Paste a public image URL (e.g. from OpenArt, Midjourney,
                  Krea). When provided, StoryForge skips image generation and
                  animates YOUR image directly. Best results: 9:16 portrait,
                  &gt;1024px, publicly accessible.
                </p>
                <input
                  type="url"
                  value={externalImageUrl}
                  onChange={(e) => setExternalImageUrl(e.target.value)}
                  placeholder="https://cdn.openart.ai/..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-fuchsia-500"
                />
              </div>
            </div>

            <button
              onClick={run}
              disabled={isRunning}
              className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate Hero Shot Reel
            </button>
          </div>
        )}

        {/* Pipeline progress */}
        {isRunning && (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
            <p className="text-sm font-medium text-zinc-200">
              {STEP_LABELS[step]}
            </p>
            <p className="mt-2 text-xs text-zinc-500 animate-pulse">
              {progress || "Working..."}
            </p>
          </div>
        )}

        {/* Completed actions */}
        {step === "complete" && data && (
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-fuchsia-900/50 bg-fuchsia-950/10 p-5">
            <button
              onClick={() => {
                reset();
                setTimeout(() => run(), 0);
              }}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Another
            </button>
            <button
              onClick={reset}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Reset
            </button>
            <p className="text-[11px] text-zinc-500">
              Download below, then post to Instagram / TikTok with the suggested caption.
            </p>
          </div>
        )}

        {/* Output cards */}
        {data && (
          <div className="mt-6 space-y-6">
            {/* Title + scenario + tags */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <span className="rounded-full bg-fuchsia-900/40 px-3 py-1 text-[10px] uppercase tracking-wider text-fuchsia-300">
                Hero Shot
              </span>
              <h3 className="mt-3 text-2xl font-bold text-white">
                {data.title}
              </h3>
              {data.textOverlay && (
                <p className="mt-2 text-sm italic text-zinc-300">
                  &ldquo;{data.textOverlay}&rdquo;
                </p>
              )}
              <p className="mt-3 text-sm text-zinc-400">{data.scenario}</p>
              {Array.isArray(data.themeTags) && data.themeTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {data.themeTags.map((t, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-300"
                    >
                      #{t.replace(/^#/, "")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Video / image preview */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Preview
              </h3>
              <div className="mx-auto" style={{ maxWidth: 360 }}>
                <div
                  className="relative overflow-hidden rounded-xl bg-black"
                  style={{ aspectRatio: "9/16" }}
                >
                  {videoUrl ? (
                    <video
                      src={videoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={imageUrl}
                      alt={data.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600 animate-pulse">
                      {progress || "Working..."}
                    </div>
                  )}
                </div>
              </div>
              {videoUrl && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={downloadVideo}
                      className="rounded-full bg-white px-6 py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200"
                    >
                      Download Video (MP4)
                    </button>
                    <button
                      onClick={saveBundle}
                      className="rounded-full border border-fuchsia-700 bg-fuchsia-950/30 px-6 py-2 text-xs font-bold text-fuchsia-200 transition-colors hover:border-fuchsia-500 hover:text-white"
                    >
                      Save to Folder…
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    &ldquo;Save to Folder&rdquo; writes the MP4 + a
                    metadata .txt (caption, hashtags, prompts, music vibe)
                    into a folder you pick. Chrome / Edge only — Safari
                    falls back to two downloads.
                  </p>
                </div>
              )}
            </div>

            {/* Text overlay */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">
                  On-Screen Text Overlay
                </h3>
                {data.textOverlay && (
                  <button
                    onClick={() => copy(data.textOverlay, "text")}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    {copiedField === "text" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <p className="text-2xl font-bold text-white">
                {data.textOverlay || "—"}
              </p>
              <p className="mt-2 text-[11px] text-zinc-500">
                Drop this as a single big-font caption in CapCut. Cinematic
                serif (e.g. Trajan, Cinzel) or condensed sans-serif. Center,
                bottom-third.
              </p>
            </div>

            {/* Music vibe */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Music Vibe
                </h3>
                {data.musicVibe && (
                  <button
                    onClick={() => copy(data.musicVibe, "music")}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    {copiedField === "music" ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-200">{data.musicVibe || "—"}</p>
              <p className="mt-2 text-[11px] text-zinc-500">
                Use this as the search query in CapCut / Epidemic Sound /
                Artlist. Cinematic reels work best with trending epic /
                ambient / orchestral audio — silent video + music + text
                consistently outperforms AI narration.
              </p>
            </div>

            {/* Suggested caption */}
            <div className="rounded-2xl border border-fuchsia-900/50 bg-fuchsia-950/10 p-5">
              <h3 className="mb-2 text-sm font-semibold text-fuchsia-300">
                Suggested Caption (Instagram / TikTok)
              </h3>
              <p className="text-sm italic text-zinc-200">
                {data.textOverlay || data.scenario}
              </p>
              <p className="mt-3 text-xs text-zinc-400">
                Comment{" "}
                <span className="font-mono text-fuchsia-300">
                  &ldquo;PROMPT&rdquo;
                </span>{" "}
                and I&apos;ll DM you the prompt that made this 👇
              </p>
              {Array.isArray(data.themeTags) && data.themeTags.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  {data.themeTags
                    .map(
                      (t) =>
                        `#${t.replace(/^#/, "").replace(/\s+/g, "")}`,
                    )
                    .join(" ")}{" "}
                  #aiart #aianimation #cinematic #ai
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
