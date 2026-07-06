import { describe, expect, it } from "vitest";
import { calculateCycleRisk } from "./cycle-risk-engine";
import type { RiskEngineInput } from "@/types/risk";

function heavyCycleInput(): RiskEngineInput {
  return {
    cycle: {
      cycle_id: "test",
      cycle_name: "Heavy stack",
      compounds: [
        {
          compound_id: "1",
          name: "Trenbolone Enanthate",
          weekly_dose: 300,
          administration: "intramuscular",
          duration_weeks: 24,
        },
        {
          compound_id: "2",
          name: "Testosterone Enanthate",
          weekly_dose: 300,
          administration: "intramuscular",
          duration_weeks: 24,
        },
        {
          compound_id: "3",
          name: "Equipoise",
          weekly_dose: 200,
          administration: "intramuscular",
          duration_weeks: 24,
        },
        {
          compound_id: "4",
          name: "Masteron Enanthate",
          weekly_dose: 100,
          administration: "intramuscular",
          duration_weeks: 24,
        },
      ],
    },
  };
}

describe("calculateCycleRisk", () => {
  it("scores heavy multi-compound 24-week cycle in 75-90 range", () => {
    const result = calculateCycleRisk(heavyCycleInput());

    expect(result.overall_score).toBeGreaterThanOrEqual(75);
    expect(result.overall_score).toBeLessThanOrEqual(100);
    expect(result.overall_level).toBe("Very High");

    const tren = result.compound_risks.find((c) => c.compound_name.includes("Tren"));
    expect(tren?.level).toBe("Very High");

    const test = result.compound_risks.find((c) => c.compound_name.includes("Testosterone"));
    expect(["Moderate", "High"]).toContain(test?.level);

    const eq = result.compound_risks.find((c) => c.compound_name.includes("Equipoise"));
    expect(["Moderate", "High"]).toContain(eq?.level);
    expect(eq?.reasons.some((r) => r.includes("16 weeks"))).toBe(true);

    const mast = result.compound_risks.find((c) => c.compound_name.includes("Masteron"));
    expect(mast?.level).toBe("Moderate");
  });

  it("returns low-to-moderate score for modest TRT cycle", () => {
    const input: RiskEngineInput = {
      cycle: {
        cycle_id: "minimal",
        cycle_name: "TRT",
        compounds: [
          {
            compound_id: "1",
            name: "Testosterone Enanthate",
            weekly_dose: 100,
            administration: "intramuscular",
            duration_weeks: 6,
          },
        ],
      },
    };

    const result = calculateCycleRisk(input);
    expect(result.overall_level).toBe("Moderate");
    expect(result.overall_score).toBeLessThanOrEqual(30);
  });

  it("uses cumulative scoring so heavy stacks are not averaged down", () => {
    const result = calculateCycleRisk(heavyCycleInput());
    const sumCompoundScores = result.compound_risks.reduce((s, c) => s + c.score, 0);
    const averageCompound = sumCompoundScores / result.compound_risks.length;
    expect(result.overall_score).toBeGreaterThan(averageCompound);
  });
});
