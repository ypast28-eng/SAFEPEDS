import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchChatHistory } from "@/lib/ai/load-user-chat-context";

export const runtime = "nodejs";

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
    const limit = Math.min(Number(searchParams.get("limit") ?? 30), 50);

    const history = await fetchChatHistory(supabase, user.id, limit);
    return NextResponse.json(history);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load chat history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
