import { useEffect, useMemo, useState } from "react";
import { Dialog, NavBar, Popup, SafeArea, Toast } from "antd-mobile";
import { DeleteOutline, UnorderedListOutline } from "antd-mobile-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getWords, searchWords } from "../services/dictionary";
import { MobileSearchBox } from "../ui/MobileSearchBox";
import { clearUserState, loadUserState, touchSearchWord } from "../services/userState";
import type { DictionaryWord } from "../types";

type HistoryEntry = {
  word: string;
  data: DictionaryWord | null;
};

const buildUpdatedAt = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}).format(new Date(__BUILD_TIMESTAMP__));

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(() => loadUserState());
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [clearCacheConfirmVisible, setClearCacheConfirmVisible] = useState(false);

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

  function clearCache() {
    const next = clearUserState();
    setState(next);
    setHistoryEntries([]);
    setQuery("");
    setSearchParams({}, { replace: true });
    setSettingsVisible(false);
    setClearCacheConfirmVisible(false);
    Toast.show({ content: "缓存已清空" });
  }

  return (
    <div className="dictionary-home">
      <header className="home-sticky-head">
        <section className="home-search-section" aria-label="查词">
          <div className="home-search-row">
            <MobileSearchBox value={query} onChange={updateQuery} onSubmit={submit} />
            <button
              aria-label="打开设置"
              className="home-settings-trigger"
              onClick={() => setSettingsVisible(true)}
              type="button"
            >
              <UnorderedListOutline />
            </button>
          </div>
        </section>
      </header>

      <Popup
        bodyClassName="home-settings-drawer"
        closeOnMaskClick
        destroyOnClose
        onClose={() => setSettingsVisible(false)}
        position="right"
        visible={settingsVisible}
      >
        <aside className="home-settings-panel" aria-label="设置">
          <SafeArea position="top" />
          <NavBar className="home-settings-navbar" onBack={() => setSettingsVisible(false)}>
            设置
          </NavBar>
          <div className="home-settings-content">
            <button className="home-clear-cache-button" onClick={() => setClearCacheConfirmVisible(true)} type="button">
              <DeleteOutline />
              <span>清空缓存</span>
            </button>
          </div>
          <div className="home-settings-version">版本更新 {buildUpdatedAt}</div>
          <SafeArea position="bottom" />
        </aside>
      </Popup>

      <Dialog
        actions={[
          [
            {
              key: "cancel",
              text: "取消",
            },
            {
              key: "confirm",
              text: "清空",
              bold: true,
            },
          ],
        ]}
        closeOnAction={false}
        content="将删除搜索历史、单词本和学习记录，且无法恢复。"
        onAction={(action) => {
          if (action.key === "cancel") {
            setClearCacheConfirmVisible(false);
            return;
          }
          clearCache();
        }}
        onClose={() => setClearCacheConfirmVisible(false)}
        style={{ "--z-index": "1200" }}
        title="清空缓存"
        visible={clearCacheConfirmVisible}
      />

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
