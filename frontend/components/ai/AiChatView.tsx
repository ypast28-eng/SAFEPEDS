"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Brain, Loader2, Send } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge } from "@/components/ui";
import { Textarea } from "@/components/ui/Textarea";
import { AiDisclaimer } from "./AiDisclaimer";
import { AiSourceList } from "./AiSourceList";
import { fetchAiReportConfig } from "@/services/ai-cycle-report";
import { fetchChatHistoryViaApi, sendChatMessageViaApi } from "@/services/ai-chat";
import { AI_SUGGESTED_QUESTIONS } from "@/types/ai";
import type { ChatHistoryMessage } from "@/types/ai";
import { cn } from "@/utils/cn";

interface ChatBubble {
  role: "user" | "assistant";
  content: string;
  sources?: ChatHistoryMessage["sources"];
}

export function AiChatView() {
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAiReportConfig().then(({ configured, setupInstructions }) => {
      setAiConfigured(configured);
      setSetupMessage(configured ? null : setupInstructions);
    });
  }, []);

  useEffect(() => {
    async function loadHistory() {
      setIsLoadingHistory(true);
      const outcome = await fetchChatHistoryViaApi(30);
      if (outcome.data) {
        setMessages(
          outcome.data.map((m) => ({
            role: m.role,
            content: m.content,
            sources: m.sources,
          }))
        );
      }
      setIsLoadingHistory(false);
    }
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading || aiConfigured === false) return;

      setInput("");
      setError(null);
      setBillingMessage(null);
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setIsLoading(true);

      const outcome = await sendChatMessageViaApi({ message: trimmed, context_type: "general" });

      if (outcome.setupRequired) {
        setSetupMessage(outcome.setupMessage);
        setAiConfigured(false);
        setMessages((prev) => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      if (outcome.billingError) {
        setBillingMessage(outcome.billingMessage);
        setMessages((prev) => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      if (outcome.error || !outcome.data) {
        setError(outcome.error ?? "Chat failed. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
        setIsLoading(false);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: outcome.data!.reply, sources: outcome.data!.sources },
      ]);
      setIsLoading(false);
    },
    [isLoading, aiConfigured]
  );

  const chatDisabled = aiConfigured === false || isLoading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI Health Chat"
        description="Ask educational questions about your bloodwork, cycles, and risk scores."
        badge="Educational Only"
        badgeVariant="warning"
      />

      {aiConfigured === false && setupMessage && (
        <Card variant="bordered" padding="md" className="mb-4 border-secondary/30 bg-secondary/5">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-secondary shrink-0" />
            <p className="text-sm text-muted whitespace-pre-line">{setupMessage}</p>
          </div>
        </Card>
      )}

      {billingMessage && (
        <Card variant="bordered" padding="md" className="mb-4 border-accent/30 bg-accent/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm text-muted whitespace-pre-line">{billingMessage}</p>
          </div>
        </Card>
      )}

      <Card variant="elevated" padding="none" className="flex-1 flex flex-col min-h-0 mb-4">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingHistory && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading conversation…
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-10 w-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted mb-4">
                Ask an educational question about your health data.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {AI_SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    disabled={chatDisabled}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
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
                  <Badge variant="warning" size="sm" className="mb-2">
                    AI Assistant
                  </Badge>
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
            <div className="flex items-center gap-2 text-muted text-sm" role="status" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/50 p-4 space-y-2">
          {error && (
            <div
              className="flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-muted">{error}</p>
            </div>
          )}
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
              placeholder={
                aiConfigured === false
                  ? "Configure OPENAI_API_KEY to enable chat…"
                  : "Ask an educational question…"
              }
              className="min-h-[44px] max-h-32"
              disabled={chatDisabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || chatDisabled}
              className="shrink-0 self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <AiDisclaimer />
        </div>
      </Card>
    </div>
  );
}
