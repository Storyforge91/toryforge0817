import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black font-sans">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10 px-8 py-16">
        <div className="text-center">
          <span className="rounded-full border border-fuchsia-700/60 bg-fuchsia-950/40 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-fuchsia-300">
            Hero Shot Reel Engine
          </span>
          <h1 className="mt-5 text-5xl font-bold tracking-tight text-white">
            StoryForge AI
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-400">
            One look. One series. 8-second cinematic 9:16 reels with scale
            contrast and dramatic lighting — built for the &quot;tiny human,
            vast world&quot; aesthetic.
          </p>
        </div>

        <Link
          href="/demo"
          className="group rounded-2xl border border-fuchsia-800/60 bg-zinc-950 p-8 transition-colors hover:border-fuchsia-500"
        >
          <h2 className="text-3xl font-bold text-white">
            Open the Studio &rarr;
          </h2>
          <p className="mt-3 text-sm text-zinc-400">
            Generate a hero shot from a one-line scenario, or bring your own
            still from OpenArt / Midjourney. Locked to 8s, 9:16, single shot.
          </p>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          <Link
            href="/calendar"
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Calendar
          </Link>
          <Link
            href="/settings"
            className="rounded-full border border-zinc-700 px-4 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Settings
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
