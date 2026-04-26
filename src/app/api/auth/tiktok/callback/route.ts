import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/tiktok/auth";
import { fetchUserInfo } from "@/lib/tiktok/client";

export const maxDuration = 30;

/**
 * GET /api/auth/tiktok/callback?code=...&state=...
 *
 * TikTok redirects here after the user approves. We:
 *  1. Validate the state cookie matches.
 *  2. Exchange the code (+ PKCE verifier) for an access + refresh token.
 *  3. Fetch the user's profile info.
 *  4. Redirect back to /settings with the token data in the URL fragment so
 *     the client can persist it via Zustand. (Fragment is never sent to
 *     the server, which is fine for our localStorage-based MVP.)
 *
 * The callback page on /settings reads the fragment and saves to the
 * social store.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const storedState = request.cookies.get("tt_oauth_state")?.value;
  const verifier = request.cookies.get("tt_pkce_verifier")?.value;
  const origin = request.cookies.get("tt_oauth_origin")?.value || "/settings";

  function redirectToSettings(hashFragment: string) {
    const target = new URL("/settings", request.url);
    const res = NextResponse.redirect(`${target.toString()}#${hashFragment}`);
    // Clear the oauth cookies — single-use.
    res.cookies.delete("tt_oauth_state");
    res.cookies.delete("tt_pkce_verifier");
    res.cookies.delete("tt_oauth_origin");
    return res;
  }

  if (error) {
    return redirectToSettings(
      `tiktok=error&reason=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code || !state || !storedState || !verifier) {
    return redirectToSettings(`tiktok=error&reason=missing_oauth_params`);
  }
  if (state !== storedState) {
    return redirectToSettings(`tiktok=error&reason=state_mismatch`);
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;
  if (!clientKey || !clientSecret || !redirectUri) {
    return redirectToSettings(`tiktok=error&reason=server_not_configured`);
  }

  try {
    const tokenResp = await exchangeCodeForToken({
      clientKey,
      clientSecret,
      redirectUri,
      code,
      codeVerifier: verifier,
    });

    // Best-effort profile fetch — failure here shouldn't block the connect.
    let username: string | undefined;
    let displayName: string | undefined;
    let avatarUrl: string | undefined;
    try {
      const info = await fetchUserInfo(tokenResp.access_token);
      username = info.username;
      displayName = info.displayName;
      avatarUrl = info.avatarUrl;
    } catch (infoErr) {
      console.warn("TikTok user info fetch failed:", infoErr);
    }

    const now = Date.now();
    const auth = {
      accessToken: tokenResp.access_token,
      refreshToken: tokenResp.refresh_token,
      expiresAt: now + tokenResp.expires_in * 1000,
      refreshExpiresAt: now + tokenResp.refresh_expires_in * 1000,
      scope: tokenResp.scope,
      openId: tokenResp.open_id,
      tokenType: tokenResp.token_type,
      username,
      displayName,
      avatarUrl,
    };

    // Encode as URL-safe base64 in the fragment. Fragment never hits the
    // server, so this is OK for our client-side persistence.
    const payload = btoa(JSON.stringify(auth))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return redirectToSettings(`tiktok=ok&payload=${payload}&origin=${encodeURIComponent(origin)}`);
  } catch (err) {
    console.error("TikTok OAuth callback error:", err);
    const reason =
      err instanceof Error ? err.message : "token_exchange_failed";
    return redirectToSettings(
      `tiktok=error&reason=${encodeURIComponent(reason)}`,
    );
  }
}
