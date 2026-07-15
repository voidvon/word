import type { ArticleTokenFrequency } from "../types";

const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s]+/giu;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const ENGLISH_TOKEN_PATTERN = /(^|[^A-Za-z0-9])([A-Za-z]+(?:['’][A-Za-z]+)*(?:[-‐‑‒–—][A-Za-z]+(?:['’][A-Za-z]+)*)*)(?=$|[^A-Za-z0-9])/g;

export function normalizeWordKey(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/[’]/g, "'")
    .replace(/[‐‑‒–—]/g, "-")
    .toLowerCase();
}

export function extractTokenFrequencies(text: string): ArticleTokenFrequency[] {
  const sanitized = text.replace(URL_PATTERN, " ").replace(EMAIL_PATTERN, " ");
  const tokens = new Map<string, ArticleTokenFrequency>();

  for (const match of sanitized.matchAll(ENGLISH_TOKEN_PATTERN)) {
    const prefix = match[1] ?? "";
    const displayText = match[2] ?? "";
    const key = normalizeWordKey(displayText);
    if (!key) {
      continue;
    }

    const existing = tokens.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    tokens.set(key, {
      key,
      displayText,
      count: 1,
      firstIndex: (match.index ?? 0) + prefix.length,
    });
  }

  return Array.from(tokens.values()).sort(
    (left, right) => right.count - left.count || left.firstIndex - right.firstIndex,
  );
}
