import type { Metadata } from "next";
import { MyCyclesView } from "@/components/cycles";

export const metadata: Metadata = {
  title: "My Cycles",
};

export default function MyCyclesPage() {
  return <MyCyclesView />;
}
