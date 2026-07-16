import { useEffect, useMemo, useState } from "react";
import { Button, NavBar, Toast } from "antd-mobile";
import { LeftOutline, RightOutline } from "antd-mobile-icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getWord } from "../services/dictionary";
import {
  applyWordReviewAction,
  loadUserState,
  restoreWordReviewState,
  toggleWordMark,
} from "../services/userState";
import { normalizeWordKey } from "../utils/articleTokenizer";
import type { DictionaryWord, WordReviewAction, WordStateType } from "../types";

const statusText: Record<WordStateType, string> = {
  n: "未背诵",
  a: "学习中",
  b: "已忽略",
  c: "已砍掉",
  d: "已背会",
};

type WordReviewLocationState = {
  index?: number;
  words?: string[];
};

export function WdBookWordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { word = "" } = useParams();
  const decodedWord = normalizeWordKey(decodeURIComponent(word));
  const [wordData, setWordData] = useState<DictionaryWord | null | undefined>(undefined);
  const [userState, setUserState] = useState(() => loadUserState());
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const wordState = userState.wordUserMap[decodedWord];
  const displayWord = wordState?.displayText ?? decodedWord;
  const isCooling = wordState?.s === "a" && wordState.t !== undefined && wordState.t > Date.now();
  const isSuspended = wordState?.s === "b" || wordState?.s === "c";
  const isCompleted = wordState?.s === "d";
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

  function applyReviewAction(action: WordReviewAction, shouldGoNext = false) {
    const next = applyWordReviewAction(decodedWord, action);
    setUserState(next);
    const updatedWordState = next.wordUserMap[decodedWord];
    const stage = updatedWordState?.a ?? 0;
    const feedback =
      action === "known"
        ? updatedWordState?.s === "d"
          ? "已完成第 7 级背诵"
          : `已进入第 ${stage} 级`
        : action === "fuzzy"
          ? `保持在第 ${stage} 级`
          : action === "forgotten"
            ? `已退回第 ${stage} 级`
            : action === "cut"
              ? "已砍掉"
              : "已忽略";
    Toast.show({ content: feedback });
    if (shouldGoNext) {
      goNextWord();
    }
  }

  function toggleFocus() {
    const next = toggleWordMark(decodedWord);
    setUserState(next);
    const isMarked = next.wordUserMap[decodedWord]?.m === 1;
    Toast.show({ content: isMarked ? "已收藏" : "已取消收藏" });
  }

  function restoreStatus() {
    const next = restoreWordReviewState(decodedWord);
    setUserState(next);
    Toast.show({ content: "已恢复原背诵状态" });
  }

  function toggleReviewStatus(action: "cut" | "ignored", activeStatus: "b" | "c") {
    if (wordState?.s === activeStatus) {
      restoreStatus();
      return;
    }
    applyReviewAction(action, true);
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
        <h1>{displayWord}</h1>
        <div className="wdbook-word-meta">
          <span>{wordData?.ipa ? `英 ${wordData.ipa}` : "暂无音标"}</span>
          {wordData?.tags?.[0] ? <span>{wordData.tags[0]}</span> : null}
        </div>
        <p className="wdbook-word-sentence">{primaryMeaning}</p>
      </section>

      <section className="wdbook-word-actions">
        <button className="wdbook-progress-card" type="button">
          <strong>{wordState?.a === undefined ? "未开始" : `第 ${wordState.a} 级`}</strong>
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
          <span>{wordState?.s ? statusText[wordState.s] : "未加入"}</span>
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
        <div
          className="wdbook-word-quick-actions"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <button
            aria-label={wordState?.s === "c" ? "取消砍掉" : "砍掉"}
            className={wordState?.s === "c" ? "is-active" : ""}
            disabled={isCompleted}
            onClick={() => toggleReviewStatus("cut", "c")}
            type="button"
          >
            砍
          </button>
          <button
            aria-label={wordState?.s === "b" ? "取消禁用" : "禁用"}
            className={wordState?.s === "b" ? "is-active" : ""}
            disabled={isCompleted}
            onClick={() => toggleReviewStatus("ignored", "b")}
            type="button"
          >
            禁
          </button>
          <button
            aria-label={wordState?.m === 1 ? "取消收藏" : "收藏"}
            className={wordState?.m === 1 ? "is-active" : ""}
            onClick={toggleFocus}
            type="button"
          >
            藏
          </button>
        </div>
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
          {isSuspended ? (
            <div className="wdbook-review-message is-wide">
              {wordState?.s === "b" ? "该词已禁用，点击右上角“禁”恢复" : "该词已砍掉，点击右上角“砍”恢复"}
            </div>
          ) : isCompleted ? (
            <div className="wdbook-review-message is-wide">该词已完成第 7 级背诵</div>
          ) : (
            <>
              {isCooling ? (
                <div className="wdbook-review-message">
                  该词在记忆冷却期中
                  <small>{wordState?.t ? new Date(wordState.t).toLocaleString() : null}</small>
                </div>
              ) : (
                <>
                  <Button block color="success" onClick={() => applyReviewAction("known", true)}>
                    认识
                  </Button>
                  <Button block color="warning" onClick={() => applyReviewAction("fuzzy", true)}>
                    模糊
                  </Button>
                  <Button block color="danger" onClick={() => applyReviewAction("forgotten", true)}>
                    不认识
                  </Button>
                </>
              )}
            </>
          )}
        </footer>
      ) : null}
    </article>
  );
}
