import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.");
    }
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function generateWithClaude<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<T> {
  const anthropic = getAnthropicClient();

  const message = await anthropic.messages.create({
    // Latest Sonnet — same price as Sonnet 4, slightly better quality.
    model: "claude-sonnet-4-6",
    // Hero-shot JSON outputs are ~500-800 tokens; cap conservatively to
    // prevent runaway billing if the model ever rambles.
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Strip markdown code fences if present
  let text = textBlock.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  try {
    return JSON.parse(text) as T;
  } catch (parseErr) {
    // Log the FULL Claude response so we can debug malformed output
    // (truncating to 300 chars often hid the actual problem token).
    console.error(
      "[Claude] Failed to parse response as JSON. Full response:",
      text,
    );
    const preview = text.length > 1000 ? text.slice(0, 1000) + "…" : text;
    const reason =
      parseErr instanceof Error ? parseErr.message : String(parseErr);
    throw new Error(
      `Failed to parse Claude response as JSON (${reason}). Response preview: ${preview}`,
    );
  }
}
