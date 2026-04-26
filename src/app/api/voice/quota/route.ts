import { NextResponse } from "next/server";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

interface ElevenLabsSubscription {
  tier?: string;
  character_count?: number;
  character_limit?: number;
  next_character_count_reset_unix?: number;
  status?: string;
}

interface ElevenLabsUserResponse {
  subscription?: ElevenLabsSubscription;
  is_new_user?: boolean;
  xi_api_key?: string;
}

/**
 * Diagnostic endpoint: reports which ElevenLabs API key the server is using
 * and how many characters remain on it. Use this to confirm that the API key
 * configured in `.env.local` matches the account you topped up.
 */
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "ELEVENLABS_API_KEY not configured",
          configured: false,
        },
        { status: 500 },
      );
    }

    // Show only a fingerprint of the key so the user can match it without
    // exposing the full secret.
    const keyFingerprint = `${apiKey.slice(0, 4)}…${apiKey.slice(-4)} (length ${apiKey.length})`;

    const res = await fetch(`${ELEVENLABS_API}/user`, {
      headers: { "xi-api-key": apiKey },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        {
          configured: true,
          keyFingerprint,
          error: `ElevenLabs /v1/user returned ${res.status}: ${body.substring(0, 300)}`,
        },
        { status: res.status },
      );
    }

    const data = (await res.json()) as ElevenLabsUserResponse;
    const sub = data.subscription ?? {};
    const used = sub.character_count ?? 0;
    const limit = sub.character_limit ?? 0;
    const remaining = Math.max(0, limit - used);

    return NextResponse.json({
      configured: true,
      keyFingerprint,
      tier: sub.tier ?? null,
      status: sub.status ?? null,
      characterCount: used,
      characterLimit: limit,
      characterRemaining: remaining,
      nextResetUnix: sub.next_character_count_reset_unix ?? null,
    });
  } catch (error) {
    console.error("Error fetching ElevenLabs quota:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch quota",
      },
      { status: 500 },
    );
  }
}
