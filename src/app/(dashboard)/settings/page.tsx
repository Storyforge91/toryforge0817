"use client";

import { useState, useEffect, useRef, startTransition } from "react";
import { useSocialStore } from "@/stores/social.store";
import type { TikTokAuth } from "@/types";

interface ApiKeyConfig {
  label: string;
  envVar: string;
  mask: string;
  connected: boolean;
}

interface Section {
  title: string;
  description: string;
  keys: ApiKeyConfig[];
}

const initialApiSections: Section[] = [
  {
    title: "Story Engine",
    description: "AI models used to generate storylines, episodes, and scripts.",
    keys: [
      {
        label: "Anthropic API Key",
        envVar: "ANTHROPIC_API_KEY",
        mask: "sk-ant-...xxxx",
        connected: false,
      },
      {
        label: "OpenAI API Key",
        envVar: "OPENAI_API_KEY",
        mask: "sk-...xxxx",
        connected: false,
      },
    ],
  },
  {
    title: "Image Generation",
    description: "Services for generating cinematic scene visuals.",
    keys: [
      {
        label: "Leonardo API Key",
        envVar: "LEONARDO_API_KEY",
        mask: "leo-...xxxx",
        connected: false,
      },
    ],
  },
  {
    title: "Voice",
    description: "Text-to-speech services for narration and voiceovers.",
    keys: [
      {
        label: "ElevenLabs API Key",
        envVar: "ELEVENLABS_API_KEY",
        mask: "el-...xxxx",
        connected: false,
      },
    ],
  },
  {
    title: "Anime Video Engine",
    description:
      "AI video generation for animated scene clips. FAL_KEY enables both Wan2.1 (best anime style) and Minimax (best expressions).",
    keys: [
      {
        label: "FAL.ai Key (Wan2.1 + Minimax)",
        envVar: "FAL_KEY",
        mask: "fal-...xxxx",
        connected: false,
      },
      {
        label: "Kling AI Key (Camera Controls)",
        envVar: "KLING_API_KEY",
        mask: "kl-...xxxx",
        connected: false,
      },
      {
        label: "Runway API Key (Not Active)",
        envVar: "RUNWAY_API_KEY",
        mask: "rw-...xxxx",
        connected: false,
      },
    ],
  },
];

const ENV_TO_STATUS_KEY: Record<string, string> = {
  ANTHROPIC_API_KEY: "anthropic",
  OPENAI_API_KEY: "openai",
  LEONARDO_API_KEY: "leonardo",
  ELEVENLABS_API_KEY: "elevenlabs",
  RUNWAY_API_KEY: "runway",
  FAL_KEY: "fal",
  KLING_API_KEY: "kling",
};

const PREFS_STORAGE_KEY = "storyforge-preferences";

