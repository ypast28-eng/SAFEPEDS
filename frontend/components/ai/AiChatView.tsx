"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brain, Loader2, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge } from "@/components/ui";
import { Textarea } from "@/components/ui/Textarea";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiSourceList } from "./AiSourceList";
import { AiUnavailableNotice, assertAiAvailable } from "./AiUnavailableNotice";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { sendChatMessage, fetchChatHistory } from "@/services/ai";
import { profileToAiContext, reportToAiContext } from "@/lib/ai/transform";
import { AI_SUGGESTED_QUESTIONS } from "@/types/ai";
import type { ChatHistoryMessage } from "@/types/ai";
import { cn } from "@/utils/cn";

interface ChatBubble {
  role: "user" | "assistant";
  content: string;
  sources?: ChatHistoryMessage["sources"];
}

export function AiChatView() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await fetchChatHistory(session?.access_token, 30);
        setMessages(
          history.map((m) => ({
            role: m.role,
            content: m.content,
            sources: m.sources,
          }))
        );
      } catch {
        // History optional when backend/Supabase not configured
      }
    }
    if (session) loadHistory();
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setInput("");
      setError(null);
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setIsLoading(true);

      try {
        assertAiAvailable();
        const { data: stats } = await fetchReportsWithStats();
        const latestReport = stats.latestReport;

        const response = await sendChatMessage(
          {
            message: trimmed,
            context_type: "general",
            profile: profileToAiContext(profile),
            report: latestReport ? reportToAiContext(latestReport) : null,
            bloodwork_trends: [stats.latestReport, ...stats.previousReports]
              .filter((r): r is NonNullable<typeof stats.latestReport> => r != null)
              .flatMap((r) =>
                r.bloodwork_results.map((br) => ({
                  marker_name: br.marker_name,
                  collection_date: r.collection_date,
                  result_value: Number(br.result_value),
                  unit: br.unit,
                  status: br.status,
                }))
              ),
          },
          session?.access_token
        );

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.reply, sources: response.sources },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chat failed");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, session, profile]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI Health Chat"
        description="Ask educational questions about your bloodwork, cycles, and risk scores."
        badge="Educational Only"
        badgeVariant="warning"
      />

      <AiUnavailableNotice />

      <Card variant="elevated" padding="none" className="flex-1 flex flex-col min-h-0 mb-4">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-10 w-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted mb-4">Ask an educational question about your health data.</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {AI_SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted hover:text-foreground hover:border-primary/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-3 text-sm",
                  msg.role === "user"
                    ? "bg-primary/20 text-foreground"
                    : "bg-surface border border-border/40 text-muted"
                )}
              >
                {msg.role === "assistant" && (
                  <Badge variant="warning" size="sm" className="mb-2">AI Assistant</Badge>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/30">
                    <AiSourceList articles={msg.sources} title="References" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/50 p-4 space-y-2">
          {error && <p className="text-xs text-accent" role="alert">{error}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask an educational question…"
              className="min-h-[44px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="shrink-0 self-end">
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <AiDisclaimer />
        </div>
      </Card>
    </div>
  );
}
