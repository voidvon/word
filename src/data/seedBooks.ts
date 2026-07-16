import type { AppUserData } from "../types";

const now = Date.now();

export const seedUserData: AppUserData = {
  version: 3,
  searchList: [],
  studyList: [],
  wordUserMap: {},
  wordBookList: [0],
  wordBookMap: {
    0: {
      id: 0,
      kind: "book",
      name: "我的单词本",
      color: "#2f80ed",
      report: { total: 0, mastered: 0 },
      wordsByAdd: [],
      wordsByAlpha: [],
      articleWordCounts: {},
      createdAt: now,
      updatedAt: now,
    },
  },
  aiBucketPrefs: {},
  updateList: [],
};
