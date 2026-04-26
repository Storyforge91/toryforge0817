import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";

// Leonardo model + preset mappings per visual style.
//
// IMPORTANT: not every Leonardo model supports the `imagePrompts` field
// (used here for character-reference consistency). Phoenix 1.0 and a few
// other newer models reject it with a 500. The models below are confirmed
// to accept imagePrompts AND produce the targeted look.
//
// 3d-cinematic = Albedo Base XL → Pixar-style 3D render, supports image refs.
// anime        = Anime XL with ANIME preset → flat anime/cartoon (legacy default).
// photoreal    = Vision XL with CINEMATIC preset → realistic film-like.
// storybook    = DreamShaper v7 → painted illustration style.
const STYLE_MODELS = {
  anime: {
    modelId: "e71a1c2f-4f80-4800-934f-2c68979d8cc8",
    presetStyle: "ANIME",
    promptSuffix: "",
    supportsImagePrompts: true,
  },
  "flat-cartoon": {
    // Same Anime XL base but with a flat-2D prompt suffix to push the model
    // toward the Primax / Humor Animations look (bold outlines, flat colors).
    modelId: "e71a1c2f-4f80-4800-934f-2c68979d8cc8",
    presetStyle: "ANIME",
    promptSuffix:
      ", flat 2D cartoon, bold black outlines, simple flat colors, animated webcomic style, no shading gradients, expressive features",
    supportsImagePrompts: true,
  },
  "3d-cinematic": {
    modelId: "2067ae52-33fd-4a82-bb92-c2c55e7d2786", // Albedo Base XL
    presetStyle: "DYNAMIC",
    promptSuffix:
      ", 3D rendered animation, Pixar-style character, photorealistic lighting, cinematic quality, detailed character, atmospheric depth",
    supportsImagePrompts: true,
  },
  photoreal: {
    modelId: "5c232a9e-9061-4777-980a-ddc8e65647c6", // Leonardo Vision XL
    presetStyle: "CINEMATIC",
    promptSuffix:
      ", photorealistic, film cinematography, atmospheric lighting, depth of field",
    supportsImagePrompts: true,
  },
  storybook: {
    modelId: "ac614f96-1082-45bf-be9d-757f2d31c174", // DreamShaper v7
    presetStyle: "ILLUSTRATION",
    promptSuffix:
      ", painted illustration, soft brushwork, watercolor textures, storybook art style",
    supportsImagePrompts: true,
  },
} as const;

type ImageStyle = keyof typeof STYLE_MODELS;

function isStyle(s: unknown): s is ImageStyle {
  return typeof s === "string" && s in STYLE_MODELS;
}

