/**
 * TikTok Content Posting API client.
 *
 * Uses PULL_FROM_URL upload mode — we pass TikTok the public URL of the
 * generated video and TikTok fetches it. This avoids streaming the video
 * bytes through our server.
 *
 * Caveats:
 *  - The video URL must be publicly reachable and HTTPS.
 *  - Some video CDNs (e.g. Kling, Fal) expire URLs after some hours; for
 *    long-scheduled posts we may need to proxy/copy the file to permanent
 *    storage. Out of scope for the MVP.
 */

const POST_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/";
const INBOX_INIT_URL =
  "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";
const STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/";
const USER_INFO_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username";

export interface TikTokVideoPostParams {
  accessToken: string;
  videoUrl: string;
  title?: string; // 0–2200 chars
  privacyLevel?:
    | "PUBLIC_TO_EVERYONE"
    | "MUTUAL_FOLLOW_FRIENDS"
    | "FOLLOWER_OF_CREATOR"
    | "SELF_ONLY";
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
  // If true, post lands in the user's drafts (works in app sandbox without
  // the full Content Posting API approval).
  postToDraftsOnly?: boolean;
}

export interface TikTokInitResponse {
  publishId: string;
  raw: unknown;
}

/**
 * Initialize a video upload. Returns publish_id which we poll for status.
 */
export async function postVideoFromUrl(
  params: TikTokVideoPostParams,
): Promise<TikTokInitResponse> {
  const url = params.postToDraftsOnly ? INBOX_INIT_URL : POST_INIT_URL;

  const body: Record<string, unknown> = {
    source_info: {
      source: "PULL_FROM_URL",
      video_url: params.videoUrl,
    },
  };

  // Direct-publish requests need post_info; drafts (inbox) only need source_info.
  if (!params.postToDraftsOnly) {
    body.post_info = {
      title: (params.title ?? "").slice(0, 2200),
      privacy_level: params.privacyLevel ?? "SELF_ONLY",
      disable_comment: params.disableComment ?? false,
      disable_duet: params.disableDuet ?? false,
      disable_stitch: params.disableStitch ?? false,
      video_cover_timestamp_ms: 0,
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `TikTok publish init failed (${res.status}): ${text.substring(0, 400)}`,
    );
  }

  const data = JSON.parse(text) as {
    data?: { publish_id?: string };
    error?: { code?: string; message?: string };
  };

  if (data.error && data.error.code && data.error.code !== "ok") {
    throw new Error(
      `TikTok error: ${data.error.code} ${data.error.message ?? ""}`,
    );
  }

  const publishId = data.data?.publish_id;
  if (!publishId) {
    throw new Error(
      `TikTok response missing publish_id: ${text.substring(0, 200)}`,
    );
  }
  return { publishId, raw: data };
}

export interface TikTokPublishStatus {
  status:
    | "PROCESSING_DOWNLOAD"
    | "PROCESSING_UPLOAD"
    | "SEND_TO_USER_INBOX"
    | "PUBLISH_COMPLETE"
    | "FAILED"
    | string;
  publicAlbumUrl?: string;
  failReason?: string;
  raw: unknown;
}

export async function fetchPublishStatus(params: {
  accessToken: string;
  publishId: string;
}): Promise<TikTokPublishStatus> {
  const res = await fetch(STATUS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: params.publishId }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `TikTok status fetch failed (${res.status}): ${text.substring(0, 300)}`,
    );
  }

  const data = JSON.parse(text) as {
    data?: {
      status?: string;
      publicaly_available_post_id?: string[];
      fail_reason?: string;
    };
  };
  const status = (data.data?.status ?? "UNKNOWN") as TikTokPublishStatus["status"];
  return {
    status,
    failReason: data.data?.fail_reason,
    raw: data,
  };
}

export interface TikTokUserInfo {
  openId: string;
  unionId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

export async function fetchUserInfo(
  accessToken: string,
): Promise<TikTokUserInfo> {
  const res = await fetch(USER_INFO_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(
      `TikTok user info failed (${res.status}): ${text.substring(0, 300)}`,
    );
  }
  const data = JSON.parse(text) as {
    data?: {
      user?: {
        open_id?: string;
        union_id?: string;
        avatar_url?: string;
        display_name?: string;
        username?: string;
      };
    };
  };
  const u = data.data?.user;
  return {
    openId: u?.open_id ?? "",
    unionId: u?.union_id,
    username: u?.username,
    displayName: u?.display_name,
    avatarUrl: u?.avatar_url,
  };
}
