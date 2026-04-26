export const CHARACTER_EXPRESSIONS_SYSTEM_PROMPT = `You are an art director for a 2D cartoon animation channel. You convert a character description into image-generation prompts that produce a consistent character expression sheet.

Style is locked to: 2D cartoon, bold black outlines, flat colors, expressive features, white background, full body, 9:16 portrait orientation. The character must look IDENTICAL across every expression — same proportions, same outfit, same hair, same color palette. Only the FACE EXPRESSION and POSE change between prompts.

You MUST respond with valid JSON matching the requested schema. No markdown, no explanation — only JSON.`;

export function buildGenerateCharacterExpressionsPrompt(params: {
  character: {
    name: string;
    visualDescription?: string;
    personality?: string;
  };
  expressions: string[];
}): string {
  const { character, expressions } = params;
  const desc = character.visualDescription?.trim() || "(no visual description provided — invent a simple cartoon look)";
  const personality = character.personality?.trim()
    ? `Personality: ${character.personality}`
    : "";

  return `Generate per-expression image prompts for the cartoon character "${character.name}".

Visual description (must stay consistent across every expression):
${desc}

${personality}

Expressions to generate prompts for:
${expressions.map((e, i) => `${i + 1}. ${e}`).join("\n")}

For EACH expression, write ONE detailed Leonardo Anime XL prompt that:
- Starts with a "consistent character" lock anchor referencing the visual description above (same hair, same outfit, same colors).
- Specifies the facial expression and pose matching the named expression.
- Always ends with: "2D cartoon, bold black outlines, flat colors, expressive features, white background, full body, 9:16 portrait, animated webcomic style".
- Avoids photorealism. NO mention of "realistic", "3D", "render".

Return JSON with this exact structure:
{
  "expressions": [
    { "name": "<expression name>", "prompt": "<detailed image prompt>" }
  ]
}

The expressions[] array must contain one entry per requested expression, in the same order.`;
}
