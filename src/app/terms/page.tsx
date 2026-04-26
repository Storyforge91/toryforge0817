import Link from "next/link";

export const metadata = {
  title: "Terms of Service | StoryForge AI",
  description:
    "The terms governing your use of StoryForge AI.",
};

const LAST_UPDATED = "April 26, 2026";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black px-6 py-16 font-sans text-zinc-300">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-xs text-zinc-500 hover:text-white">
          &larr; Back to StoryForge AI
        </Link>

        <h1 className="mt-6 text-4xl font-bold text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="prose prose-invert mt-10 max-w-none space-y-8 text-sm leading-relaxed">
          <Section title="1. Acceptance of terms">
            <p>
              By accessing or using StoryForge AI (&ldquo;StoryForge&rdquo;,
              &ldquo;the service&rdquo;), you agree to be bound by these
              Terms of Service (&ldquo;Terms&rdquo;) and our{" "}
              <Link
                href="/privacy"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Privacy Policy
              </Link>
              . If you do not agree, do not use the service.
            </p>
          </Section>

          <Section title="2. Description of service">
            <p>
              StoryForge is an AI-assisted creation tool that helps you
              generate short-form animated content (storylines, characters,
              scripts, scene images, animated video clips, narration,
              captions) and schedule that content for publication to
              third-party platforms such as TikTok, Instagram, and YouTube
              Shorts.
            </p>
            <p>
              The service is provided &ldquo;as is&rdquo; and may change,
              add, or remove features at any time.
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>
              You must be at least 13 years old (or the minimum age in
              your jurisdiction) to use StoryForge. If you are using the
              service on behalf of a business or organization, you
              represent that you have authority to bind that entity to
              these Terms.
            </p>
          </Section>

          <Section title="4. Your account and connected platforms">
            <p>
              To use the auto-posting features, you may choose to connect
              third-party accounts (e.g., TikTok) via OAuth. You are
              responsible for:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Keeping the credentials for your StoryForge install (e.g.,
                your local environment, your browser session) secure.
              </li>
              <li>
                Ensuring you have the right to publish content to any
                connected accounts. Do not connect accounts you do not
                own or are not authorized to operate.
              </li>
              <li>
                Complying with the terms of every platform you connect.
                StoryForge does not override their rules; in particular,
                TikTok&apos;s Community Guidelines, Music Usage Confirmation,
                Branded Content policy, and AI Content disclosure rules
                apply in full.
              </li>
            </ul>
          </Section>

          <Section title="5. Acceptable use">
            <p>You agree NOT to use StoryForge to:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Generate or publish content that violates the rules of any
                connected platform, including content that is hateful,
                harassing, sexually explicit involving minors, fraudulent,
                or otherwise prohibited.
              </li>
              <li>
                Impersonate another person or organization, or post AI-
                generated likenesses of real public or private individuals
                without their consent.
              </li>
              <li>
                Generate content that infringes copyright, trademark, or
                other intellectual property rights.
              </li>
              <li>
                Bypass platform rate limits, scrape competitors, or
                automate fake engagement (likes, follows, comments).
              </li>
              <li>
                Reverse engineer the service, attack our infrastructure,
                or attempt to access another user&apos;s data.
              </li>
            </ul>
            <p className="mt-3">
              You are solely responsible for the content you generate and
              the posts you publish through StoryForge.
            </p>
          </Section>

          <Section title="6. AI-generated content disclosure">
            <p>
              Content produced by StoryForge is AI-generated. Many
              platforms (including TikTok) require you to disclose
              AI-generated or AI-modified content. You are responsible
              for adding the appropriate disclosure (e.g., TikTok&apos;s
              &ldquo;AI-generated content&rdquo; toggle, or an in-caption
              tag) when publishing.
            </p>
          </Section>

          <Section title="7. Third-party services">
            <p>
              StoryForge depends on third-party providers including (but
              not limited to) Anthropic, OpenAI, Leonardo, ElevenLabs,
              fal.ai, Kling, and the social platforms you connect. Their
              terms of service and pricing apply to your use of their
              APIs through StoryForge. We are not responsible for outages,
              billing disputes, or policy changes on those platforms.
            </p>
          </Section>

          <Section title="8. Intellectual property">
            <p>
              <strong>Your content.</strong> You retain all rights to the
              content you create with StoryForge, subject to the rights
              you grant the third-party providers under their own terms.
            </p>
            <p>
              <strong>Our service.</strong> The StoryForge software, UI,
              and brand are protected by copyright and other laws. We
              grant you a limited, non-exclusive, revocable license to
              use the service for its intended purpose.
            </p>
          </Section>

          <Section title="9. Disclaimers and limitation of liability">
            <p>
              StoryForge is provided &ldquo;as is&rdquo; without
              warranties of any kind, whether express or implied. We do
              not warrant that the service will be uninterrupted, error-
              free, or that AI-generated content will be accurate, safe,
              suitable for your purpose, or free from infringement.
            </p>
            <p>
              To the maximum extent permitted by law, neither StoryForge
              nor its affiliates will be liable for any indirect,
              incidental, special, consequential, or punitive damages,
              or any loss of profits, revenue, data, or goodwill arising
              out of or related to your use of the service.
            </p>
          </Section>

          <Section title="10. Indemnification">
            <p>
              You agree to indemnify and hold StoryForge and its
              affiliates harmless from any claim, loss, or damage,
              including attorneys&apos; fees, arising out of: (a) your
              use of the service, (b) your content, (c) your violation
              of these Terms, or (d) your violation of a third party&apos;s
              rights or applicable law.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              You may stop using StoryForge at any time. We may suspend
              or terminate your access if we reasonably believe you have
              violated these Terms or applicable law, or to protect the
              service. Sections that by their nature should survive
              termination (e.g., 8, 9, 10) will continue to apply.
            </p>
          </Section>

          <Section title="12. Changes to these terms">
            <p>
              We may update these Terms from time to time. The &ldquo;Last
              updated&rdquo; date at the top reflects the most recent
              revision. Continued use of the service after changes are
              posted constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              Questions about these Terms? Email{" "}
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
          <Link href="/privacy" className="text-cyan-400 underline">
            Privacy Policy
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
