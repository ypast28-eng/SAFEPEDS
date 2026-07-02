const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?(doctor|physician|medical)/i,
  /prescribe\s+/i,
  /diagnose\s+/i,
  /system\s+prompt/i,
  /<\s*\/?\s*system\s*>/i,
  /jailbreak/i,
  /override\s+(safety|rules)/i,
];

const BLOCKED_TOPICS = [
  /\b(is\s+my\s+cycle\s+safe)\b/i,
  /\b(should\s+i\s+(start|stop|take))\b/i,
  /\b(what\s+dose\s+should\s+i)\b/i,
  /\b(prescribe\s+me)\b/i,
];

export function sanitizeUserMessage(message: string): string {
  const cleaned = message.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");
  return cleaned.replace(/\s+/g, " ").trim().slice(0, 2000);
}

export function validateChatMessage(message: string): { sanitized: string; blockReason: string | null } {
  const sanitized = sanitizeUserMessage(message);
  if (!sanitized) {
    return { sanitized: "", blockReason: "Empty message" };
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      return { sanitized, blockReason: "Blocked unsafe instruction pattern" };
    }
  }

  for (const pattern of BLOCKED_TOPICS) {
    if (pattern.test(sanitized)) {
      return { sanitized, blockReason: "Request asks for individualized medical advice" };
    }
  }

  return { sanitized, blockReason: null };
}
