# Deploying StoryForge AI to Vercel

Goal: get a public HTTPS URL like `https://your-app.vercel.app/privacy`
that you can paste into TikTok's Developer Portal.

The whole flow takes about 10 minutes once you have the steps in front
of you.

---

## 1. Push the repo to GitHub

This is the part Claude can't do for you because it requires your
GitHub credentials.

```bash
# From the project root:
cd "/Users/enelsimilien/Documents/Faceless_Automated/Faceless Animation MD File/storyforge-ai"

# 1. Create a new EMPTY repo on github.com (call it "storyforge-ai" or
#    whatever you want). Do NOT initialize it with a README/license/
#    .gitignore — those would conflict with the existing commit.

# 2. Connect your local repo to it (replace <username> and <repo>):
git remote add origin git@github.com:<username>/<repo>.git
# OR with HTTPS if you don't have SSH set up:
# git remote add origin https://github.com/<username>/<repo>.git

# 3. Push:
git push -u origin main
```

If you get "Permission denied (publickey)" with SSH, switch to HTTPS
or follow https://docs.github.com/en/authentication/connecting-to-github-with-ssh.

---

## 2. Connect the repo to Vercel

1. Go to **https://vercel.com/new**
2. Sign in (GitHub login is fastest — auto-syncs the repo list).
3. Click **Import Git Repository** → select the repo you just pushed.
4. **Framework Preset**: should auto-detect as **Next.js**. Don't change.
5. **Root Directory**: leave as default (the project root).
6. **Build & Output settings**: leave defaults — the `vercel.json` in
   the repo handles per-route timeouts and the cron schedule.
7. **Don't click Deploy yet** — go to Step 3 first to add env vars.

---

## 3. Add environment variables to Vercel

On the same import screen, expand the **Environment Variables** section
and add the following (one per row). All seven are required for the
parts of the app that depend on them.

| Variable | Where to get it | Notes |
|----------|-----------------|-------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys | Required for ALL story generation. |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Optional fallback. Set if you have it. |
| `LEONARDO_API_KEY` | https://app.leonardo.ai/account → API access | Required for image generation. |
| `ELEVENLABS_API_KEY` | https://elevenlabs.io/app/settings/api-keys | Required for voice. |
| `FAL_KEY` | https://fal.ai/dashboard/keys | Powers Wan2.1 + Minimax. |
| `KLING_API_KEY` | https://aimlapi.com (or your Kling provider) | Powers Kling video. |
| `RUNWAY_API_KEY` | (optional, legacy) | Skip if you don't use it. |

**Pro tip:** copy your existing `.env.local` and paste the entire
contents into Vercel's bulk env-var field. Vercel parses each `KEY=VALUE`
line automatically. **Do not include `.env.local` in your commit** —
the `.gitignore` already prevents this.

For each variable, set the **Environment** to **Production, Preview,
and Development** (all three checkboxes).

---

## 4. Click Deploy

Vercel runs `npm install` + `npm run build` + ships it. Takes ~2-3 min.

When it's done you'll get a URL like:
```
https://storyforge-ai-yourname.vercel.app
```

Verify it works:
- `https://storyforge-ai-yourname.vercel.app/` → home page
- `https://storyforge-ai-yourname.vercel.app/privacy` → privacy policy
- `https://storyforge-ai-yourname.vercel.app/terms` → terms of service
- `https://storyforge-ai-yourname.vercel.app/demo` → the generator

---

## 5. Add the TikTok-related env vars

Once you have your TikTok app credentials (see `TIKTOK_SETUP.md`), add
three more env vars in Vercel (Settings → Environment Variables →
Add New):

| Variable | Value |
|----------|-------|
| `TIKTOK_CLIENT_KEY` | Your TikTok app's client key |
| `TIKTOK_CLIENT_SECRET` | Your TikTok app's client secret |
| `TIKTOK_REDIRECT_URI` | `https://storyforge-ai-yourname.vercel.app/api/auth/tiktok/callback` |
| `CRON_SECRET` | Any random string — required to authorize the cron processor |

After adding env vars, click **Redeploy** in the Vercel dashboard so
they take effect (env vars only load at build/start time).

---

## 6. Update TikTok's developer portal redirect URI

Go back to the TikTok Developer Portal → your app → **Login Kit** →
**Redirect URI** and add the production URL:

```
https://storyforge-ai-yourname.vercel.app/api/auth/tiktok/callback
```

(Keep the localhost URI registered too if you want OAuth to work in dev.)

---

## 7. Submit your URLs to TikTok

In the TikTok Developer Portal app form, you can now paste:

- **Privacy Policy URL**: `https://storyforge-ai-yourname.vercel.app/privacy`
- **Terms of Service URL**: `https://storyforge-ai-yourname.vercel.app/terms`

These pages already include the contact email **nofaceneeded91@gmail.com**.

---

## 8. About the cron job

`vercel.json` registers a cron that hits `/api/cron/process-schedule`
every 15 minutes. The endpoint authorizes via the `x-cron-secret`
header.

**Important caveat:** because the calendar items live in `localStorage`
(client-side) for this dev MVP, the cron can't actually see them
server-side. For now you'll trigger posts manually with the **Run
Schedule Now** button on `/calendar`. To make the cron useful
end-to-end, the next step would be moving the calendar to a server-side
database (Postgres via Vercel Postgres or Supabase). That's a separate
piece of work.

---

## Common deploy errors

| Error | Fix |
|-------|-----|
| `Module not found` during build | A dependency is in `devDependencies` but used at runtime. Move it to `dependencies` and push again. |
| `Function exceeded maxDuration` | The current `vercel.json` already sets 300s on long routes. If a custom route still times out, add it to the `functions` block. |
| `EnvVar X not configured` errors at runtime | Forgot to add the env var, or didn't redeploy after adding. Settings → Environment Variables → check it exists for the Production env, then click Redeploy. |
| Privacy/Terms 404 | The page route compiled but the deploy is using a stale build. Trigger a fresh deploy. |

---

## Recap

After all 8 steps:

1. Public URL: ✓
2. Privacy + Terms URLs: ✓ (with your real email)
3. TikTok app submission ready: ✓
4. Cron-driven auto-posting wired (with the localStorage caveat): ✓

Drop your Vercel URL in the chat once it's deployed and I'll help with
any deploy errors or the TikTok app submission.
