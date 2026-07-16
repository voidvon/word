import type { AiBucket, AiBucketDefinition, AiBucketKey, AppUserData, WordBook, WordUserState } from "../types";
import { DEFAULT_REVIEW_CONFIG } from "../config/review";

export const AI_BUCKET_DEFINITIONS: AiBucketDefinition[] = [
  {
    key: "due",
    title: "⏰ 遗忘中单词",
    tone: "purple",
    description: "已到下次复习时间的学习中单词",
    enabled: true,
    order: 10,
    ruleType: "local-rule",
  },
  {
    key: "hard",
    title: "📚易错词",
    tone: "blue",
    description: "学习中且累计忘记达到 3 次的单词",
    enabled: true,
    order: 20,
    ruleType: "local-rule",
  },
  {
    key: "marked",
    title: "⭐收藏单词",
    tone: "orange",
    description: "用户主动收藏的全部单词",
    enabled: true,
    order: 30,
    ruleType: "local-rule",
  },
  {
    key: "unknown",
    title: "❓不认识单词",
    tone: "gray",
    description: "已加入单词本但尚未背诵的单词",
    enabled: true,
    order: 40,
    ruleType: "local-rule",
  },
  {
    key: "mastered",
    title: "👍🏻砍掉的单词",
    tone: "red",
    description: "用户主动砍掉并标记为掌握的单词",
    enabled: true,
    order: 50,
    ruleType: "local-rule",
  },
  {
    key: "ignored",
    title: "🚫忽略的单词",
    tone: "black",
    description: "已标记为忽略的单词",
    enabled: true,
    order: 60,
    ruleType: "local-rule",
  },
];

export function getDefaultAiBucketPrefs(now = Date.now()): AppUserData["aiBucketPrefs"] {
  return Object.fromEntries(
    AI_BUCKET_DEFINITIONS.map((bucket) => [
      bucket.key,
      {
        enabled: bucket.enabled,
        order: bucket.order,
        updatedAt: now,
      },
    ]),
  );
}

export function normalizeAiBucketPrefs(state: AppUserData): AppUserData["aiBucketPrefs"] {
  const defaults = getDefaultAiBucketPrefs();
  return Object.fromEntries(
    AI_BUCKET_DEFINITIONS.map((bucket) => {
      const prev = state.aiBucketPrefs?.[bucket.key];
      return [
        bucket.key,
        {
          enabled: prev?.enabled ?? defaults[bucket.key]?.enabled ?? bucket.enabled,
          order: prev?.order ?? defaults[bucket.key]?.order ?? bucket.order,
          updatedAt: prev?.updatedAt ?? defaults[bucket.key]?.updatedAt ?? Date.now(),
        },
      ];
    }),
  );
}

function matchesAiBucket(bucketKey: AiBucketKey, value: WordUserState, now: number) {
  if (bucketKey === "due") {
    return value.s === "a" && value.t !== undefined && value.t <= now;
  }
  if (bucketKey === "hard") {
    return value.s === "a" && value.ec >= DEFAULT_REVIEW_CONFIG.errorThreshold;
  }
  if (bucketKey === "marked") {
    return value.m === 1;
  }
  if (bucketKey === "unknown") {
    return value.s === "n";
  }
  if (bucketKey === "mastered") {
    return value.s === "c";
  }
  if (bucketKey === "ignored") {
    return value.s === "b";
  }
  return false;
}

export function isBook(entity: AppUserData["wordBookMap"][number]): entity is WordBook {
  return entity.kind === "book";
}

export function getBookWords(book: WordBook, sortMode: "add" | "alpha") {
  return sortMode === "alpha" ? book.wordsByAlpha : book.wordsByAdd;
}

export function computeAiBuckets(state: AppUserData): AiBucket[] {
  const now = Date.now();
  const entries = Object.entries(state.wordUserMap);
  const prefs = normalizeAiBucketPrefs(state);

  return AI_BUCKET_DEFINITIONS
    .map((bucket) => {
      const pref = prefs[bucket.key];
      return {
        ...bucket,
        enabled: pref?.enabled ?? bucket.enabled,
        order: pref?.order ?? bucket.order,
        count: entries.filter(([, value]) => matchesAiBucket(bucket.key, value, now)).length,
      };
    })
    .filter((bucket) => bucket.enabled)
    .sort((left, right) => left.order - right.order);
}

export function getAiBucketWords(state: AppUserData, bucketKey: string) {
  const now = Date.now();
  const entries = Object.entries(state.wordUserMap);
  const bucket = AI_BUCKET_DEFINITIONS.find((item) => item.key === bucketKey);
  if (!bucket) {
    return [];
  }

  const words = entries
    .filter(([, value]) => matchesAiBucket(bucket.key, value, now))
    .sort((left, right) => (right[1].t ?? 0) - (left[1].t ?? 0))
    .map(([word]) => word);

  return words;
}

export function getBookReport(state: AppUserData, book: WordBook) {
  const total = book.wordsByAdd.length;
  const mastered = book.wordsByAdd.filter((word) => {
    const status = state.wordUserMap[word]?.s;
    return status === "c" || status === "d";
  }).length;

  return {
    total,
    mastered,
  };
}
