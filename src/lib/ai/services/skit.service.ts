import { generateWithClaude } from "../providers";
import {
  COMEDY_SYSTEM_PROMPT,
  buildGenerateSkitPrompt,
  buildGenerateBatchSkitsPrompt,
  type ComedyCharRef,
} from "../prompts/skit.prompt";
import type {
  SkitCategory,
  AudioStyle,
  SkitBeat,
  DialogueLine,
} from "@/types";

export interface GeneratedSkit {
  title: string;
  scenario: string;
  audioStyle: AudioStyle;
  characterIds: string[];
  beats: SkitBeat[];
  dialogue: DialogueLine[];
}

interface BatchSkitsResponse {
  skits: GeneratedSkit[];
}

export async function generateSkitConcept(params: {
  category: SkitCategory;
  scenario?: string;
  characters: ComedyCharRef[];
  audioStyle: AudioStyle;
  comedyStyle?: string;
}): Promise<GeneratedSkit> {
  return generateWithClaude<GeneratedSkit>(
    COMEDY_SYSTEM_PROMPT,
    buildGenerateSkitPrompt(params),
  );
}

export async function generateBatchSkitConcepts(params: {
  count: number;
  category: SkitCategory;
  characters: ComedyCharRef[];
  comedyStyle?: string;
}): Promise<GeneratedSkit[]> {
  const response = await generateWithClaude<BatchSkitsResponse>(
    COMEDY_SYSTEM_PROMPT,
    buildGenerateBatchSkitsPrompt(params),
  );
  return response.skits ?? [];
}
