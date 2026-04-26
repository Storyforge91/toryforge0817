import { NextRequest, NextResponse } from "next/server";
import { postVideoFromUrl } from "@/lib/tiktok/client";

export const maxDuration = 120;

/**
 * GET or POST /api/cron/process-schedule
 *
 * Processes any CalendarItems whose `scheduledDate` has passed and whose
 * `status` is still "scheduled". For each due item, this route:
 *   1. Looks up the content (skit or episode) from the request body
 *      (the caller is responsible for sending the queue, since the
 *      Zustand stores live in localStorage and aren't accessible from
 *      the server).
 *   2. Calls the TikTok publish init API.
 *   3. Returns the new statuses + publishIds; the client persists them
 *      back into the calendar store.
 *
 * This split (server-side posting, client-side state) keeps the auto-poster
 * flexible without requiring a database. To run this on a schedule:
 *   - Vercel Cron: configure vercel.json with a daily/hourly job that hits
 *     this endpoint with the calendar dump.
 *   - Locally: a "Run Schedule Now" button on /calendar that POSTs the
 *     current pending items.
 *
 * Auth: requires CRON_SECRET in the `x-cron-secret` header for production.
 * In dev (NODE_ENV !== "production") the check is bypassed.
 */

interface PendingItem {
  id: string;
  contentType: "episode" | "skit";
  contentId: string;
  platform: "tiktok" | "instagram" | "youtube";
  scheduledDate: string; // ISO string
  videoUrl?: string; // Pre-fetched by the caller
  title?: string;
  privacyLevel?:
    | "PUBLIC_TO_EVERYONE"
    | "MUTUAL_FOLLOW_FRIENDS"
    | "FOLLOWER_OF_CREATOR"
    | "SELF_ONLY";
  postToDraftsOnly?: boolean;
}

interface ProcessRequest {
  tiktokAccessToken?: string;
  pending: PendingItem[];
}

interface ProcessResult {
  id: string;
  status: "posted" | "failed" | "uploading" | "skipped";
  publishId?: string;
  error?: string;
}

async function authorize(request: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // No secret configured — open by default in dev
  const provided = request.headers.get("x-cron-secret");
  return provided === secret;
}

async function handle(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: ProcessRequest;
  try {
    payload = (await request.json()) as ProcessRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { tiktokAccessToken, pending } = payload;
  if (!Array.isArray(pending)) {
    return NextResponse.json(
      { error: "pending[] required" },
      { status: 400 },
    );
  }

  const now = Date.now();
  const results: ProcessResult[] = [];

  for (const item of pending) {
    const due = new Date(item.scheduledDate).getTime() <= now;
    if (!due) {
      results.push({ id: item.id, status: "skipped" });
      continue;
    }

    // Currently only TikTok auto-posting is wired.
    if (item.platform !== "tiktok") {
      results.push({
        id: item.id,
        status: "skipped",
        error: `Platform '${item.platform}' auto-posting not yet implemented`,
      });
      continue;
    }

    if (!tiktokAccessToken) {
      results.push({
        id: item.id,
        status: "failed",
        error: "TikTok not connected — connect on Settings page",
      });
      continue;
    }

    if (!item.videoUrl) {
      results.push({
        id: item.id,
        status: "failed",
        error: "Content has no video URL — generate the video first",
      });
      continue;
    }

    try {
      const r = await postVideoFromUrl({
        accessToken: tiktokAccessToken,
        videoUrl: item.videoUrl,
        title: item.title,
        privacyLevel: item.privacyLevel ?? "SELF_ONLY",
        postToDraftsOnly: item.postToDraftsOnly ?? false,
      });
      results.push({
        id: item.id,
        status: "uploading",
        publishId: r.publishId,
      });
    } catch (err) {
      results.push({
        id: item.id,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ results });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

// Allow GET for compatibility with simple cron services (returns method
// hint if no body provided).
export async function GET(request: NextRequest) {
  if (request.headers.get("content-type")?.includes("application/json")) {
    return handle(request);
  }
  return NextResponse.json({
    message:
      "POST a JSON body { tiktokAccessToken, pending: [...] } to process due calendar items.",
  });
}
