"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Brain, Loader2, Send, AlertCircle } from "lucide-react";
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
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
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
    setIsHistoryLoading(true);
    fetchChatHistoryViaApi(30)
      .then((history) => {
        setMessages(
          history.map((m) => ({
            role: m.role,
            content: m.content,
            sources: m.sources,
          }))
        );
      })
      .finally(() => setIsHistoryLoading(false));
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

      try {
        const outcome = await sendChatMessageViaApi({ message: trimmed });

        if (outcome.setupRequired) {
          setSetupMessage(outcome.setupMessage);
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        if (outcome.billingError) {
          setBillingMessage(outcome.billingMessage);
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        if (outcome.error || !outcome.data) {
          setError(outcome.error ?? "Could not get a response. Please try again.");
          setMessages((prev) => prev.slice(0, -1));
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: outcome.data.reply,
            sources: outcome.data.sources,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not get a response. Please try again.");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, aiConfigured]
  );

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
        <div
          role="alert"
          className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent flex items-start gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="whitespace-pre-line">{billingMessage}</p>
        </div>
      )}

      <Card variant="elevated" padding="none" className="flex-1 flex flex-col min-h-0 mb-4">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isHistoryLoading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading chat history…
            </div>
          )}

          {!isHistoryLoading && messages.length === 0 && (
            <div className="text-center py-12">
              <Brain className="h-10 w-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted mb-4">
                Ask an educational question about your health data. Context from your latest bloodwork,
                saved cycles, and risk scores is included automatically.
              </p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {AI_SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    disabled={aiConfigured === false || isLoading}
                    className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
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
            <div className="flex items-center gap-2 text-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating educational response from your health data…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/50 p-4 space-y-2">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent flex items-start gap-2"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>{error}</p>
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
              disabled={aiConfigured === false || isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || aiConfigured === false}
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
