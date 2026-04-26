"use client";

import { useState } from "react";
import { IdeaStudioTabs } from "@/components/idea-studio-tabs";

/* ════════════════════════════════════════════════════════════
   STATIC DATA — Top faceless animation channels & intel
   ════════════════════════════════════════════════════════════ */

const TOP_CHANNELS = [
  {
    name: "Solar Sands",
    platform: "YouTube",
    followers: "2.2M+",
    niche: "Art analysis / dark animation essays",
    revenue: "$15K–40K/mo (est.)",
    whatTheyDoWell: [
      "Deep, essay-style narration that rewards rewatching",
      "Distinctive visual identity — collage-style animation that's instantly recognizable",
      "Explores niche art topics mainstream channels ignore, building a cult following",
      "Consistent upload schedule builds anticipation",
    ],
    whatTheyDontDoWell: [
      "Long gaps between uploads lose momentum",
      "Longer format doesn't translate well to Shorts/Reels",
      "Limited merchandise or product diversification",
    ],
    keyTakeaway:
      "A unique visual style + deep niche expertise creates an audience that competitors can't steal.",
  },
  {
    name: "Storybook AI / AI Story Channels",
    platform: "TikTok / YouTube Shorts",
    followers: "500K–2M+ (aggregate)",
    niche: "AI-generated moral stories / dark tales",
    revenue: "$5K–25K/mo (est.)",
    whatTheyDoWell: [
      "High volume output — 1-3 videos per day leveraging AI generation",
      "Strong emotional hooks ('She made a deal she'd regret forever...')",
      "Consistent visual style with AI art creates brand recognition",
      "Episode series drive follow-for-next behavior",
      "Dark/twisted takes on familiar story formats stand out in feeds",
    ],
    whatTheyDontDoWell: [
      "Character consistency breaks between episodes — faces change",
      "Generic AI voices reduce emotional connection",
      "Many copycat channels dilute the niche",
      "Limited narrative depth — most are one-off morality tales, not true series",
    ],
    keyTakeaway:
      "Volume + emotional hooks work, but the channels that add true serialization will own the space.",
  },
  {
    name: "Motivation/Stoic Channels",
    platform: "TikTok / Instagram Reels",
    followers: "1M–10M+ (aggregate)",
    niche: "Dark motivation / stoic philosophy with animated characters",
    revenue: "$10K–100K/mo (top channels)",
    whatTheyDoWell: [
      "Evergreen content — motivation never goes out of style",
      "Simple but effective formula: deep voice + striking AI visuals + powerful text",
      "High shareability — followers tag friends, driving organic growth",
      "Strong merchandise potential (prints, apparel with character art)",
      "Multiple revenue streams: ad revenue, sponsors, digital products, coaching",
    ],
    whatTheyDontDoWell: [
      "Extremely saturated — hundreds of near-identical channels",
      "Recycled quotes and ideas make channels interchangeable",
      "Audiences have quote fatigue — generic motivation doesn't stop scrolls anymore",
      "Over-reliance on trending audio rather than original voice",
    ],
    keyTakeaway:
      "The money is real, but differentiation is everything. Story-driven motivation (character arcs, not just quotes) is the untapped angle.",
  },
  {
    name: "Mystery / Iceberg Channels",
    platform: "YouTube / TikTok",
    followers: "500K–5M+",
    niche: "Animated mystery breakdowns, conspiracy, creepypasta",
    revenue: "$8K–50K/mo (est.)",
    whatTheyDoWell: [
      "Serialized format is natural — each mystery has parts, levels, layers",
      "Built-in cliffhanger mechanics drive binge behavior",
      "Comment sections become community discussion hubs (algorithmic gold)",
      "Dark/eerie animation style is cheap to produce but highly atmospheric",
      "Topics are infinitely renewable — new mysteries, new icebergs, new rabbit holes",
    ],
    whatTheyDontDoWell: [
      "Research-heavy — each video requires significant prep beyond AI generation",
      "Copyright risks with real-world stories and images",
      "Audience can be fickle — quality variance loses subscribers fast",
      "Harder to merchandise compared to character-driven channels",
    ],
    keyTakeaway:
      "Mystery + serialization is a proven combo. The channels adding original fictional mysteries (instead of retelling known ones) are growing fastest.",
  },
  {
    name: "Anime-Style Story Channels",
    platform: "YouTube Shorts / TikTok",
    followers: "200K–3M+",
    niche: "AI anime-style animated stories (romance, action, fantasy)",
    revenue: "$3K–30K/mo (est.)",
    whatTheyDoWell: [
      "Massive built-in audience — anime fans are highly engaged on social media",
      "AI anime art has reached quality parity with hand-drawn styles",
      "Strong character attachment drives follow behavior",
      "Romance and fantasy arcs generate massive comment engagement",
      "Fan art and community creation amplify reach organically",
    ],
    whatTheyDontDoWell: [
      "Character consistency is the #1 complaint — faces change constantly",
      "AI 'tells' (extra fingers, weird eyes) break immersion for savvy anime fans",
      "Competition from actual anime clips and manga content",
      "Harder to monetize via brand deals compared to lifestyle/motivation niches",
    ],
    keyTakeaway:
      "Character consistency is make-or-break here. Channels that solve it (via LoRA training or consistent style) dominate. StoryForge's character system is purpose-built for this.",
  },
  {
    name: "Horror / Creepy Animation Channels",
    platform: "TikTok / YouTube",
    followers: "500K–8M+",
    niche: "Short horror animations, creepypasta, urban legends",
    revenue: "$5K–60K/mo (est.)",
    whatTheyDoWell: [
      "Horror is the #1 performing genre on TikTok for completion rates",
      "Fear triggers saves and shares — both are algorithm gold",
      "Atmospheric AI art is perfect for horror — uncanny valley becomes a feature",
      "Low barrier to entry — dark scenes require less visual precision",
      "Series format ('Part 1... Part 2...') drives compulsive following",
    ],
    whatTheyDontDoWell: [
      "Platform content moderation can restrict reach for graphic content",
      "Audience skews young — limits premium brand sponsorship opportunities",
      "Easy to fall into 'jump scare' gimmicks that don't build lasting audience",
      "Burnout risk — constantly producing disturbing content affects creators",
    ],
    keyTakeaway:
      "Horror + serialization is the fastest-growing faceless animation niche. Psychological horror (tension, dread) outperforms gore and jump scares long-term.",
  },
];

