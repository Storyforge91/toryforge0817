import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | StoryForge AI",
  description:
    "How StoryForge AI collects, stores, and uses your information.",
};

const LAST_UPDATED = "April 26, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black px-6 py-16 font-sans text-zinc-300">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-white"
        >
          &larr; Back to StoryForge AI
        </Link>

        <h1 className="mt-6 text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-sm leading-relaxed">
          <Section title="1. Overview">
            <p>
              StoryForge AI (&ldquo;StoryForge&rdquo;, &ldquo;we&rdquo;,
              &ldquo;our&rdquo;) is an AI-assisted content creation tool that
              helps you generate, schedule, and publish short-form animated
              videos to platforms including TikTok, Instagram, and YouTube
              Shorts.
            </p>
            <p>
              This Privacy Policy explains what information we collect, how we
              use it, and the choices you have. By using StoryForge, you agree
              to the practices described here.
            </p>
          </Section>

          <Section title="2. Information we collect">
            <h3 className="text-base font-semibold text-white">
              2.1 Information you provide
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Content you create with StoryForge (storylines, scripts,
                generated images and videos, scheduled posts).
              </li>
              <li>
                Configuration values you enter on the Settings page (API keys
                for third-party services, default platform preferences).
              </li>
            </ul>

            <h3 className="mt-4 text-base font-semibold text-white">
              2.2 Information collected when you connect a social account
            </h3>
            <p>
              When you click &ldquo;Connect TikTok&rdquo; (or another supported
              platform) and approve the OAuth prompt, the platform sends us:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>An access token</strong> that lets StoryForge act on
                your behalf within the scopes you approved (e.g., reading your
                basic profile, uploading videos to your drafts, publishing
                videos).
              </li>
              <li>
                <strong>A refresh token</strong> used to renew the access token
                without re-prompting you.
              </li>
              <li>
                <strong>Your basic profile</strong> from that platform (open
                ID, display name, username, avatar URL) so StoryForge can
                show you which account is connected.
              </li>
            </ul>

            <h3 className="mt-4 text-base font-semibold text-white">
              2.3 Information collected automatically
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Standard server logs (IP address, request URL, timestamp,
                user-agent) when you interact with our hosted endpoints.
                These are kept short-term for security and debugging.
              </li>
            </ul>
          </Section>

          <Section title="3. How we use your information">
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>To run the product</strong>: generating storylines,
                images, videos, and captions; scheduling and publishing posts
                you have explicitly created.
              </li>
              <li>
                <strong>To act on your behalf only when you ask us to</strong>.
                We do not post content unless you have created it in
                StoryForge and either clicked &ldquo;Post Now&rdquo; or
                scheduled it on the Calendar page.
              </li>
              <li>
                <strong>To keep you signed in</strong> via your social account,
                using the access and refresh tokens described above.
              </li>
              <li>
                <strong>To debug, maintain, and secure</strong> the service.
              </li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> use your content or your social tokens
              to train AI models, sell to third parties, or run targeted
              advertising.
            </p>
          </Section>

          <Section title="4. How your information is stored">
            <p>
              Most StoryForge data lives <strong>locally in your browser</strong>{" "}
              (via <code className="rounded bg-zinc-900 px-1 text-zinc-200">localStorage</code>{" "}
              and the Zustand persistence layer). This includes generated
              storylines, skits, characters, calendar items, and OAuth tokens
              for connected social accounts. Clearing your browser data
              clears this state.
            </p>
            <p>
              When you call StoryForge&apos;s server-side API routes (e.g.,
              image, voice, or video generation), the inputs you send are
              passed through to the underlying provider (OpenAI, Anthropic,
              Leonardo, ElevenLabs, fal.ai, Kling) under your own API keys.
              StoryForge does not retain those inputs server-side beyond the
              duration of the request, except for short-lived logs as
              described in Section 2.3.
            </p>
          </Section>

          <Section title="5. Sharing with third parties">
            <p>
              StoryForge integrates with a number of third-party APIs to
              generate and publish content. When you use a feature that
              relies on one of these services, the relevant inputs are sent
              to that provider:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Anthropic / OpenAI</strong>: your prompts (storyline
                concepts, scripts, captions).
              </li>
              <li>
                <strong>Leonardo</strong>: your image prompts and any
                reference images you provide.
              </li>
              <li>
                <strong>ElevenLabs</strong>: the narration text we ask it to
                voice.
              </li>
              <li>
                <strong>fal.ai (Wan2.1, Minimax) / Kling</strong>: the still
                image and motion description we ask them to animate.
              </li>
              <li>
                <strong>TikTok</strong>: the video URL we ask TikTok to fetch
                and publish, plus any title/caption metadata you have set.
              </li>
            </ul>
            <p className="mt-3">
              Each of those providers has its own privacy policy that
              governs how it handles requests sent to it. You should review
              their policies before relying on them.
            </p>
          </Section>

          <Section title="6. Posting on your behalf">
            <p>
              When StoryForge publishes a post to a connected social account
              (e.g., TikTok), we use the OAuth access token you granted to
              call that platform&apos;s Content Posting API. We send only the
              video URL and metadata associated with the specific post you
              created or scheduled in StoryForge. We do not post anything
              you have not explicitly authorized.
            </p>
            <p>
              By default, StoryForge posts videos to your platform&apos;s{" "}
              <strong>Drafts</strong> rather than publishing them directly,
              giving you a final chance to review before they go live. You
              can change this setting per item.
            </p>
          </Section>

          <Section title="7. Your rights and choices">
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Disconnect a social account</strong> at any time from
                the Settings page. This deletes the OAuth tokens from your
                local browser storage.
              </li>
              <li>
                <strong>Revoke access</strong> directly with the platform
                (e.g., in TikTok&apos;s app settings under
                &ldquo;Manage apps&rdquo;). Revoking there immediately
                invalidates StoryForge&apos;s access token.
              </li>
              <li>
                <strong>Delete generated content</strong> by removing items
                from the Skits, Episodes, or Calendar pages, or by clearing
                your browser&apos;s local storage.
              </li>
              <li>
                <strong>Request information</strong> about any data
                StoryForge holds about you by emailing the address in
                Section 11.
              </li>
            </ul>
          </Section>

          <Section title="8. Children's privacy">
            <p>
              StoryForge is not directed to children under 13 (or under the
              age required by your local law). We do not knowingly collect
              information from such users. If you believe a child has used
              StoryForge, contact us and we will take steps to remove the
              data.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We use industry-standard transport encryption (HTTPS) for all
              traffic between your browser and our servers and between our
              servers and third-party providers. OAuth tokens stored in
              your browser&apos;s localStorage are protected by the
              same-origin restrictions of your browser; we recommend not
              installing untrusted browser extensions on the same profile.
            </p>
            <p>
              No system is perfectly secure. If you believe your account
              has been compromised, disconnect the social account and
              reconnect it to issue fresh tokens.
            </p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>
              We may update this Privacy Policy from time to time. The
              &ldquo;Last updated&rdquo; date at the top reflects the most
              recent revision. Material changes will be highlighted on this
              page or communicated in-app.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              Questions or requests? Email{" "}
              <a
                href="mailto:nofaceneeded91@gmail.com"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                nofaceneeded91@gmail.com
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          <Link href="/terms" className="text-cyan-400 underline">
            Terms of Service
          </Link>{" "}
          &bull;{" "}
          <Link href="/" className="text-cyan-400 underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-zinc-300">{children}</div>
    </section>
  );
}
