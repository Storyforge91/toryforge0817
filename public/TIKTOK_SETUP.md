# TikTok API Setup Guide

This walks you through registering a TikTok Developer app and wiring it
into StoryForge so the calendar's auto-poster can publish on your behalf.

The whole process is roughly:

1. Register an app at developers.tiktok.com (5 min).
2. Configure URLs, scopes, and redirect URIs (10 min).
3. Copy the keys into `.env.local` and restart the dev server (1 min).
4. **Wait for Content Posting API approval** (days to weeks for direct
   publish; Login Kit / drafts works immediately).

---

## 0. Pre-flight checklist

You'll need:

- A **TikTok account** (personal is fine; you can attach a business account
  later if you want to post to a brand account).
- A **deployable URL** for production. Localhost works for dev. If you don't
  have a deployed URL yet, deploy to Vercel first or use a tunnel like
  `ngrok` / `cloudflared` so TikTok can hit your callback during testing.
- **A privacy policy and terms of service URL.** TikTok requires public
  URLs for both before approving any app — even sandbox apps. StoryForge
  ships with both ready to submit:
  - `/privacy` → Privacy Policy
  - `/terms` → Terms of Service

  The contact email on both pages is set to **nofaceneeded91@gmail.com**.
  Once you've deployed the app to a public URL (Vercel, Netlify, or your
  own host), the URLs you give TikTok become e.g.
  `https://yourdomain.com/privacy` and `https://yourdomain.com/terms`.

  > **Localhost won't work** for TikTok submission. You must deploy first
  > or expose your local server with a tunnel like `ngrok http 3000` /
  > `cloudflared tunnel`. TikTok needs to fetch these URLs publicly.
- **A logo / icon** (PNG, at least 512×512). Required by TikTok during
  app submission.

---

## 1. Register the TikTok Developer app

1. Go to **<https://developers.tiktok.com/>** and sign in with your TikTok
   account.
2. Click **Manage Apps** → **Connect an app**.
3. Fill in the app details:

   | Field | Suggested value |
   |-------|-----------------|
   | **App name** | `StoryForge AI` |
   | **App icon** | Upload your 512×512 logo |
   | **Category** | `Entertainment` (or `Content / Media`) |
   | **App description** | `AI-powered serialized animated content engine for TikTok, Instagram Reels, and YouTube Shorts. Generates 2D comedy skits and cinematic short episodes with character consistency.` |
   | **Platform** | `Web` |
   | **Terms of Service URL** | `https://yourdomain.com/terms` *(StoryForge ships this page at `/terms` — deploy first)* |
   | **Privacy Policy URL** | `https://yourdomain.com/privacy` *(StoryForge ships this page at `/privacy` — deploy first)* |

4. Click **Submit**. You'll land on the app detail page with a
   **Client Key** and **Client Secret**. Don't share these.

---

## 2. Add products / scopes

On the app detail page, you'll see a **Products** tab. Add these:

### A. Login Kit *(required, instant approval)*

This gives you OAuth, which the calendar uses to authenticate the user.

- Add **Login Kit**.
- Under **Scopes**, enable:
  - `user.info.basic` — needed to display the connected username/avatar in
    StoryForge's Settings page.

### B. Content Posting API *(required for auto-posting; needs review)*

This is the one that takes days to weeks.

- Add **Content Posting API**.
- Under **Scopes**, enable BOTH:
  - `video.upload` — posts to **drafts** (works in sandbox / before review).
  - `video.publish` — posts **directly** with privacy/comment settings
    (requires full approval).
- During review TikTok will ask:
  - Demo video showing the feature working
  - Justification for needing direct publish (vs drafts)
  - Privacy policy that explicitly mentions video posting on user's behalf

> **Tip:** Submit for review with `video.upload` only first. You'll get
> approved in days. `video.publish` review can take weeks. StoryForge
> defaults to `postToDraftsOnly: true` so the calendar works the moment
> drafts is approved.

---

## 3. Configure redirect URIs

This is where most setups break. The redirect URI in your TikTok app config
**must EXACTLY match** the value of `TIKTOK_REDIRECT_URI` in `.env.local`,
character-for-character including the trailing slash.

In the TikTok Developer Portal, on your app's **Login Kit** product page,
find the **Redirect URI** field and add:

| Environment | Redirect URI |
|-------------|--------------|
| Local dev   | `http://localhost:3000/api/auth/tiktok/callback` |
| Production  | `https://yourdomain.com/api/auth/tiktok/callback` |

You can register multiple URIs — add both.

> **Common mistakes:** trailing slash mismatch, `http://` vs `https://`,
> using `127.0.0.1` instead of `localhost`. Match exactly.

---

## 4. Add your keys to .env.local

Open (or create) `.env.local` in the project root and paste:

