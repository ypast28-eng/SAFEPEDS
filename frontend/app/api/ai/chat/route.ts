import { NextResponse } from "next/server";
import { loadChatUserContext, mergeChatRequest } from "@/lib/ai/chat-context";
import { generateChatReply, type ChatGenerateError } from "@/lib/ai/chat-generate";
import {
  isOpenAiConfigured,
  OPENAI_AI_SETUP_INSTRUCTIONS,
} from "@/lib/ai/openai-config";
import { validateChatMessage } from "@/lib/ai/chat-security";
import { createClient } from "@/lib/supabase/server";
import type { AiChatRequest, AiSourceReference, ChatHistoryMessage } from "@/types/ai";

export const runtime = "nodejs";

async function saveChatMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: "user" | "assistant",
  content: string,
  sources: AiSourceReference[] = []
): Promise<void> {
  await supabase.from("ai_chat_messages").insert({
    user_id: userId,
    role,
    content,
    sources,
  });
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("role, content, sources, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const history: ChatHistoryMessage[] = [...(data ?? [])]
      .reverse()
      .map((row) => ({
        role: row.role as "user" | "assistant",
        content: row.content,
        sources: (row.sources as AiSourceReference[] | null) ?? undefined,
        created_at: row.created_at,
      }));

    return NextResponse.json(history);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load chat history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const body = (await request.json()) as Partial<AiChatRequest>;
    const rawMessage = body.message?.trim() ?? "";

    if (!rawMessage) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const { sanitized, blockReason } = validateChatMessage(rawMessage);
    const serverContext = await loadChatUserContext(supabase, user.id);
    const context = mergeChatRequest(body, serverContext);

    const result = await generateChatReply(sanitized, context, { blockReason });

    await saveChatMessage(supabase, user.id, "user", sanitized);
    await saveChatMessage(supabase, user.id, "assistant", result.reply, result.sources);

    return NextResponse.json(result);
  } catch (err) {
    const classified = err as ChatGenerateError;
    if (classified?.code && classified?.message && classified?.status) {
      return NextResponse.json(
        { code: classified.code, message: classified.message },
        { status: classified.status }
      );
    }

    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