const WHAT_WORKS = [
  {
    category: "Hook Strategy",
    tips: [
      {
        tip: "Lead with conflict, not context",
        detail:
          "Don't explain the world first. Start with the moment everything goes wrong. 'She opened the door and froze' beats 'In a small town in Ohio, there lived a girl named Sarah.'",
      },
      {
        tip: "Use the 'curiosity gap' in first 1.5 seconds",
        detail:
          "Show or say something incomplete that the viewer MUST resolve. 'Nobody talks about what happened on floor 13.' Their brain won't let them scroll past.",
      },
      {
        tip: "Pattern interrupt with visual contrast",
        detail:
          "First frame should be visually different from typical feed content. Dark scenes, unusual compositions, extreme close-ups — anything that breaks the scroll pattern.",
      },
      {
        tip: "Numbered series in captions ('Part 3 of 7')",
        detail:
          "This triggers completionist psychology. Viewers who see Part 3 will go find Parts 1-2 (driving profile visits) and follow for Parts 4-7.",
      },
    ],
  },
  {
    category: "Narrative Technique",
    tips: [
      {
        tip: "End every episode mid-action, never mid-thought",
        detail:
          "Bad cliffhanger: 'Little did he know what was coming.' Good cliffhanger: 'He reached for the handle — and that's when the lights went out.' Action cliffhangers create urgency. Thought cliffhangers create indifference.",
      },
      {
        tip: "Give characters a wound, not just a goal",
        detail:
          "Characters who want something are interesting. Characters who want something because of a specific pain are magnetic. 'He wanted to win' vs 'He wanted to win because his father told him he'd never amount to anything.'",
      },
      {
        tip: "Escalate stakes every episode, not every arc",
        detail:
          "Each episode should raise the stakes from the previous one. If Episode 2 feels like a step down from Episode 1, you'll lose the audience even if Episode 5 is amazing.",
      },
      {
        tip: "Use the 'False Victory' beat in episode 3-4",
        detail:
          "Give the audience a moment where it seems like the character has won. Then pull the rug. This is the most shared/commented moment in serialized content.",
      },
    ],
  },
  {
    category: "Growth Tactics",
    tips: [
      {
        tip: "Post 2-3x per day for the first 30 days",
        detail:
          "Platform algorithms heavily favor new accounts that demonstrate consistent output. After 30 days, you can drop to 1x/day or 5x/week. The first month is about training the algorithm.",
      },
      {
        tip: "Reply to EVERY comment in the first 100 videos",
        detail:
          "Comments drive algorithmic reach. Replying doubles your comment count and signals to the algorithm that your content sparks conversation. Pin a question as your first comment on every video.",
      },
      {
        tip: "Cross-post but stagger by 4-6 hours",
        detail:
          "Post to TikTok first (fastest discovery), Instagram Reels 4 hours later, YouTube Shorts 6 hours after that. Each platform gets 'fresh' content from its perspective.",
      },
      {
        tip: "Use trending audio on TikTok, original audio on YouTube",
        detail:
          "TikTok's algorithm boosts trending sounds. YouTube's algorithm prefers originality. Adapt your audio strategy per platform, not one-size-fits-all.",
      },
    ],
  },
  {
    category: "Visual & Production",
    tips: [
      {
        tip: "Lock your visual style by episode 3, not episode 1",
        detail:
          "Use the first 2-3 videos to test different AI art styles, aspect ratios, and color palettes. Once you find what resonates (check completion rates), lock it in and never deviate.",
      },
      {
        tip: "Animated captions are non-negotiable",
        detail:
          "85% of short-form video is watched on mute. Word-by-word animated captions (not static subtitles) keep viewers engaged even silently. CapCut's auto-captions are the industry standard.",
      },
      {
        tip: "Use 9:16 framing with a visual 'anchor zone'",
        detail:
          "The center 60% of a vertical frame is where eyes naturally rest. Place your key visual action there. Use the top 20% for text/hooks and the bottom 20% for captions.",
      },
      {
        tip: "Slow zoom or pan on every static image",
        detail:
          "Never show a completely static frame. Even a slow 5% zoom over 4 seconds adds perceived motion and prevents the 'AI slideshow' feeling that kills retention.",
      },
    ],
  },
  {
    category: "Monetization",
    tips: [
      {
        tip: "Don't wait for ad revenue — build email from day 1",
        detail:
          "Ad revenue requires 10K+ followers and platform approval. An email list is yours forever. Use a free lead magnet (character wallpapers, exclusive episode) in your bio link.",
      },
      {
        tip: "Digital products outperform sponsorships until 100K followers",
        detail:
          "Sell prompt packs, character art bundles, 'behind the scenes' of your AI workflow, or story templates. $10-50 products to an engaged audience of 5K beats waiting for brand deals.",
      },
      {
        tip: "Treat your character IP like a brand",
        detail:
          "Your characters are intellectual property. License them for merch, create sticker packs, build a Patreon with exclusive storylines. The character, not the video format, is the monetizable asset.",
      },
      {
        tip: "Sponsored story integrations over product placements",
        detail:
          "When brands come calling, offer to weave their product into a storyline episode rather than doing a standard ad read. This commands 3-5x the rate and performs better for the brand.",
      },
    ],
  },
];

