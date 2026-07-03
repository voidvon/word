import { STORAGE_KEY } from "../constants";
import { seedUserData } from "../data/seedBooks";
import type { AppUserData, WordBook, WordStateType, WordUserState } from "../types";

export const BUILTIN_BOOK_ID = 0;
export const BUILTIN_BOOK_NAME = "我的单词本";
const LEGACY_SEED_SEARCH_WORDS = ["seek", "evidence", "refund", "deactivate", "special"];
const LEGACY_SEED_WORDS = ["terminate", "legate", "salient", "appall", "succeed", "evidence", "refund"];
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
    updateList: [...state.updateList],
  };
}

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function ensureWordState(state: AppUserData, word: string) {
  const normalized = normalizeWord(word);
  const prev = state.wordUserMap[normalized];
  const nextWordState: WordUserState = {
    s: prev?.s ?? "a",
    a: prev?.a ?? 0,
    sc: prev?.sc ?? 0,
    t: prev?.t ?? Date.now(),
    l: prev?.l ?? [],
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
  const shouldMove = state.wordBookList[0] !== BUILTIN_BOOK_ID;

  if (isValidBuiltin && entity.name === BUILTIN_BOOK_NAME && shouldMove === false) {
    return state;
  }

  const now = Date.now();
  const next = cloneState(state);
  next.wordBookMap[BUILTIN_BOOK_ID] = {
    id: BUILTIN_BOOK_ID,
    kind: "book",
    name: BUILTIN_BOOK_NAME,
    color: isValidBuiltin ? entity.color : "#2f80ed",
    report: isValidBuiltin ? entity.report : { total: 0, mastered: 0 },
    wordsByAdd: isValidBuiltin ? [...entity.wordsByAdd] : [],
    wordsByAlpha: isValidBuiltin ? [...entity.wordsByAlpha] : [],
    createdAt: isValidBuiltin ? entity.createdAt : now,
    updatedAt: isValidBuiltin ? entity.updatedAt : now,
  };
  next.wordBookList = [
    BUILTIN_BOOK_ID,
    ...next.wordBookList.filter((id) => id !== BUILTIN_BOOK_ID),
  ];
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

function migrateUserState(state: AppUserData) {
  return removeLegacySeedSearchHistory(removeLegacySeedBooks(ensureBuiltinBook(state)));
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
    wordBookList: [
      BUILTIN_BOOK_ID,
      nextId,
      ...state.wordBookList.filter((id) => id !== BUILTIN_BOOK_ID),
    ],
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
  if (bookId === BUILTIN_BOOK_ID) {
    return loadUserState();
  }

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
  if (bookId === BUILTIN_BOOK_ID) {
    return loadUserState();
  }

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

export function setWordStatus(word: string, status: WordStateType) {
  const base = loadUserState();
  const next = cloneState(base);
  const normalized = normalizeWord(word);
  const wordState = ensureWordState(next, normalized);

  wordState.s = status;
  wordState.t = Date.now();
  if (status === "a") {
    wordState.a = 0;
    next.studyList = [normalized, ...next.studyList.filter((item) => item !== normalized)];
  } else {
    next.studyList = next.studyList.filter((item) => item !== normalized);
  }

  for (const bookId of wordState.l) {
    recomputeBookReport(next, bookId);
  }

  pushUpdate(next, "set-word-status", { word: normalized, status });
  saveUserState(next);
  return next;
}
