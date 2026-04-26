import { NextRequest, NextResponse } from "next/server";
import {
  postVideoFromUrl,
  fetchPublishStatus,
  type TikTokVideoPostParams,
} from "@/lib/tiktok/client";

export const maxDuration = 60;

/**
 * POST /api/social/tiktok/post
 *
 * Body: { accessToken, videoUrl, title?, privacyLevel?, postToDraftsOnly? }
 * Returns: { publishId } on success.
 *
 * The caller (calendar UI or cron processor) is responsible for polling
 * /api/social/tiktok/status?publishId=... to confirm the post landed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TikTokVideoPostParams>;

    if (!body.accessToken) {
      return NextResponse.json(
        { error: "accessToken required" },
        { status: 400 },
      );
    }
    if (!body.videoUrl || !/^https?:\/\//.test(body.videoUrl)) {
      return NextResponse.json(
        { error: "videoUrl required and must be http(s)" },
        { status: 400 },
      );
    }

    const result = await postVideoFromUrl({
      accessToken: body.accessToken,
      videoUrl: body.videoUrl,
      title: body.title,
      privacyLevel: body.privacyLevel,
      postToDraftsOnly: body.postToDraftsOnly,
      disableComment: body.disableComment,
      disableDuet: body.disableDuet,
      disableStitch: body.disableStitch,
    });

    return NextResponse.json({ publishId: result.publishId });
  } catch (err) {
    console.error("[TikTok post] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TikTok post failed" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/social/tiktok/post?publishId=...&accessToken=...
 *
 * Polls TikTok for the publish status. Returns the current state so the
 * client can update calendar UI (PROCESSING → PUBLISH_COMPLETE / FAILED).
 *
 * Note: passing accessToken via query string is fine in dev; production
 * should use a server-stored token instead.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const publishId = url.searchParams.get("publishId");
    const accessToken = url.searchParams.get("accessToken");
    if (!publishId || !accessToken) {
      return NextResponse.json(
        { error: "publishId and accessToken query params required" },
        { status: 400 },
      );
    }
    const status = await fetchPublishStatus({ accessToken, publishId });
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Status fetch failed" },
      { status: 500 },
    );
  }
}
