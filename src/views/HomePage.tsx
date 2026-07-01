import { useEffect, useMemo, useState } from "react";
import { Card, List } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { getWords } from "../services/dictionary";
import { MobileSearchBox } from "../ui/MobileSearchBox";
import { loadUserState } from "../services/userState";
import type { DictionaryWord } from "../types";

type HistoryEntry = {
  word: string;
  data: DictionaryWord | null;
};

export function HomePage() {
  const navigate = useNavigate();
  const [state] = useState(() => loadUserState());
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  const history = useMemo(() => state.searchList.slice(0, 10), [state.searchList]);

  useEffect(() => {
    void getWords(history).then(setHistoryEntries);
  }, [history]);

  function submit(word: string) {
    navigate(`/word?wd=${encodeURIComponent(word)}&l=en`);
  }

  return (
    <div className="page-grid">
      <Card className="mobile-card">
        <MobileSearchBox onSubmit={submit} />
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
