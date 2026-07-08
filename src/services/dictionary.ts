import type { DictionaryWord } from "../types";

const eagerModules = import.meta.glob<DictionaryWord>("../data/dictionary/*.json", {
  eager: true,
  import: "default",
});

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

export async function getWord(word: string): Promise<DictionaryWord | null> {
  const normalized = normalizeWord(word);
  return eagerModules[`../data/dictionary/${normalized}.json`] ?? null;
}

export async function getWords(words: string[]) {
  const items = await Promise.all(
    words.map(async (word) => ({
      word,
      data: await getWord(word),
    })),
  );
  return items;
}

export function getDictionaryWords() {
  return Object.values(eagerModules).sort((left, right) => left.word.localeCompare(right.word));
}

function getSearchText(item: DictionaryWord) {
  return [
    item.word,
    item.ipa,
    item.frm,
    item.tags?.join(" "),
    item.trans?.map((trans) => `${trans.pos} ${trans.text}`).join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function searchWords(query: string, limit = 20) {
  const normalized = normalizeWord(query);
  if (!normalized) {
    return [];
  }

  const words = Object.values(eagerModules);
  const startsWithMatches: DictionaryWord[] = [];
  const includesMatches: DictionaryWord[] = [];

  for (const item of words) {
    const word = item.word.toLowerCase();
    if (word.startsWith(normalized)) {
      startsWithMatches.push(item);
      continue;
    }
    if (getSearchText(item).includes(normalized)) {
      includesMatches.push(item);
    }
  }

  return [...startsWithMatches, ...includesMatches]
    .sort((left, right) => left.word.localeCompare(right.word))
    .slice(0, limit);
}
