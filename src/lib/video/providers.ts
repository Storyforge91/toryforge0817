/**
 * Video generation providers: Kling AI, Minimax (Hailuo), Wan2.1
 * Each provider takes a still image and animates it into a video clip.
 */

import { fal } from "@fal-ai/client";

/**
 * Fal.ai's SDK throws an `ApiError` whose `.message` is just the HTTP
 * status text ("Forbidden", "Not Found"). The actionable detail —
 * "User is locked. Reason: Exhausted balance." — lives in `error.body.detail`.
 * This helper unpacks the structured body so callers see the real reason.
 */
function unwrapFalError(err: unknown, providerLabel: string): Error {
  if (err instanceof Error) {
    // ApiError shape: { status, body: { detail }, message }
    const e = err as Error & {
      status?: number;
      body?: { detail?: string; message?: string };
    };
    const detail = e.body?.detail || e.body?.message;
    if (detail) {
      return new Error(`${providerLabel}: ${detail}`);
    }
    return new Error(`${providerLabel}: ${err.message}`);
  }
  return new Error(`${providerLabel}: ${String(err)}`);
}

export interface VideoGenerationInput {
  imageUrl: string;
  motionPrompt: string;
  duration: number; // seconds
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

export interface VideoGenerationResult {
  videoUrl: string;
  provider: "kling" | "minimax" | "wan21";
  duration: number;
}

// ─────────────────────────────────────────────
// Wan 2.1 via FAL.ai — Best anime/cartoon quality
// ─────────────────────────────────────────────

export async function generateWithWan21(
  input: VideoGenerationInput,
): Promise<VideoGenerationResult> {
  fal.config({ credentials: process.env.FAL_KEY! });

  const fps = 16;
  // ~5s at 16fps = 81 frames, ~6s = 97 frames
  const numFrames = Math.min(Math.max(Math.round(input.duration * fps), 81), 100);

  let result;
  try {
    result = await fal.subscribe("fal-ai/wan-i2v", {
      input: {
        image_url: input.imageUrl,
        prompt: `anime animation style, fluid character movement, expressive facial animation. ${input.motionPrompt}`,
        num_frames: numFrames,
        frames_per_second: fps,
        resolution: "720p" as const,
        aspect_ratio: input.aspectRatio === "16:9" ? "16:9" : input.aspectRatio === "1:1" ? "1:1" : "9:16",
        negative_prompt:
          "static, frozen, blurry, low quality, distorted, watermark, text, realistic photo, live action",
        guide_scale: 5,
        num_inference_steps: 30,
      },
    });
  } catch (err) {
    throw unwrapFalError(err, "Wan2.1");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = result as any;
  const videoUrl: string | undefined =
    data?.data?.video?.url ?? data?.video?.url;

  if (!videoUrl) {
    throw new Error("Wan2.1: No video URL in response");
  }

  return {
    videoUrl,
    provider: "wan21",
    duration: numFrames / fps,
  };
}

// ─────────────────────────────────────────────
// Minimax (Hailuo) via FAL.ai — Best expressions & motion
// ─────────────────────────────────────────────

export async function generateWithMinimax(
  input: VideoGenerationInput,
): Promise<VideoGenerationResult> {
  fal.config({ credentials: process.env.FAL_KEY! });

  let result;
  try {
    result = await fal.subscribe(
      "fal-ai/minimax/video-01/image-to-video",
      {
        input: {
          image_url: input.imageUrl,
          prompt: `anime cartoon animation, characters move naturally with fluid expressions. ${input.motionPrompt}`,
        },
      },
    );
  } catch (err) {
    throw unwrapFalError(err, "Minimax");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mmData = result as any;
  const mmVideoUrl: string | undefined =
    mmData?.data?.video?.url ?? mmData?.video?.url;

  if (!mmVideoUrl) {
    throw new Error("Minimax: No video URL in response");
  }

  return {
    videoUrl: mmVideoUrl,
    provider: "minimax",
    duration: 6,
  };
}

// ─────────────────────────────────────────────
// Kling AI via AIML API — Best camera controls & extended duration
// ─────────────────────────────────────────────

/**
 * Extract a value from an object trying multiple possible paths.
 * Returns the first truthy value found.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractField(obj: any, paths: string[]): any {
  for (const path of paths) {
    const parts = path.split(".");
    let val = obj;
    for (const part of parts) {
      if (val == null) break;
      // Handle array indexing like "videos[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        val = val[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        val = val[part];
      }
    }
    if (val != null && val !== "") return val;
  }
  return undefined;
}

export async function generateWithKling(
  input: VideoGenerationInput,
): Promise<VideoGenerationResult> {
  const apiKey = process.env.KLING_API_KEY;
  if (!apiKey) throw new Error("KLING_API_KEY not configured");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const requestBody = {
    model: "kling-video/v1/standard/image-to-video",
    image_url: input.imageUrl,
    prompt: `anime cartoon style animation, fluid movement, expressive characters. ${input.motionPrompt}`,
    duration: input.duration >= 8 ? "10" : "5",
    aspect_ratio: input.aspectRatio || "9:16",
    negative_prompt:
      "static, frozen, blurry, realistic, live action, watermark",
  };

  console.log("[Kling] ═══════════════════════════════════");
  console.log("[Kling] Creating video generation task...");
  console.log("[Kling] Image URL:", input.imageUrl?.substring(0, 120));
  console.log("[Kling] Motion prompt:", input.motionPrompt?.substring(0, 100));
  console.log("[Kling] Duration:", requestBody.duration, "Aspect:", requestBody.aspect_ratio);

  // Step 1: Create generation task
  const createRes = await fetch(
    "https://api.aimlapi.com/v2/generate/video/kling/generation",
    {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    },
  );

  const createText = await createRes.text();
  console.log("[Kling] Create response status:", createRes.status);
  console.log("[Kling] Create response body:", createText.substring(0, 500));

  if (!createRes.ok) {
    throw new Error(`Kling task creation failed (${createRes.status}): ${createText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let createData: any;
  try {
    createData = JSON.parse(createText);
  } catch {
    throw new Error(`Kling: Invalid JSON in create response: ${createText.substring(0, 200)}`);
  }

  // Try multiple paths to find the generation ID
  const generationId = extractField(createData, [
    "id",
    "generation_id",
    "data.id",
    "data.generation_id",
    "task_id",
    "data.task_id",
  ]);

  if (!generationId) {
    throw new Error(
      `Kling: No generation ID found in response. Keys: [${Object.keys(createData).join(", ")}]. Body: ${createText.substring(0, 300)}`,
    );
  }

  console.log("[Kling] Generation ID:", generationId);

  // Step 2: Poll for completion (up to 5 minutes — 30 attempts × 10s each).
  // Polling every 10s instead of 5s halves the request load when many beats
  // animate concurrently, while keeping the same overall timeout window.
  let consecutiveErrors = 0;
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((r) => setTimeout(r, 10000));

    // Per-poll timeout — if a single fetch hangs (network partition,
    // upstream stall) we don't want to block the whole loop indefinitely.
    // 15s is generous: a healthy Kling status response is a few hundred ms.
    let pollRes: Response;
    try {
      pollRes = await fetch(
        `https://api.aimlapi.com/v2/generate/video/kling/generation?generation_id=${generationId}`,
        {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(15000),
        },
      );
    } catch (fetchErr) {
      consecutiveErrors++;
      const reason =
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error(
        `[Kling] Poll ${attempt + 1} fetch error (${consecutiveErrors}/5):`,
        reason,
      );
      if (consecutiveErrors >= 5) {
        throw new Error(
          `Kling poll failed after ${consecutiveErrors} consecutive fetch errors: ${reason}`,
        );
      }
      continue;
    }

    const pollText = await pollRes.text();

    if (!pollRes.ok) {
      consecutiveErrors++;
      console.error(`[Kling] Poll ${attempt + 1} error (${pollRes.status}, ${consecutiveErrors}/5):`, pollText.substring(0, 300));
      if (consecutiveErrors >= 5) {
        throw new Error(`Kling poll failed after ${consecutiveErrors} consecutive errors (${pollRes.status}): ${pollText.substring(0, 200)}`);
      }
      // Retry on 5xx server errors
      if (pollRes.status >= 500) continue;
      throw new Error(`Kling poll failed (${pollRes.status}): ${pollText.substring(0, 200)}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pollData: any;
    try {
      pollData = JSON.parse(pollText);
      consecutiveErrors = 0; // Reset on success
    } catch {
      consecutiveErrors++;
      console.error(`[Kling] Poll ${attempt + 1}: invalid JSON (${consecutiveErrors}/5):`, pollText.substring(0, 200));
      if (consecutiveErrors >= 5) {
        throw new Error(`Kling API returned invalid JSON ${consecutiveErrors} times: ${pollText.substring(0, 200)}`);
      }
      continue;
    }

    // Extract status from multiple possible locations
    const taskStatus = extractField(pollData, [
      "status",
      "data.status",
      "task_status",
      "data.task_status",
      "state",
    ]);

    // Extract video URL from multiple possible locations
    const videoUrl = extractField(pollData, [
      "video.url",
      "video_url",
      "output.video_url",
      "output.video.url",
      "data.video.url",
      "data.video_url",
      "result.video.url",
      "result.video_url",
      "result.videos[0].url",
      "videos[0].url",
      "data.output.video_url",
    ]);

    // Log every few polls + any status change
    if (attempt % 3 === 0 || videoUrl || taskStatus === "completed" || taskStatus === "failed") {
      console.log(
        `[Kling] Poll ${attempt + 1}: status="${taskStatus}", hasVideo=${!!videoUrl}`,
        attempt % 5 === 0 ? `full: ${pollText.substring(0, 400)}` : "",
      );
    }

    // Success conditions
    if (videoUrl) {
      console.log("[Kling] ✓ Video ready:", videoUrl.substring(0, 120));
      return {
        videoUrl,
        provider: "kling",
        duration: input.duration >= 8 ? 10 : 5,
      };
    }

    // Failure conditions
    const isError =
      taskStatus === "error" ||
      taskStatus === "failed" ||
      taskStatus === "FAILED";

    if (isError) {
      const errorMsg = extractField(pollData, [
        "error.message",
        "error",
        "data.error.message",
        "data.error",
        "message",
        "data.message",
      ]);
      throw new Error(`Kling generation failed: ${errorMsg || "unknown error"}. Full: ${pollText.substring(0, 300)}`);
    }
  }

  throw new Error("Kling: Generation timed out after 5 minutes of polling");
}
