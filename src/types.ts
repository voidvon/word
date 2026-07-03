export type DictionaryWord = {
  word: string;
  ipa?: string;
  frm?: string;
  tags?: string[];
  spoken?: {
    rank?: number;
    total?: number;
    lemmas?: string;
  };
  pos_percents?: Array<{
    pos: string;
    rank?: number;
    total?: number;
  }>;
  trans_percents?: Array<{
    text: string;
    percent: number;
  }>;
  trans?: Array<{
    pos: string;
    text: string;
  }>;
};

export type WordStateType = "a" | "b" | "c" | "d";

export type WordUserState = {
  s: WordStateType;
  a?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  sc: number;
  t: number;
  l: number[];
};

export type WordUserStateMap = Record<string, WordUserState>;

export type WordBook = {
  id: number;
  kind: "book";
  name: string;
  color?: string;
  report: {
    total: number;
    mastered: number;
  };
  wordsByAdd: string[];
  wordsByAlpha: string[];
  createdAt: number;
  updatedAt: number;
};

export type WordBookGroup = {
  id: number;
  kind: "group";
  name: string;
  bookIds: number[];
  createdAt: number;
  updatedAt: number;
};

export type WordBookEntity = WordBook | WordBookGroup;

export type AppUserData = {
  version: 1;
  searchList: string[];
  studyList: string[];
  wordUserMap: WordUserStateMap;
  wordBookList: number[];
  wordBookMap: Record<number, WordBookEntity>;
  updateList: Array<{
    type: string;
    payload: unknown;
    createdAt: number;
  }>;
};

export type AiBucket = {
  key: string;
  title: string;
  count: number;
  tone: "orange" | "blue" | "green" | "gray" | "red" | "purple" | "teal" | "black";
};
