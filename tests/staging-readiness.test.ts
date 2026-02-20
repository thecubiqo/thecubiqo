/**
 * Staging Readiness Report — Unit Tests
 *
 * Tests the pure helper functions exported by scripts/staging-readiness-report.ts
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// We test the source file content to match the established pattern in this repo
// (see tests/feature-flags.test.ts) AND we import the pure helpers directly.
import {
  isAgentRun,
  isRunInProgress,
  computeReadiness,
  computeStagingReady,
  formatMarkdownReport,
  type PRReadiness,
  type ReadinessReport,
} from "../scripts/staging-readiness-report";

// ---------------------------------------------------------------------------
// isAgentRun
// ---------------------------------------------------------------------------

describe("isAgentRun", () => {
  it("returns true for names containing 'copilot'", () => {
    expect(isAgentRun("Copilot Build")).toBe(true);
    expect(isAgentRun("copilot-pr-check")).toBe(true);
  });

  it("returns true for names containing 'agent'", () => {
    expect(isAgentRun("PR Agent Triage")).toBe(true);
  });

  it("returns true for names containing 'bot'", () => {
    expect(isAgentRun("Dependabot")).toBe(true);
  });

  it("returns false for regular CI names", () => {
    expect(isAgentRun("Build and Test")).toBe(false);
    expect(isAgentRun("Lint")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isRunInProgress
// ---------------------------------------------------------------------------

describe("isRunInProgress", () => {
  it("returns true for queued, in_progress, waiting", () => {
    expect(isRunInProgress("queued")).toBe(true);
    expect(isRunInProgress("in_progress")).toBe(true);
    expect(isRunInProgress("waiting")).toBe(true);
  });

  it("returns false for completed", () => {
    expect(isRunInProgress("completed")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeReadiness
// ---------------------------------------------------------------------------

describe("computeReadiness", () => {
  it("returns true when all criteria pass", () => {
    expect(
      computeReadiness({
        isDraft: false,
        ciGreen: true,
        mergeable: true,
        agentActive: false,
      })
    ).toBe(true);
  });

  it("returns false when PR is a draft", () => {
    expect(
      computeReadiness({
        isDraft: true,
        ciGreen: true,
        mergeable: true,
        agentActive: false,
      })
    ).toBe(false);
  });

  it("returns false when CI is red", () => {
    expect(
      computeReadiness({
        isDraft: false,
        ciGreen: false,
        mergeable: true,
        agentActive: false,
      })
    ).toBe(false);
  });

  it("returns false when there are merge conflicts", () => {
    expect(
      computeReadiness({
        isDraft: false,
        ciGreen: true,
        mergeable: false,
        agentActive: false,
      })
    ).toBe(false);
  });

  it("returns false when mergeable is null (unknown)", () => {
    expect(
      computeReadiness({
        isDraft: false,
        ciGreen: true,
        mergeable: null,
        agentActive: false,
      })
    ).toBe(false);
  });

  it("returns false when an agent is still active", () => {
    expect(
      computeReadiness({
        isDraft: false,
        ciGreen: true,
        mergeable: true,
        agentActive: true,
      })
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeStagingReady
// ---------------------------------------------------------------------------

describe("computeStagingReady", () => {
  it("returns true when there are no open PRs", () => {
    expect(computeStagingReady([])).toBe(true);
  });

  it("returns true when every PR is ready", () => {
    const prs: PRReadiness[] = [
      makePR({ ready: true }),
      makePR({ ready: true }),
    ];
    expect(computeStagingReady(prs)).toBe(true);
  });

  it("returns false when any PR is not ready", () => {
    const prs: PRReadiness[] = [
      makePR({ ready: true }),
      makePR({ ready: false }),
    ];
    expect(computeStagingReady(prs)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// formatMarkdownReport
// ---------------------------------------------------------------------------

describe("formatMarkdownReport", () => {
  it("includes staging ready verdict when all PRs are ready", () => {
    const report = makeReport({ stagingReady: true, allAgentsDone: true });
    const md = formatMarkdownReport(report);

    expect(md).toContain("✅ Staging Ready");
    expect(md).toContain("safe to merge");
  });

  it("includes not ready verdict with agent warning", () => {
    const report = makeReport({ stagingReady: false, allAgentsDone: false });
    const md = formatMarkdownReport(report);

    expect(md).toContain("❌ Not Yet Staging Ready");
    expect(md).toContain("Agents are still working");
  });

  it("includes the PR details table", () => {
    const report = makeReport({
      prs: [makePR({ number: 42, title: "Fix bug" })],
    });
    const md = formatMarkdownReport(report);

    expect(md).toContain("#42");
    expect(md).toContain("Fix bug");
    expect(md).toContain("| PR |");
  });
});

// ---------------------------------------------------------------------------
// Source file structure (matches repo pattern in feature-flags.test.ts)
// ---------------------------------------------------------------------------

describe("staging-readiness-report source structure", () => {
  const srcPath = resolve(
    __dirname,
    "../scripts/staging-readiness-report.ts"
  );
  const src = readFileSync(srcPath, "utf-8");

  it("exports PRReadiness interface", () => {
    expect(src).toContain("export interface PRReadiness");
  });

  it("exports ReadinessReport interface", () => {
    expect(src).toContain("export interface ReadinessReport");
  });

  it("exports isAgentRun function", () => {
    expect(src).toContain("export function isAgentRun");
  });

  it("exports computeReadiness function", () => {
    expect(src).toContain("export function computeReadiness");
  });

  it("exports formatMarkdownReport function", () => {
    expect(src).toContain("export function formatMarkdownReport");
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePR(overrides: Partial<PRReadiness> = {}): PRReadiness {
  return {
    number: 1,
    title: "Test PR",
    url: "https://github.com/thecubiqo/thecubiqo/pull/1",
    author: "test-user",
    isDraft: false,
    ciGreen: true,
    ciDetail: "All checks passed",
    mergeable: true,
    agentActive: false,
    agentDetail: "No active agent runs",
    ready: true,
    ...overrides,
  };
}

function makeReport(
  overrides: Partial<ReadinessReport> = {}
): ReadinessReport {
  return {
    timestamp: "2026-02-19T12:00:00.000Z",
    owner: "thecubiqo",
    repo: "thecubiqo",
    totalOpen: 1,
    readyCount: 1,
    notReadyCount: 0,
    allAgentsDone: true,
    stagingReady: true,
    prs: [makePR()],
    ...overrides,
  };
}
