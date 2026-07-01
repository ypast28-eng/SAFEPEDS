"""In-memory per-user rate limiting for AI endpoints."""

from __future__ import annotations

import time
from collections import defaultdict
from dataclasses import dataclass, field


@dataclass
class RateLimitConfig:
    max_requests: int = 20
    window_seconds: int = 3600  # 1 hour


@dataclass
class _Window:
    count: int = 0
    reset_at: float = field(default_factory=time.time)


class RateLimiter:
    """Simple sliding-window rate limiter keyed by user_id."""

    def __init__(self, config: RateLimitConfig | None = None) -> None:
        self.config = config or RateLimitConfig()
        self._windows: dict[str, _Window] = defaultdict(_Window)

    def check(self, user_id: str) -> tuple[bool, int]:
        """
        Check if request is allowed.
        Returns (allowed, seconds_until_reset).
        """
        now = time.time()
        window = self._windows[user_id]

        if now >= window.reset_at:
            window.count = 0
            window.reset_at = now + self.config.window_seconds

        if window.count >= self.config.max_requests:
            return False, int(window.reset_at - now)

        window.count += 1
        return True, 0

    def reset(self, user_id: str) -> None:
        if user_id in self._windows:
            del self._windows[user_id]


# Shared instance for AI endpoints
ai_rate_limiter = RateLimiter(RateLimitConfig(max_requests=30, window_seconds=3600))
