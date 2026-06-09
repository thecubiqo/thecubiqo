/**
 * DuoProjectView — the structured "live view" a capsule renders in its
 * artifact pane the moment you open it.
 *
 * This is the data contract behind the screenshots: a headline, a row of
 * stat cards, a results table with status badges, prose sections, and a
 * proactive "what CubiQo does next" list. It is produced by the capsule
 * engine (src/lib/agent/capsule-engine.ts) — either synthesized by the LLM
 * or built deterministically as a fallback — stored as a `duo_artifacts`
 * row of type 'view', and rendered by <ProjectView> inside <ArtifactPane>.
 *
 * Keeping it as structured JSON (rather than model-authored HTML) means the
 * UI is deterministic, injection-safe, and consistent across every capsule.
 */

export type ViewTone = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

/** A single stat card (e.g. "18 · Roles found"). */
export interface ViewStat {
  label: string;
  value: string | number;
  tone?: ViewTone;
  hint?: string;
}

/** A coloured status pill rendered at the end of a table row. */
export interface ViewBadge {
  label: string;
  tone?: ViewTone;
}

/** One row of the results table; cells align to `columns`. */
export interface ViewRow {
  cells: string[];
  badge?: ViewBadge;
  href?: string;
}

/** A free-text section rendered below the table (e.g. a preview/explanation). */
export interface ViewSection {
  heading: string;
  body: string;
}

/** The full live view object persisted as a capsule artifact. */
export interface DuoProjectView {
  kind: 'view';
  /** "Application Tracker — 18 Roles Found" */
  headline: string;
  subtitle?: string;
  /** ISO timestamp the view was generated. */
  generatedAt?: string;
  /** Human status line, e.g. "Generating" / "Awaiting your approval". */
  status?: string;
  /** 2–4 headline metric cards. */
  stats: ViewStat[];
  /** Table headers. Omit to hide the table. */
  columns?: string[];
  /** Table rows. */
  rows?: ViewRow[];
  /** Extra prose sections (previews, rationale). */
  sections?: ViewSection[];
  /** Proactive list of what CubiQo will do next — the "always working" signal. */
  nextActions?: string[];
  /** Money-minded framing: the opportunity / value angle for the owner. */
  moneyAngle?: string;
}
