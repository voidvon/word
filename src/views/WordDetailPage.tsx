import { useEffect, useMemo, useState } from "react";
import { LeftOutline, StarOutline } from "antd-mobile-icons";
import { useNavigate, useParams } from "react-router-dom";
import { getWord, searchWords } from "../services/dictionary";
import { addWordToBuiltinBook } from "../services/userState";
import type { DictionaryWord } from "../types";

export function WordDetailPage() {
  const navigate = useNavigate();
  const { word = "" } = useParams();
  const decodedWord = decodeURIComponent(word).toLowerCase();
  const [wordData, setWordData] = useState<DictionaryWord | null | undefined>(undefined);

  useEffect(() => {
    setWordData(undefined);
    void getWord(decodedWord).then(setWordData);
  }, [decodedWord]);

  useEffect(() => {
    if (wordData) {
      addWordToBuiltinBook(wordData.word);
    }
  }, [wordData]);

  const suggestions = useMemo(
    () => searchWords(decodedWord.slice(0, Math.max(1, decodedWord.length - 1)), 8)
      .filter((item) => item.word !== decodedWord)
      .slice(0, 6),
    [decodedWord],
  );

  return (
    <article className="word-detail-page">
      <header className="word-detail-hero">
        <div className="word-detail-top">
          <button aria-label="返回" className="word-detail-icon-button" onClick={() => navigate(-1)} type="button">
            <LeftOutline />
          </button>
          <h1>{decodedWord}</h1>
          <button aria-label="收藏" className="word-detail-icon-button" type="button">
            <StarOutline />
          </button>
        </div>

        <div className="word-pronunciation-row">
          <span>英 {wordData?.ipa ?? "暂无音标"}</span>
        </div>

        {wordData?.tags?.length ? (
          <div className="word-tag-row">
            {wordData.tags.slice(0, 4).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </header>

      <section className="word-detail-section">
        <div className="word-translation-list">
          {wordData === undefined ? <p>加载中...</p> : null}
          {wordData === null ? <p>本地词典中未找到该词条。</p> : null}
          {wordData?.trans?.map((item, index) => (
            <p key={`${item.pos}-${index}`}>
              <span>{index + 1}.</span> <strong>{item.pos}</strong> {item.text}
            </p>
          ))}
          {wordData?.frm ? (
            <p className="word-forms"><span>时态:</span> {wordData.frm}</p>
          ) : null}
        </div>
      </section>

      <section className="word-detail-section">
        <div className="word-suggestions">
          <h3>您要查找的是不是：</h3>
          {suggestions.length === 0 ? <p className="word-muted">暂无相近词</p> : null}
          {suggestions.map((item) => (
            <button
              key={item.word}
              onClick={() => navigate(`/word/${encodeURIComponent(item.word)}`)}
              type="button"
            >
              <strong>{item.word}</strong>
              <span>{item.trans?.[0] ? `${item.trans[0].pos} ${item.trans[0].text}` : "暂无释义"}</span>
            </button>
          ))}
        </div>
      </section>
    </article>
  );
}
