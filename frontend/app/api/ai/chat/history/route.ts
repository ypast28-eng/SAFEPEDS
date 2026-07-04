import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearChatHistory } from "@/lib/ai/load-user-chat-context";

export const runtime = "nodejs";

/** Chat history is session-only; always return an empty list. */
export async function GET() {
  return NextResponse.json([]);
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await clearChatHistory(supabase, user.id);
    return NextResponse.json({ success: true, cleared: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear chat history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
