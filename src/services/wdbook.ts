import type { AiBucket, AiBucketDefinition, AiBucketKey, AppUserData, WordBook, WordUserState } from "../types";

const ONE_DAY = 24 * 60 * 60 * 1000;

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
    key: "new",
    title: "🔥 今日新词",
    tone: "green",
    description: "最近 24 小时首次加入的单词",
    enabled: true,
    order: 20,
    ruleType: "local-rule",
  },
  {
    key: "hard",
    title: "📚易错词",
    tone: "blue",
    description: "多次标记为模糊或忘记的单词",
    enabled: true,
    order: 30,
    ruleType: "local-rule",
  },
  {
    key: "unknown",
    title: "❗不认识",
    tone: "gray",
    description: "首次明确标记为忘记的单词",
    enabled: true,
    order: 40,
    ruleType: "local-rule",
  },
  {
    key: "focus",
    title: "⭐重点关注",
    tone: "orange",
    description: "用户主动标记为重点关注的单词",
    enabled: true,
    order: 50,
    ruleType: "local-rule",
  },
  {
    key: "mastered",
    title: "👍🏻砍掉的单词",
    tone: "red",
    description: "已明确标记为认识的单词",
    enabled: true,
    order: 60,
    ruleType: "local-rule",
  },
  {
    key: "frequent",
    title: "🔍常查的单词",
    tone: "teal",
    description: "查询次数较高的单词",
    enabled: true,
    order: 70,
    ruleType: "local-rule",
  },
  {
    key: "ignored",
    title: "🚫忽略的单词",
    tone: "black",
    description: "已标记为忽略的单词",
    enabled: true,
    order: 80,
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
    return value.s === "a" && value.t <= now;
  }
  if (bucketKey === "new") {
    return value.s === "a" && now - value.createdAt < ONE_DAY;
  }
  if (bucketKey === "hard") {
    return value.fuzzyCount + value.wrongCount >= 2;
  }
  if (bucketKey === "unknown") {
    return value.s === "a" && value.wrongCount === 1;
  }
  if (bucketKey === "focus") {
    return value.focused;
  }
  if (bucketKey === "mastered") {
    return value.s === "c";
  }
  if (bucketKey === "frequent") {
    return value.sc >= 3;
  }
  if (bucketKey === "ignored") {
    return value.s === "b" || Boolean(value.ignoredAt);
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
    .sort((left, right) => right[1].t - left[1].t)
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