const AVOID_LIST = [
  {
    mistake: "Starting with expensive tools before validating the concept",
    detail:
      "Use free tiers of everything for the first 30 days. If your stories don't resonate with free tools, paid tools won't fix it. Content quality > production quality at the start.",
  },
  {
    mistake: "Chasing trends instead of building a series",
    detail:
      "Trend-hopping gets views but not followers. A viewer who watches your trending video has no reason to follow — they followed the trend, not you. A viewer who watches Episode 3 and wants Episode 4 follows YOU.",
  },
  {
    mistake: "Overthinking production, underthinking hooks",
    detail:
      "Creators spend 3 hours perfecting visuals and 30 seconds on the hook. Flip that ratio. The hook determines if anyone sees your beautiful visuals. A mediocre video with an incredible hook outperforms a masterpiece with a weak opening.",
  },
  {
    mistake: "Posting the same video identically on all platforms",
    detail:
      "Each platform has different caption lengths, hashtag strategies, aspect ratio preferences, and audience behavior. At minimum, customize captions and hashtags per platform.",
  },
  {
    mistake: "Ignoring comments and community building",
    detail:
      "Comments are the #1 algorithmic signal across all platforms. Every unanswered comment is a missed opportunity to double your engagement metrics. The algorithm watches your reply rate.",
  },
  {
    mistake: "Giving up before the algorithm 'picks you up'",
    detail:
      "Most faceless channels see near-zero traction for 15-30 videos. The algorithm needs data to understand your content and find your audience. The channels that succeed are the ones that posted video #31.",
  },
  {
    mistake: "Using generic AI voices everyone has heard",
    detail:
      "If your viewers recognize the ElevenLabs 'Adam' voice from 50 other channels, you've lost distinctiveness. Clone a unique voice or use a less common preset. Your voice is your brand's audio signature.",
  },
  {
    mistake: "Neglecting the 'binge path' on your profile",
    detail:
      "When a viewer loves one video and visits your profile, they should immediately see a clear series to binge. Pin your Episode 1 or 'Start Here' video. Use playlists. Make the binge path obvious.",
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */

type Tab = "channels" | "playbook" | "avoid" | "analyze";

export default function CreatorIntelPage() {
  const [activeTab, setActiveTab] = useState<Tab>("channels");
  const [expandedChannel, setExpandedChannel] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);

  // AI analysis state
  const [analyzeMode, setAnalyzeMode] = useState<
    "analyze-niche" | "strategy-session"
  >("analyze-niche");
  const [analyzeInput, setAnalyzeInput] = useState("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);

  async function handleAnalyze() {
    if (!analyzeInput.trim()) return;
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);

    try {
      const res = await fetch("/api/ai/creator-intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: analyzeInput, type: analyzeMode }),
      });
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      setAnalyzeResult(await res.json());
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setAnalyzeLoading(false);
    }
  }

  const TABS: { value: Tab; label: string }[] = [
    { value: "channels", label: "Top Channels" },
    { value: "playbook", label: "Playbook" },
    { value: "avoid", label: "What to Avoid" },
    { value: "analyze", label: "AI Analysis" },
  ];

  return (
    <div className="min-h-screen bg-black px-8 py-12 font-sans">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white">Idea Studio</h1>
          <p className="mt-2 text-zinc-400">
            Niche analysis. Breakdowns of top faceless animation channels,
            proven tactics, and an AI strategist for your niche.
          </p>
        </div>

        <IdeaStudioTabs active="niche" />

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-lg bg-zinc-900 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ───── Top Channels Tab ───── */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Breakdowns of the most profitable faceless animation niches — what
              they do right, where they fall short, and what you can learn.
            </p>
            {TOP_CHANNELS.map((ch, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50"
              >
                <button
                  onClick={() =>
                    setExpandedChannel(expandedChannel === i ? null : i)
                  }
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-800/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-white">
                        {ch.name}
                      </h3>
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-300">
                        {ch.platform}
                      </span>
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-300">
                        {ch.followers}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">{ch.niche}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-emerald-400">
                      {ch.revenue}
                    </span>
                    <span className="text-zinc-500">
                      {expandedChannel === i ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {expandedChannel === i && (
                  <div className="border-t border-zinc-800 p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* What they do well */}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                          What They Do Well
                        </h4>
                        <ul className="space-y-2">
                          {ch.whatTheyDoWell.map((item, j) => (
                            <li
                              key={j}
                              className="flex gap-2 text-sm text-zinc-300"
                            >
                              <span className="mt-1 shrink-0 text-emerald-500">
                                +
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* What they don't do well */}
                      <div>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-400">
                          Where They Fall Short
                        </h4>
                        <ul className="space-y-2">
                          {ch.whatTheyDontDoWell.map((item, j) => (
                            <li
                              key={j}
                              className="flex gap-2 text-sm text-zinc-300"
                            >
                              <span className="mt-1 shrink-0 text-red-500">
                                −
                              </span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {/* Key Takeaway */}
                    <div className="mt-4 rounded-lg bg-zinc-800/50 px-4 py-3">
                      <p className="text-xs font-medium text-amber-400">
                        Key Takeaway for You
                      </p>
                      <p className="mt-1 text-sm text-zinc-200">
                        {ch.keyTakeaway}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ───── Playbook Tab ───── */}
        {activeTab === "playbook" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Proven tactics and techniques from the most successful faceless
              animation creators.
            </p>
            {WHAT_WORKS.map((cat, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50"
              >
                <button
                  onClick={() =>
                    setExpandedCategory(expandedCategory === i ? null : i)
                  }
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-800/30"
                >
                  <h3 className="text-base font-bold text-white">
                    {cat.category}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {cat.tips.length} tips
                    </span>
                    <span className="text-zinc-500">
                      {expandedCategory === i ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {expandedCategory === i && (
                  <div className="border-t border-zinc-800 p-5">
                    <div className="space-y-4">
                      {cat.tips.map((tip, j) => (
                        <div
                          key={j}
                          className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
                        >
                          <h4 className="text-sm font-semibold text-white">
                            {tip.tip}
                          </h4>
                          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                            {tip.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ───── What to Avoid Tab ───── */}
        {activeTab === "avoid" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              The most common mistakes that kill faceless animation channels
              before they get traction.
            </p>
            {AVOID_LIST.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {item.mistake}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ───── AI Analysis Tab ───── */}
        {activeTab === "analyze" && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-400">
              Get AI-powered competitive analysis and personalized strategy for
              your specific niche.
            </p>

            {/* Mode selector */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAnalyzeMode("analyze-niche");
                  setAnalyzeResult(null);
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all ${
                  analyzeMode === "analyze-niche"
                    ? "border-white bg-white/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <div className="text-sm font-semibold">Niche Analysis</div>
                <div className="mt-1 text-xs opacity-70">
                  Analyze a specific niche — saturation, tactics, formulas,
                  growth strategy
                </div>
              </button>
              <button
                onClick={() => {
                  setAnalyzeMode("strategy-session");
                  setAnalyzeResult(null);
                }}
                className={`flex-1 rounded-xl border px-4 py-3 text-left transition-all ${
                  analyzeMode === "strategy-session"
                    ? "border-white bg-white/10 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <div className="text-sm font-semibold">Strategy Session</div>
                <div className="mt-1 text-xs opacity-70">
                  Get a personalized launch playbook for your channel concept
                </div>
              </button>
            </div>

            {/* Input */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                {analyzeMode === "analyze-niche"
                  ? "What niche do you want to analyze?"
                  : "Describe your channel concept"}
              </label>
              <textarea
                value={analyzeInput}
                onChange={(e) => setAnalyzeInput(e.target.value)}
                rows={3}
                placeholder={
                  analyzeMode === "analyze-niche"
                    ? 'e.g. "dark motivation with anime characters" or "AI horror stories"'
                    : 'e.g. "I want to create a serialized mystery series about a detective in a cyberpunk city, targeting 18-30 year olds on TikTok"'
                }
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
              />
              {/* Quick niche buttons */}
              {analyzeMode === "analyze-niche" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Dark motivation / stoic",
                    "Horror animation",
                    "AI anime romance",
                    "Mystery / true crime",
                    "Wholesome stories",
                    "Sci-fi / cyberpunk",
                  ].map((niche) => (
                    <button
                      key={niche}
                      onClick={() => setAnalyzeInput(niche)}
                      className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                    >
                      {niche}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzeLoading || !analyzeInput.trim()}
                  className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analyzeLoading ? "Analyzing..." : "Run Analysis"}
                </button>
                {analyzeLoading && (
                  <span className="ml-3 text-xs text-zinc-500 animate-pulse">
                    Crunching competitive intel...
                  </span>
                )}
              </div>
              {analyzeError && (
                <p className="mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                  {analyzeError}
                </p>
              )}
            </div>

            {/* Niche Analysis Results */}
            {analyzeResult && analyzeMode === "analyze-niche" && (
              <NicheAnalysisResults result={analyzeResult} />
            )}

            {/* Strategy Session Results */}
            {analyzeResult && analyzeMode === "strategy-session" && (
              <StrategySessionResults result={analyzeResult} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────── Niche Analysis Results ──────────────────── */

function NicheAnalysisResults({ result }: { result: any }) {
  const satColor =
    result.saturationLevel === "low"
      ? "text-emerald-400 bg-emerald-500/20"
      : result.saturationLevel === "medium"
        ? "text-amber-400 bg-amber-500/20"
        : "text-red-400 bg-red-500/20";

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">{result.niche || "Analysis"}</h3>
          {result.saturationLevel && (
            <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${satColor}`}>
              {result.saturationLevel} saturation
            </span>
          )}
        </div>
        {result.marketOverview && (
          <p className="mt-2 text-sm text-zinc-400">{result.marketOverview}</p>
        )}
        {result.revenueEstimate && (
          <p className="mt-2 text-sm text-emerald-400">
            Revenue estimate: {result.revenueEstimate}
          </p>
        )}
      </div>

      {/* Top Tactics */}
      {result.topTactics && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Top Tactics
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.topTactics.map((t: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">
                    {t.tactic}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      t.difficultyLevel === "easy"
                        ? "bg-emerald-900/60 text-emerald-300"
                        : t.difficultyLevel === "medium"
                          ? "bg-amber-900/60 text-amber-300"
                          : "bg-red-900/60 text-red-300"
                    }`}
                  >
                    {t.difficultyLevel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{t.whyItWorks}</p>
                <p className="mt-2 text-xs text-zinc-300">
                  How: {t.howToImplement}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Formulas */}
      {result.contentFormulas && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Proven Content Formulas
          </h3>
          <div className="space-y-3">
            {result.contentFormulas.map((f: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <h4 className="text-sm font-bold text-white">{f.name}</h4>
                <p className="mt-1 text-xs text-zinc-400">{f.structure}</p>
                <p className="mt-2 text-xs italic text-amber-400/80">
                  Example hook: &ldquo;{f.exampleHook}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {result.commonMistakes && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Common Mistakes in This Niche
          </h3>
          <div className="space-y-3">
            {result.commonMistakes.map((m: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <h4 className="text-sm font-semibold text-red-400">
                  {m.mistake}
                </h4>
                <p className="mt-1 text-xs text-zinc-400">{m.whyItsHarmful}</p>
                <p className="mt-2 text-xs text-emerald-400/80">
                  Instead: {m.whatToDoInstead}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Strategy */}
      {result.growthStrategy && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Growth Roadmap
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-zinc-800/40 px-4 py-3">
              <p className="text-xs font-medium text-emerald-400">
                0 → 1K Followers
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                {result.growthStrategy.first1000Followers}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/40 px-4 py-3">
              <p className="text-xs font-medium text-amber-400">
                1K → 10K Followers
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                {result.growthStrategy.first10000Followers}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/40 px-4 py-3">
              <p className="text-xs font-medium text-purple-400">
                10K+ Scaling
              </p>
              <p className="mt-1 text-xs text-zinc-300">
                {result.growthStrategy.scaling}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Strategy Session Results ──────────────────── */

function StrategySessionResults({ result }: { result: any }) {
  return (
    <div className="space-y-5">
      {/* Assessment */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-zinc-300">
          Honest Assessment
        </h3>
        <p className="mt-2 text-sm text-zinc-200">{result.assessment}</p>
      </div>

      {/* Positioning */}
      {result.positioning && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Positioning
          </h3>
          <div className="space-y-2">
            <div className="rounded-lg bg-zinc-800/40 px-4 py-3">
              <p className="text-xs font-medium text-zinc-400">Unique Angle</p>
              <p className="mt-1 text-sm text-white">
                {result.positioning.uniqueAngle}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/40 px-4 py-3">
              <p className="text-xs font-medium text-zinc-400">
                Target Audience
              </p>
              <p className="mt-1 text-sm text-white">
                {result.positioning.targetAudience}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {result.positioning.contentPillars?.map(
                (p: string, i: number) => (
                  <span
                    key={i}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
                  >
                    {p}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Launch Plan */}
      {result.launchPlan && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Launch Plan
          </h3>
          <div className="space-y-3">
            {[
              {
                data: result.launchPlan.week1,
                label: "Week 1",
                color: "text-emerald-400",
              },
              {
                data: result.launchPlan.week2to4,
                label: "Weeks 2–4",
                color: "text-amber-400",
              },
              {
                data: result.launchPlan.month2to3,
                label: "Months 2–3",
                color: "text-purple-400",
              },
            ].map(
              ({ data, label, color }) =>
                data && (
                  <div key={label} className="rounded-lg bg-zinc-800/40 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-medium ${color}`}>{label}</p>
                      <span className="text-xs text-zinc-500">
                        {data.contentCount} videos | Track: {data.keyMetric}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white">{data.focus}</p>
                    <ul className="mt-2 space-y-1">
                      {data.actions?.map((a: string, i: number) => (
                        <li key={i} className="text-xs text-zinc-400">
                          &bull; {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ),
            )}
          </div>
        </div>
      )}

      {/* Hook Formulas */}
      {result.hookFormulas && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Hook Formulas for Your Niche
          </h3>
          <div className="space-y-3">
            {result.hookFormulas.map((h: any, i: number) => (
              <div
                key={i}
                className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <p className="font-mono text-sm text-white">{h.template}</p>
                <p className="mt-2 text-xs italic text-amber-400/80">
                  Example: &ldquo;{h.example}&rdquo;
                </p>
                <p className="mt-1 text-xs text-zinc-500">{h.whyItWorks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posting Schedule */}
      {result.postingSchedule && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h3 className="mb-2 text-sm font-semibold text-zinc-300">
            Posting Schedule
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
              <p className="text-xs text-zinc-500">Frequency</p>
              <p className="text-sm text-white">
                {result.postingSchedule.frequency}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
              <p className="text-xs text-zinc-500">Best Times</p>
              <p className="text-sm text-white">
                {result.postingSchedule.bestTimes}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-800/40 px-3 py-2">
              <p className="text-xs text-zinc-500">Platform Priority</p>
              <p className="text-sm text-white">
                {result.postingSchedule.platformPriority?.join(" → ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monetization Path */}
      {result.monetizationPath && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Monetization Milestones
          </h3>
          <div className="space-y-2">
            {result.monetizationPath.map((m: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    {m.milestone}
                  </p>
                  <p className="text-xs text-zinc-400">{m.revenueStream}</p>
                </div>
                <span className="text-sm font-medium text-emerald-400">
                  {m.estimatedRevenue}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warningsAndPitfalls && (
        <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-5">
          <h3 className="mb-2 text-sm font-semibold text-red-400">
            Watch Out For
          </h3>
          <ul className="space-y-1">
            {result.warningsAndPitfalls.map((w: string, i: number) => (
              <li key={i} className="text-xs text-zinc-300">
                &bull; {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
