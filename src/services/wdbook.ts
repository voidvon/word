import type { AiBucket, AppUserData, WordBook } from "../types";

export function isBook(entity: AppUserData["wordBookMap"][number]): entity is WordBook {
  return entity.kind === "book";
}

export function getBookWords(book: WordBook, sortMode: "add" | "alpha") {
  return sortMode === "alpha" ? book.wordsByAlpha : book.wordsByAdd;
}

export function computeAiBuckets(state: AppUserData): AiBucket[] {
  const now = Date.now();
  const entries = Object.entries(state.wordUserMap);

  const due = entries.filter(([, value]) => value.s === "a" && value.t <= now).length;
  const newToday = entries.filter(([, value]) => value.s === "a" && now - value.t < 24 * 60 * 60 * 1000).length;
  const hard = entries.filter(([, value]) => value.sc >= 3 && value.s === "a").length;
  const unknown = entries.filter(([, value]) => value.sc <= 1 && value.s === "a").length;
  const focus = entries.filter(([, value]) => value.l.length > 1).length;
  const mastered = entries.filter(([, value]) => value.s === "c" || value.s === "d").length;
  const frequent = entries.filter(([, value]) => value.sc >= 3).length;
  const ignored = entries.filter(([, value]) => value.s === "b").length;

  return [
    { key: "due", title: "⏰ 遗忘中单词", count: due, tone: "purple" },
    { key: "new", title: "🔥 今日新词", count: newToday, tone: "green" },
    { key: "hard", title: "📚易错词", count: hard, tone: "blue" },
    { key: "unknown", title: "❗不认识", count: unknown, tone: "gray" },
    { key: "focus", title: "⭐重点关注", count: focus, tone: "orange" },
    { key: "mastered", title: "👍🏻砍掉的单词", count: mastered, tone: "red" },
    { key: "frequent", title: "🔍常查的单词", count: frequent, tone: "teal" },
    { key: "ignored", title: "🚫忽略的单词", count: ignored, tone: "black" },
  ];
}

export function getAiBucketWords(state: AppUserData, bucketKey: string) {
  const now = Date.now();
  const entries = Object.entries(state.wordUserMap);

  const words = entries
    .filter(([, value]) => {
      if (bucketKey === "due") {
        return value.s === "a" && value.t <= now;
      }
      if (bucketKey === "new") {
        return value.s === "a" && now - value.t < 24 * 60 * 60 * 1000;
      }
      if (bucketKey === "hard") {
        return value.sc >= 3 && value.s === "a";
      }
      if (bucketKey === "unknown") {
        return value.sc <= 1 && value.s === "a";
      }
      if (bucketKey === "focus") {
        return value.l.length > 1;
      }
      if (bucketKey === "mastered") {
        return value.s === "c" || value.s === "d";
      }
      if (bucketKey === "frequent") {
        return value.sc >= 3;
      }
      if (bucketKey === "ignored") {
        return value.s === "b";
      }
      return false;
    })
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
