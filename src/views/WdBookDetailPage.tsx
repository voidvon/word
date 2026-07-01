import { useMemo, useState } from "react";
import { ActionSheet, Button, Card, Selector, Toast } from "antd-mobile";
import { useParams } from "react-router-dom";
import { loadUserState, setWordStatus } from "../services/userState";
import { getBookWords, isBook } from "../services/wdbook";

function getTileTone(status?: "a" | "b" | "c" | "d") {
  if (status === "b") {
    return "tile-gray";
  }
  if (status === "c") {
    return "tile-red";
  }
  if (status === "d") {
    return "tile-purple";
  }
  return "tile-orange";
}

export function WdBookDetailPage() {
  const { bookId } = useParams();
  const [sortMode, setSortMode] = useState<"add" | "alpha">("add");
  const [state, setState] = useState(() => loadUserState());
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const entity = state.wordBookMap[Number(bookId)];
  const book = entity && isBook(entity) ? entity : null;

  const words = useMemo(() => {
    if (!book) {
      return [];
    }
    return getBookWords(book, sortMode);
  }, [book, sortMode]);

  if (!book) {
    return (
      <section className="panel">
        <h2>单词本不存在</h2>
      </section>
    );
  }

  return (
    <section className="detail-panel">
      <Card className="mobile-card">
        <div>
          <p className="eyebrow">单词本详情</p>
          <h2>{book.name}</h2>
        </div>
        <Selector
          className="sort-selector"
          columns={2}
          showCheckMark
          options={[
            { label: "按添加顺序", value: "add" },
            { label: "按字母顺序", value: "alpha" },
          ]}
          value={[sortMode]}
          onChange={(value) => {
            const next = value[0];
            if (next === "add" || next === "alpha") {
              setSortMode(next);
            }
          }}
        />
      </Card>

      <Card className="mobile-card">
        <div className="word-grid">
        {words.map((word) => (
          <Button
            key={word}
            block
            fill="solid"
            size="small"
            className={`word-tile ${getTileTone(state.wordUserMap[word]?.s)} ${
              activeWord === word ? "is-selected" : ""
            }`}
            onClick={() => {
              setActiveWord(word);
              setActionVisible(true);
            }}
          >
            {word}
          </Button>
        ))}
        </div>
      </Card>

      <ActionSheet
        visible={actionVisible}
        onClose={() => setActionVisible(false)}
        extra={activeWord ? `当前单词：${activeWord}` : "单词操作"}
        actions={[
          {
            text: "标记为学习中",
            key: "a",
          },
          {
            text: "标记为忽略",
            key: "b",
          },
          {
            text: "标记为砍掉",
            key: "c",
          },
          {
            text: "标记为已背会",
            key: "d",
          },
        ]}
        cancelText="取消"
        onAction={(action) => {
          if (!activeWord) {
            return;
          }
          const next = setWordStatus(activeWord, action.key as "a" | "b" | "c" | "d");
          setState(next);
          setActionVisible(false);
          Toast.show({
            content: `已更新 ${activeWord} 的状态`,
          });
        }}
      />
    </section>
  );
}
