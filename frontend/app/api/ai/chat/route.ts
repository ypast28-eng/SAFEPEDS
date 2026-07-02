import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateChatWithAi } from "@/lib/ai/chat-generate";
import { validateChatMessage } from "@/lib/ai/chat-security";
import { loadEducationContent } from "@/lib/ai/load-education-content";
import {
  buildChatContext,
  saveChatMessage,
} from "@/lib/ai/load-user-chat-context";
import {
  AI_DISCLAIMER,
  isOpenAiConfigured,
  OPENAI_AI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/openai-config";
import type { AiChatResponse } from "@/types/ai";

export const runtime = "nodejs";

const BLOCKED_REPLY =
  "I can only provide general educational information about your logged data. " +
  "I cannot provide individualized medical advice, prescribe compounds, diagnose conditions, " +
  "or assess whether a cycle is safe. Please ask an educational question about your markers, trends, or risk scores.";

export async function POST(request: Request) {
  if (!isOpenAiConfigured()) {
    return NextResponse.json(
      {
        code: "setup_required",
        message: OPENAI_AI_SETUP_INSTRUCTIONS,
      },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      message?: string;
      cycleId?: string | null;
      context_type?: "bloodwork" | "cycle" | "risk" | "general";
    };

    const rawMessage = body.message?.trim() ?? "";
    if (!rawMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const { sanitized, blockReason } = validateChatMessage(rawMessage);
    if (blockReason) {
      const blocked: AiChatResponse = {
        reply: BLOCKED_REPLY,
        sources: [],
        disclaimer: AI_DISCLAIMER,
      };
      return NextResponse.json(blocked);
    }

    const context = await buildChatContext(supabase, user.id, body.cycleId);
    context.context_type = body.context_type ?? context.context_type;

    const markerNames =
      context.report?.markers?.map((m) => m.marker_name).filter(Boolean).slice(0, 6) ?? [];
    const education = await loadEducationContent(supabase, sanitized, markerNames);

    const outcome = await generateChatWithAi(sanitized, context, education);

    if (!outcome.ok) {
      return NextResponse.json(
        { code: outcome.code, message: outcome.message },
        { status: outcome.status }
      );
    }

    await saveChatMessage(supabase, user.id, "user", sanitized, []);
    await saveChatMessage(
      supabase,
      user.id,
      "assistant",
      outcome.result.reply,
      outcome.result.sources
    );

    return NextResponse.json(outcome.result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate chat response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
