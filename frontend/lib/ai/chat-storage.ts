/** Client-side AI chat storage keys (none used by default; cleared on erase). */
const CLIENT_CHAT_STORAGE_KEYS = [
  "ai-chat-history",
  "ai_chat_history",
  "safepeds-ai-chat",
  "safepeds:ai-chat",
] as const;

export function clearClientChatStorage(): void {
  if (typeof window === "undefined") return;

  for (const key of CLIENT_CHAT_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