export default function SettingsPage() {
  const [apiSections, setApiSections] = useState<Section[]>(initialApiSections);
  const [defaultGenre, setDefaultGenre] = useState("drama");
  const [defaultTone, setDefaultTone] = useState("cinematic");
  const [defaultPlatform, setDefaultPlatform] = useState("tiktok");
  const [saveMessage, setSaveMessage] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // TikTok auth state (Zustand store)
  const tiktokAuth = useSocialStore((s) => s.tiktok);
  const setTikTokAuth = useSocialStore((s) => s.setTikTokAuth);
  const [tiktokOAuthMsg, setTiktokOAuthMsg] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  // Parse the OAuth callback fragment if present (set by /api/auth/tiktok/callback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("tiktok=")) return;
    const params = new URLSearchParams(hash.slice(1));
    const result = params.get("tiktok");
    // Wrap state updates in startTransition so they don't fire synchronously
    // inside the effect body (React 19's set-state-in-effect rule).
    startTransition(() => {
      if (result === "ok") {
        const payload = params.get("payload");
        if (payload) {
          try {
            const padded = payload + "===".slice((payload.length + 3) % 4);
            const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
            const auth = JSON.parse(json) as TikTokAuth;
            setTikTokAuth(auth);
            setTiktokOAuthMsg({
              kind: "ok",
              text: `TikTok connected${auth.displayName ? ` as ${auth.displayName}` : ""}.`,
            });
          } catch (err) {
            setTiktokOAuthMsg({
              kind: "error",
              text: `Failed to parse OAuth payload: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }
      } else if (result === "error") {
        const reason = params.get("reason") || "unknown";
        setTiktokOAuthMsg({
          kind: "error",
          text: `TikTok connect failed: ${reason}`,
        });
      }
    });
    // Strip the fragment so a refresh doesn't re-trigger
    history.replaceState(null, "", window.location.pathname);
  }, [setTikTokAuth]);

  // Clean up save message timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored);
        startTransition(() => {
          if (prefs.defaultGenre) setDefaultGenre(prefs.defaultGenre);
          if (prefs.defaultTone) setDefaultTone(prefs.defaultTone);
          if (prefs.defaultPlatform) setDefaultPlatform(prefs.defaultPlatform);
        });
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch API key status on mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/settings/status");
        if (!res.ok) return;
        const status: Record<string, boolean> = await res.json();

        setApiSections((prev) =>
          prev.map((section) => ({
            ...section,
            keys: section.keys.map((key) => {
              const statusKey = ENV_TO_STATUS_KEY[key.envVar];
              return statusKey !== undefined
                ? { ...key, connected: !!status[statusKey] }
                : key;
            }),
          }))
        );
      } catch {
        // Silently fail — indicators stay as "Not Configured"
      }
    }
    fetchStatus();
  }, []);

  function handleSavePreferences() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({ defaultGenre, defaultTone, defaultPlatform })
      );
      setSaveMessage("Preferences saved!");
    } catch {
      setSaveMessage("Failed to save preferences.");
    }
    saveTimerRef.current = setTimeout(() => setSaveMessage(""), 2500);
  }

  return (
    <div className="min-h-screen bg-black px-8 py-16 font-sans">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="mt-2 text-zinc-400">
            Configure API keys and platform preferences.
          </p>
        </div>

        {/* API Key Sections */}
        <div className="mt-10 space-y-6">
          {apiSections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6"
            >
              <h2 className="text-lg font-semibold text-white">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {section.description}
              </p>

              <div className="mt-5 space-y-4">
                {section.keys.map((key) => (
                  <div
                    key={key.envVar}
                    className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
                  >
                    {/* Status indicator */}
                    <div
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        key.connected ? "bg-emerald-500" : "bg-zinc-600"
                      }`}
                      title={key.connected ? "Connected" : "Not configured"}
                    />

                    {/* Key info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {key.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            key.connected
                              ? "bg-emerald-900/60 text-emerald-300"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {key.connected ? "Connected" : "Not Configured"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-600">
                        {key.envVar}
                      </p>
                    </div>

                    {/* Masked input placeholder */}
                    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-600">
                      {key.mask}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info notice */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4">
          <p className="text-sm text-zinc-400">
            <span className="font-medium text-zinc-300">Note:</span> API keys
            are stored securely in your{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
              .env.local
            </code>{" "}
            file on the server. They are never exposed to the browser. Edit{" "}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
              .env.local
            </code>{" "}
            directly to add or update your keys, then restart the dev server.
          </p>
        </div>

        {/* Connected Social Accounts */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold text-white">
            Connected Social Accounts
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Authorize StoryForge to publish to your platforms. Required for
            scheduled auto-posting.
          </p>

          <div className="mt-5 space-y-4">
            {/* TikTok */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-900/40 text-sm font-bold text-cyan-300">
                    TT
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">TikTok</p>
                    {tiktokAuth ? (
                      <p className="mt-0.5 text-xs text-emerald-400">
                        Connected
                        {tiktokAuth.displayName
                          ? ` as ${tiktokAuth.displayName}`
                          : ""}
                        {tiktokAuth.username ? ` (@${tiktokAuth.username})` : ""}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Not connected
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {tiktokAuth ? (
                    <>
                      <a
                        href="/api/auth/tiktok"
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
                      >
                        Reconnect
                      </a>
                      <button
                        onClick={() => {
                          setTikTokAuth(null);
                          setTiktokOAuthMsg({
                            kind: "ok",
                            text: "TikTok disconnected.",
                          });
                        }}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-red-700 hover:text-red-400"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <a
                      href="/api/auth/tiktok"
                      className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                    >
                      Connect TikTok
                    </a>
                  )}
                </div>
              </div>

              {tiktokOAuthMsg && (
                <p
                  className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                    tiktokOAuthMsg.kind === "ok"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {tiktokOAuthMsg.text}
                </p>
              )}

              <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                Requires{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                  TIKTOK_CLIENT_KEY
                </code>
                ,{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                  TIKTOK_CLIENT_SECRET
                </code>
                , and{" "}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                  TIKTOK_REDIRECT_URI
                </code>{" "}
                in <code className="text-zinc-300">.env.local</code>. Direct
                publishing requires Content Posting API approval from TikTok
                Developer Portal (can take days to weeks). Until approved,
                posts land in your TikTok drafts.
              </p>

              {/* Setup guide quick links */}
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-3 text-[11px]">
                <span className="text-zinc-500">Step-by-step setup:</span>
                <a
                  href="https://developers.tiktok.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  TikTok Developer Portal &rarr;
                </a>
                <a
                  href="/TIKTOK_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                  title="Full setup guide in the repo"
                >
                  StoryForge setup guide &rarr;
                </a>
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                  title="Submit this URL to TikTok as your Privacy Policy URL"
                >
                  Privacy Policy
                </a>
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                  title="Submit this URL to TikTok as your Terms of Service URL"
                >
                  Terms of Service
                </a>
              </div>
              <details className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-[11px] text-zinc-400">
                <summary className="cursor-pointer font-medium text-zinc-300">
                  Quick checklist (click to expand)
                </summary>
                <ol className="mt-3 list-decimal space-y-2 pl-5">
                  <li>
                    Sign in at{" "}
                    <a
                      href="https://developers.tiktok.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline"
                    >
                      developers.tiktok.com
                    </a>{" "}
                    and click <strong>Manage Apps</strong> &rarr;{" "}
                    <strong>Connect an app</strong>.
                  </li>
                  <li>
                    Add products: <strong>Login Kit</strong> (instant) and{" "}
                    <strong>Content Posting API</strong> (review takes
                    days/weeks).
                  </li>
                  <li>
                    Enable scopes:{" "}
                    <code className="rounded bg-zinc-800 px-1 text-zinc-300">
                      user.info.basic
                    </code>
                    ,{" "}
                    <code className="rounded bg-zinc-800 px-1 text-zinc-300">
                      video.upload
                    </code>
                    ,{" "}
                    <code className="rounded bg-zinc-800 px-1 text-zinc-300">
                      video.publish
                    </code>
                    .
                  </li>
                  <li>
                    Set Redirect URI to{" "}
                    <code className="rounded bg-zinc-800 px-1 text-zinc-300">
                      http://localhost:3000/api/auth/tiktok/callback
                    </code>{" "}
                    (must match exactly, including trailing path).
                  </li>
                  <li>
                    Provide a public Privacy Policy + Terms of Service URL
                    (TikTok requires these before approval).
                  </li>
                  <li>
                    Copy <strong>Client Key</strong> + <strong>Client Secret</strong> from
                    your app, paste into{" "}
                    <code className="rounded bg-zinc-800 px-1 text-zinc-300">
                      .env.local
                    </code>{" "}
                    as{" "}
                    <code className="text-zinc-300">TIKTOK_CLIENT_KEY</code>{" "}
                    and{" "}
                    <code className="text-zinc-300">TIKTOK_CLIENT_SECRET</code>
                    .
                  </li>
                  <li>
                    Restart{" "}
                    <code className="rounded bg-zinc-800 px-1 text-zinc-300">
                      npm run dev
                    </code>
                    , then click <strong>Connect TikTok</strong> above.
                  </li>
                </ol>
                <p className="mt-3 text-zinc-500">
                  Full guide with troubleshooting:{" "}
                  <a
                    href="/TIKTOK_SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline"
                  >
                    TIKTOK_SETUP.md
                  </a>
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Platform Preferences */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold text-white">
            Platform Preferences
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Default settings for new storylines and content generation.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {/* Default Genre */}
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Default Genre
              </label>
              <select
                value={defaultGenre}
                onChange={(e) => setDefaultGenre(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="drama">Drama</option>
                <option value="thriller">Thriller</option>
                <option value="horror">Horror</option>
                <option value="sci-fi">Sci-Fi</option>
                <option value="romance">Romance</option>
                <option value="mystery">Mystery</option>
                <option value="fantasy">Fantasy</option>
                <option value="comedy">Comedy</option>
                <option value="crime">Crime</option>
                <option value="documentary">Documentary</option>
              </select>
            </div>

            {/* Default Tone */}
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Default Tone
              </label>
              <select
                value={defaultTone}
                onChange={(e) => setDefaultTone(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="cinematic">Cinematic</option>
                <option value="dark">Dark</option>
                <option value="suspenseful">Suspenseful</option>
                <option value="lighthearted">Lighthearted</option>
                <option value="emotional">Emotional</option>
                <option value="mysterious">Mysterious</option>
                <option value="epic">Epic</option>
                <option value="minimalist">Minimalist</option>
              </select>
            </div>

            {/* Default Platform */}
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Default Platform
              </label>
              <select
                value={defaultPlatform}
                onChange={(e) => setDefaultPlatform(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
              >
                <option value="tiktok">TikTok</option>
                <option value="reels">Instagram Reels</option>
                <option value="shorts">YouTube Shorts</option>
                <option value="all">All Platforms</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSavePreferences}
              className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Save Preferences
            </button>
            {saveMessage && (
              <span className="text-sm text-emerald-400">{saveMessage}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
