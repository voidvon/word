export const STORAGE_KEY = "word-web-user-state-v1";

export const REVIEW_STAGE_DELAYS: Record<number, number> = {
  0: 0,
  1: 20 * 60 * 1000,
  2: 60 * 60 * 1000,
  3: 9 * 60 * 60 * 1000,
  4: 24 * 60 * 60 * 1000,
  5: 2 * 24 * 60 * 60 * 1000,
  6: 6 * 24 * 60 * 60 * 1000,
  7: 31 * 24 * 60 * 60 * 1000,
};
