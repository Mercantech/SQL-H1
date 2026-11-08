import type { ModuleDto, ProgressRow } from "../api";
import { buildFlatPath, type FlatStep } from "./contentPath.ts";

export type LearningHomeResumeReason = "started" | "next" | "review" | "new" | null;
export type LearningHomeRecent = {
  step: FlatStep;
  status: "started" | "completed";
  updatedAt: string;
};

export type LearningHomeModel = {
  resume: FlatStep | null;
  resumeReason: LearningHomeResumeReason;
  returning: boolean;
  started: FlatStep[];
  recent: LearningHomeRecent[];
  stats: {
    openedTheory: number;
    passedExercises: number;
    readyProjects: number;
  };
  totalItems: number;
  recordedItems: number;
};

/** A tie must never turn ambiguous progress into an awarded completion. */
function statusPriority(status: string) {
  return status === "completed" ? 0 : status === "started" ? 1 : 2;
}

/** Build a read-only learning overview from the latest whole-item records. */
export function buildLearningHome(
  modules: readonly ModuleDto[],
  progress: readonly ProgressRow[],
): LearningHomeModel {
  const steps = [...new Map(buildFlatPath([...modules]).map((step) => [step.item.slug, step])).values()];
  const positions = new Map(steps.map((step, index) => [step.item.slug, index]));
  const bySlug = new Map(steps.map((step) => [step.item.slug, step]));
  const latest = new Map<string, { row: ProgressRow; timestamp: number }>();

  for (const row of progress) {
    if (row.partIndex !== 0 || !bySlug.has(row.contentSlug)) continue;
    const timestamp = Date.parse(row.updatedAt);
    if (!Number.isFinite(timestamp)) continue;
    const previous = latest.get(row.contentSlug);
    if (!previous || timestamp > previous.timestamp || (
      timestamp === previous.timestamp && statusPriority(row.status) > statusPriority(previous.row.status)
    )) {
      latest.set(row.contentSlug, { row, timestamp });
    }
  }

  // Unknown latest statuses do not fall back to an older, potentially stale pass.
  const records = [...latest.values()]
    .filter(({ row }) => row.status === "started" || row.status === "completed")
    .sort((a, b) => b.timestamp - a.timestamp || positions.get(a.row.contentSlug)! - positions.get(b.row.contentSlug)!);
  const recent: LearningHomeRecent[] = records.map(({ row }) => ({
    step: bySlug.get(row.contentSlug)!,
    status: row.status as LearningHomeRecent["status"],
    updatedAt: row.updatedAt,
  }));
  const started = recent.filter((record) => record.status === "started").map((record) => record.step);
  const completed = new Set(recent.filter((record) => record.status === "completed").map((record) => record.step.item.slug));
  const stats = { openedTheory: 0, passedExercises: 0, readyProjects: 0 };
  for (const record of recent) {
    if (record.status !== "completed") continue;
    if (record.step.item.kind === "theory") stats.openedTheory++;
    else if (record.step.item.kind === "exercise") stats.passedExercises++;
    else if (record.step.item.kind === "project") stats.readyProjects++;
  }

  let resume: FlatStep | null = null;
  let resumeReason: LearningHomeResumeReason = null;
  if (started.length) {
    resume = started[0];
    resumeReason = "started";
  } else if (recent.length) {
    const position = positions.get(recent[0].step.item.slug)!;
    const following = [...steps.slice(position + 1), ...steps.slice(0, position + 1)];
    resume = following.find((step) => !completed.has(step.item.slug)) ?? recent[0].step;
    resumeReason = completed.size === steps.length ? "review" : "next";
  } else if (steps.length) {
    resume = steps[0];
    resumeReason = "new";
  }

  return { resume, resumeReason, returning: recent.length > 0, started, recent, stats, totalItems: steps.length, recordedItems: recent.length };
}
