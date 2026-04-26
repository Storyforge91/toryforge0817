import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120;

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";
const MAX_CHARS_PER_REQUEST = 4500; // ElevenLabs limit is ~5000; leave buffer

/**
 * Strip bracketed stage directions like `[pause]`, `[emphasis]`, `[whisper]`
 * before sending to ElevenLabs. The standard `eleven_multilingual_v2` model
 * reads these as literal words instead of interpreting them as cues, which
 * is why narrators were saying "pause" between sentences.
 *
 * We also collapse the extra whitespace left behind by removed cues so we
 * don't end up with double spaces or orphaned punctuation.
 */
function sanitizeNarrationText(text: string): string {
  return text
    // Remove anything inside square brackets (incl. multi-word cues).
    .replace(/\[[^\]]*\]/g, "")
    // Remove anything inside angle brackets (defensive against stray <pause/> tags).
    .replace(/<[^>]*>/g, "")
    // Collapse whitespace runs.
    .replace(/\s+/g, " ")
    // Tidy spaces before punctuation.
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

/**
 * Split text into chunks at sentence boundaries, staying under the char limit.
 */
function splitTextIntoChunks(text: string, maxChars: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    // Find the last sentence boundary within the limit
    const slice = remaining.substring(0, maxChars);
    let splitAt = -1;
    for (const sep of [". ", "! ", "? ", ".\n", "\n\n", ", "]) {
      const idx = slice.lastIndexOf(sep);
      if (idx > splitAt) splitAt = idx + sep.length;
    }

    // Fallback: split at last space
    if (splitAt <= 0) {
      splitAt = slice.lastIndexOf(" ");
    }
    // Absolute fallback: hard split
    if (splitAt <= 0) {
      splitAt = maxChars;
    }

    const chunk = remaining.substring(0, splitAt).trim();
    if (chunk.length > 0) chunks.push(chunk);
    remaining = remaining.substring(splitAt).trim();
  }

  // Filter out any whitespace-only chunks defensively (ElevenLabs 400s on empty)
  return chunks.filter((c) => c.length > 0);
}

async function generateAudioChunk(
  text: string,
  voiceId: string,
  apiKey: string,
): Promise<ArrayBuffer> {
  const res = await fetch(
    `${ELEVENLABS_API}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.4,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`ElevenLabs API error (${res.status}): ${errorText}`);
  }

  return res.arrayBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voiceId } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "text is required and must be non-empty" },
        { status: 400 },
      );
    }

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 },
      );
    }

    const selectedVoice = voiceId || "pNInz6obpgDQGcFmaJgB";
    const apiKey = process.env.ELEVENLABS_API_KEY;

    // Strip bracketed stage directions before TTS so the narrator doesn't
    // read "[pause]" / "[emphasis]" out loud as literal words.
    const sanitized = sanitizeNarrationText(text);
    if (!sanitized) {
      return NextResponse.json(
        { error: "text contained only stage directions (nothing to narrate)" },
        { status: 400 },
      );
    }

    // Split long text into chunks to stay within ElevenLabs character limit
    const chunks = splitTextIntoChunks(sanitized, MAX_CHARS_PER_REQUEST);
    console.log(
      `[Voice] Generating audio: ${sanitized.length} chars (raw ${text.length}) in ${chunks.length} chunk(s)`,
    );

    // Generate audio for each chunk
    const audioBuffers: ArrayBuffer[] = [];
    for (const chunk of chunks) {
      const buffer = await generateAudioChunk(chunk, selectedVoice, apiKey);
      audioBuffers.push(buffer);
    }

    // Concatenate all audio buffers
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of audioBuffers) {
      combined.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    const base64Audio = Buffer.from(combined).toString("base64");
    const audioDataUri = `data:audio/mpeg;base64,${base64Audio}`;

    return NextResponse.json({ audioUrl: audioDataUri });
  } catch (error) {
    console.error("Error generating voice:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate voice";

    // Try to parse the embedded ElevenLabs JSON error body to detect
    // `quota_exceeded` reliably. The ElevenLabs response shape is
    // `{ detail: { status: "quota_exceeded", message: "..." } }`.
    let isQuotaExceeded = false;
    const jsonStart = errorMessage.indexOf("{");
    if (jsonStart >= 0) {
      try {
        const body = JSON.parse(errorMessage.slice(jsonStart));
        const status = body?.detail?.status ?? body?.status;
        if (typeof status === "string" && status === "quota_exceeded") {
          isQuotaExceeded = true;
        }
      } catch {
        // Fall through to substring check
      }
    }
    // Fallback: case-insensitive substring match for the exact status code.
    if (!isQuotaExceeded && /quota_exceeded/i.test(errorMessage)) {
      isQuotaExceeded = true;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        quotaExceeded: isQuotaExceeded,
      },
      { status: isQuotaExceeded ? 402 : 500 },
    );
  }
}

// GET available voices
export async function GET() {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 },
      );
    }

    const res = await fetch(`${ELEVENLABS_API}/voices`, {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    });

    if (!res.ok) {
      throw new Error(`ElevenLabs API error (${res.status})`);
    }

    const data = await res.json();
    const voices = data.voices.map(
      (v: { voice_id: string; name: string; category: string; labels: Record<string, string> }) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
        accent: v.labels?.accent || "",
        gender: v.labels?.gender || "",
      }),
    );

    return NextResponse.json({ voices });
  } catch (error) {
    console.error("Error fetching voices:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch voices" },
      { status: 500 },
    );
  }
}
