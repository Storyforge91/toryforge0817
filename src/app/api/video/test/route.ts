import { NextResponse } from "next/server";
import { getEnabledProviders } from "@/lib/video/engine";

export const maxDuration = 120;

/**
 * GET /api/video/test
 *
 * Diagnostic endpoint that:
 * 1. Checks which providers are configured
 * 2. Tests the Kling API with a known-good public image
 * 3. Returns detailed results for debugging
 */
export async function GET() {
  const results: Record<string, unknown> = {};
  const enabled = getEnabledProviders();

  results.enabledProviders = enabled;
  results.envCheck = {
    FAL_KEY: !!process.env.FAL_KEY,
    KLING_API_KEY: !!process.env.KLING_API_KEY,
    KLING_KEY_LENGTH: process.env.KLING_API_KEY?.length ?? 0,
  };

  // Test Kling API connectivity
  if (process.env.KLING_API_KEY) {
    try {
      console.log("[VideoTest] Testing Kling API connectivity...");

      // Use a known-good, publicly accessible test image
      const testImageUrl =
        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png";

      const headers: Record<string, string> = {
        Authorization: `Bearer ${process.env.KLING_API_KEY}`,
        "Content-Type": "application/json",
      };

      const createRes = await fetch(
        "https://api.aimlapi.com/v2/generate/video/kling/generation",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "kling-video/v1/standard/image-to-video",
            image_url: testImageUrl,
            prompt: "gentle swaying motion, subtle movement",
            duration: "5",
            aspect_ratio: "9:16",
          }),
        },
      );

      const createText = await createRes.text();
      console.log("[VideoTest] Kling create response:", createRes.status, createText.substring(0, 500));

      let createData;
      try {
        createData = JSON.parse(createText);
      } catch {
        createData = { raw: createText.substring(0, 500) };
      }

      results.klingTest = {
        status: createRes.status,
        ok: createRes.ok,
        response: createData,
        testImageUrl,
      };

      // If task created successfully, try one poll to see the response format
      if (createRes.ok) {
        const taskId =
          createData.id ||
          createData.generation_id ||
          createData.data?.id ||
          createData.task_id;

        if (taskId) {
          // Wait a moment, then poll once to see the response format
          await new Promise((r) => setTimeout(r, 3000));

          const pollRes = await fetch(
            `https://api.aimlapi.com/v2/generate/video/kling/generation?generation_id=${taskId}`,
            { method: "GET", headers },
          );
          const pollText = await pollRes.text();
          console.log("[VideoTest] Kling poll response:", pollRes.status, pollText.substring(0, 500));

          let pollData;
          try {
            pollData = JSON.parse(pollText);
          } catch {
            pollData = { raw: pollText.substring(0, 500) };
          }

          results.klingPollTest = {
            taskId,
            status: pollRes.status,
            ok: pollRes.ok,
            response: pollData,
          };
        } else {
          results.klingPollTest = {
            error: "No task ID found in create response",
            responseKeys: Object.keys(createData),
          };
        }
      }
    } catch (err) {
      results.klingTest = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(results, {
    headers: { "Content-Type": "application/json" },
  });
}
