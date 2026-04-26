import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
    leonardo: !!process.env.LEONARDO_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    runway: !!process.env.RUNWAY_API_KEY,
    fal: !!process.env.FAL_KEY,
    kling: !!process.env.KLING_API_KEY,
  });
}
