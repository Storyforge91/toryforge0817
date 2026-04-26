"use client";

import Link from "next/link";

/**
 * Tab bar shared by /idea-studio (Brainstorm Ideas) and /creator-intel
 * (Niche Analysis). The two routes stay distinct under the hood, but the
 * matching tab bar makes them feel like one Idea Studio tool.
 */
export function IdeaStudioTabs({
  active,
}: {
  active: "brainstorm" | "niche";
}) {
  return (
    <div className="mb-6 inline-flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
      <Link
        href="/idea-studio"
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          active === "brainstorm"
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Brainstorm Ideas
      </Link>
      <Link
        href="/creator-intel"
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          active === "niche"
            ? "bg-white text-black"
            : "text-zinc-400 hover:text-white"
        }`}
      >
        Niche Analysis
      </Link>
    </div>
  );
}
