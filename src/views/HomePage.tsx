import { useEffect, useMemo, useState } from "react";
import { Card, List, Tabs } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { getWords } from "../services/dictionary";
import { MobileSearchBox } from "../ui/MobileSearchBox";
import { loadUserState, touchSearchWord } from "../services/userState";
import type { DictionaryWord } from "../types";

const tabs = ["每日推荐", "单词块", "知识圈"] as const;

type HistoryEntry = {
  word: string;
  data: DictionaryWord | null;
};

export function HomePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("每日推荐");
  const [state, setState] = useState(() => loadUserState());
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  const history = useMemo(() => state.searchList.slice(0, 10), [state.searchList]);

  useEffect(() => {
    void getWords(history).then(setHistoryEntries);
  }, [history]);

  function submit(word: string) {
    const next = touchSearchWord(word);
    setState(next);
    navigate(`/word?wd=${encodeURIComponent(word)}&l=en`);
  }

  return (
    <div className="page-grid">
      <Card className="mobile-card">
        <MobileSearchBox onSubmit={submit} />
        <Tabs
          className="mobile-tabs"
          activeKey={tab}
          onChange={(key) => {
            const next = key as (typeof tabs)[number];
            setTab(next);
            if (next === "单词块") {
              navigate("/wdbook");
            }
          }}
        >
          {tabs.map((item) => (
            <Tabs.Tab title={item} key={item} />
          ))}
        </Tabs>
      </Card>

      <Card className="mobile-card" title="搜索历史">
        <div className="section-note">按最近查询时间倒序，已去重</div>
        <List className="history-mobile-list">
          {historyEntries.map(({ word, data }) => (
            <List.Item
              key={word}
              onClick={() => navigate(`/word?wd=${encodeURIComponent(word)}&l=en`)}
              clickable
              description={data?.trans?.[0]?.text ?? "本地词典暂无释义"}
              extra={`已查询 ${state.wordUserMap[word]?.sc ?? 0} 次`}
            >
              {word}
            </List.Item>
          ))}
        </List>
      </Card>
    </div>
  );
}
