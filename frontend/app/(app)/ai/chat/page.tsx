import type { Metadata } from "next";
import { AiChatView } from "@/components/ai";

export const metadata: Metadata = {
  title: "AI Health Chat",
};

export default function AiChatPage() {
  return <AiChatView />;
}
