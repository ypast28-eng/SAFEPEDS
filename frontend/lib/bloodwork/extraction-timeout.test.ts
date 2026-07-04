import { describe, expect, it } from "vitest";
import { ExtractionTimeoutError, withTimeout } from "@/lib/bloodwork/extraction-timeout";

describe("extraction-timeout", () => {
  it("resolves when the operation completes in time", async () => {
    await expect(
      withTimeout(async () => "ok", 1000, "fast operation")
    ).resolves.toBe("ok");
  });

  it("rejects when the operation exceeds the timeout", async () => {
    await expect(
      withTimeout(
        () => new Promise<string>((resolve) => setTimeout(() => resolve("late"), 50)),
        10,
        "slow operation"
      )
    ).rejects.toBeInstanceOf(ExtractionTimeoutError);
  });
});
