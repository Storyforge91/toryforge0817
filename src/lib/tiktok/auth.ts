/**
 * TikTok OAuth 2.0 helpers (PKCE flow + token exchange + refresh).
 *
 * Flow:
 *  1. Browser redirects user to TIKTOK_AUTH_URL with our client_key + state +
 *     code_challenge.
 *  2. User approves in TikTok; TikTok redirects to our /api/auth/tiktok/callback
 *     with `code` and `state`.
 *  3. We POST the code + code_verifier to /v2/oauth/token to get access +
 *     refresh tokens.
 */

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";

// Scopes we need to publish videos and read the user's profile.
// `video.upload` = post to drafts (works while app is in sandbox).
// `video.publish` = direct publish (requires full app approval).
// `user.info.basic` = display username/avatar in our UI.
export const TIKTOK_SCOPES = [
  "user.info.basic",
  "video.upload",
  "video.publish",
].join(",");

export interface TikTokTokenResponse {
  access_token: string;
  expires_in: number; // seconds
  open_id: string;
  refresh_expires_in: number; // seconds
  refresh_token: string;
  scope: string;
  token_type: string;
}

/**
 * Generate a PKCE code verifier (random URL-safe string, 43-128 chars).
 */
export function generateCodeVerifier(): string {
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}

/**
 * SHA-256 + base64url of the verifier — sent to TikTok as code_challenge.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildAuthorizeUrl(params: {
  clientKey: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const u = new URL(TIKTOK_AUTH_URL);
  u.searchParams.set("client_key", params.clientKey);
  u.searchParams.set("scope", TIKTOK_SCOPES);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", params.redirectUri);
  u.searchParams.set("state", params.state);
  u.searchParams.set("code_challenge", params.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

export async function exchangeCodeForToken(params: {
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
}): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: params.clientKey,
    client_secret: params.clientSecret,
    code: params.code,
    grant_type: "authorization_code",
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `TikTok token exchange failed (${res.status}): ${text.substring(0, 300)}`,
    );
  }
  return JSON.parse(text) as TikTokTokenResponse;
}

export async function refreshAccessToken(params: {
  clientKey: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<TikTokTokenResponse> {
  const body = new URLSearchParams({
    client_key: params.clientKey,
    client_secret: params.clientSecret,
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
  });

  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `TikTok refresh failed (${res.status}): ${text.substring(0, 300)}`,
    );
  }
  return JSON.parse(text) as TikTokTokenResponse;
}
