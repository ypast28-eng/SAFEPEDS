import { NextResponse } from "next/server";
import {
  isOpenAiConfigured,
  OPENAI_AI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/openai-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    configured: isOpenAiConfigured(),
    setupInstructions: isOpenAiConfigured() ? null : OPENAI_AI_SETUP_INSTRUCTIONS,
  });
}
