import type { ReviewStage, WordStateType } from "../types";

export type ReviewStageConfig = {
  stage: ReviewStage;
  delayMs: number;
  color: string;
};

export const DEFAULT_REVIEW_CONFIG = {
  stages: [
    { stage: 0, delayMs: 0, color: "#9e9e9e" },
    { stage: 1, delayMs: 20 * 60 * 1000, color: "#ef4444" },
    { stage: 2, delayMs: 60 * 60 * 1000, color: "#f59e0b" },
    { stage: 3, delayMs: 9 * 60 * 60 * 1000, color: "#eab308" },
    { stage: 4, delayMs: 24 * 60 * 60 * 1000, color: "#22c55e" },
    { stage: 5, delayMs: 2 * 24 * 60 * 60 * 1000, color: "#06b6d4" },
    { stage: 6, delayMs: 6 * 24 * 60 * 60 * 1000, color: "#3b82f6" },
    { stage: 7, delayMs: 31 * 24 * 60 * 60 * 1000, color: "#8b5cf6" },
  ] satisfies ReviewStageConfig[],
  statusColors: {
    n: "#78909c",
    b: "#455a64",
    c: "#d81b60",
    d: "#b8860b",
  } satisfies Partial<Record<WordStateType, string>>,
  frequentLookupThreshold: 3,
  errorThreshold: 3,
} as const;

export function getReviewStageConfig(stage: ReviewStage) {
  return DEFAULT_REVIEW_CONFIG.stages[stage]!;
}

export function getWordStateColor(status: WordStateType | undefined, stage: ReviewStage | undefined) {
  if (status === "a") {
    return getReviewStageConfig(stage ?? 0).color;
  }
  return status ? DEFAULT_REVIEW_CONFIG.statusColors[status] : DEFAULT_REVIEW_CONFIG.statusColors.n;
}
