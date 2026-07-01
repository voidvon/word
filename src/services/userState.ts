import { STORAGE_KEY } from "../constants";
import { seedUserData } from "../data/seedBooks";
import type { AppUserData, WordBook, WordStateType, WordUserState } from "../types";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadUserState(): AppUserData {
  if (!canUseStorage()) {
    return seedUserData;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUserData));
    return seedUserData;
  }

  try {
    return JSON.parse(raw) as AppUserData;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUserData));
    return seedUserData;
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
    wordBookList: [nextId, ...state.wordBookList],
    wordBookMap: {
      ...state.wordBookMap,
      [nextId]: {
        id: nextId,
        kind: "book",
        name,
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
