import { useEffect, useMemo, useState } from "react";
import { Button, NavBar, Toast } from "antd-mobile";
import { LeftOutline, RightOutline } from "antd-mobile-icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getWord } from "../services/dictionary";
import { loadUserState, setWordStatus, toggleWordFocus } from "../services/userState";
import type { DictionaryWord, WordStateType } from "../types";

const statusText: Record<WordStateType, string> = {
  a: "学习中",
  b: "已忽略",
  c: "不认识",
  d: "已认识",
};

type WordReviewLocationState = {
  index?: number;
  words?: string[];
};

export function WdBookWordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { word = "" } = useParams();
  const decodedWord = decodeURIComponent(word).toLowerCase();
  const [wordData, setWordData] = useState<DictionaryWord | null | undefined>(undefined);
  const [userState, setUserState] = useState(() => loadUserState());
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const wordState = userState.wordUserMap[decodedWord];
  const reviewState = location.state as WordReviewLocationState | null;
  const reviewWords = Array.isArray(reviewState?.words) ? reviewState.words : [];
  const reviewIndex =
    typeof reviewState?.index === "number"
      ? reviewState.index
      : reviewWords.findIndex((item) => item === decodedWord);

  useEffect(() => {
    setWordData(undefined);
    setIsAnswerVisible(false);
    void getWord(decodedWord).then(setWordData);
  }, [decodedWord]);

  const primaryMeaning = useMemo(() => {
    const first = wordData?.trans?.[0];
    if (!first) {
      return "暂无释义";
    }
    return `${first.pos} ${first.text}`;
  }, [wordData]);

  function updateStatus(status: WordStateType, shouldGoNext = false) {
    const next = setWordStatus(decodedWord, status);
    setUserState(next);
    Toast.show({
      content:
        status === "d"
          ? "已标记为认识"
          : status === "a"
            ? "已标记为模糊"
            : status === "b"
              ? "已忽略"
              : "已标记为忘记",
    });
    if (shouldGoNext) {
      goNextWord();
    }
  }

  function toggleFocus() {
    const next = toggleWordFocus(decodedWord);
    setUserState(next);
    const isFocused = next.wordUserMap[decodedWord]?.focused ?? false;
    Toast.show({ content: isFocused ? "已加入重点关注" : "已取消重点关注" });
  }

  function goNextWord() {
    if (reviewIndex < 0 || reviewWords.length === 0) {
      return;
    }

    const nextWord = reviewWords[reviewIndex + 1];
    if (!nextWord) {
      Toast.show({ content: "已完成当前单词块" });
      navigate(-1);
      return;
    }

    navigate(`/wdbook/word/${encodeURIComponent(nextWord)}`, {
      replace: true,
      state: {
        index: reviewIndex + 1,
        words: reviewWords,
      },
    });
  }

  return (
    <article className="wdbook-word-page">
      <NavBar className="wdbook-word-navbar" backArrow={<LeftOutline />} onBack={() => navigate(-1)}>
        单词块
      </NavBar>

      <section className="wdbook-word-hero">
        <h1>{decodedWord}</h1>
        <div className="wdbook-word-meta">
          <span>{wordData?.ipa ? `英 ${wordData.ipa}` : "暂无音标"}</span>
          {wordData?.tags?.[0] ? <span>{wordData.tags[0]}</span> : null}
        </div>
        <p className="wdbook-word-sentence">{primaryMeaning}</p>
      </section>

      <section className="wdbook-word-actions">
        <button className="wdbook-progress-card" type="button">
          <strong>{wordState?.a ?? 0}%</strong>
          <span>累计学习 {wordState?.reviewCount ?? 0} 次</span>
          <RightOutline />
        </button>
        <button
          className="wdbook-action-card"
          onClick={() => navigate(`/word/${encodeURIComponent(decodedWord)}`)}
          type="button"
        >
          <span>词典</span>
        </button>
        <button className="wdbook-action-card" type="button">
          <span>{statusText[wordState?.s ?? "a"]}</span>
        </button>
      </section>

      <section className="wdbook-word-secondary-actions">
        <button className={wordState?.focused ? "is-active" : ""} onClick={toggleFocus} type="button">
          {wordState?.focused ? "已重点关注" : "重点关注"}
        </button>
        <button className={wordState?.s === "b" ? "is-active" : ""} onClick={() => updateStatus("b")} type="button">
          忽略
        </button>
      </section>

      <section
        className={`wdbook-answer-card${isAnswerVisible ? " is-visible" : ""}`}
        onClick={() => {
          if (!isAnswerVisible) {
            setIsAnswerVisible(true);
          }
        }}
        onKeyDown={(event) => {
          if (!isAnswerVisible && (event.key === "Enter" || event.key === " ")) {
            setIsAnswerVisible(true);
          }
        }}
        role={isAnswerVisible ? undefined : "button"}
        tabIndex={isAnswerVisible ? undefined : 0}
      >
        <div className="wdbook-answer-badge">{wordState?.reviewCount ?? 0}</div>
        {isAnswerVisible ? (
          <div className="wdbook-answer-content">
            {wordData === undefined ? <p>加载中...</p> : null}
            {wordData === null ? <p>本地词典中未找到该词条。</p> : null}
            {wordData?.trans?.map((item, index) => (
              <p key={`${item.pos}-${index}`}>
                <strong>{item.pos}</strong> {item.text}
              </p>
            ))}
            {wordData?.frm ? <p className="wdbook-answer-forms">{wordData.frm}</p> : null}
          </div>
        ) : (
          <div className="wdbook-answer-placeholder">
            <strong>点击显示答案</strong>
          </div>
        )}
      </section>

      {isAnswerVisible ? (
        <footer className="wdbook-review-bar">
          <Button block color="success" onClick={() => updateStatus("d", true)}>
            认识
          </Button>
          <Button block color="warning" onClick={() => updateStatus("a", true)}>
            模糊
          </Button>
          <Button block color="danger" onClick={() => updateStatus("c", true)}>
            忘记
          </Button>
        </footer>
      ) : null}
    </article>
  );
}
