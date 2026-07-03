import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getWords, searchWords } from "../services/dictionary";
import { MobileSearchBox } from "../ui/MobileSearchBox";
import { loadUserState, touchSearchWord } from "../services/userState";
import type { DictionaryWord } from "../types";

type HistoryEntry = {
  word: string;
  data: DictionaryWord | null;
};

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(() => loadUserState());
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  const history = useMemo(() => state.searchList.slice(0, 10), [state.searchList]);
  const normalizedQuery = query.trim().toLowerCase();
  const searchResults = useMemo(() => searchWords(normalizedQuery), [normalizedQuery]);

  useEffect(() => {
    void getWords(history).then(setHistoryEntries);
  }, [history]);

  useEffect(() => {
    const queryFromUrl = searchParams.get("q") ?? "";
    if (queryFromUrl !== query) {
      setQuery(queryFromUrl);
    }
  }, [query, searchParams]);

  function updateQuery(nextQuery: string) {
    setQuery(nextQuery);
    setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace: true });
  }

  function submit(word: string) {
    setState(touchSearchWord(word));
  }

  function openWord(word: string) {
    setState(touchSearchWord(word));
    navigate(`/word/${encodeURIComponent(word)}`);
  }

  return (
    <div className="dictionary-home">
      <header className="home-sticky-head">
        <section className="home-search-section" aria-label="查词">
          <MobileSearchBox value={query} onChange={updateQuery} onSubmit={submit} />
        </section>
      </header>

      {normalizedQuery ? (
        <section className="search-results" aria-label="搜索结果">
          <div className="search-results__head">
            <h2>搜索结果</h2>
            <span>{searchResults.length} 个</span>
          </div>
          <div className="search-results__list">
            {searchResults.length === 0 ? (
              <p className="search-results__empty">本地词库中未找到相关内容</p>
            ) : null}
            {searchResults.map((item) => (
              <button
                key={item.word}
                className="search-result-item"
                onClick={() => openWord(item.word)}
                type="button"
              >
                <span>
                  <strong>{item.word}</strong>
                  <small>{item.ipa ?? "暂无音标"}</small>
                </span>
                <em>{item.trans?.[0] ? `${item.trans[0].pos} ${item.trans[0].text}` : "暂无释义"}</em>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="home-history" aria-label="搜索历史">
          <div className="home-history__head">
            <h2>搜索历史</h2>
          </div>
          <div className="home-history__list">
            {historyEntries.length === 0 && (
              <p className="home-history__empty">暂无搜索历史</p>
            )}
            {historyEntries.map(({ word, data }) => (
              <button
                key={word}
                className="home-history__item"
                onClick={() => openWord(word)}
                type="button"
              >
                <span className="home-history__clock" aria-hidden="true">◷</span>
                <span>
                  <strong>{word}</strong>
                  <small>{data?.trans?.[0]?.text ?? "本地词典暂无释义"}</small>
                </span>
                <em>{state.wordUserMap[word]?.sc ?? 0} 次</em>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
