"""Prompt injection protection and input sanitization."""

from __future__ import annotations

import re

INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior|above)",
    r"you\s+are\s+now\s+",
    r"act\s+as\s+(a\s+)?(doctor|physician|medical)",
    r"prescribe\s+",
    r"diagnose\s+",
    r"system\s+prompt",
    r"<\s*/?\s*system\s*>",
    r"jailbreak",
    r"override\s+(safety|rules)",
]

BLOCKED_TOPICS = [
    r"\b(is\s+my\s+cycle\s+safe)\b",
    r"\b(should\s+i\s+(start|stop|take))\b",
    r"\b(what\s+dose\s+should\s+i)\b",
    r"\b(prescribe\s+me)\b",
]


def sanitize_user_message(message: str) -> str:
    """Strip control chars and excessive whitespace."""
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", message)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:2000]


def detect_injection(message: str) -> str | None:
    """Return reason if injection attempt detected, else None."""
    lower = message.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, lower, re.IGNORECASE):
            return f"Blocked pattern: {pattern}"
    return None


def detect_blocked_medical_advice_request(message: str) -> str | None:
    """Block requests for individualized medical advice."""
    lower = message.lower()
    for pattern in BLOCKED_TOPICS:
        if re.search(pattern, lower, re.IGNORECASE):
            return "Request asks for individualized medical advice"
    return None


def validate_chat_message(message: str) -> tuple[str, str | None]:
    """
    Sanitize and validate a chat message.
    Returns (sanitized_message, block_reason).
    """
    sanitized = sanitize_user_message(message)
    if not sanitized:
        return "", "Empty message"

    injection = detect_injection(sanitized)
    if injection:
        return sanitized, injection

    blocked = detect_blocked_medical_advice_request(sanitized)
    if blocked:
        return sanitized, blocked

    return sanitized, None
