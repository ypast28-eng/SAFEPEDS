import { AI_DISCLAIMER } from "@/lib/ai/openai-config";
import type { AiChatResponse, AiSourceReference } from "@/types/ai";

type ChatContext = Record<string, unknown>;

export function generateChatReplyFallback(
  userMessage: string,
  context: ChatContext
): AiChatResponse {
  const lower = userMessage.toLowerCase();
  let reply = "";

  if (lower.includes("hdl")) {
    reply =
      "HDL (high-density lipoprotein) cholesterol is an educational lipid marker commonly tracked in performance health monitoring. Lower HDL over multiple tests may be worth discussing with your healthcare provider using your lab's reference ranges. I cannot provide individualized medical advice.";
  } else if (lower.includes("alt") || lower.includes("liver")) {
    reply =
      "ALT (alanine aminotransferase) is a liver enzyme measured in blood panels. Elevated ALT relative to your supplied reference range indicates the value is outside the range you entered — not a diagnosis. Liver enzymes are commonly monitored in educational harm-reduction contexts.";
  } else if (lower.includes("hematocrit")) {
    reply =
      "Hematocrit measures the percentage of red blood cells in blood volume. It is commonly monitored because certain compounds may influence red blood cell production. Values above your supplied reference range should be discussed with a qualified healthcare provider.";
  } else if (lower.includes("risk") || lower.includes("score")) {
    const risk = (context.risk_assessment ?? {}) as Record<string, unknown>;
    reply = `Your rule-based risk assessment shows an overall monitoring priority of ${risk.overall_level ?? "N/A"} (${risk.overall_score ?? 0}/100). These scores are calculated by transparent rules — not by AI — and do not determine whether a cycle is safe.`;
  } else if (lower.includes("blood") || lower.includes("test") || lower.includes("changed")) {
    const report = (context.report ?? {}) as Record<string, unknown>;
    const markers = (report.markers ?? []) as Array<{ status?: string | null }>;
    const oor = markers.filter((m) => m.status === "Low" || m.status === "High");
    reply = `Your most recent report '${report.report_name ?? ""}' has ${markers.length} markers, ${oor.length} outside your supplied reference range. Compare specific markers on the Trends page for historical context.`;
  } else {
    reply =
      "I can provide educational explanations about your logged bloodwork, cycle composition, and rule-based risk scores. I cannot diagnose conditions, prescribe treatments, or advise on compound use. What specific marker or topic would you like explained?";
  }

  return { reply, sources: [] as AiSourceReference[], disclaimer: AI_DISCLAIMER };
}
