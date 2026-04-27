"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import EpisodePlayer from "@/components/episode-player";
import { useSkitStore } from "@/stores/skit.store";
import { useStorylineStore } from "@/stores/storyline.store";
import { useEpisodeStore } from "@/stores/episode.store";
import { useCharacterStore } from "@/stores/character.store";

/* eslint-disable @typescript-eslint/no-explicit-any */

type PipelineStep =
  | "idle"
  | "storyline"
  | "episode"
  | "skit"
  | "images"
  | "video"
  | "voice"
  | "complete";

const STEP_LABELS: Record<PipelineStep, string> = {
  idle: "Ready",
  storyline: "Generating Storyline & Characters",
  episode: "Writing Episode & Scenes",
  skit: "Writing Comedy Skit",
  images: "Generating Scene Images (parallel)",
  video: "Generating Video & Voice (parallel)",
  voice: "Generating Narration Voice",
  complete: "Package Ready",
};

const GENRE_OPTIONS = [
  { value: "action", label: "Action" },
  { value: "drama", label: "Drama" },
  { value: "superhero", label: "Superhero" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Sci-Fi / Cyberpunk" },
  { value: "horror", label: "Horror" },
  { value: "mystery-thriller", label: "Mystery / Thriller" },
  { value: "crime-noir", label: "Crime / Noir" },
  { value: "adventure", label: "Adventure" },
  { value: "comedy", label: "Comedy" },
  { value: "romance", label: "Romance" },
  { value: "anime-romance", label: "Anime Romance" },
  { value: "coming-of-age", label: "Coming-of-Age" },
  { value: "dark-motivation", label: "Dark Motivation" },
  { value: "wholesome", label: "Wholesome Transformation" },
  { value: "western", label: "Western" },
  { value: "historical", label: "Historical Drama" },
  { value: "survival", label: "Survival / Post-Apocalyptic" },
  { value: "slice-of-life", label: "Slice of Life" },
];

const TONE_OPTIONS = [
  { value: "high-octane and explosive", label: "High-Octane & Explosive" },
  { value: "emotional and grounded", label: "Emotional & Grounded" },
  { value: "epic and heroic", label: "Epic & Heroic" },
  { value: "mythic and wondrous", label: "Mythic & Wondrous" },
  { value: "dark and cinematic", label: "Dark & Cinematic" },
  { value: "intense and suspenseful", label: "Intense & Suspenseful" },
  { value: "epic and motivational", label: "Epic & Motivational" },
  { value: "eerie and atmospheric", label: "Eerie & Atmospheric" },
  { value: "gritty and morally complex", label: "Gritty & Morally Complex" },
  { value: "sweeping and adventurous", label: "Sweeping & Adventurous" },
  { value: "lighthearted and witty", label: "Lighthearted & Witty" },
  { value: "warm and heartfelt", label: "Warm & Heartfelt" },
  { value: "tender and romantic", label: "Tender & Romantic" },
  { value: "nostalgic and bittersweet", label: "Nostalgic & Bittersweet" },
  { value: "tense and hopeful", label: "Tense & Hopeful (Survival)" },
  { value: "rugged and weathered", label: "Rugged & Weathered (Western)" },
  { value: "absurd and surreal", label: "Absurd & Surreal" },
];

const SKIT_CATEGORIES = [
  { value: "work_office", label: "Work / Office" },
  { value: "school", label: "School" },
  { value: "relationships", label: "Relationships" },
  { value: "technology", label: "Technology" },
  { value: "daily_life", label: "Daily Life" },
  { value: "trending_audio", label: "Trending Audio" },
  { value: "cultural", label: "Cultural" },
  { value: "gaming", label: "Gaming" },
] as const;

const COMEDY_STYLES = [
  "observational",
  "deadpan",
  "slapstick",
  "absurdist",
  "self-deprecating",
] as const;

const SKIT_AUDIO_STYLES = [
  { value: "voiceover", label: "AI Voiceover" },
  { value: "trending_audio", label: "Trending Audio" },
  { value: "text_only", label: "Text Only" },
  { value: "mixed", label: "Mixed" },
] as const;

type SkitCategoryValue = (typeof SKIT_CATEGORIES)[number]["value"];
type SkitAudioStyleValue = (typeof SKIT_AUDIO_STYLES)[number]["value"];

export default function DemoPage() {
  const router = useRouter();
  const addSkit = useSkitStore((s) => s.addSkit);
  const addStoryline = useStorylineStore((s) => s.addStoryline);
  const addEpisode = useEpisodeStore((s) => s.addEpisode);
  const addCharacter = useCharacterStore((s) => s.addCharacter);

  const [step, setStep] = useState<PipelineStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mode toggle: cinematic episodes vs 2D comedy skits vs single hero-shot reel
  const [mode, setMode] = useState<"cinematic" | "skit" | "hero-shot">(
    "cinematic",
  );

  // Hero Shot config
  const [heroScenarioSeed, setHeroScenarioSeed] = useState("");
  const [heroThemeHint, setHeroThemeHint] = useState("mythic fantasy");
  const [heroExternalImageUrl, setHeroExternalImageUrl] = useState("");

  // Hero Shot pipeline outputs (any since the demo file already has a
  // file-level eslint-disable for explicit-any in dynamic API responses)
  const [heroShotData, setHeroShotData] = useState<any>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string | null>(null);
  const [heroVoiceUrl, setHeroVoiceUrl] = useState<string | null>(null);
  const [heroProgress, setHeroProgress] = useState("");

  // Cinematic config
  const [genre, setGenre] = useState("dark-motivation");
  const [tone, setTone] = useState("dark and cinematic");
  const [premise, setPremise] = useState("");
  const [videoEngine, setVideoEngine] = useState<"auto" | "wan21" | "minimax" | "kling">("auto");
  const [imageStyle, setImageStyle] = useState<
    "3d-cinematic" | "anime" | "flat-cartoon" | "photoreal" | "storybook"
  >("3d-cinematic");
  const [motionFluidity, setMotionFluidity] = useState<
    "mixed" | "limited" | "smooth"
  >("mixed");

  // Character reference image (used for consistency across all scene images)
  const [characterRefUrl, setCharacterRefUrl] = useState<string | null>(null);
  const [characterRefProgress, setCharacterRefProgress] = useState("");

  // Skit config
  const [skitCategory, setSkitCategory] = useState<SkitCategoryValue>("work_office");
  const [skitComedyStyle, setSkitComedyStyle] = useState<string>("observational");
  const [skitAudioStyle, setSkitAudioStyle] = useState<SkitAudioStyleValue>("voiceover");
  const [skitScenarioSeed, setSkitScenarioSeed] = useState("");
  // Visual styling for the skit pipeline. Defaults to flat-cartoon (Primax /
  // Humor Animations look) with limited animation (pose swaps + lip flaps),
  // matching the original 2D comedy reference.
  const [skitImageStyle, setSkitImageStyle] = useState<
    "flat-cartoon" | "anime" | "3d-cinematic" | "photoreal" | "storybook"
  >("flat-cartoon");
  const [skitMotionFluidity, setSkitMotionFluidity] = useState<
    "limited" | "mixed" | "smooth"
  >("limited");

  // Skit pipeline outputs
  const [skitData, setSkitData] = useState<any>(null);
  const [beatImages, setBeatImages] = useState<Record<number, string>>({});
  const [beatVideos, setBeatVideos] = useState<Record<number, string>>({});
  const [skitVoiceUrl, setSkitVoiceUrl] = useState<string | null>(null);
  const [skitCaptions, setSkitCaptions] = useState<any>(null);

  // Pipeline outputs
  const [storyline, setStoryline] = useState<any>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({});
  const [sceneVideos, setSceneVideos] = useState<Record<number, string>>({});
  const [voiceAudio, setVoiceAudio] = useState<string | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [storyMemory, setStoryMemory] = useState("");
  const [episodes, setEpisodes] = useState<any[]>([]);

  // UI state
  const [activeSceneTab, setActiveSceneTab] = useState(0);
  const [captionPlatform, setCaptionPlatform] = useState<
    "tiktok" | "instagram" | "youtube"
  >("tiktok");
  const [imageProgress, setImageProgress] = useState("");
  const [videoProgress, setVideoProgress] = useState("");
  const [videoErrors, setVideoErrors] = useState<string[]>([]);
  const [videoSuccessCount, setVideoSuccessCount] = useState(0);
  const [engineTestResult, setEngineTestResult] = useState<any>(null);
  const [engineTesting, setEngineTesting] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState("");
  const [voiceQuotaExceeded, setVoiceQuotaExceeded] = useState(false);
  const [browserVoicePlaying, setBrowserVoicePlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pipelineRunningRef = useRef(false);
  // AbortController for the active pipeline run. Aborting cancels every
  // in-flight fetch (image gen, video gen, voice gen, captions) so the user
  // navigating away or toggling modes doesn't leave ghost requests running
  // server-side for minutes.
  const pipelineAbortRef = useRef<AbortController | null>(null);

  // Cancel any active pipeline when the component unmounts (user navigates
  // away). React StrictMode in dev fires this twice — that's safe because
  // an already-aborted controller is a no-op.
  useEffect(() => {
    return () => {
      pipelineAbortRef.current?.abort();
    };
  }, []);

  async function runFullPipeline() {
    // Prevent double pipeline runs (ref is instant, not subject to React batching)
    if (pipelineRunningRef.current) return;
    pipelineRunningRef.current = true;

    // New AbortController per run. Stored on the ref so the unmount cleanup
    // can call .abort() and stop further state updates if the user navigates
    // away mid-pipeline. (Individual fetch threading is a follow-up — abort
    // currently signals "stop" to anyone watching the controller.)
    pipelineAbortRef.current?.abort();
    pipelineAbortRef.current = new AbortController();

    setError(null);
    setEpisode(null);
    setSceneImages({});
    setSceneVideos({});
    setVoiceAudio(null);
    setActiveSceneTab(0);
    setImageProgress("");
    setVideoProgress("");
    setVideoErrors([]);
    setVideoSuccessCount(0);
    setVoiceProgress("");
    setVoiceQuotaExceeded(false);
    setBrowserVoicePlaying(false);
    setCharacterRefUrl(null);
    setCharacterRefProgress("");
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    let generatedAudioUrl: string | null = null;

    try {
      // Step 1: Generate storyline (only on first run)
      let currentStoryline = storyline;
      if (!currentStoryline) {
        setStep("storyline");
        const storyRes = await fetch("/api/ai/demo-pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: "storyline",
            data: { genre, tone, premise: premise || undefined },
          }),
        });
        if (!storyRes.ok) throw new Error("Storyline generation failed");
        currentStoryline = await storyRes.json();
        setStoryline(currentStoryline);
      }

      // Step 2: Generate episode
      setStep("episode");
      const epRes = await fetch("/api/ai/demo-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "episode",
          data: {
            storyline: currentStoryline,
            episodeNumber,
            storyMemory,
          },
        }),
      });
      if (!epRes.ok) throw new Error("Episode generation failed");
      const epData = await epRes.json();
      setEpisode(epData);
      setStoryMemory(epData.storyMemory || "");

      // Step 3a: Generate ONE character reference image so all subsequent
      // scenes can reference it for identity consistency. We use the
      // protagonist's visual description to build the ref.
      setStep("images");
      const protagonist =
        (currentStoryline?.characters || []).find(
          (c: any) => c.role === "protagonist",
        ) || (currentStoryline?.characters || [])[0];
      let refImageId: string | null = null;
      if (protagonist?.visualDescription) {
        setCharacterRefProgress("Generating character reference image...");
        try {
          const refPrompt = `Full-body character reference of ${protagonist.name}: ${protagonist.visualDescription}. Standing pose, neutral expression, simple background, clearly visible face and outfit.`;
          const refRes = await fetch("/api/images/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: refPrompt,
              width: 832,
              height: 1472,
              numImages: 1,
              style: imageStyle,
            }),
          });
          if (refRes.ok) {
            const refData = await refRes.json();
            const refUrl = refData.imageUrls?.[0];
            const refId = refData.imageIds?.[0];
            if (refUrl) setCharacterRefUrl(refUrl);
            if (refId) {
              refImageId = refId;
            }
            setCharacterRefProgress("Character ref ready");
          } else {
            setCharacterRefProgress("Character ref skipped (gen failed)");
          }
        } catch {
          setCharacterRefProgress("Character ref skipped (error)");
        }
      }

      // Step 3b: Generate scene images in parallel, each conditioned on the
      // character reference (if we got one) so the protagonist looks the
      // same across every scene.
      const imageResults: Record<number, string> = {};
      const scenes = epData.scenes || [];
      let imagesCompleted = 0;

      setImageProgress(`Generating ${scenes.length} scene images in parallel...`);

      const imagePromises = scenes.map(async (scene: any, i: number) => {
        try {
          const imgRes = await fetch("/api/images/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: scene.imagePrompt,
              width: 832,
              height: 1472,
              numImages: 1,
              style: imageStyle,
              referenceImageIds: refImageId ? [refImageId] : undefined,
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData.imageUrls?.[0]) {
              imageResults[scene.order] = imgData.imageUrls[0];
              setSceneImages((prev) => ({ ...prev, [scene.order]: imgData.imageUrls[0] }));
            }
          }
        } catch {
          console.error(`Image generation failed for scene ${i + 1}`);
        }
        imagesCompleted++;
        setImageProgress(`${imagesCompleted}/${scenes.length} images generated`);
      });

      await Promise.allSettled(imagePromises);
      setImageProgress("");

      // Step 4+5: Generate video clips AND voice narration IN PARALLEL
      // Voice only needs episode text (from Step 2) — no dependency on images/videos
      setStep("video");
      const videoResults: Record<number, string> = {};
      const vidErrors: string[] = [];
      let vidSuccesses = 0;
      let videosProcessed = 0;

      setVideoProgress(`Animating ${scenes.length} scenes in parallel...`);

      // Start voice generation immediately (no dependency on images or videos)
      const voicePromise = (async () => {
        setVoiceProgress("Generating narration...");
        try {
          const voiceRes = await fetch("/api/voice/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: epData.fullVoiceScript || (scenes || []).map((s: any) => s.narrationText || "").filter(Boolean).join(" "),
            }),
          });

          if (voiceRes.ok) {
            const contentType = voiceRes.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const voiceData = await voiceRes.json();
              generatedAudioUrl = voiceData.audioUrl;
              setVoiceAudio(voiceData.audioUrl);
              setVoiceProgress("Voice ready");
            } else {
              console.error("Voice API returned non-JSON response");
              setVoiceProgress("Voice failed");
            }
          } else {
            // Read the error body so we know WHY it failed
            let errDetail = `HTTP ${voiceRes.status}`;
            let isQuotaError = false;
            try {
              const errBody = await voiceRes.json();
              errDetail = errBody.error || errDetail;
              isQuotaError = errBody.quotaExceeded === true;
            } catch { /* ignore parse errors */ }

            if (isQuotaError) {
              setVoiceQuotaExceeded(true);
              setVoiceProgress("Quota exceeded \u2014 browser voice available");
            } else {
              console.error("Voice generation failed:", errDetail);
              setVoiceProgress(`Voice failed: ${errDetail}`);
            }
          }
        } catch (err) {
          console.error("Voice generation failed:", err);
          setVoiceProgress("Voice failed");
        }
      })();

      // Generate all scene videos in parallel
      const videoPromises = scenes.map(async (scene: any, i: number) => {
        const sceneImageUrl = imageResults[scene.order];
        if (!sceneImageUrl) {
          vidErrors.push(`Scene ${i + 1}: No image available to animate`);
          setVideoErrors([...vidErrors]);
          videosProcessed++;
          setVideoProgress(
            `${videosProcessed}/${scenes.length} scenes processed (${vidSuccesses} animated)`
          );
          return;
        }

        try {
          // Map cinematic image style to a video animation style so the
          // motion matches the rendered look.
          const animationStyleForVideo =
            imageStyle === "3d-cinematic"
              ? "cinematic"
              : imageStyle === "anime"
                ? "anime"
                : imageStyle === "storybook"
                  ? "storybook"
                  : "cinematic";

          const vidRes = await fetch("/api/video/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: sceneImageUrl,
              motionPrompt: scene.motionPrompt || scene.cinematicDescription,
              duration: scene.duration || 5,
              provider: videoEngine,
              animationStyle: animationStyleForVideo,
              motionFluidity,
            }),
          });

          // Guard: parse JSON only if response is actually JSON
          let vidData: any;
          const contentType = vidRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            vidData = await vidRes.json();
          } else {
            const rawText = await vidRes.text();
            vidData = { error: `Server returned non-JSON (${vidRes.status}): ${rawText.substring(0, 100)}` };
          }

          if (vidRes.ok && vidData.videoUrl) {
            videoResults[scene.order] = vidData.videoUrl;
            vidSuccesses++;
            setVideoSuccessCount(vidSuccesses);
            setSceneVideos((prev) => ({ ...prev, [scene.order]: vidData.videoUrl }));
          } else {
            const errMsg = vidData.error || `HTTP ${vidRes.status}`;
            vidErrors.push(`Scene ${i + 1}: ${errMsg}`);
            setVideoErrors([...vidErrors]);
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          vidErrors.push(`Scene ${i + 1}: ${errMsg}`);
          setVideoErrors([...vidErrors]);
          console.error(`Video generation failed for scene ${i + 1}:`, err);
        }

        videosProcessed++;
        setVideoProgress(
          `${videosProcessed}/${scenes.length} scenes processed (${vidSuccesses} animated)`
        );
      });

      // Wait for ALL videos + voice to finish
      await Promise.allSettled([...videoPromises, voicePromise]);
      setVideoProgress(
        vidSuccesses > 0
          ? `${vidSuccesses}/${scenes.length} scenes animated`
          : "Video generation failed for all scenes"
      );

      // Done!
      setStep("complete");
      setEpisodes((prev) => [
        ...prev,
        {
          number: episodeNumber,
          data: epData,
          images: { ...imageResults },
          videos: { ...videoResults },
          audio: generatedAudioUrl,
        },
      ]);
      setEpisodeNumber((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline failed");
      setStep("idle");
    } finally {
      pipelineRunningRef.current = false;
    }
  }

  function handleNextEpisode() {
    setEpisode(null);
    setSceneImages({});
    setSceneVideos({});
    setVoiceAudio(null);
    setActiveSceneTab(0);
    setStep("idle");
    // storyline persists, episodeNumber already incremented
    // Use setTimeout to let state settle before triggering pipeline
    setTimeout(() => runFullPipeline(), 0);
  }

  // ─────────────────────────────────────────────
  // Skit pipeline: skit concept → per-beat images → videos + voice + captions
  // ─────────────────────────────────────────────
  async function runSkitPipeline() {
    if (pipelineRunningRef.current) return;
    pipelineRunningRef.current = true;

    setError(null);
    setSkitData(null);
    setBeatImages({});
    setBeatVideos({});
    setSkitVoiceUrl(null);
    setSkitCaptions(null);
    setImageProgress("");
    setVideoProgress("");
    setVideoErrors([]);
    setVideoSuccessCount(0);
    setVoiceProgress("");
    setVoiceQuotaExceeded(false);
    setBrowserVoicePlaying(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    try {
      // Step 1: Generate skit concept
      setStep("skit");
      const skitRes = await fetch("/api/ai/generate-skit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: skitCategory,
          comedyStyle: skitComedyStyle,
          audioStyle: skitAudioStyle,
          scenario: skitScenarioSeed.trim() || undefined,
          characters: [],
        }),
      });
      if (!skitRes.ok) {
        const err = await skitRes.json().catch(() => ({}));
        throw new Error(err.error || `Skit generation failed (HTTP ${skitRes.status})`);
      }
      const generated = await skitRes.json();
      setSkitData(generated);

      const beats: any[] = generated.beats || [];

      // Step 2: Generate one image per beat in parallel
      setStep("images");
      const imageResults: Record<number, string> = {};
      let imagesCompleted = 0;
      setImageProgress(`Generating ${beats.length} beat images in parallel...`);

      const imagePromises = beats.map(async (beat: any) => {
        try {
          // Use just the beat description as the base prompt — the image API
          // will add the style-specific suffix (flat-cartoon, anime, 3d, etc.)
          // based on `skitImageStyle`.
          const prompt = `${beat.description}. White background, full body, 9:16 portrait.`;
          const imgRes = await fetch("/api/images/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              width: 832,
              height: 1472,
              numImages: 1,
              style: skitImageStyle,
            }),
          });

          if (imgRes.ok) {
            const imgData = await imgRes.json();
            if (imgData.imageUrls?.[0]) {
              imageResults[beat.order] = imgData.imageUrls[0];
              setBeatImages((prev) => ({ ...prev, [beat.order]: imgData.imageUrls[0] }));
            }
          }
        } catch {
          console.error(`Image generation failed for beat ${beat.order}`);
        }
        imagesCompleted++;
        setImageProgress(`${imagesCompleted}/${beats.length} beat images generated`);
      });

      await Promise.allSettled(imagePromises);
      setImageProgress("");

      // Step 3: In parallel — animate each beat + voice narration + captions
      setStep("video");
      const videoResults: Record<number, string> = {};
      const vidErrors: string[] = [];
      let vidSuccesses = 0;
      let videosProcessed = 0;
      setVideoProgress(`Animating ${beats.length} beats in parallel...`);

      // Voice narration: build script from dialogue or beat overlays/descriptions
      const voicePromise = (async () => {
        const dialogue: any[] = generated.dialogue || [];
        let narrationText = "";
        if (dialogue.length > 0) {
          narrationText = [...dialogue]
            .sort((a, b) => a.timing - b.timing)
            .map((line) => line.text)
            .join(" ");
        } else {
          narrationText = beats
            .map((b: any) => b.textOverlay || b.description)
            .filter(Boolean)
            .join(". ");
        }

        if (!narrationText.trim()) {
          setVoiceProgress("Voice skipped (no text)");
          return;
        }

        setVoiceProgress("Generating narration...");
        try {
          const voiceRes = await fetch("/api/voice/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: narrationText }),
          });
          if (voiceRes.ok) {
            const data = await voiceRes.json();
            setSkitVoiceUrl(data.audioUrl);
            setVoiceProgress("Voice ready");
          } else {
            let errDetail = `HTTP ${voiceRes.status}`;
            let isQuotaError = false;
            try {
              const errBody = await voiceRes.json();
              errDetail = errBody.error || errDetail;
              isQuotaError = errBody.quotaExceeded === true;
            } catch {}
            if (isQuotaError) {
              setVoiceQuotaExceeded(true);
              setVoiceProgress("Quota exceeded — browser voice available");
            } else {
              setVoiceProgress(`Voice failed: ${errDetail}`);
            }
          }
        } catch (err) {
          setVoiceProgress(`Voice failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      })();

      // Captions: in parallel
      const captionsPromise = (async () => {
        try {
          const synopsis = beats.map((b: any) => `${b.order}. ${b.description}`).join(" ");
          const capRes = await fetch("/api/ai/generate-captions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: generated.title,
              hook: generated.scenario,
              synopsis,
              genre: "comedy",
              tone: skitCategory.replace("_", " "),
            }),
          });
          if (capRes.ok) {
            setSkitCaptions(await capRes.json());
          }
        } catch (err) {
          console.error("Caption generation failed:", err);
        }
      })();

      // Animate each beat
      const videoPromises = beats.map(async (beat: any) => {
        const imageUrl = imageResults[beat.order];
        if (!imageUrl) {
          vidErrors.push(`Beat ${beat.order}: No image to animate`);
          setVideoErrors([...vidErrors]);
          videosProcessed++;
          setVideoProgress(
            `${videosProcessed}/${beats.length} beats processed (${vidSuccesses} animated)`
          );
          return;
        }
        try {
          // Map skit image style → video animationStyle so motion matches
          // the rendered look (flat-cartoon → flat-cartoon, etc.).
          const skitAnimationStyle =
            skitImageStyle === "3d-cinematic"
              ? "cinematic"
              : skitImageStyle === "photoreal"
                ? "cinematic"
                : skitImageStyle === "anime"
                  ? "anime"
                  : skitImageStyle === "storybook"
                    ? "storybook"
                    : "flat-cartoon";

          const vidRes = await fetch("/api/video/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl,
              motionPrompt: beat.description,
              duration: Math.max(1, Math.min(10, Number(beat.duration) || 5)),
              provider: videoEngine,
              animationStyle: skitAnimationStyle,
              motionFluidity: skitMotionFluidity,
            }),
          });

          let vidData: any;
          const contentType = vidRes.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            vidData = await vidRes.json();
          } else {
            const rawText = await vidRes.text();
            vidData = { error: `Server returned non-JSON (${vidRes.status}): ${rawText.substring(0, 100)}` };
          }

          if (vidRes.ok && vidData.videoUrl) {
            videoResults[beat.order] = vidData.videoUrl;
            vidSuccesses++;
            setVideoSuccessCount(vidSuccesses);
            setBeatVideos((prev) => ({ ...prev, [beat.order]: vidData.videoUrl }));
          } else {
            const errMsg = vidData.error || `HTTP ${vidRes.status}`;
            vidErrors.push(`Beat ${beat.order}: ${errMsg}`);
            setVideoErrors([...vidErrors]);
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          vidErrors.push(`Beat ${beat.order}: ${errMsg}`);
          setVideoErrors([...vidErrors]);
        }
        videosProcessed++;
        setVideoProgress(
          `${videosProcessed}/${beats.length} beats processed (${vidSuccesses} animated)`
        );
      });

      await Promise.allSettled([...videoPromises, voicePromise, captionsPromise]);
      setVideoProgress(
        vidSuccesses > 0
          ? `${vidSuccesses}/${beats.length} beats animated`
          : "Video generation failed for all beats"
      );

      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skit pipeline failed");
      setStep("idle");
    } finally {
      pipelineRunningRef.current = false;
    }
  }

  function handleNewSkit() {
    setSkitData(null);
    setBeatImages({});
    setBeatVideos({});
    setSkitVoiceUrl(null);
    setSkitCaptions(null);
    setVoiceQuotaExceeded(false);
    setBrowserVoicePlaying(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setStep("idle");
    setSaveError(null);
  }

  // Save the demo skit (with all generated assets) into the persistent skit
  // library, then jump to its detail page so the user can keep iterating.
  function saveSkitToLibrary() {
    if (!skitData) return;
    setSaveError(null);
    try {
      const beats = (skitData.beats || []).map((b: any) => ({
        order: b.order,
        description: b.description,
        expression: b.expression,
        // Strip AI-invented characterIds — they don't reference real characters
        characterId: undefined,
        duration: Number(b.duration) || 5,
        textOverlay: b.textOverlay || undefined,
        soundEffect: b.soundEffect || undefined,
        cameraAction: b.cameraAction || undefined,
        videoUrl: beatVideos[b.order] || undefined,
      }));

      const dialogue = (skitData.dialogue || []).map((d: any) => ({
        characterId: d.characterId || "",
        text: d.text,
        emotion: d.emotion,
        timing: Number(d.timing) || 0,
      }));

      const id = addSkit({
        title: skitData.title,
        category: skitCategory,
        scenario: skitData.scenario,
        beats,
        dialogue,
        audioStyle: skitData.audioStyle || skitAudioStyle,
        characterIds: [],
        captions: skitCaptions || undefined,
      });

      // Persist voice URL + script via a follow-up update once the skit is
      // saved (addSkit doesn't accept these fields directly).
      if (skitVoiceUrl) {
        const voiceScript =
          (skitData.dialogue || [])
            .map((d: any) => d.text)
            .join(" ") ||
          (skitData.beats || [])
            .map((b: any) => b.textOverlay || b.description)
            .filter(Boolean)
            .join(". ");
        useSkitStore.getState().updateSkit(id, {
          voiceUrl: skitVoiceUrl,
          voiceScript,
        });
      }

      router.push(`/skits/${id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  // Save the demo cinematic episode (storyline + characters + episode) into
  // the persistent library so the user can keep generating episodes in the
  // proper Storylines / Episodes pages.
  function saveEpisodeToLibrary() {
    if (!storyline || !episode) return;
    setSaveError(null);
    try {
      // 1. Create the storyline (also seeds storyline.characters with IDs)
      const storylineId = addStoryline({
        title: storyline.title,
        premise: storyline.premise,
        genre: storyline.genre || genre,
        tone: storyline.tone || tone,
        targetPlatform: "all",
        narrativeArc: {
          type: storyline.narrativeArc?.type || "rejection-to-comeback",
          stages: storyline.narrativeArc?.stages || [],
          currentStage: storyline.narrativeArc?.currentStage ?? 0,
          totalEpisodes: storyline.narrativeArc?.totalEpisodes || 6,
        },
        characters: (storyline.characters || []).map((c: any) => ({
          kind: "cinematic" as const,
          name: c.name,
          role: c.role || "supporting",
          personality: c.personality || "",
          emotionalWound: c.emotionalWound || "",
          motivation: c.motivation || "",
          visualDescription: c.visualDescription || "",
          referenceImageUrl: undefined,
        })),
      });

      // 2. Also mirror characters into the standalone character store so they
      //    show up under /characters → Cinematic tab.
      (storyline.characters || []).forEach((c: any) => {
        addCharacter({
          kind: "cinematic",
          storylineId,
          name: c.name,
          role: c.role || "supporting",
          personality: c.personality || "",
          emotionalWound: c.emotionalWound || "",
          motivation: c.motivation || "",
          visualDescription: c.visualDescription || "",
        });
      });

      // 3. Save the episode with scene metadata
      const episodeId = addEpisode({
        storylineId,
        number: episode.episodeNumber || episodeNumber - 1 || 1,
        title: episode.title,
        hook: episode.hook,
        synopsis: episode.synopsis,
        emotionalArc: episode.emotionalArc || "",
        cliffhanger: episode.cliffhanger || "",
        voiceScript: episode.fullVoiceScript || episode.voiceScript || "",
        scenes: (episode.scenes || []).map((s: any, i: number) => ({
          order: s.order ?? i + 1,
          environment: s.environment || "",
          mood: s.mood || "",
          cameraAngle: s.cameraAngle || "",
          characterPresence: s.characterPresence || [],
          cinematicDescription: s.cinematicDescription || "",
          motionPrompt: s.motionPrompt,
          duration: Number(s.duration) || 5,
          narrationText: s.narrationText || "",
        })),
        captions: episode.captions,
      });

      router.push(`/episodes/${episodeId}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    }
  }

  function playSkitBrowserVoice() {
    if (!skitData) return;
    const dialogue: any[] = skitData.dialogue || [];
    const beats: any[] = skitData.beats || [];
    const text =
      dialogue.length > 0
        ? [...dialogue].sort((a, b) => a.timing - b.timing).map((l: any) => l.text).join(" ")
        : beats.map((b: any) => b.textOverlay || b.description).filter(Boolean).join(". ");
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setBrowserVoicePlaying(false);
    utterance.onerror = () => setBrowserVoicePlaying(false);
    setBrowserVoicePlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  // ─────────────────────────────────────────────
  // Hero Shot pipeline (Path 1 + Path 3)
  //   1. Generate cinematic concept via Claude (mister_z formula)
  //   2. Either generate the hero image OR use a user-provided URL
  //   3. In parallel: animate via Kling/Wan + narrate via ElevenLabs
  //   4. Show single video result
  // ─────────────────────────────────────────────
  async function runHeroShotPipeline() {
    if (pipelineRunningRef.current) return;
    pipelineRunningRef.current = true;

    pipelineAbortRef.current?.abort();
    pipelineAbortRef.current = new AbortController();

    setError(null);
    setHeroShotData(null);
    setHeroImageUrl(null);
    setHeroVideoUrl(null);
    setHeroVoiceUrl(null);
    setHeroProgress("");
    setVoiceProgress("");
    setVoiceQuotaExceeded(false);
    setBrowserVoicePlaying(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();

    try {
      // Step 1 — generate the cinematic concept
      setStep("storyline");
      setHeroProgress("Designing the shot...");
      const conceptRes = await fetch("/api/ai/generate-hero-shot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioSeed: heroScenarioSeed.trim() || undefined,
          themeHint: heroThemeHint.trim() || undefined,
        }),
      });
      if (!conceptRes.ok) {
        const err = await conceptRes.json().catch(() => ({}));
        throw new Error(err.error || `Hero shot concept failed (HTTP ${conceptRes.status})`);
      }
      const concept = await conceptRes.json();
      setHeroShotData(concept);

      // Step 2 — image: either generate or use the user-provided URL (Path 1)
      setStep("images");
      let imageUrl: string | null = null;
      const externalUrl = heroExternalImageUrl.trim();
      if (externalUrl) {
        // Path 1: user pasted an image URL (e.g. from OpenArt). Skip generation.
        if (!/^https?:\/\//.test(externalUrl)) {
          throw new Error("External image URL must start with http:// or https://");
        }
        imageUrl = externalUrl;
        setHeroImageUrl(externalUrl);
        setHeroProgress("Using your image \u2014 skipping generation");
      } else {
        setHeroProgress("Generating hero frame (3D cinematic)...");
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
          throw new Error(err.error || `Image generation failed (HTTP ${imgRes.status})`);
        }
        const imgData = await imgRes.json();
        imageUrl = imgData.imageUrls?.[0] || null;
        if (!imageUrl) throw new Error("No image URL returned from generator");
        setHeroImageUrl(imageUrl);
      }

      // Step 3 — animate + narrate in parallel
      setStep("video");
      setHeroProgress("Animating + narrating in parallel...");

      const duration = Math.max(
        1,
        Math.min(10, Number(concept.duration) || 6),
      );

      const videoPromise = (async () => {
        try {
          const vidRes = await fetch("/api/video/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl,
              motionPrompt: concept.motionPrompt,
              duration,
              provider: "kling", // Kling is the strongest match for hero shots
              animationStyle: "cinematic",
              motionFluidity: "smooth",
            }),
          });
          if (!vidRes.ok) {
            const err = await vidRes.json().catch(() => ({}));
            throw new Error(err.error || `Animation failed (HTTP ${vidRes.status})`);
          }
          const vidData = await vidRes.json();
          if (vidData.videoUrl) {
            setHeroVideoUrl(vidData.videoUrl);
          }
        } catch (err) {
          console.error("Hero shot animation failed:", err);
          setError(
            err instanceof Error
              ? `Animation: ${err.message}`
              : "Animation failed",
          );
        }
      })();

      const voicePromise = (async () => {
        const text = (concept.voiceScript || "").trim();
        if (!text) return;
        setVoiceProgress("Generating narration...");
        try {
          const voiceRes = await fetch("/api/voice/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (voiceRes.ok) {
            const data = await voiceRes.json();
            setHeroVoiceUrl(data.audioUrl);
            setVoiceProgress("Voice ready");
          } else {
            let errDetail = `HTTP ${voiceRes.status}`;
            let isQuotaError = false;
            try {
              const errBody = await voiceRes.json();
              errDetail = errBody.error || errDetail;
              isQuotaError = errBody.quotaExceeded === true;
            } catch {
              /* ignore */
            }
            if (isQuotaError) {
              setVoiceQuotaExceeded(true);
              setVoiceProgress("Quota exceeded \u2014 browser voice available");
            } else {
              setVoiceProgress(`Voice failed: ${errDetail}`);
            }
          }
        } catch (err) {
          setVoiceProgress(
            `Voice failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      })();

      await Promise.allSettled([videoPromise, voicePromise]);

      setHeroProgress("");
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hero shot pipeline failed");
      setStep("idle");
    } finally {
      pipelineRunningRef.current = false;
    }
  }

  function handleNewHeroShot() {
    setHeroShotData(null);
    setHeroImageUrl(null);
    setHeroVideoUrl(null);
    setHeroVoiceUrl(null);
    setHeroProgress("");
    setVoiceQuotaExceeded(false);
    setBrowserVoicePlaying(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setStep("idle");
    setError(null);
  }

  function playHeroBrowserVoice() {
    if (!heroShotData?.voiceScript) return;
    const text = String(heroShotData.voiceScript).trim();
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onend = () => setBrowserVoicePlaying(false);
    utterance.onerror = () => setBrowserVoicePlaying(false);
    setBrowserVoicePlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function handleNewSeries() {
    setStoryline(null);
    setEpisode(null);
    setSceneImages({});
    setSceneVideos({});
    setVoiceAudio(null);
    setEpisodeNumber(1);
    setStoryMemory("");
    setEpisodes([]);
    setVoiceQuotaExceeded(false);
    setBrowserVoicePlaying(false);
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setStep("idle");
  }

  function playBrowserVoice() {
    if (!episode?.fullVoiceScript && !episode?.scenes) return;

    const text =
      episode.fullVoiceScript ||
      (episode.scenes || [])
        .map((s: any) => s.narrationText || "")
        .filter(Boolean)
        .join(" ");

    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(
        (v) => v.name.includes("Google") && v.lang.startsWith("en"),
      ) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setBrowserVoicePlaying(false);
    utterance.onerror = () => setBrowserVoicePlaying(false);

    setBrowserVoicePlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  function stopBrowserVoice() {
    window.speechSynthesis.cancel();
    setBrowserVoicePlaying(false);
  }

  const isRunning = step !== "idle" && step !== "complete";

  return (
    <div className="min-h-screen bg-black px-8 py-12 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Demo</h1>
          <p className="mt-2 text-zinc-400">
            {mode === "cinematic"
              ? "One click. Full animated episode. Storyline, characters, scenes, animated video clips, voice narration, captions — all generated automatically."
              : mode === "skit"
                ? "One click. Full 2D comedy skit. Concept, beats, dialogue, scene images, animated clips, voice narration, captions — all generated automatically."
                : "One click. Single cinematic hero-shot reel \u2014 the @mister_z / OpenArt aesthetic. Scale contrast, atmospheric depth, dramatic camera, mythic narration."}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-8 inline-flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <button
            onClick={() => {
              if (isRunning) return;
              setMode("cinematic");
              setStep("idle");
              setError(null);
              setSaveError(null);
              setVoiceQuotaExceeded(false);
              setBrowserVoicePlaying(false);
              setVoiceProgress("");
              setVideoProgress("");
              setImageProgress("");
              setVideoErrors([]);
              setVideoSuccessCount(0);
              setHeroProgress("");
              if (typeof window !== "undefined") window.speechSynthesis?.cancel();
            }}
            disabled={isRunning}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "cinematic"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Cinematic Episode
          </button>
          <button
            onClick={() => {
              if (isRunning) return;
              setMode("skit");
              setStep("idle");
              setError(null);
              setSaveError(null);
              setVoiceQuotaExceeded(false);
              setBrowserVoicePlaying(false);
              setVoiceProgress("");
              setVideoProgress("");
              setImageProgress("");
              setVideoErrors([]);
              setVideoSuccessCount(0);
              setHeroProgress("");
              if (typeof window !== "undefined") window.speechSynthesis?.cancel();
            }}
            disabled={isRunning}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "skit"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            2D Comedy Skit
          </button>
          <button
            onClick={() => {
              if (isRunning) return;
              setMode("hero-shot");
              setStep("idle");
              setError(null);
              setSaveError(null);
              setVoiceQuotaExceeded(false);
              setBrowserVoicePlaying(false);
              setVoiceProgress("");
              setVideoProgress("");
              setImageProgress("");
              setVideoErrors([]);
              setVideoSuccessCount(0);
              setHeroProgress("");
              if (typeof window !== "undefined") window.speechSynthesis?.cancel();
            }}
            disabled={isRunning}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "hero-shot"
                ? "bg-white text-black"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Hero Shot Reel
          </button>
        </div>

        {/* Pipeline Progress Bar */}
        {isRunning && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                {STEP_LABELS[step]}
              </p>
              <span className="text-xs text-zinc-500 animate-pulse">
                {[videoProgress, voiceProgress, imageProgress].filter(Boolean).join(" | ") || "Processing..."}
              </span>
            </div>
            <div className="flex gap-1">
              {(mode === "cinematic"
                ? (["storyline", "episode", "images", "video"] as PipelineStep[])
                : (["skit", "images", "video"] as PipelineStep[])
              ).map((s, i, steps) => {
                const currentIdx = steps.indexOf(step);
                const stepIdx = i;
                return (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                      stepIdx < currentIdx
                        ? "bg-emerald-500"
                        : stepIdx === currentIdx
                          ? "bg-white animate-pulse"
                          : "bg-zinc-800"
                    }`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
              {mode === "cinematic" ? (
                <>
                  <span>Story</span>
                  <span>Episode</span>
                  <span>Images</span>
                  <span>Video & Voice</span>
                </>
              ) : (
                <>
                  <span>Skit</span>
                  <span>Images</span>
                  <span>Video & Voice</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* CINEMATIC: Config + Launch (only when idle and no storyline yet) */}
        {mode === "cinematic" && step === "idle" && !storyline && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Configure Your Series
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Genre
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Premise (optional)
                </label>
                <textarea
                  value={premise}
                  onChange={(e) => setPremise(e.target.value)}
                  rows={2}
                  placeholder="Leave blank for AI to surprise you, or describe your idea..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
              </div>

              {/* Visual Style — drives image generation look + character ref */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Visual Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        value: "3d-cinematic",
                        label: "3D Cinematic",
                        desc: "Pixar-quality 3D, photorealistic lighting",
                      },
                      {
                        value: "photoreal",
                        label: "Photoreal",
                        desc: "Live-action film look",
                      },
                      {
                        value: "anime",
                        label: "Anime",
                        desc: "Cel-shaded anime/manga",
                      },
                      {
                        value: "storybook",
                        label: "Storybook",
                        desc: "Painted illustration",
                      },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setImageStyle(s.value)}
                      className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                        imageStyle === s.value
                          ? "border-violet-600 bg-violet-950/40 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {s.label}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {s.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-zinc-600">
                  3D Cinematic uses Leonardo Phoenix 1.0 + character-reference
                  consistency so the protagonist looks identical across all
                  scenes (matches the &ldquo;AI movie from one image&rdquo;
                  workflow).
                </p>
              </div>

              {/* Motion Fluidity */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Motion Fluidity
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        value: "limited",
                        label: "Limited",
                        desc: "Pose swaps, lip flaps",
                      },
                      {
                        value: "mixed",
                        label: "Mixed",
                        desc: "Limited + smooth highlights",
                      },
                      {
                        value: "smooth",
                        label: "Smooth",
                        desc: "Continuous fluid motion",
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setMotionFluidity(f.value)}
                      className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                        motionFluidity === f.value
                          ? "border-violet-600 bg-violet-950/40 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {f.label}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {f.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Anime Video Engine */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Animation Engine
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "auto", label: "Auto (Best Available)", desc: "Tries Kling → Wan2.1 → Minimax" },
                      { value: "wan21", label: "Wan 2.1", desc: "Best anime style" },
                      { value: "minimax", label: "Minimax", desc: "Best expressions" },
                      { value: "kling", label: "Kling AI", desc: "Best camera" },
                    ] as const
                  ).map((engine) => (
                    <button
                      key={engine.value}
                      type="button"
                      onClick={() => setVideoEngine(engine.value)}
                      className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                        videoEngine === engine.value
                          ? "border-emerald-600 bg-emerald-950/40 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {engine.label}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {engine.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={engineTesting}
                    onClick={async () => {
                      setEngineTesting(true);
                      setEngineTestResult(null);
                      try {
                        const res = await fetch("/api/video/test");
                        const data = await res.json();
                        setEngineTestResult(data);
                      } catch (err) {
                        setEngineTestResult({ error: String(err) });
                      }
                      setEngineTesting(false);
                    }}
                    className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white disabled:opacity-50"
                  >
                    {engineTesting ? "Testing..." : "Test Video Engine"}
                  </button>
                  <span className="text-[11px] text-zinc-600">
                    Verifies API keys and connectivity
                  </span>
                </div>

                {engineTestResult && (
                  <div className={`mt-2 rounded-lg border p-3 text-xs ${
                    engineTestResult.klingTest?.ok
                      ? "border-emerald-800 bg-emerald-950/30"
                      : "border-red-800 bg-red-950/30"
                  }`}>
                    <div className="space-y-1">
                      <p className="text-zinc-300">
                        <span className="font-medium">Providers:</span>{" "}
                        {engineTestResult.enabledProviders?.length
                          ? engineTestResult.enabledProviders.join(", ")
                          : "None configured"}
                      </p>
                      {engineTestResult.klingTest && (
                        <p className={engineTestResult.klingTest.ok ? "text-emerald-400" : "text-red-400"}>
                          <span className="font-medium">Kling API:</span>{" "}
                          {engineTestResult.klingTest.ok
                            ? `Connected (task created)`
                            : `Failed (${engineTestResult.klingTest.status}): ${JSON.stringify(engineTestResult.klingTest.response)?.substring(0, 150)}`}
                        </p>
                      )}
                      {engineTestResult.klingPollTest && (
                        <p className="text-zinc-400">
                          <span className="font-medium">Poll format:</span>{" "}
                          {JSON.stringify(engineTestResult.klingPollTest.response)?.substring(0, 200)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={runFullPipeline}
              className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Full Animated Episode
            </button>
          </div>
        )}

        {/* Generate Next Episode button (when series exists but no episode showing) */}
        {mode === "cinematic" && step === "idle" && storyline && !episode && (
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={runFullPipeline}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Episode {episodeNumber}
            </button>
            <button
              onClick={handleNewSeries}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              New Series
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 px-5 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {saveError && (
          <div className="mb-6 rounded-xl bg-red-500/10 px-5 py-3 text-sm text-red-400">
            Save failed: {saveError}
          </div>
        )}

        {/* Video generation errors */}
        {videoErrors.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/20 px-5 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-amber-400">
                Video Animation Issues ({videoErrors.length} scene{videoErrors.length > 1 ? "s" : ""} failed)
              </p>
              {videoSuccessCount > 0 && (
                <span className="text-xs text-emerald-400">
                  {videoSuccessCount} succeeded
                </span>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {videoErrors.map((err, i) => (
                <p key={i} className="text-xs text-amber-300/70">{err}</p>
              ))}
            </div>
          </div>
        )}

        {/* Character Reference card — shows the protagonist ref used to lock
            visual identity across all scene images (the "AI movie from one
            image" workflow). */}
        {mode === "cinematic" && (characterRefUrl || characterRefProgress) && (
          <div className="mb-6 flex gap-4 rounded-2xl border border-violet-900/50 bg-violet-950/20 p-5">
            <div className="h-32 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              {characterRefUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={characterRefUrl}
                  alt="Character reference"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[9px] text-zinc-600 animate-pulse">
                  Generating...
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-violet-300">
                Character Reference
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                {characterRefUrl
                  ? "Locked"
                  : characterRefProgress || "Working..."}
              </h3>
              <p className="mt-2 text-xs text-zinc-400">
                Every scene image is conditioned on this reference, so the
                protagonist looks consistent across the entire episode (the
                same workflow as the &ldquo;AI movie from one image&rdquo;
                tutorials).
              </p>
            </div>
          </div>
        )}

        {/* ═══════ Storyline Card ═══════ */}
        {mode === "cinematic" && storyline && (
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Series
                </p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {storyline.title}
                </h2>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {storyline.genre}
                </span>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                  {storyline.tone}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-400">{storyline.premise}</p>
            {storyline.seriesHook && (
              <p className="mt-2 text-sm italic text-amber-400/80">
                &ldquo;{storyline.seriesHook}&rdquo;
              </p>
            )}

            {/* Characters */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {storyline.characters?.map((char: any, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {char.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        char.role === "protagonist"
                          ? "bg-emerald-900/60 text-emerald-300"
                          : char.role === "antagonist"
                            ? "bg-red-900/60 text-red-300"
                            : "bg-blue-900/60 text-blue-300"
                      }`}
                    >
                      {char.role}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {char.personality}
                  </p>
                </div>
              ))}
            </div>

            {/* Episode count */}
            {episodes.length > 0 && (
              <p className="mt-3 text-xs text-zinc-500">
                {episodes.length} episode{episodes.length > 1 ? "s" : ""}{" "}
                generated
              </p>
            )}
          </div>
        )}

        {/* ═══════ Episode Output ═══════ */}
        {mode === "cinematic" && episode && (
          <div className="space-y-6">
            {/* Episode Header */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                  {episode.scenes ? episodeNumber - 1 : episodeNumber}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {episode.title}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {episode.scenes?.length || 0} scenes &bull;{" "}
                    {episode.scenes?.reduce(
                      (sum: number, s: any) => sum + (s.duration || 5),
                      0,
                    )}
                    s runtime
                  </p>
                </div>
                {step === "complete" && (
                  <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                    Ready to Post
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
                  <p className="text-[10px] text-zinc-500">Hook</p>
                  <p className="text-sm text-amber-300">{episode.hook}</p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
                  <p className="text-[10px] text-zinc-500">Cliffhanger</p>
                  <p className="text-sm text-red-300">{episode.cliffhanger}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-zinc-400">{episode.synopsis}</p>
            </div>

            {/* Episode Preview Player */}
            {episode.scenes?.length > 0 && step === "complete" && (
              <EpisodePlayer
                scenes={episode.scenes}
                sceneImages={sceneImages}
                sceneVideos={sceneVideos}
                audioUrl={voiceAudio}
                title={episode.title}
                episodeNumber={episodeNumber - 1}
                hook={episode.hook}
              />
            )}

            {/* Scenes & Media */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Scenes & Animation
              </h3>

              {/* Scene tabs */}
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {episode.scenes?.map((s: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveSceneTab(i)}
                    className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      activeSceneTab === i
                        ? "bg-white text-black"
                        : "bg-zinc-900 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Scene {i + 1}
                    {sceneVideos[s.order] && (
                      <span className="ml-1.5 text-[9px] text-emerald-500">VIDEO</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Active scene */}
              {episode.scenes?.[activeSceneTab] && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Video or Image */}
                  <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                    {sceneVideos[
                      episode.scenes[activeSceneTab].order
                    ] ? (
                      <video
                        src={sceneVideos[episode.scenes[activeSceneTab].order]}
                        controls
                        loop
                        playsInline
                        className="h-auto w-full"
                      />
                    ) : sceneImages[
                      episode.scenes[activeSceneTab].order
                    ] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={
                          sceneImages[episode.scenes[activeSceneTab].order]
                        }
                        alt={`Scene ${activeSceneTab + 1}`}
                        className="h-auto w-full"
                      />
                    ) : (
                      <div className="flex aspect-[9/16] max-h-[500px] items-center justify-center bg-zinc-900">
                        <div className="text-center">
                          <p className="text-sm text-zinc-600">
                            {isRunning
                              ? "Generating..."
                              : "No media generated"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scene details */}
                  <div className="space-y-3">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                      <p className="text-xs font-medium text-zinc-500">
                        Scene {episode.scenes[activeSceneTab].order} &bull;{" "}
                        {episode.scenes[activeSceneTab].duration}s
                      </p>
                      <p className="mt-2 text-sm text-white">
                        {episode.scenes[activeSceneTab].cinematicDescription}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
                        <p className="text-[10px] text-zinc-500">Environment</p>
                        <p className="text-xs text-zinc-300">
                          {episode.scenes[activeSceneTab].environment}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
                        <p className="text-[10px] text-zinc-500">Mood</p>
                        <p className="text-xs text-zinc-300">
                          {episode.scenes[activeSceneTab].mood}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
                        <p className="text-[10px] text-zinc-500">Camera</p>
                        <p className="text-xs text-zinc-300">
                          {episode.scenes[activeSceneTab].cameraAngle}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
                        <p className="text-[10px] text-zinc-500">Characters</p>
                        <p className="text-xs text-zinc-300">
                          {episode.scenes[activeSceneTab].characterPresence?.join(
                            ", ",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                      <p className="text-[10px] font-medium text-zinc-500">
                        Narration
                      </p>
                      <p className="mt-1 font-serif text-sm italic leading-relaxed text-zinc-200">
                        &ldquo;
                        {episode.scenes[activeSceneTab].narrationText}
                        &rdquo;
                      </p>
                    </div>

                    {/* Motion Prompt (animation direction) */}
                    {episode.scenes[activeSceneTab].motionPrompt && (
                      <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-medium text-emerald-500">
                            Animation Direction
                          </p>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                episode.scenes[activeSceneTab].motionPrompt,
                              )
                            }
                            className="text-[10px] text-zinc-600 hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-300/80">
                          {episode.scenes[activeSceneTab].motionPrompt}
                        </p>
                      </div>
                    )}

                    {/* Image Prompt (copyable) */}
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-medium text-zinc-500">
                          Image Prompt
                        </p>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              episode.scenes[activeSceneTab].imagePrompt,
                            )
                          }
                          className="text-[10px] text-zinc-600 hover:text-white"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                        {episode.scenes[activeSceneTab].imagePrompt}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Narration */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Voice Narration
              </h3>
              {voiceAudio ? (
                <div>
                  <audio
                    ref={audioRef}
                    src={voiceAudio}
                    controls
                    className="w-full"
                  />
                  <a
                    href={voiceAudio}
                    download={`${storyline?.title || "episode"}-ep${episodeNumber - 1}-narration.mp3`}
                    className="mt-2 inline-block text-xs text-zinc-400 underline hover:text-white"
                  >
                    Download MP3
                  </a>
                </div>
              ) : voiceQuotaExceeded ? (
                <div>
                  <div className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
                    <p className="text-xs text-amber-400">
                      ElevenLabs credit quota exceeded. Browser voice is
                      available as a free fallback.
                    </p>
                    <p className="mt-1 text-[10px] text-amber-400/60">
                      Upgrade your ElevenLabs plan at elevenlabs.io for premium
                      AI voices.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={
                        browserVoicePlaying
                          ? stopBrowserVoice
                          : playBrowserVoice
                      }
                      className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
                    >
                      {browserVoicePlaying
                        ? "Stop Playback"
                        : "Play with Browser Voice"}
                    </button>
                    {browserVoicePlaying && (
                      <span className="animate-pulse text-xs text-zinc-400">
                        Playing narration...
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  {isRunning
                    ? "Generating narration..."
                    : "Voice generation skipped or failed"}
                </p>
              )}

              {/* Full Script */}
              {episode.fullVoiceScript && (
                <div className="mt-4 rounded-lg bg-zinc-950 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-medium text-zinc-500">
                      Full Script
                    </p>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(episode.fullVoiceScript)
                      }
                      className="text-[10px] text-zinc-600 hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap font-serif text-xs leading-relaxed text-zinc-300">
                    {episode.fullVoiceScript}
                  </p>
                </div>
              )}
            </div>

            {/* Platform Captions */}
            {episode.captions && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Ready-to-Post Captions
                </h3>
                <div className="mb-4 flex gap-1 rounded-lg bg-zinc-800 p-1">
                  {(["tiktok", "instagram", "youtube"] as const).map(
                    (platform) => (
                      <button
                        key={platform}
                        onClick={() => setCaptionPlatform(platform)}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          captionPlatform === platform
                            ? platform === "tiktok"
                              ? "bg-cyan-600 text-white"
                              : platform === "instagram"
                                ? "bg-pink-600 text-white"
                                : "bg-red-600 text-white"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {platform === "tiktok"
                          ? "TikTok"
                          : platform === "instagram"
                            ? "Instagram"
                            : "YouTube"}
                      </button>
                    ),
                  )}
                </div>

                {/* TikTok */}
                {captionPlatform === "tiktok" && episode.captions.tiktok && (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-zinc-950 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-zinc-500">Caption</p>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `${episode.captions.tiktok.caption} ${episode.captions.tiktok.hashtags?.join(" ")}`,
                            )
                          }
                          className="text-[10px] text-zinc-600 hover:text-white"
                        >
                          Copy All
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-white">
                        {episode.captions.tiktok.caption}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {episode.captions.tiktok.hashtags?.map(
                          (h: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs text-cyan-400"
                            >
                              {h.startsWith("#") ? h : `#${h}`}
                            </span>
                          ),
                        )}
                      </div>
                      {episode.captions.tiktok.cta && (
                        <p className="mt-2 text-xs text-amber-400">
                          CTA: {episode.captions.tiktok.cta}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Instagram */}
                {captionPlatform === "instagram" &&
                  episode.captions.instagram && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-zinc-950 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-zinc-500">Caption</p>
                          <button
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${episode.captions.instagram.caption}\n\n${episode.captions.instagram.hashtags?.join(" ")}`,
                              )
                            }
                            className="text-[10px] text-zinc-600 hover:text-white"
                          >
                            Copy All
                          </button>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-white">
                          {episode.captions.instagram.caption}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {episode.captions.instagram.hashtags?.map(
                            (h: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs text-pink-400"
                              >
                                {h.startsWith("#") ? h : `#${h}`}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {/* YouTube */}
                {captionPlatform === "youtube" &&
                  episode.captions.youtube && (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-zinc-950 p-4">
                        <p className="text-[10px] text-zinc-500">Title</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          {episode.captions.youtube.title}
                        </p>
                        <p className="mt-3 text-[10px] text-zinc-500">
                          Description
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-zinc-300">
                          {episode.captions.youtube.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {episode.captions.youtube.tags?.map(
                            (t: string, i: number) => (
                              <span
                                key={i}
                                className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                              >
                                {t}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Actions */}
            {step === "complete" && (
              <div className="flex flex-wrap gap-4 rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5">
                <button
                  onClick={saveEpisodeToLibrary}
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
                >
                  Save to Library &amp; Continue Editing &rarr;
                </button>
                <button
                  onClick={handleNextEpisode}
                  className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Generate Episode {episodeNumber}
                </button>
                <button
                  onClick={handleNewSeries}
                  className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  Start New Series
                </button>
                <p className="flex w-full items-center text-xs text-zinc-500">
                  Save persists the storyline, characters, and episode to your
                  library so you can edit, schedule, and continue the series
                  from /storylines or /episodes. Each new episode builds on the
                  previous one.
                </p>
              </div>
            )}

            {/* Episode History */}
            {episodes.length > 1 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Episode History
                </h3>
                <div className="space-y-2">
                  {episodes.map((ep, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-zinc-800/40 px-4 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-bold text-zinc-300">
                        {ep.number}
                      </span>
                      <span className="text-sm text-white">
                        {ep.data.title}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {ep.data.scenes?.length || 0} scenes &bull;{" "}
                        {Object.keys(ep.videos || {}).length} videos &bull;{" "}
                        {Object.keys(ep.images).length} images
                      </span>
                      <span className="ml-auto rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                        Complete
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ SKIT MODE ═══════ */}
        {mode === "skit" && step === "idle" && !skitData && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Configure Your Skit
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">
                  Category
                </label>
                <select
                  value={skitCategory}
                  onChange={(e) =>
                    setSkitCategory(e.target.value as SkitCategoryValue)
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {SKIT_CATEGORIES.map((c) => (
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
                  value={skitComedyStyle}
                  onChange={(e) => setSkitComedyStyle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
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
                  value={skitAudioStyle}
                  onChange={(e) =>
                    setSkitAudioStyle(e.target.value as SkitAudioStyleValue)
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  {SKIT_AUDIO_STYLES.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Scenario seed (optional)
                </label>
                <textarea
                  value={skitScenarioSeed}
                  onChange={(e) => setSkitScenarioSeed(e.target.value)}
                  rows={2}
                  placeholder='e.g. "When your boss replies-all to a private DM"'
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
              </div>

              {/* Visual Style — drives the per-beat image look. Default
                  flat-cartoon for skits matches Primax / Humor Animations. */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Visual Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        value: "flat-cartoon",
                        label: "Flat 2D Cartoon",
                        desc: "Bold outlines, flat colors (Primax style)",
                      },
                      {
                        value: "anime",
                        label: "Anime",
                        desc: "Cel-shaded anime/manga",
                      },
                      {
                        value: "3d-cinematic",
                        label: "3D Cinematic",
                        desc: "Pixar-quality 3D",
                      },
                      {
                        value: "photoreal",
                        label: "Photoreal",
                        desc: "Live-action film look",
                      },
                      {
                        value: "storybook",
                        label: "Storybook",
                        desc: "Painted illustration",
                      },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSkitImageStyle(s.value)}
                      className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                        skitImageStyle === s.value
                          ? "border-violet-600 bg-violet-950/40 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {s.label}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {s.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion Fluidity */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Motion Fluidity
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        value: "limited",
                        label: "Limited",
                        desc: "Pose swaps + lip flaps (default for comedy)",
                      },
                      {
                        value: "mixed",
                        label: "Mixed",
                        desc: "Limited + smooth highlights",
                      },
                      {
                        value: "smooth",
                        label: "Smooth",
                        desc: "Continuous fluid motion",
                      },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setSkitMotionFluidity(f.value)}
                      className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                        skitMotionFluidity === f.value
                          ? "border-violet-600 bg-violet-950/40 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {f.label}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {f.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Animation Engine
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "auto", label: "Auto", desc: "Tries Kling \u2192 Wan2.1 \u2192 Minimax" },
                      { value: "wan21", label: "Wan 2.1", desc: "Best for stylized motion" },
                      { value: "minimax", label: "Minimax", desc: "Best expressions" },
                      { value: "kling", label: "Kling AI", desc: "Best camera" },
                    ] as const
                  ).map((engine) => (
                    <button
                      key={engine.value}
                      type="button"
                      onClick={() => setVideoEngine(engine.value)}
                      className={`rounded-lg border px-4 py-2 text-left transition-colors ${
                        videoEngine === engine.value
                          ? "border-violet-600 bg-violet-950/40 text-white"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
                      }`}
                    >
                      <span className="block text-sm font-medium">
                        {engine.label}
                      </span>
                      <span className="block text-[10px] text-zinc-500">
                        {engine.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={runSkitPipeline}
              className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Full Animated Skit
            </button>
          </div>
        )}

        {/* SKIT: completed actions */}
        {mode === "skit" && step === "complete" && skitData && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-900/50 bg-violet-950/20 p-5">
            <button
              onClick={saveSkitToLibrary}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Save to Library &amp; Continue Editing &rarr;
            </button>
            <button
              onClick={() => {
                handleNewSkit();
                setTimeout(() => runSkitPipeline(), 0);
              }}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Generate Another
            </button>
            <button
              onClick={handleNewSkit}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Reset
            </button>
            <p className="text-[11px] text-zinc-500">
              Save lets you tweak beats, regenerate clips per-beat, schedule on the calendar, and export a production pack.
            </p>
          </div>
        )}

        {/* SKIT: between-runs shortcut (idle but skit data still on screen) */}
        {mode === "skit" && step === "idle" && skitData && (
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => {
                handleNewSkit();
                setTimeout(() => runSkitPipeline(), 0);
              }}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Another Skit
            </button>
            <button
              onClick={handleNewSkit}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Reset
            </button>
          </div>
        )}

        {/* SKIT: Output */}
        {mode === "skit" && skitData && (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-violet-900/40 px-3 py-1 text-[10px] uppercase tracking-wider text-violet-300">
                  {skitCategory.replace("_", " ")}
                </span>
                {step === "complete" && (
                  <span className="ml-auto rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                    Ready to Post
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-xl font-bold text-white">
                {skitData.title}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{skitData.scenario}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                <span>{skitData.beats?.length || 0} beats</span>
                <span>·</span>
                <span>
                  {(skitData.beats || []).reduce(
                    (sum: number, b: any) => sum + (b.duration || 0),
                    0,
                  ).toFixed(1)}
                  s total
                </span>
                <span>·</span>
                <span className="capitalize">audio: {skitData.audioStyle}</span>
              </div>
            </div>

            {/* Unified player — plays the whole skit as one continuous video */}
            {skitData.beats?.length > 0 && step === "complete" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Preview
                </h3>
                <EpisodePlayer
                  scenes={skitData.beats.map((b: any) => ({
                    order: b.order,
                    environment: "",
                    mood: "",
                    narrationText: b.textOverlay || b.description,
                    duration: Number(b.duration) || 3,
                    cinematicDescription: b.description,
                  }))}
                  sceneImages={beatImages}
                  sceneVideos={beatVideos}
                  audioUrl={skitVoiceUrl}
                  title={skitData.title}
                  episodeNumber={1}
                  hook={skitData.scenario}
                />
                <p className="mt-2 text-xs text-zinc-500">
                  Press play to watch the full skit. The narration audio is
                  synced and the visual auto-advances through each scene.
                </p>
              </div>
            )}

            {/* Pre-completion fallback: show generation progress per scene */}
            {skitData.beats?.length > 0 && step !== "complete" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Scenes ({skitData.beats.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {skitData.beats.map((b: any, i: number) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
                    >
                      <div className="aspect-[9/16] bg-zinc-900">
                        {beatVideos[b.order] ? (
                          <video
                            src={beatVideos[b.order]}
                            muted
                            loop
                            autoPlay
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : beatImages[b.order] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={beatImages[b.order]}
                            alt={`Scene ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                            Generating...
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] text-zinc-500">
                          Scene {i + 1} &bull; {b.duration}s
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-300">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dialogue */}
            {skitData.dialogue?.length > 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Dialogue
                </h3>
                <div className="space-y-2">
                  {[...skitData.dialogue]
                    .sort((a: any, b: any) => a.timing - b.timing)
                    .map((line: any, i: number) => (
                      <div key={i} className="flex gap-3">
                        <span className="shrink-0 text-[10px] text-zinc-600">
                          {line.timing.toFixed(1)}s
                        </span>
                        <div>
                          <span className="text-[10px] italic text-zinc-500">
                            ({line.emotion})
                          </span>
                          <p className="text-sm text-zinc-200">{line.text}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Voice Narration */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Voice Narration
              </h3>
              {skitVoiceUrl ? (
                <div>
                  <audio src={skitVoiceUrl} controls className="w-full" />
                  <a
                    href={skitVoiceUrl}
                    download={`${skitData.title?.replace(/\s+/g, "-") || "skit"}-narration.mp3`}
                    className="mt-2 inline-block text-xs text-zinc-400 underline hover:text-white"
                  >
                    Download MP3
                  </a>
                </div>
              ) : voiceQuotaExceeded ? (
                <div>
                  <div className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
                    <p className="text-xs text-amber-400">
                      ElevenLabs quota exceeded. Browser voice is available as a free fallback.
                    </p>
                  </div>
                  <button
                    onClick={browserVoicePlaying ? stopBrowserVoice : playSkitBrowserVoice}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                  >
                    {browserVoicePlaying ? "Stop Playback" : "Play with Browser Voice"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  {isRunning ? "Generating narration..." : "Voice generation skipped or failed"}
                </p>
              )}
            </div>

            {/* Captions */}
            {skitCaptions && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Ready-to-Post Captions
                </h3>
                <div className="mb-4 flex gap-1 rounded-lg bg-zinc-800 p-1">
                  {(["tiktok", "instagram", "youtube"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCaptionPlatform(p)}
                      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        captionPlatform === p
                          ? p === "tiktok"
                            ? "bg-cyan-600 text-white"
                            : p === "instagram"
                              ? "bg-pink-600 text-white"
                              : "bg-red-600 text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {p === "tiktok"
                        ? "TikTok"
                        : p === "instagram"
                          ? "Instagram"
                          : "YouTube"}
                    </button>
                  ))}
                </div>
                <div className="rounded-lg bg-zinc-950 p-4">
                  {captionPlatform === "tiktok" && skitCaptions.tiktok && (
                    <div>
                      <p className="text-sm text-white">
                        {skitCaptions.tiktok.caption}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {skitCaptions.tiktok.hashtags?.map((h: string, i: number) => (
                          <span key={i} className="text-xs text-cyan-400">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {captionPlatform === "instagram" && skitCaptions.instagram && (
                    <div>
                      <p className="whitespace-pre-wrap text-sm text-white">
                        {skitCaptions.instagram.caption}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {skitCaptions.instagram.hashtags?.map((h: string, i: number) => (
                          <span key={i} className="text-xs text-pink-400">
                            {h.startsWith("#") ? h : `#${h}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {captionPlatform === "youtube" && skitCaptions.youtube && (
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {skitCaptions.youtube.title}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-300">
                        {skitCaptions.youtube.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ HERO SHOT MODE ═══════ */}
        {mode === "hero-shot" && step === "idle" && !heroShotData && (
          <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              Configure Your Hero Shot
            </h2>
            <p className="mb-5 text-xs text-zinc-500">
              Single cinematic reel in the @mister_z / OpenArt aesthetic.
              Scale contrast, atmospheric depth, dramatic camera, mythic narration.
              Generates one shocking 5-10s clip.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Scenario seed (optional)
                </label>
                <textarea
                  value={heroScenarioSeed}
                  onChange={(e) => setHeroScenarioSeed(e.target.value)}
                  rows={3}
                  placeholder='e.g. "A child standing on a cliff facing a god made of storm clouds with glowing eyes" \u2014 leave blank for AI to invent something fresh'
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-zinc-400">
                  Theme / aesthetic
                </label>
                <select
                  value={heroThemeHint}
                  onChange={(e) => setHeroThemeHint(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  <option value="mythic fantasy">Mythic Fantasy</option>
                  <option value="cosmic horror">Cosmic Horror</option>
                  <option value="post-apocalyptic">Post-Apocalyptic</option>
                  <option value="epic superhero">Epic Superhero</option>
                  <option value="dark sci-fi">Dark Sci-Fi</option>
                  <option value="ancient civilization">Ancient Civilization</option>
                  <option value="cyberpunk dystopia">Cyberpunk Dystopia</option>
                  <option value="surreal dreamscape">Surreal Dreamscape</option>
                  <option value="elemental forces of nature">
                    Elemental Forces of Nature
                  </option>
                  <option value="biblical / spiritual">Biblical / Spiritual</option>
                </select>
              </div>

              {/* Path 1 — Bring Your Own Image */}
              <div className="sm:col-span-2 rounded-lg border border-violet-900/40 bg-violet-950/10 p-4">
                <label className="mb-1 block text-sm font-medium text-violet-300">
                  Use my own image URL <span className="text-zinc-500">(optional)</span>
                </label>
                <p className="mb-2 text-[11px] text-zinc-500">
                  Paste a public image URL (e.g. from OpenArt, Midjourney, Krea).
                  When provided, StoryForge skips image generation and animates
                  YOUR image directly. Best results: 9:16 portrait, &gt;1024px,
                  publicly accessible.
                </p>
                <input
                  type="url"
                  value={heroExternalImageUrl}
                  onChange={(e) => setHeroExternalImageUrl(e.target.value)}
                  placeholder="https://cdn.openart.ai/..."
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <button
              onClick={runHeroShotPipeline}
              className="mt-5 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Hero Shot Reel
            </button>
          </div>
        )}

        {/* HERO SHOT: completed actions */}
        {mode === "hero-shot" && step === "complete" && heroShotData && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-violet-900/50 bg-violet-950/20 p-5">
            <button
              onClick={() => {
                handleNewHeroShot();
                setTimeout(() => runHeroShotPipeline(), 0);
              }}
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Another
            </button>
            <button
              onClick={handleNewHeroShot}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Reset
            </button>
            <p className="text-[11px] text-zinc-500">
              Right-click the video to download. Then post to Instagram / TikTok with the suggested caption below.
            </p>
          </div>
        )}

        {/* HERO SHOT: between-runs shortcut */}
        {mode === "hero-shot" && step === "idle" && heroShotData && (
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => {
                handleNewHeroShot();
                setTimeout(() => runHeroShotPipeline(), 0);
              }}
              className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-zinc-200"
            >
              Generate Another Hero Shot
            </button>
            <button
              onClick={handleNewHeroShot}
              className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Reset
            </button>
          </div>
        )}

        {/* HERO SHOT: output */}
        {mode === "hero-shot" && heroShotData && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
              <span className="rounded-full bg-violet-900/40 px-3 py-1 text-[10px] uppercase tracking-wider text-violet-300">
                Hero Shot
              </span>
              <h3 className="mt-3 text-2xl font-bold text-white">
                {heroShotData.title}
              </h3>
              <p className="mt-2 text-sm italic text-zinc-300">
                &ldquo;{heroShotData.voiceScript}&rdquo;
              </p>
              <p className="mt-3 text-sm text-zinc-400">
                {heroShotData.scenario}
              </p>
              {Array.isArray(heroShotData.themeTags) && heroShotData.themeTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {heroShotData.themeTags.map((t: string, i: number) => (
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

            {/* Hero shot media — video if ready, image fallback while animating */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Preview
              </h3>
              <div className="mx-auto" style={{ maxWidth: 360 }}>
                <div
                  className="relative overflow-hidden rounded-xl bg-black"
                  style={{ aspectRatio: "9/16" }}
                >
                  {heroVideoUrl ? (
                    <video
                      src={heroVideoUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : heroImageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={heroImageUrl}
                      alt={heroShotData.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600 animate-pulse">
                      {heroProgress || "Working..."}
                    </div>
                  )}
                </div>
              </div>
              {heroVideoUrl && (
                <p className="mt-3 text-center text-[11px] text-zinc-500">
                  Right-click the video and choose &ldquo;Save Video As&rdquo; to download.
                </p>
              )}
            </div>

            {/* Hero shot voice */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Voice Narration
              </h3>
              {heroVoiceUrl ? (
                <div>
                  <audio src={heroVoiceUrl} controls className="w-full" />
                  <a
                    href={heroVoiceUrl}
                    download={`${(heroShotData.title || "hero-shot").replace(/\s+/g, "-")}-narration.mp3`}
                    className="mt-2 inline-block text-xs text-zinc-400 underline hover:text-white"
                  >
                    Download MP3
                  </a>
                </div>
              ) : voiceQuotaExceeded ? (
                <div>
                  <div className="mb-3 rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
                    <p className="text-xs text-amber-400">
                      ElevenLabs quota exceeded. Browser voice is available as a free fallback.
                    </p>
                  </div>
                  <button
                    onClick={
                      browserVoicePlaying
                        ? stopBrowserVoice
                        : playHeroBrowserVoice
                    }
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                  >
                    {browserVoicePlaying
                      ? "Stop Playback"
                      : "Play with Browser Voice"}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  {isRunning
                    ? "Generating narration..."
                    : "Voice generation skipped or failed"}
                </p>
              )}
            </div>

            {/* Suggested caption */}
            <div className="rounded-2xl border border-violet-900/50 bg-violet-950/20 p-5">
              <h3 className="mb-2 text-sm font-semibold text-violet-300">
                Suggested Caption (Instagram / TikTok)
              </h3>
              <p className="text-sm italic text-zinc-200">
                &ldquo;{heroShotData.voiceScript}&rdquo;
              </p>
              <p className="mt-3 text-xs text-zinc-400">
                Comment <span className="font-mono text-violet-300">&ldquo;PROMPT&rdquo;</span> and I&apos;ll DM you the prompt that made this 👇
              </p>
              {Array.isArray(heroShotData.themeTags) && heroShotData.themeTags.length > 0 && (
                <p className="mt-2 text-xs text-zinc-500">
                  {heroShotData.themeTags
                    .map((t: string) => `#${t.replace(/^#/, "").replace(/\s+/g, "")}`)
                    .join(" ")}{" "}
                  #aiart #aianimation #cinematic #ai
                </p>
              )}
              <p className="mt-3 text-[11px] text-zinc-500">
                The comment-bait CTA is the engagement multiplier behind viral
                AI reels. Replace &ldquo;PROMPT&rdquo; with whatever DM keyword
                fits your funnel.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
