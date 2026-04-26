"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";

interface Scene {
  order: number;
  environment: string;
  mood: string;
  narrationText: string;
  duration: number;
  cinematicDescription: string;
}

interface EpisodePlayerProps {
  scenes: Scene[];
  sceneImages: Record<number, string>;
  sceneVideos?: Record<number, string>;
  audioUrl: string | null;
  title: string;
  episodeNumber: number;
  hook?: string;
}

export default function EpisodePlayer({
  scenes,
  sceneImages,
  sceneVideos = {},
  audioUrl,
  title,
  episodeNumber,
}: EpisodePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const [audioReadyUrl, setAudioReadyUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [audioErrorUrl, setAudioErrorUrl] = useState<string | null>(null);

  // Derived: auto-reset when audioUrl changes (no synchronous setState needed)
  const audioReady = !!(audioUrl && audioReadyUrl === audioUrl);
  const audioError = !!(audioUrl && audioErrorUrl === audioUrl);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const animationRef = useRef<number>(0);
  const prevSceneIndexRef = useRef<number>(0);
  const updatePlaybackRef = useRef<(() => void) | undefined>(undefined);

  // Real audio duration once it loads — drives scene scaling so visuals
  // stay perfectly in sync with the narration's actual length. We track the
  // URL the duration was captured for so a stale value doesn't bleed across
  // audioUrl changes (same pattern as audioReadyUrl above).
  const [audioDurationCapture, setAudioDurationCapture] = useState<{
    url: string;
    duration: number;
  } | null>(null);
  const audioActualDuration =
    audioUrl && audioDurationCapture?.url === audioUrl
      ? audioDurationCapture.duration
      : null;

  // Plan duration is the sum of Claude's pre-set scene durations. Used only
  // when there's no audio to anchor to.
  const plannedDuration = useMemo(
    () => scenes.reduce((sum, s) => sum + (s.duration || 5), 0),
    [scenes],
  );
  // Master timeline: prefer the actual audio duration so scenes spread
  // evenly across the narration. Fall back to planned duration when audio
  // hasn't loaded yet (or this episode has no narration).
  const totalDuration = audioActualDuration ?? plannedDuration;
  const hasAnyVideo = useMemo(
    () => Object.keys(sceneVideos).length > 0,
    [sceneVideos],
  );

  // Build cumulative scene timing. When audio drives the timeline, scale
  // each scene's planned duration by the ratio (audio / planned) so all
  // scenes still get airtime proportional to what Claude wrote, but the
  // total fits the actual narration length perfectly.
  const sceneTiming = useMemo(() => {
    const useAudio = audioActualDuration != null && plannedDuration > 0;
    const scale = useAudio ? audioActualDuration / plannedDuration : 1;
    return scenes.reduce<
      { start: number; duration: number; end: number }[]
    >((acc, s) => {
      const prev = acc[acc.length - 1];
      const start = prev ? prev.end : 0;
      const duration = (s.duration || 5) * scale;
      acc.push({ start, duration, end: start + duration });
      return acc;
    }, []);
  }, [scenes, audioActualDuration, plannedDuration]);

  const currentScene = scenes[currentSceneIndex];
  const currentVideo = currentScene ? sceneVideos[currentScene.order] : null;

  // Track audio readiness and errors via event callbacks (no synchronous setState)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const url = audioUrl; // Capture for stable closure
    const captureDuration = () => {
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setAudioDurationCapture({ url, duration: dur });
      }
    };
    const onCanPlay = () => {
      setAudioReadyUrl(url);
      captureDuration();
    };
    const onLoadedMeta = () => {
      captureDuration();
    };
    const onError = () => {
      console.error("[EpisodePlayer] Audio failed to load:", url.substring(0, 80));
      setAudioErrorUrl(url);
    };

    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("loadedmetadata", onLoadedMeta);
    audio.addEventListener("error", onError);

    // If already loaded (cache hit), trigger via async callback
    if (audio.readyState >= 4) {
      setTimeout(onCanPlay, 0);
    }

    return () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("loadedmetadata", onLoadedMeta);
      audio.removeEventListener("error", onError);
    };
  }, [audioUrl]);

  // Manage video element playback when scene changes. Each time a scene
  // becomes active we restart its clip from frame 0 so it always plays
  // forward (not from a paused-mid-clip state). Other scenes are paused
  // and reset so they're ready to play cleanly next time.
  const syncSceneVideos = useCallback(
    (sceneIdx: number, playing: boolean) => {
      const scene = scenes[sceneIdx];
      if (!scene) return;

      // Pause and rewind all other scene videos so re-entry starts fresh.
      for (const s of scenes) {
        if (s.order !== scene.order) {
          const otherVid = videoRefs.current[s.order];
          if (otherVid) {
            if (!otherVid.paused) otherVid.pause();
            // Resetting currentTime on a video that's still buffering can
            // throw — guard with try/catch.
            try {
              otherVid.currentTime = 0;
            } catch {
              /* ignore */
            }
          }
        }
      }

      const videoEl = videoRefs.current[scene.order];
      if (videoEl) {
        if (playing) {
          // Always restart the active scene's clip from the beginning.
          try {
            videoEl.currentTime = 0;
          } catch {
            /* ignore */
          }
          videoEl.play().catch((err) => {
            console.warn(
              `[EpisodePlayer] Video play failed for scene ${scene.order}:`,
              err.message,
              "src:",
              videoEl.src?.substring(0, 80),
            );
          });
        } else {
          videoEl.pause();
        }
      }
    },
    [scenes],
  );

  const updatePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;

    const currentTime = audio.currentTime;
    const overallProgress = totalDuration > 0 ? Math.min(currentTime / totalDuration, 1) : 0;
    setProgress(overallProgress);

    let newSceneIndex = 0;
    for (let i = 0; i < sceneTiming.length; i++) {
      if (
        currentTime >= sceneTiming[i].start &&
        currentTime < sceneTiming[i].end
      ) {
        newSceneIndex = i;
        break;
      }
      if (
        i === sceneTiming.length - 1 &&
        currentTime >= sceneTiming[i].start
      ) {
        newSceneIndex = i;
      }
    }

    if (newSceneIndex !== prevSceneIndexRef.current) {
      prevSceneIndexRef.current = newSceneIndex;
      syncSceneVideos(newSceneIndex, true);
    }

    setCurrentSceneIndex(newSceneIndex);

    const timing = sceneTiming[newSceneIndex];
    if (timing && timing.duration > 0) {
      const elapsed = currentTime - timing.start;
      setSceneProgress(Math.min(elapsed / timing.duration, 1));
    }

    animationRef.current = requestAnimationFrame(() => updatePlaybackRef.current?.());
  }, [totalDuration, sceneTiming, syncSceneVideos]);

  // Keep ref in sync so requestAnimationFrame always calls the latest version
  useEffect(() => {
    updatePlaybackRef.current = updatePlayback;
  }, [updatePlayback]);

  function handlePlay() {
    const audio = audioRef.current;
    // If no audio element, audio failed to load, or no URL — use timer playback
    if (!audio || audioError) {
      startTimerPlayback();
      return;
    }

    if (hasEnded) {
      audio.currentTime = 0;
      setCurrentSceneIndex(0);
      setProgress(0);
      setSceneProgress(0);
      setHasEnded(false);
      prevSceneIndexRef.current = 0;
      for (const s of scenes) {
        const vid = videoRefs.current[s.order];
        if (vid) vid.currentTime = 0;
      }
    }

    audio.muted = isMuted;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        syncSceneVideos(hasEnded ? 0 : currentSceneIndex, true);
        animationRef.current = requestAnimationFrame(updatePlayback);
      })
      .catch((err) => {
        console.error("[EpisodePlayer] Audio play failed:", err);
        // Fall back to timer-based playback so video still works
        startTimerPlayback();
      });
  }

  function handlePause() {
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.pause();
    setIsPlaying(false);
    syncSceneVideos(currentSceneIndex, false);
    cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
    const seekTime = fraction * totalDuration;

    if (audio && audioUrl && !audioError) {
      audio.currentTime = Math.min(seekTime, audio.duration || totalDuration);
    } else {
      // Timer mode: adjust the start time
      startTimeRef.current = Date.now() - seekTime * 1000;
    }
    setProgress(fraction);
  }

  function handleEnded() {
    setIsPlaying(false);
    setHasEnded(true);
    setProgress(1);
    syncSceneVideos(currentSceneIndex, false);
    cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  // Timer-based playback (no audio or audio failed)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  function startTimerPlayback() {
    if (hasEnded) {
      setCurrentSceneIndex(0);
      setProgress(0);
      setSceneProgress(0);
      setHasEnded(false);
      startTimeRef.current = Date.now();
      prevSceneIndexRef.current = 0;
      for (const s of scenes) {
        const vid = videoRefs.current[s.order];
        if (vid) vid.currentTime = 0;
      }
    } else {
      startTimeRef.current = Date.now() - progress * totalDuration * 1000;
    }

    setIsPlaying(true);
    syncSceneVideos(hasEnded ? 0 : currentSceneIndex, true);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const overallProgress = Math.min(elapsed / totalDuration, 1);
      setProgress(overallProgress);

      let newSceneIndex = 0;
      for (let i = 0; i < sceneTiming.length; i++) {
        if (
          elapsed >= sceneTiming[i].start &&
          elapsed < sceneTiming[i].end
        ) {
          newSceneIndex = i;
          break;
        }
        if (
          i === sceneTiming.length - 1 &&
          elapsed >= sceneTiming[i].start
        ) {
          newSceneIndex = i;
        }
      }

      if (newSceneIndex !== prevSceneIndexRef.current) {
        prevSceneIndexRef.current = newSceneIndex;
        syncSceneVideos(newSceneIndex, true);
      }

      setCurrentSceneIndex(newSceneIndex);

      const timing = sceneTiming[newSceneIndex];
      if (timing) {
        setSceneProgress(
          Math.min((elapsed - timing.start) / timing.duration, 1),
        );
      }

      if (overallProgress >= 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsPlaying(false);
        setHasEnded(true);
        syncSceneVideos(newSceneIndex, false);
      }
    }, 33);
  }

  function handlePlayNoAudio() {
    startTimerPlayback();
  }

  function handlePauseNoAudio() {
    setIsPlaying(false);
    syncSceneVideos(currentSceneIndex, false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Use audio-synced playback only if audio URL exists and loaded successfully
  const useAudioSync = !!(audioUrl && !audioError);
  const play = useAudioSync ? handlePlay : handlePlayNoAudio;
  const pause = useAudioSync ? handlePause : handlePauseNoAudio;

  // Ken Burns zoom for image fallback
  const scale = 1 + sceneProgress * 0.12;

  function toggleMute() {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-300">
            Episode Preview
          </h3>
          {hasAnyVideo && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              Animated
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCaptions(!showCaptions)}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            showCaptions
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          Captions {showCaptions ? "ON" : "OFF"}
        </button>
      </div>

      {/* Player viewport — 9:16 aspect ratio */}
      <div className="mx-auto" style={{ maxWidth: 360 }}>
        <div
          className="relative overflow-hidden rounded-xl bg-black"
          style={{ aspectRatio: "9/16" }}
        >
          {/* Scene media layer — video clips or fallback images */}
          {scenes.map((scene, i) => {
            const videoUrl = sceneVideos[scene.order];
            const imageUrl = sceneImages[scene.order];
            const isActive = i === currentSceneIndex;

            return (
              <div
                key={scene.order}
                className="absolute inset-0 transition-opacity duration-500"
                style={{
                  opacity: isActive ? 1 : 0,
                  zIndex: isActive ? 1 : 0,
                }}
              >
                {videoUrl ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[scene.order] = el;
                    }}
                    src={videoUrl}
                    muted
                    // Intentionally NOT looped: when a clip is shorter than
                    // its allotted scene time, looping makes the scene
                    // appear to "repeat". Browsers naturally hold on the
                    // last frame after a video ends, which looks much
                    // smoother than restarting.
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() =>
                      console.warn(
                        `[EpisodePlayer] Video element error for scene ${scene.order}:`,
                        videoUrl.substring(0, 80),
                      )
                    }
                  />
                ) : imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageUrl}
                    alt={`Scene ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out"
                    style={{
                      transform: isActive ? `scale(${scale})` : "scale(1)",
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                    <div className="px-6 text-center">
                      <p className="text-xs text-zinc-500">
                        Scene {i + 1}
                      </p>
                      <p className="mt-2 text-sm text-zinc-400">
                        {scene.cinematicDescription || scene.environment || "No media available"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Dark gradient overlays */}
          <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-black/60 via-transparent to-black/80" />

          {/* Top: Episode title */}
          <div className="absolute left-0 right-0 top-0 z-[3] p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/60">
              Episode {episodeNumber}
            </p>
            <p className="mt-0.5 text-sm font-bold text-white">{title}</p>
          </div>

          {/* Scene indicator dots */}
          <div className="absolute left-0 right-0 top-16 z-[3] flex justify-center gap-1.5 px-4">
            {scenes.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentSceneIndex
                    ? "w-6 bg-white"
                    : i < currentSceneIndex
                      ? "w-3 bg-white/60"
                      : "w-3 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Bottom: Narration caption */}
          {showCaptions && currentScene?.narrationText && (
            <div className="absolute bottom-16 left-0 right-0 z-[3] px-5">
              <p
                className="text-center text-sm font-semibold leading-snug text-white drop-shadow-lg"
                style={{
                  textShadow:
                    "0 1px 4px rgba(0,0,0,0.9), 0 0px 12px rgba(0,0,0,0.6)",
                }}
              >
                {currentScene.narrationText}
              </p>
            </div>
          )}

          {/* Play button overlay (when paused) */}
          {!isPlaying && (
            <button
              onClick={play}
              className="absolute inset-0 z-[4] flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                {hasEnded ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    className="ml-0.5 h-7 w-7"
                  >
                    <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="white"
                    className="ml-1 h-8 w-8"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          )}

          {/* Tap to pause (when playing) */}
          {isPlaying && (
            <button
              onClick={pause}
              className="absolute inset-0 z-[4]"
              aria-label="Pause"
            />
          )}
        </div>

        {/* Progress bar */}
        <div
          className="mt-2 h-1.5 cursor-pointer rounded-full bg-zinc-800"
          onClick={handleSeek}
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? pause : play}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200"
            >
              {isPlaying ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : hasEnded ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ml-0.5 h-4 w-4"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Mute/unmute */}
            <button
              onClick={toggleMute}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-white"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            <span className="text-xs text-zinc-500">
              Scene {currentSceneIndex + 1} / {scenes.length}
            </span>
            {currentVideo && (
              <span className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                VIDEO
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">
            {Math.floor(progress * totalDuration)}s / {totalDuration}s
          </span>
        </div>

        {/* Narration audio player */}
        {audioUrl && (
          <div className="mt-3 rounded-lg bg-zinc-800/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-3.5 w-3.5 shrink-0 text-zinc-500"
              >
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <span className="text-[10px] text-zinc-500">Narration Audio</span>
              {audioError ? (
                <span className="rounded-full bg-red-900/40 px-1.5 py-0.5 text-[9px] text-red-400">
                  Failed
                </span>
              ) : audioReady ? (
                <span className="rounded-full bg-emerald-900/40 px-1.5 py-0.5 text-[9px] text-emerald-400">
                  Ready
                </span>
              ) : (
                <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-400">
                  Loading
                </span>
              )}
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={handleEnded}
              preload="auto"
              controls
              className="mt-1.5 h-8 w-full opacity-80"
              style={{ filter: "invert(1) hue-rotate(180deg)" }}
            />
          </div>
        )}

        {/* No-audio indicator */}
        {!audioUrl && (
          <div className="mt-3 rounded-lg bg-zinc-800/30 px-3 py-2">
            <p className="text-[10px] text-zinc-600">
              No narration audio — playing with timer-based scene transitions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
