import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-sans">
      <main className="flex w-full max-w-5xl flex-col items-center gap-10 px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            StoryForge AI
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            AI-powered content engine for TikTok, Instagram Reels, and YouTube
            Shorts. Two formats, one pipeline.
          </p>
        </div>

        <div className="grid w-full gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Hero Shot Reel */}
          <Link
            href="/demo"
            className="group rounded-2xl border border-fuchsia-800/60 bg-zinc-950 p-6 transition-colors hover:border-fuchsia-500"
          >
            <span className="rounded-full bg-fuchsia-900/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-fuchsia-300">
              Hero Shot
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Cinematic Hero Reels
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              5–10s 9:16 reels with scale contrast and Pixar-quality lighting.
              Built like @mister_z. Bring your own image or generate one.
            </p>
            <p className="mt-5 text-sm font-semibold text-fuchsia-400 group-hover:text-fuchsia-300">
              Generate Hero Shot &rarr;
            </p>
          </Link>

          {/* Comedy Skits */}
          <Link
            href="/skits"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-violet-700"
          >
            <span className="rounded-full bg-violet-900/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-violet-300">
              Comedy
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white">
              2D Comedy Skits
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Recurring cartoon characters, relatable scenarios, viral 15-30s
              clips. Built like Primax / Humor Animations.
            </p>
            <p className="mt-5 text-sm font-semibold text-violet-400 group-hover:text-violet-300">
              Generate Skits &rarr;
            </p>
          </Link>

          {/* Cinematic Stories */}
          <Link
            href="/storylines"
            className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-colors hover:border-emerald-700"
          >
            <span className="rounded-full bg-emerald-900/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
              Cinematic
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Serialized Episodes
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Long-form storylines with narrative arcs, consistent characters,
              and dramatic episode-to-episode continuity.
            </p>
            <p className="mt-5 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
              Create Storyline &rarr;
            </p>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <Link
            href="/characters"
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Characters
          </Link>
          <Link
            href="/calendar"
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Calendar
          </Link>
          <Link
            href="/idea-studio"
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Idea Studio
          </Link>
          <Link
            href="/creator-intel"
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Creator Intel
          </Link>
        </div>

        {/* Footer with legal links — required for TikTok app submission. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-zinc-900 pt-6 text-xs text-zinc-600">
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy Policy
          </Link>
          <span aria-hidden>&bull;</span>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