```bash
# Required
TIKTOK_CLIENT_KEY=<your client key from TikTok>
TIKTOK_CLIENT_SECRET=<your client secret from TikTok>
TIKTOK_REDIRECT_URI=http://localhost:3000/api/auth/tiktok/callback

# Optional (only required when running scheduled cron in production)
CRON_SECRET=<any random long string>
```

Restart the dev server (`npm run dev`) so Next.js picks up the new env vars.

---

## 5. Connect the account

1. Open **<http://localhost:3000/settings>**.
2. Find the **Connected Social Accounts** section.
3. Click **Connect TikTok**.
4. You'll be redirected to TikTok's auth page → approve.
5. TikTok redirects back to `/settings` with a green
   "TikTok connected as @username" message.

If you see a red error message instead, check the
[Troubleshooting](#troubleshooting) section below.

---

## 6. Schedule and post

1. Generate a skit on **/demo** (Skit mode). Save it to library.
2. Open **/skits/[id]** and confirm at least one beat has an animated video
   (otherwise there's nothing for TikTok to fetch).
3. Click **Schedule on Calendar** → pick a date/time and platform `tiktok`.
4. On **/calendar**, click **Run Schedule Now** to fire all due posts
   immediately, OR wait for your cron service.
5. Status badge updates: `scheduled` → `uploading` → `posted` (or `failed`
   with an error message you can hover-read).

---

## 7. Production: scheduled cron

For real auto-posting (without you manually clicking "Run Schedule Now"),
set up a periodic POST to `/api/cron/process-schedule`.

### Vercel Cron

In `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/process-schedule", "schedule": "*/15 * * * *" }
  ]
}
```

Add `CRON_SECRET` as a Vercel environment variable, AND configure the cron
to send the `x-cron-secret` header. (Vercel supports custom headers on
crons via the dashboard.)

The cron expects a JSON body with `{ tiktokAccessToken, pending: [...] }`.
Since the calendar items live in localStorage (client-side), you'll need
to either:

1. Move the calendar to a server DB before going production (recommended),
   OR
2. Have the client POST to the cron route on a heartbeat — useful while
   you're still developing.

### Alternative: external cron (GitHub Actions, EasyCron, etc.)

Any service that can do an authenticated HTTPS POST works. Use the same
`x-cron-secret` header for auth.

---

## 8. Going public — what TikTok actually reviews

Before they approve `video.publish`, TikTok looks for:

- ✅ **A working demo video** — walk through your app posting to TikTok.
- ✅ **A live privacy policy** that mentions storing OAuth tokens and
  posting on behalf of the user.
- ✅ **A live terms of service** with reasonable usage clauses.
- ✅ **A logo** that doesn't look auto-generated.
- ✅ **Branded login** — the "Connect TikTok" button should make it clear
  what's happening (already covered by our Settings UI).
- ❌ Things that get rejected fast: scraping/cloning content, posting AI
  content without disclosure, posting on behalf of accounts the user
  doesn't own, content that violates community guidelines.

> **Disclosure:** TikTok requires AI-generated content to be labeled.
> StoryForge's caption generator already includes platform-specific captions
> — make sure your scheduled posts add an `#AI` or "Made with AI" tag
> where appropriate.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `redirect_uri_mismatch` | The URI in `.env.local` doesn't match the one registered in the TikTok portal | Copy-paste exactly, including trailing slash, `http://` vs `https://`. |
| `state mismatch` after approve | Cookies blocked or session changed mid-flow | Don't open `/settings` in incognito and finish the OAuth in a normal tab — they're separate cookie jars. |
| `Forbidden` / `403` on post | Account not yet approved for `video.publish` | StoryForge defaults to drafts (`postToDraftsOnly: true`) which works in sandbox. Wait for review or set the param to `true` if you've changed it. |
| Connected but `username` is empty | TikTok hasn't propagated profile yet, or `user.info.basic` scope missing | Reconnect after a minute, or verify the scope is enabled. |
| `permission not granted` | Scope wasn't enabled when the user authorized | Disconnect, re-enable scopes in the portal, reconnect. |
| Scheduled post fails with "no video URL" | The skit has no animated beats yet | Open the skit detail and click "Animate All Beats" before the scheduled time. |
| Video URL expired between scheduling and posting | Some video CDNs (Kling, Fal) expire links after hours | For long schedules (>24h out), copy the file to permanent storage. Out of scope for the MVP. |

---

## Quick reference

| What you need | Where to get it |
|---------------|-----------------|
| Client Key | TikTok Developer Portal → Your App → Credentials |
| Client Secret | TikTok Developer Portal → Your App → Credentials |
| Redirect URI | You set this — must match `.env.local` exactly |
| Scopes | Login Kit: `user.info.basic`. Content Posting: `video.upload`, `video.publish` |
| Approval needed for | `video.publish`. Drafts (`video.upload`) works without full review. |
| Token storage | Currently localStorage (dev). Move to encrypted DB before going public. |

That's it. Once approved, the calendar's "Run Schedule Now" button fires
real TikTok posts.
