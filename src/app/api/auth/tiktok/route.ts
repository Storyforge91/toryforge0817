import { NextRequest, NextResponse } from "next/server";
import {
  buildAuthorizeUrl,
  generateCodeChallenge,
  generateCodeVerifier,
} from "@/lib/tiktok/auth";

export const maxDuration = 30;

/**
 * GET /api/auth/tiktok
 *
 * Starts the TikTok OAuth flow. Generates a PKCE verifier + state,
 * stores them in HTTP-only cookies (so they survive the redirect to
 * TikTok and back), and redirects the browser to TikTok's authorize URL.
 *
 * The callback route reads the verifier from the cookie to complete
 * the code exchange.
 */
export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "TikTok OAuth not configured. Set TIKTOK_CLIENT_KEY and TIKTOK_REDIRECT_URI in .env.local. See settings page for details.",
      },
      { status: 500 },
    );
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // CSRF state — random per request, validated in the callback.
  const stateBytes = new Uint8Array(16);
  crypto.getRandomValues(stateBytes);
  const state = Array.from(stateBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const url = buildAuthorizeUrl({
    clientKey,
    redirectUri,
    state,
    codeChallenge: challenge,
  });

  // Stash the verifier and state in cookies so the callback can verify
  // and complete the exchange. HTTP-only so JS can't read them.
  const referer = request.headers.get("referer") || "/settings";
  const res = NextResponse.redirect(url);
  const tenMin = 60 * 10;
  res.cookies.set("tt_pkce_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tenMin,
    path: "/",
  });
  res.cookies.set("tt_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tenMin,
    path: "/",
  });
  res.cookies.set("tt_oauth_origin", referer, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: tenMin,
    path: "/",
  });

  return res;
}
