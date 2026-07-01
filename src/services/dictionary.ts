import type { DictionaryWord } from "../types";

type DictionaryWordModule = {
  default: DictionaryWord;
};

const modules = import.meta.glob<DictionaryWordModule>("../../output/*.json");

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

export async function getWord(word: string): Promise<DictionaryWord | null> {
  const normalized = normalizeWord(word);
  const loader = modules[`../../output/${normalized}.json`];
  if (!loader) {
    return null;
  }
  const mod = await loader();
  return mod.default;
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
