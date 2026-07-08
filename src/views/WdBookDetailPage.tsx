import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { Button, NavBar } from "antd-mobile";
import { FilterOutline } from "antd-mobile-icons";
import { useNavigate, useParams } from "react-router-dom";
import { loadUserState } from "../services/userState";
import { computeAiBuckets, getAiBucketWords, getBookWords, isBook } from "../services/wdbook";

type SortMode = "add" | "alpha";

type WordTileStyle = CSSProperties & {
  "--word-tile-font-size": string;
};

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

function getTileFontSize(word: string) {
  const safeLength = Math.max(word.length, 1);
  const fittedSize = Math.floor(80 / (safeLength * 0.48));
  return Math.max(7, Math.min(14, fittedSize));
}

export function WdBookDetailPage() {
  const navigate = useNavigate();
  const { bookId, bucketKey } = useParams();
  const [state] = useState(() => loadUserState());
  const [sortMode, setSortMode] = useState<SortMode>("add");
  const entity = state.wordBookMap[Number(bookId)];
  const book = entity && isBook(entity) ? entity : null;
  const aiBucket = useMemo(
    () => computeAiBuckets(state).find((bucket) => bucket.key === bucketKey),
    [bucketKey, state],
  );
  const pageTitle = aiBucket?.title.replace(/^[^\u4e00-\u9fa5A-Za-z]+\s*/, "") ?? book?.name ?? "单词块列表";

  const words = useMemo(() => {
    if (bucketKey) {
      const bucketWords = getAiBucketWords(state, bucketKey);
      return sortMode === "alpha"
        ? [...bucketWords].sort((left, right) => left.localeCompare(right))
        : bucketWords;
    }
    if (!book) {
      return [];
    }
    return getBookWords(book, sortMode);
  }, [book, bucketKey, sortMode, state]);

  function toggleSortMode() {
    setSortMode((current) => (current === "add" ? "alpha" : "add"));
  }

  if (!book && !aiBucket) {
    return (
      <section className="word-block-list-page">
        <NavBar className="word-block-navbar" onBack={() => navigate(-1)}>
          单词块列表
        </NavBar>
        <div className="word-block-list-empty">入口不存在</div>
      </section>
    );
  }

  return (
    <section className="word-block-list-page">
      <NavBar
        className="word-block-navbar"
        onBack={() => navigate(-1)}
        right={
          <button
            aria-label={`切换排序，当前为${sortMode === "add" ? "添加顺序" : "字母顺序"}`}
            className="word-block-sort-button"
            onClick={toggleSortMode}
            type="button"
          >
            <FilterOutline />
            <span>{sortMode === "add" ? "添加" : "A-Z"}</span>
          </button>
        }
      >
        {pageTitle}
      </NavBar>

      <div className={`word-block-list-body${book ? " is-book-list" : ""}`}>
        <div className="word-grid">
          {words.map((word, index) => (
            <Button
              key={word}
              block
              fill="solid"
              size="small"
              className={`word-tile ${getTileTone(state.wordUserMap[word]?.s)}`}
              style={{ "--word-tile-font-size": `${getTileFontSize(word)}px` } as WordTileStyle}
              onClick={() =>
                navigate(`/wdbook/word/${encodeURIComponent(word)}`, {
                  state: {
                    index,
                    words,
                  },
                })
              }
            >
              {word}
            </Button>
          ))}
        </div>

        <div className="word-block-list-count">
          {words.length === 0 ? "暂无单词" : `${words.length} 个单词`}
        </div>
      </div>
    </section>
  );
}
