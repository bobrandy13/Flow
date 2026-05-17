import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SimulationResults } from "./SimulationResults";
import type { Diagnosis, ValidationReport } from "@flow/shared/types/validation";

function failDiagnosis(): Diagnosis {
  return {
    category: "node_overloaded",
    headline: "Your Database ran out of capacity",
    explanation:
      "The Database hit its concurrency limit and dropped requests. Add a cache in front of it or scale it out.",
    culpritNodeIds: ["db1"],
    evidence: [
      { label: "Peak in-flight", value: "120 / 120" },
      { label: "Drops at Database", value: "412 (71% of all drops)" },
    ],
    suggestions: [
      "Scale out: add more instances of the Database behind a load balancer.",
      "Reduce the load reaching it: put a cache in front, batch requests, or filter at the edge.",
    ],
  };
}

function passCleanDiagnosis(): Diagnosis {
  return {
    category: "passed_clean",
    headline: "Clean pass: your system has room to breathe",
    explanation: "Healthy design. Move on.",
    culpritNodeIds: [],
    evidence: [{ label: "Success rate", value: "100%" }],
    suggestions: ["Try removing one component. Does the system still pass?"],
  };
}

function makeReport(diagnosis: Diagnosis, passed: boolean): ValidationReport {
  return {
    structuralPassed: true,
    ruleResults: [],
    simulation: {
      passed,
      metrics: {
        avgLatency: 5,
        p95Latency: 10,
        successRate: passed ? 1 : 0.3,
        drops: passed ? 0 : 400,
        bottleneckNodeId: "db1",
      },
      diagnosis,
      failureReason: passed ? undefined : diagnosis.headline,
    },
  };
}

describe("SimulationResults → MentorVerdict", () => {
  it("renders headline, evidence, and suggestions on a failed run", () => {
    const report = makeReport(failDiagnosis(), false);
    render(<SimulationResults report={report} nodeLabels={{ db1: "Database #1" }} />);

    expect(screen.getByTestId("mentor-verdict")).toBeInTheDocument();
    expect(screen.getByText(/your database ran out of capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/peak in-flight/i)).toBeInTheDocument();
    expect(screen.getByText("120 / 120")).toBeInTheDocument();
    expect(screen.getByText(/scale out/i)).toBeInTheDocument();
    // Culprit label resolves from the nodeLabels map.
    expect(screen.getAllByText(/database #1/i).length).toBeGreaterThan(0);
  });

  it("renders a celebratory verdict on a clean pass", () => {
    const report = makeReport(passCleanDiagnosis(), true);
    render(<SimulationResults report={report} />);
    expect(screen.getByText(/clean pass/i)).toBeInTheDocument();
    expect(screen.getByText(/try removing one component/i)).toBeInTheDocument();
  });

  it("does not render the verdict when there is no simulation outcome", () => {
    const report: ValidationReport = { structuralPassed: false, ruleResults: [] };
    render(<SimulationResults report={report} />);
    expect(screen.queryByTestId("mentor-verdict")).not.toBeInTheDocument();
  });

  it("renders helpful structural guidance before simulation tuning", () => {
    const report: ValidationReport = {
      structuralPassed: false,
      ruleResults: [
        {
          passed: false,
          rule: { type: "requires_kind", kind: "cache", min: 1 },
          message:
            "Add a Cache node (none are on the canvas yet). For this lesson, the cache should sit on the read path: Server -> Cache -> Database.",
        },
      ],
    };

    render(<SimulationResults report={report} />);

    expect(screen.getByText(/add the required building blocks/i)).toBeInTheDocument();
    expect(screen.getByText(/pattern this level wants you to practice/i)).toBeInTheDocument();
    expect(screen.getAllByText(/server -> cache -> database/i).length).toBeGreaterThan(0);
  });
});
