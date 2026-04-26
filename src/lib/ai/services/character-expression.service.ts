import { generateWithClaude } from "../providers";
import {
  CHARACTER_EXPRESSIONS_SYSTEM_PROMPT,
  buildGenerateCharacterExpressionsPrompt,
} from "../prompts/character-expressions.prompt";

export interface ExpressionPromptPair {
  name: string;
  prompt: string;
}

interface ExpressionPromptsResponse {
  expressions: ExpressionPromptPair[];
}

export async function generateExpressionPrompts(params: {
  character: {
    name: string;
    visualDescription?: string;
    personality?: string;
  };
  expressions: string[];
}): Promise<ExpressionPromptPair[]> {
  const response = await generateWithClaude<ExpressionPromptsResponse>(
    CHARACTER_EXPRESSIONS_SYSTEM_PROMPT,
    buildGenerateCharacterExpressionsPrompt(params),
  );
  return response.expressions ?? [];
}
