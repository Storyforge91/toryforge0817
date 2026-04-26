import { NextRequest, NextResponse } from "next/server";

interface ExportPayload {
  skit: {
    title: string;
    scenario: string;
    category: string;
    audioStyle: string;
    beats: {
      order: number;
      description: string;
      expression: string;
      characterId?: string;
      duration: number;
      textOverlay?: string;
      soundEffect?: string;
      cameraAction?: string;
      videoUrl?: string;
    }[];
    dialogue: {
      characterId: string;
      text: string;
      emotion: string;
      timing: number;
    }[];
    captions?: unknown;
    voiceUrl?: string;
    voiceScript?: string;
  };
  characters: {
    id: string;
    name: string;
    visualDescription?: string;
    expressions?: { name: string; assetUrl: string }[];
  }[];
}

function buildProductionBrief(payload: ExportPayload): string {
  const { skit, characters } = payload;
  const charById = new Map(characters.map((c) => [c.id, c]));
  const totalDuration = skit.beats.reduce((sum, b) => sum + (b.duration || 0), 0);

  const lines: string[] = [];
  lines.push(`# Production Brief: ${skit.title}`);
  lines.push("");
  lines.push(`**Category:** ${skit.category.replace("_", " ")}`);
  lines.push(`**Audio style:** ${skit.audioStyle}`);
  lines.push(`**Total duration:** ${totalDuration.toFixed(1)}s`);
  lines.push(`**Beats:** ${skit.beats.length}  •  **Dialogue lines:** ${skit.dialogue.length}`);
  lines.push("");
  lines.push(`## Scenario`);
  lines.push(skit.scenario);
  lines.push("");

  if (characters.length > 0) {
    lines.push(`## Featured Characters`);
    for (const c of characters) {
      lines.push(`### ${c.name}`);
      if (c.visualDescription) lines.push(c.visualDescription);
      if (c.expressions?.length) {
        lines.push("");
        lines.push("**Expression assets:**");
        for (const e of c.expressions) {
          lines.push(`- \`${e.name}\` — ${e.assetUrl}`);
        }
      }
      lines.push("");
    }
  }

  lines.push(`## Beats Timeline`);
  for (const beat of [...skit.beats].sort((a, b) => a.order - b.order)) {
    const char = beat.characterId ? charById.get(beat.characterId) : undefined;
    lines.push(`### Beat ${beat.order} — ${beat.duration}s`);
    lines.push(`**Character:** ${char?.name ?? "(unspecified)"}  •  **Expression:** \`${beat.expression}\``);
    lines.push(beat.description);
    if (beat.textOverlay) lines.push(`- Text overlay: ${beat.textOverlay}`);
    if (beat.soundEffect) lines.push(`- Sound effect: ${beat.soundEffect}`);
    if (beat.cameraAction) lines.push(`- Camera: ${beat.cameraAction}`);
    if (beat.videoUrl) lines.push(`- Animated clip: ${beat.videoUrl}`);
    lines.push("");
  }

  if (skit.dialogue.length > 0) {
    lines.push(`## Dialogue Script`);
    for (const line of [...skit.dialogue].sort((a, b) => a.timing - b.timing)) {
      const char = charById.get(line.characterId);
      lines.push(`**[${line.timing.toFixed(1)}s] ${char?.name ?? "?"}** _(${line.emotion})_: ${line.text}`);
    }
    lines.push("");
  }

  if (skit.voiceUrl) {
    lines.push(`## Narration Audio`);
    lines.push(skit.voiceUrl);
    lines.push("");
  }

  if (skit.voiceScript) {
    lines.push(`## Full Voice Script`);
    lines.push(skit.voiceScript);
    lines.push("");
  }

  if (skit.captions) {
    lines.push(`## Platform Captions`);
    lines.push("```json");
    lines.push(JSON.stringify(skit.captions, null, 2));
    lines.push("```");
    lines.push("");
  }

  lines.push(`## Assembly Instructions (CapCut)`);
  lines.push(`1. Import all expression PNGs and beat clips into a new 9:16 1080×1920 timeline.`);
  lines.push(`2. Place each beat in order — duration on the timeline must match the beat duration above.`);
  lines.push(`3. Drop the narration audio on a separate audio track aligned to the first beat.`);
  lines.push(`4. Add text overlays per beat where specified.`);
  lines.push(`5. Use the auto-caption feature to subtitle the dialogue.`);
  lines.push(`6. Apply category-appropriate background music.`);
  lines.push(`7. Export at 1080×1920, 30fps, MP4.`);
  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ExportPayload;
    if (!body?.skit?.title) {
      return NextResponse.json(
        { error: "skit object with at least a title is required" },
        { status: 400 },
      );
    }

    const brief = buildProductionBrief(body);

    const manifest = {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      skit: body.skit,
      characters: body.characters,
      assemblyHint: {
        platform: "capcut",
        aspect: "9:16",
        targetResolution: "1080x1920",
        fps: 30,
      },
    };

    return NextResponse.json({ manifest, brief });
  } catch (error) {
    console.error("Error building production pack:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to build production pack",
      },
      { status: 500 },
    );
  }
}