async function leonardoRequest(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${LEONARDO_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Leonardo API error (${res.status}): ${text}`);
  }
  return res.json();
}

async function leonardoGet(path: string) {
  const res = await fetch(`${LEONARDO_API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.LEONARDO_API_KEY}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Leonardo API error (${res.status}): ${text}`);
  }
  return res.json();
}

interface GeneratedImage {
  url: string;
  id: string;
}

async function waitForGeneration(
  generationId: string,
  // 50 attempts × 3s = 150s. Leonardo can be slow under queue pressure;
  // 90s was tight at peak load and produced false-failure timeouts.
  maxAttempts = 50,
): Promise<GeneratedImage[]> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const result = await leonardoGet(`/generations/${generationId}`);
    const gen = result.generations_by_pk;
    if (gen?.status === "COMPLETE") {
      return gen.generated_images.map((img: { url: string; id: string }) => ({
        url: img.url,
        id: img.id,
      }));
    }
    if (gen?.status === "FAILED") {
      throw new Error("Image generation failed");
    }
  }
  throw new Error("Image generation timed out after 150 seconds");
}

/**
 * Pull a generation ID out of Leonardo's response by trying multiple known
 * paths. Different endpoints (and undocumented API changes) put the ID in
 * different places — this avoids "No generation ID returned" false failures
 * when Leonardo has actually queued the job.
 */
function extractGenerationId(genResult: unknown): string | undefined {
  const r = genResult as Record<string, unknown> | undefined;
  if (!r) return undefined;
  const candidates: unknown[] = [
    (r.sdGenerationJob as Record<string, unknown> | undefined)?.generationId,
    r.generationId,
    r.id,
    (r.data as Record<string, unknown> | undefined)?.id,
    (r.data as Record<string, unknown> | undefined)?.generationId,
    (r.generation as Record<string, unknown> | undefined)?.id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      width = 832,
      height = 1472,
      numImages = 1,
      style,
      referenceImageIds,
    } = body as {
      prompt?: string;
      width?: number;
      height?: number;
      numImages?: number;
      style?: string;
      referenceImageIds?: string[];
    };

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    if (!process.env.LEONARDO_API_KEY) {
      return NextResponse.json(
        { error: "LEONARDO_API_KEY not configured" },
        { status: 500 },
      );
    }

    // Pick model + preset from style param. Default to anime for back-compat
    // with the existing skit demo character expression generation path.
    const resolvedStyle: ImageStyle = isStyle(style) ? style : "anime";
    const styleConfig = STYLE_MODELS[resolvedStyle];

    const fullPrompt = prompt + styleConfig.promptSuffix;

    // Build request body. If referenceImageIds is provided, attach them as
    // imagePrompts so Leonardo conditions the new image on the reference
    // (this is how character consistency works across scenes).
    const requestBody: Record<string, unknown> = {
      prompt: fullPrompt,
      negative_prompt:
        resolvedStyle === "anime"
          ? "blurry, low quality, distorted, deformed, extra fingers, bad anatomy, watermark, text, logo"
          : "blurry, low quality, distorted, deformed, watermark, text, logo, anime, cartoon flat colors",
      modelId: styleConfig.modelId,
      width,
      height,
      num_images: numImages,
      alchemy: true,
      photoReal: false,
      presetStyle: styleConfig.presetStyle,
    };

    const wantsRefs =
      Array.isArray(referenceImageIds) &&
      referenceImageIds.length > 0 &&
      styleConfig.supportsImagePrompts;
    if (wantsRefs) {
      // Leonardo's `imagePrompts` field accepts up to 4 generated-image IDs
      // and uses default internal weighting. Some models (e.g. Phoenix 1.0)
      // reject it; we filter those out via the supportsImagePrompts flag.
      requestBody.imagePrompts = referenceImageIds!.slice(0, 4);
    }

    // Submit the generation. If Leonardo rejects the imagePrompts (some
    // models silently change support), fall back to a request without them
    // so the user still gets a usable image instead of a hard failure.
    let genResult;
    try {
      genResult = await leonardoRequest("/generations", requestBody);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isImgPromptError =
        wantsRefs &&
        (msg.includes("imagePrompts") ||
          msg.includes("internal error") ||
          msg.includes("(500)"));
      if (isImgPromptError) {
        console.warn(
          "[Leonardo] imagePrompts rejected; retrying without character reference",
        );
        delete requestBody.imagePrompts;
        genResult = await leonardoRequest("/generations", requestBody);
      } else {
        throw err;
      }
    }

    const generationId = extractGenerationId(genResult);
    if (!generationId) {
      throw new Error(
        `No generation ID returned. Response keys: [${Object.keys(genResult || {}).join(", ")}]`,
      );
    }

    const images = await waitForGeneration(generationId);

    return NextResponse.json({
      // Back-compat: existing callers read imageUrls
      imageUrls: images.map((img) => img.url),
      // New: per-image IDs that callers can pass back as referenceImageIds
      // for character-consistent follow-up generations.
      imageIds: images.map((img) => img.id),
      generationId,
      style: resolvedStyle,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate image",
      },
      { status: 500 },
    );
  }
}
