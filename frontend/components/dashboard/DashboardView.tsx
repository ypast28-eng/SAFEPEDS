"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  Droplets,
  FlaskConical,
  BookOpen,
  Heart,
  ShieldAlert,
  Brain,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button, Card, Badge } from "@/components/ui";
import { useUserCycles } from "@/hooks/useUserCycles";
import { fetchReportsWithStats } from "@/services/bloodwork";
import { calculateRisk } from "@/services/risk";
import { fetchCycleById } from "@/services/cycles";
import { searchKnowledgeArticles } from "@/services/knowledge";
import { searchHealthTopics } from "@/services/health-library";
import {
  bloodworkToRiskInput,
  cycleToRiskInput,
} from "@/lib/risk/transform";
import { formatLabDate } from "@/utils/bloodwork";
import { RISK_LEVEL_COLORS } from "@/types/risk";

interface HubCardProps {
  href: string;
  title: string;
  description: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function HubCard({ href, title, description, value, sub, icon: Icon }: HubCardProps) {
  return (
    <Link href={href}>
      <Card variant="gradient" hover padding="md" className="h-full border border-border/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
            {sub && <p className="text-xs text-muted mt-1 line-clamp-2">{sub}</p>}
            <p className="text-xs text-muted/70 mt-2">{description}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function DashboardView() {
  const { cycles } = useUserCycles();
  const [bloodworkSummary, setBloodworkSummary] = useState("No entries yet");
  const [bloodworkSub, setBloodworkSub] = useState("Add your first lab report");
  const [riskLevel, setRiskLevel] = useState("—");
  const [riskSub, setRiskSub] = useState("Save a cycle to assess");
  const [kbCount, setKbCount] = useState("—");
  const [healthCount, setHealthCount] = useState("—");

  const activeCycle = cycles[0];

  useEffect(() => {
    fetchReportsWithStats().then(({ data }) => {
      if (data.latestReport) {
        setBloodworkSummary(formatLabDate(data.latestReport.collection_date));
        setBloodworkSub(
          `${data.latestReport.bloodwork_results.length} markers · ${data.totalOutOfRange} out of range`
        );
      }
    });
    searchKnowledgeArticles({ limit: 1 }).then((r) => setKbCount(String(r.total)));
    searchHealthTopics({}).then((r) => setHealthCount(String(r.total)));
  }, []);

  useEffect(() => {
    if (!activeCycle) return;
    fetchCycleById(activeCycle.id).then(async ({ data: cycle }) => {
      if (!cycle) return;
      const { data: stats } = await fetchReportsWithStats();
      try {
        const result = await calculateRisk({
          cycle: cycleToRiskInput(cycle),
          bloodwork: bloodworkToRiskInput(stats.latestReport),
        }, undefined, false);
        setRiskLevel(result.overall_level);
        setRiskSub(`Score ${result.overall_score} · placeholder rules`);
      } catch {
        setRiskLevel("—");
      }
    });
  }, [activeCycle]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your health monitoring overview. Tap any card to explore."
        badge="MVP"
        actions={
          <Link href="/bloodwork/entry">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add Bloodwork
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <HubCard
          href={activeCycle ? `/cycle-builder?id=${activeCycle.id}` : "/cycle-builder"}
          title="Current Cycle"
          description="Build or edit your compound cycle"
          value={activeCycle?.cycle_name ?? "None"}
          sub={activeCycle ? `${activeCycle.compound_count} compound(s)` : "Create your first cycle"}
          icon={FlaskConical}
        />
        <HubCard
          href={"/bloodwork"}
          title="Latest Bloodwork"
          description="View reports and trends"
          value={bloodworkSummary}
          sub={bloodworkSub}
          icon={Droplets}
        />
        <HubCard
          href="/risk"
          title="Risk Summary"
          description="Educational rule-based scores"
          value={riskLevel}
          sub={riskSub}
          icon={ShieldAlert}
        />
        <HubCard
          href="/knowledge-base"
          title="Knowledge Base"
          description="Educational articles and guides"
          value={kbCount}
          sub="Browse scientific education"
          icon={BookOpen}
        />
        <HubCard
          href="/health-library"
          title="Health Library"
          description="Bloodwork findings and monitoring"
          value={healthCount}
          sub="Topics across health categories"
          icon={Heart}
        />
        <Link href="/ai/chat">
          <Card variant="gradient" hover padding="md" className="h-full border border-border/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider">AI Assistant</p>
                <p className="text-lg font-semibold text-foreground mt-1">Educational Chat</p>
                <p className="text-xs text-muted mt-2">Ask questions about your logged data</p>
              </div>
              <Brain className="h-8 w-8 text-primary/60" />
            </div>
          </Card>
        </Link>
      </div>

      <Card variant="elevated" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
            <p className="text-sm text-muted">Jump to common tasks</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/cycle-builder"><Button variant="outline" size="sm"><FlaskConical className="h-4 w-4" /> Cycle Builder</Button></Link>
          <Link href="/bloodwork/entry"><Button variant="outline" size="sm"><Droplets className="h-4 w-4" /> Log Bloodwork</Button></Link>
          <Link href="/risk"><Button variant="outline" size="sm"><ShieldAlert className="h-4 w-4" /> Risk Dashboard</Button></Link>
          <Link href="/bloodwork/trends"><Button variant="outline" size="sm"><TrendingUp className="h-4 w-4" /> Trends</Button></Link>
        </div>
        {riskLevel !== "—" && (
          <p className={`text-sm mt-4 ${RISK_LEVEL_COLORS[riskLevel as keyof typeof RISK_LEVEL_COLORS] ?? "text-muted"}`}>
            Overall educational risk level: {riskLevel}
          </p>
        )}
        <Badge variant="default" className="mt-4">Educational monitoring only — not medical advice</Badge>
      </Card>
    </div>
  );
}
