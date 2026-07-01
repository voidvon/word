import type { AppUserData } from "../types";

const now = Date.now();

export const seedUserData: AppUserData = {
  version: 1,
  searchList: ["seek", "evidence", "refund", "deactivate", "special"],
  studyList: ["terminate", "legate", "salient", "appall", "succeed"],
  wordUserMap: {
    terminate: { s: "a", a: 1, sc: 3, t: now - 60_000, l: [1] },
    legate: { s: "a", a: 3, sc: 1, t: now + 2 * 60 * 60 * 1000, l: [1] },
    salient: { s: "c", sc: 2, t: now - 86400000, l: [2] },
    appall: { s: "b", sc: 1, t: now - 3600000, l: [2] },
    succeed: { s: "d", sc: 5, t: now - 7200000, l: [3] },
    evidence: { s: "a", a: 0, sc: 4, t: now, l: [1, 3] },
    refund: { s: "a", a: 2, sc: 2, t: now + 30 * 60 * 1000, l: [2] },
  },
  wordBookList: [1, 2, 3],
  wordBookMap: {
    1: {
      id: 1,
      kind: "book",
      name: "斯克林",
      report: { total: 4, mastered: 0 },
      wordsByAdd: ["terminate", "legate", "evidence", "salient"],
      wordsByAlpha: ["evidence", "legate", "salient", "terminate"],
      createdAt: now,
      updatedAt: now,
    },
    2: {
      id: 2,
      kind: "book",
      name: "生活中的英语",
      report: { total: 3, mastered: 1 },
      wordsByAdd: ["refund", "appall", "seek"],
      wordsByAlpha: ["appall", "refund", "seek"],
      createdAt: now,
      updatedAt: now,
    },
    3: {
      id: 3,
      kind: "book",
      name: "Fun Study",
      report: { total: 3, mastered: 1 },
      wordsByAdd: ["succeed", "evidence", "special"],
      wordsByAlpha: ["evidence", "special", "succeed"],
      createdAt: now,
      updatedAt: now,
    },
  },
  updateList: [],
};
