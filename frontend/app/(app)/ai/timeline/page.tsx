import { redirect } from "next/navigation";

/** AI Timeline is disabled — send visitors to AI Chat. */
export default function AiTimelinePage() {
  redirect("/ai/chat");
}
