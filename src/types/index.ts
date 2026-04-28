// TikTokAuth — credentials returned by TikTok's OAuth flow.
// Stored client-side via Zustand persist for now (move to server-side
// encrypted storage in production).
export interface TikTokAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix ms
  refreshExpiresAt: number; // Unix ms
  scope: string;
  openId: string;
  tokenType: string;
  // Profile info (fetched once after auth)
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}
