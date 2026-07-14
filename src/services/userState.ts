import { REVIEW_STAGE_DELAYS, STORAGE_KEY } from "../constants";
import { seedUserData } from "../data/seedBooks";
import { normalizeAiBucketPrefs } from "./wdbook";
import type { AppUserData, WordBook, WordReviewAction, WordUserState } from "../types";

export const BUILTIN_BOOK_ID = 0;
export const BUILTIN_BOOK_NAME = "我的单词本";
const LEGACY_SEED_SEARCH_WORDS = ["seek", "evidence", "refund", "deactivate", "special"];
const LEGACY_SEED_WORDS = ["terminate", "legate", "salient", "appall", "succeed", "evidence", "refund"];
const MAX_REVIEW_STAGE = 7;
type ReviewStage = NonNullable<WordUserState["a"]>;
const LEGACY_SEED_BOOKS: Record<number, { name: string; wordsByAdd: string[] }> = {
  1: {
    name: "斯克林",
    wordsByAdd: ["terminate", "legate", "evidence", "salient"],
  },
  2: {
    name: "生活中的英语",
    wordsByAdd: ["refund", "appall", "seek"],
  },
  3: {
    name: "Fun Study",
    wordsByAdd: ["succeed", "evidence", "special"],
  },
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadUserState(): AppUserData {
  if (!canUseStorage()) {
    return migrateUserState(seedUserData);
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const next = migrateUserState(seedUserData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  try {
    const parsed = JSON.parse(raw) as AppUserData;
    const next = migrateUserState(parsed);
    if (next !== parsed) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    const next = migrateUserState(seedUserData);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  }
}

export function saveUserState(next: AppUserData) {
  if (!canUseStorage()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function cloneState(state: AppUserData): AppUserData {
  return {
    ...state,
    searchList: [...state.searchList],
    studyList: [...state.studyList],
    wordUserMap: { ...state.wordUserMap },
    wordBookList: [...state.wordBookList],
    wordBookMap: { ...state.wordBookMap },
    aiBucketPrefs: { ...(state.aiBucketPrefs ?? {}) },
    updateList: [...state.updateList],
  };
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function normalizeReviewStage(stage: WordUserState["a"]): ReviewStage {
  return Math.max(0, Math.min(MAX_REVIEW_STAGE, stage ?? 0)) as ReviewStage;
}

function getNextReviewTime(stage: ReviewStage, now: number) {
  return now + (REVIEW_STAGE_DELAYS[stage] ?? 0);
}

function ensureWordState(state: AppUserData, word: string) {
  const normalized = normalizeWord(word);
  const prev = state.wordUserMap[normalized];
  const now = Date.now();
  const nextWordState: WordUserState = {
    s: prev?.s ?? "a",
    a: prev?.a ?? 0,
    sc: prev?.sc ?? 0,
    reviewCount: prev?.reviewCount ?? 0,
    createdAt: prev?.createdAt ?? prev?.t ?? now,
    lastReviewedAt: prev?.lastReviewedAt,
    t: prev?.t ?? now,
    l: prev?.l ?? [],
    fuzzyCount: prev?.fuzzyCount ?? 0,
    wrongCount: prev?.wrongCount ?? 0,
    focused: prev?.focused ?? Boolean((prev as WordUserState & { favorited?: boolean })?.favorited),
    ignoredAt: prev?.ignoredAt,
  };
  state.wordUserMap[normalized] = nextWordState;
  return nextWordState;
}

function isBookEntity(entity: AppUserData["wordBookMap"][number]): entity is WordBook {
  return entity.kind === "book";
}

function recomputeBookReport(state: AppUserData, bookId: number) {
  const entity = state.wordBookMap[bookId];
  if (!entity || !isBookEntity(entity)) {
    return;
  }

  const mastered = entity.wordsByAdd.filter((word) => {
    const status = state.wordUserMap[word]?.s;
    return status === "c" || status === "d";
  }).length;

  state.wordBookMap[bookId] = {
    ...entity,
    report: {
      total: entity.wordsByAdd.length,
      mastered,
    },
    updatedAt: Date.now(),
  };
}

function pushUpdate(state: AppUserData, type: string, payload: unknown) {
  state.updateList.unshift({
    type,
    payload,
    createdAt: Date.now(),
  });
  state.updateList = state.updateList.slice(0, 100);
}

function ensureBuiltinBook(state: AppUserData) {
  const entity = state.wordBookMap[BUILTIN_BOOK_ID];
  const isValidBuiltin = entity && isBookEntity(entity);

  if (isValidBuiltin) {
    return state;
  }

  const wasDeleted = state.updateList.some((item) => {
    const payload = item.payload as { bookId?: unknown };
    return item.type === "delete-book" && payload.bookId === BUILTIN_BOOK_ID;
  });
  if (wasDeleted) {
    return state;
  }

  const now = Date.now();
  const next = cloneState(state);
  next.wordBookMap[BUILTIN_BOOK_ID] = {
    id: BUILTIN_BOOK_ID,
    kind: "book",
    name: BUILTIN_BOOK_NAME,
    color: "#2f80ed",
    report: { total: 0, mastered: 0 },
    wordsByAdd: [],
    wordsByAlpha: [],
    createdAt: now,
    updatedAt: now,
  };
  next.wordBookList = [BUILTIN_BOOK_ID, ...next.wordBookList.filter((id) => id !== BUILTIN_BOOK_ID)];
  recomputeBookReport(next, BUILTIN_BOOK_ID);
  return next;
}

function removeLegacySeedSearchHistory(state: AppUserData) {
  if (state.searchList.length === 0) {
    return state;
  }

  const searchedWords = new Set(
    state.updateList
      .filter((item) => item.type === "search")
      .map((item) => {
        const payload = item.payload as { word?: unknown };
        return typeof payload.word === "string" ? normalizeWord(payload.word) : "";
      })
      .filter(Boolean),
  );
  const nextSearchList = state.searchList.filter((word) => {
    const normalized = normalizeWord(word);
    return !LEGACY_SEED_SEARCH_WORDS.includes(normalized) || searchedWords.has(normalized);
  });

  if (nextSearchList.length === state.searchList.length) {
    return state;
  }

  const next = cloneState(state);
  next.searchList = nextSearchList;
  return next;
}

function isSameWords(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((word, index) => {
    const rightWord = right[index];
    return typeof rightWord === "string" && normalizeWord(word) === normalizeWord(rightWord);
  });
}

function removeLegacySeedBooks(state: AppUserData) {
  const legacyBookIds = Object.entries(LEGACY_SEED_BOOKS)
    .filter(([bookId, legacyBook]) => {
      const entity = state.wordBookMap[Number(bookId)];
      return (
        entity &&
        isBookEntity(entity) &&
        entity.name === legacyBook.name &&
        isSameWords(entity.wordsByAdd, legacyBook.wordsByAdd)
      );
    })
    .map(([bookId]) => Number(bookId));

  if (legacyBookIds.length === 0) {
    return state;
  }

  const legacyBookIdSet = new Set(legacyBookIds);
  const next = cloneState(state);
  legacyBookIds.forEach((bookId) => {
    delete next.wordBookMap[bookId];
  });
  next.wordBookList = next.wordBookList.filter((bookId) => !legacyBookIdSet.has(bookId));

  Object.entries(next.wordUserMap).forEach(([word, wordState]) => {
    const nextBookIds = wordState.l.filter((bookId) => !legacyBookIdSet.has(bookId));
    if (nextBookIds.length === 0 && LEGACY_SEED_WORDS.includes(normalizeWord(word))) {
      delete next.wordUserMap[word];
      return;
    }
    wordState.l = nextBookIds;
  });
  next.studyList = next.studyList.filter((word) => next.wordUserMap[normalizeWord(word)]);

  return next;
}

function normalizeWordUserMap(state: AppUserData) {
  const next = cloneState(state);
  Object.keys(next.wordUserMap).forEach((word) => {
    ensureWordState(next, word);
  });
  return next;
}

function migrateUserState(state: AppUserData) {
  const next = normalizeWordUserMap(removeLegacySeedSearchHistory(removeLegacySeedBooks(ensureBuiltinBook(state))));
  return {
    ...next,
    aiBucketPrefs: normalizeAiBucketPrefs(next),
  };
}

const BOOK_COLORS = [
  "#2f80ed",
  "#27ae60",
  "#f2994a",
  "#eb5757",
  "#9b51e0",
  "#00a6a6",
  "#f2c94c",
  "#34495e",
];

function randomBookColor() {
  return BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
}

export function touchSearchWord(word: string) {
  const base = loadUserState();
  const next = cloneState(base);
  const normalized = normalizeWord(word);
  next.searchList = [normalized, ...next.searchList.filter((item) => item !== normalized)];
  const nextWordState = ensureWordState(next, normalized);
  nextWordState.sc += 1;
  pushUpdate(next, "search", { word: normalized });

  saveUserState(next);
  return next;
}

export function createBook(name: string) {
  const state = loadUserState();
  const nextId = Math.max(0, ...state.wordBookList) + 1;
  const now = Date.now();

  const next: AppUserData = {
    ...state,
    wordBookList: [...state.wordBookList, nextId],
    wordBookMap: {
      ...state.wordBookMap,
      [nextId]: {
        id: nextId,
        kind: "book",
        name,
        color: randomBookColor(),
        report: {
          total: 0,
          mastered: 0,
        },
        wordsByAdd: [],
        wordsByAlpha: [],
        createdAt: now,
        updatedAt: now,
      },
    },
  };

  saveUserState(next);
  return next;
}

export function deleteBook(bookId: number) {
  const base = loadUserState();
  const next = cloneState(base);
  const entity = next.wordBookMap[bookId];

  if (!entity || !isBookEntity(entity)) {
    return next;
  }

  delete next.wordBookMap[bookId];
  next.wordBookList = next.wordBookList.filter((id) => id !== bookId);
  Object.values(next.wordUserMap).forEach((wordState) => {
    wordState.l = wordState.l.filter((id) => id !== bookId);
  });
  pushUpdate(next, "delete-book", { bookId });

  saveUserState(next);
  return next;
}

export function renameBook(bookId: number, name: string) {
  const base = loadUserState();
  const next = cloneState(base);
  const entity = next.wordBookMap[bookId];
  const nextName = name.trim();

  if (!entity || !isBookEntity(entity) || !nextName) {
    return next;
  }

  next.wordBookMap[bookId] = {
    ...entity,
    name: nextName,
    updatedAt: Date.now(),
  };
  pushUpdate(next, "rename-book", { bookId, name: nextName });

  saveUserState(next);
  return next;
}

export function addWordToBook(bookId: number, word: string) {
  const base = loadUserState();
  const next = cloneState(base);
  const normalized = normalizeWord(word);
  const entity = next.wordBookMap[bookId];

  if (!entity || !isBookEntity(entity)) {
    return next;
  }

  const wordState = ensureWordState(next, normalized);
  if (!entity.wordsByAdd.includes(normalized)) {
    const wordsByAdd = [normalized, ...entity.wordsByAdd];
    const wordsByAlpha = [...wordsByAdd].sort((left, right) => left.localeCompare(right));
    next.wordBookMap[bookId] = {
      ...entity,
      wordsByAdd,
      wordsByAlpha,
      updatedAt: Date.now(),
    };
  }

  if (!wordState.l.includes(bookId)) {
    wordState.l = [...wordState.l, bookId];
  }

  recomputeBookReport(next, bookId);
  pushUpdate(next, "add-word-to-book", { bookId, word: normalized });
  saveUserState(next);
  return next;
}

export function addWordsToBook(bookId: number, words: string[]) {
  const base = loadUserState();
  const next = cloneState(base);
  const entity = next.wordBookMap[bookId];

  if (!entity || !isBookEntity(entity)) {
    return next;
  }

  const normalizedWords = Array.from(
    new Set(words.map(normalizeWord).filter(Boolean)),
  );
  if (normalizedWords.length === 0) {
    return next;
  }

  const existingWords = new Set(entity.wordsByAdd);
  const addedWords = normalizedWords.filter((word) => !existingWords.has(word));

  normalizedWords.forEach((word) => {
    const wordState = ensureWordState(next, word);
    if (!wordState.l.includes(bookId)) {
      wordState.l = [...wordState.l, bookId];
    }
  });

  if (addedWords.length > 0) {
    const wordsByAdd = [...addedWords, ...entity.wordsByAdd];
    next.wordBookMap[bookId] = {
      ...entity,
      wordsByAdd,
      wordsByAlpha: [...wordsByAdd].sort((left, right) => left.localeCompare(right)),
      updatedAt: Date.now(),
    };
    recomputeBookReport(next, bookId);
    pushUpdate(next, "add-words-to-book", { bookId, words: addedWords });
    saveUserState(next);
  }

  return next;
}

export function importWordToBook(bookId: number, word: string, color: string) {
  const next = addWordToBook(bookId, word);
  const entity = next.wordBookMap[bookId];

  if (!entity || !isBookEntity(entity)) {
    return next;
  }

  const updated = cloneState(next);
  updated.wordBookMap[bookId] = {
    ...entity,
    color,
    updatedAt: Date.now(),
  };
  pushUpdate(updated, "update-book-color", { bookId, color });
  saveUserState(updated);
  return updated;
}

export function addWordToBuiltinBook(word: string) {
  return addWordToBook(BUILTIN_BOOK_ID, word);
}

export function addWordToStudy(word: string, bookId?: number) {
  let next = addWordToBook(bookId ?? loadUserState().wordBookList[0] ?? 1, word);
  next = cloneState(next);
  const normalized = normalizeWord(word);
  const wordState = ensureWordState(next, normalized);
  wordState.s = "a";
  wordState.a = 0;
  wordState.t = Date.now();
  next.studyList = [normalized, ...next.studyList.filter((item) => item !== normalized)];
  pushUpdate(next, "add-word-to-study", { bookId, word: normalized });
  saveUserState(next);
  return next;
}

export function applyWordReviewAction(word: string, action: WordReviewAction) {
  const base = loadUserState();
  const next = cloneState(base);
  const normalized = normalizeWord(word);
  const wordState = ensureWordState(next, normalized);
  const now = Date.now();
  const currentStage = normalizeReviewStage(wordState.a);

  wordState.lastReviewedAt = now;
  wordState.reviewCount += 1;
  if (action === "known") {
    if (currentStage >= MAX_REVIEW_STAGE) {
      wordState.s = "d";
      wordState.a = MAX_REVIEW_STAGE;
      wordState.t = now;
      next.studyList = next.studyList.filter((item) => item !== normalized);
    } else {
      const nextStage = (currentStage + 1) as ReviewStage;
      wordState.s = "a";
      wordState.a = nextStage;
      wordState.t = getNextReviewTime(nextStage, now);
      next.studyList = [normalized, ...next.studyList.filter((item) => item !== normalized)];
    }
    wordState.ignoredAt = undefined;
  } else if (action === "fuzzy") {
    wordState.s = "a";
    wordState.a = currentStage;
    wordState.t = getNextReviewTime(currentStage, now);
    wordState.fuzzyCount += 1;
    wordState.ignoredAt = undefined;
    next.studyList = [normalized, ...next.studyList.filter((item) => item !== normalized)];
  } else if (action === "forgotten") {
    const previousStage = Math.max(0, currentStage - 1) as ReviewStage;
    wordState.s = "a";
    wordState.a = previousStage;
    wordState.t = getNextReviewTime(previousStage, now);
    wordState.wrongCount += 1;
    wordState.ignoredAt = undefined;
    next.studyList = [normalized, ...next.studyList.filter((item) => item !== normalized)];
  } else if (action === "ignored") {
    wordState.s = "b";
    wordState.t = now;
    wordState.ignoredAt = now;
    next.studyList = next.studyList.filter((item) => item !== normalized);
  } else {
    wordState.s = "c";
    wordState.t = now;
    wordState.ignoredAt = undefined;
    next.studyList = next.studyList.filter((item) => item !== normalized);
  }

  for (const bookId of wordState.l) {
    recomputeBookReport(next, bookId);
  }

  pushUpdate(next, "set-word-status", {
    word: normalized,
    status: wordState.s,
    stage: wordState.a,
    nextReviewAt: wordState.t,
    action,
  });
  saveUserState(next);
  return next;
}

export function toggleWordFocus(word: string) {
  const base = loadUserState();
  const next = cloneState(base);
  const normalized = normalizeWord(word);
  const wordState = ensureWordState(next, normalized);

  wordState.focused = !wordState.focused;
  wordState.t = Date.now();
  pushUpdate(next, "toggle-word-focus", { word: normalized, focused: wordState.focused });
  saveUserState(next);
  return next;
}
