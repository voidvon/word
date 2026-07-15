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

export type WordStateType = "n" | "a" | "b" | "c" | "d";
export type WordReviewAction = "known" | "fuzzy" | "forgotten" | "cut" | "ignored";
export type ReviewStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type WordUserState = {
  s?: WordStateType;
  a?: ReviewStage;
  sc: number;
  reviewCount: number;
  createdAt: number;
  lastReviewedAt?: number;
  t?: number;
  l: number[];
  fuzzyCount: number;
  ec: number;
  focused: boolean;
  ignoredAt?: number;
  previousStatus?: "n" | "a";
  displayText?: string;
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
  articleWordCounts: Record<string, number>;
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
  version: 2;
  searchList: string[];
  studyList: string[];
  wordUserMap: WordUserStateMap;
  wordBookList: number[];
  wordBookMap: Record<number, WordBookEntity>;
  aiBucketPrefs: Record<string, {
    enabled: boolean;
    order: number;
    updatedAt: number;
  }>;
  updateList: Array<{
    type: string;
    payload: unknown;
    createdAt: number;
  }>;
};

export type AiBucketTone = "orange" | "blue" | "green" | "gray" | "red" | "purple" | "teal" | "black";
export type AiBucketRuleType = "local-rule" | "ai-generated" | "remote";
export type AiBucketKey =
  | "due"
  | "hard"
  | "mastered"
  | "ignored";

export type ArticleTokenFrequency = {
  key: string;
  displayText: string;
  count: number;
  firstIndex: number;
};

export type AiBucketDefinition = {
  key: AiBucketKey;
  title: string;
  tone: AiBucketTone;
  description?: string;
  enabled: boolean;
  order: number;
  ruleType: AiBucketRuleType;
};

export type AiBucket = {
  key: AiBucketKey;
  title: string;
  count: number;
  tone: AiBucketTone;
  description?: string;
  order: number;
  ruleType: AiBucketRuleType;
};
