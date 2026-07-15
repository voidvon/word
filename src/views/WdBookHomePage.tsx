import { useMemo, useState } from "react";
import { ActionSheet, Card, Dialog, Input, List, NavBar, Popup, TextArea, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { getDictionaryWords } from "../services/dictionary";
import { computeAiBuckets, getBookReport, isBook } from "../services/wdbook";
import {
  addWordsToBook,
  createBook,
  deleteBook,
  importArticleWordsToBook,
  importWordToBook,
  loadUserState,
  renameBook,
} from "../services/userState";
import { extractTokenFrequencies, normalizeWordKey } from "../utils/articleTokenizer";
import type { WordBook } from "../types";

const fallbackBookColors = ["#2f80ed", "#27ae60", "#f2994a", "#eb5757", "#9b51e0", "#00a6a6"];
const defaultImportWordColor = "#2f80ed";
const importWordColors = [defaultImportWordColor, "#27ae60", "#f2994a", "#eb5757", "#9b51e0", "#00a6a6", "#34495e", "#df6d3c"];

export function WdBookHomePage() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => loadUserState());
  const [activeBook, setActiveBook] = useState<WordBook | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameBookName, setRenameBookName] = useState("");
  const [importVisible, setImportVisible] = useState(false);
  const [batchImportVisible, setBatchImportVisible] = useState(false);
  const [batchImportText, setBatchImportText] = useState("");
  const [articleImportVisible, setArticleImportVisible] = useState(false);
  const [articleImportText, setArticleImportText] = useState("");
  const [pendingImportMode, setPendingImportMode] = useState<"batch" | "article" | null>(null);

  const aiBuckets = useMemo(
    () => computeAiBuckets(state),
    [state],
  );
  const dictionaryWords = useMemo(() => getDictionaryWords(), []);
  const articleTokens = useMemo(() => extractTokenFrequencies(articleImportText), [articleImportText]);
  const articleOccurrenceCount = useMemo(
    () => articleTokens.reduce((total, token) => total + token.count, 0),
    [articleTokens],
  );
  const books = useMemo(
    () =>
      state.wordBookList
        .map((id) => state.wordBookMap[id])
        .filter((item): item is NonNullable<typeof item> => item !== undefined)
        .filter(isBook),
    [state],
  );

  function confirmCreateBook() {
    const name = newBookName.trim();
    if (!name) {
      Toast.show({ content: "请输入单词本名称" });
      return;
    }
    setState(createBook(name));
    setCreateVisible(false);
  }

  function confirmRenameBook() {
    const name = renameBookName.trim();
    if (!name || !activeBook) {
      Toast.show({ content: "请输入单词本名称" });
      return;
    }
    setState(renameBook(activeBook.id, name));
    setRenameVisible(false);
    setActiveBook(null);
  }

  function importWord(word: string, color: string) {
    if (!activeBook) {
      return;
    }
    const nextState = importWordToBook(activeBook.id, word, color);
    const nextActiveBook = nextState.wordBookMap[activeBook.id];
    setState(nextState);
    if (nextActiveBook && isBook(nextActiveBook)) {
      setActiveBook(nextActiveBook);
    }
    Toast.show({ content: "添加成功" });
  }

  function confirmBatchImport() {
    if (!activeBook) {
      return;
    }

    const words = batchImportText
      .split(/\r?\n/)
      .map((word) => word.trim())
      .filter(Boolean);
    if (words.length === 0) {
      Toast.show({ content: "请输入至少一个单词" });
      return;
    }

    const existingWords = new Set(activeBook.wordsByAdd);
    const addedCount = Array.from(new Set(words.map(normalizeWordKey))).filter(
      (word) => !existingWords.has(word),
    ).length;
    const nextState = addWordsToBook(activeBook.id, words);
    setState(nextState);
    setBatchImportVisible(false);
    setBatchImportText("");
    setActiveBook(null);
    Toast.show({
      content: addedCount > 0 ? `已导入 ${addedCount} 个单词` : "这些单词已在当前单词本中",
    });
  }

  function closeBatchImport() {
    setBatchImportVisible(false);
    setBatchImportText("");
    setActiveBook(null);
  }

  function confirmArticleImport() {
    if (!activeBook) {
      return;
    }
    if (articleTokens.length === 0) {
      Toast.show({ content: "文章中没有可导入的英文单词" });
      return;
    }

    const existingWords = new Set(activeBook.wordsByAdd);
    const addedCount = articleTokens.filter((token) => !existingWords.has(token.key)).length;
    const nextState = importArticleWordsToBook(activeBook.id, articleTokens);
    setState(nextState);
    setArticleImportVisible(false);
    setArticleImportText("");
    setActiveBook(null);
    Toast.show({ content: `已新增 ${addedCount} 个单词，累计 ${articleOccurrenceCount} 次出现` });
  }

  function closeArticleImport() {
    setArticleImportVisible(false);
    setArticleImportText("");
    setActiveBook(null);
  }

  return (
    <div className="page-grid">
      <Card className="mobile-card ai-wordbook-card">
        <h2 className="ai-wordbook-title">AI 单词本</h2>
        <div className="ai-bucket-grid">
          {aiBuckets.map((bucket) => (
            <button
              className={`ai-bucket-card tone-${bucket.tone}`}
              key={bucket.key}
              onClick={() => navigate(`/wdbook/ai/${bucket.key}`)}
              type="button"
            >
              <span>{bucket.title}</span>
              <strong>({bucket.count})</strong>
            </button>
          ))}
        </div>
      </Card>

      <Card className="mobile-card my-wordbook-card">
        <h2 className="ai-wordbook-title">我的单词本</h2>
        <div className="my-wordbook-grid">
          {books.map((book) => {
            const report = getBookReport(state, book);
            return (
              <div
                className="my-wordbook-item"
                key={book.id}
                onClick={() => navigate(`/wdbook/${book.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/wdbook/${book.id}`);
                  }
                }}
                role="button"
                style={{ background: book.color ?? fallbackBookColors[book.id % fallbackBookColors.length] }}
                tabIndex={0}
              >
                <strong>{book.name}</strong>
                <span>{report.total} 词</span>
                <button
                  aria-label={`${book.name} 更多操作`}
                  className="my-wordbook-more"
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveBook(book);
                    setActionVisible(true);
                  }}
                  type="button"
                >
                  ...
                </button>
              </div>
            );
          })}
          <button
            className="my-wordbook-item my-wordbook-item--new"
            onClick={() => {
              setNewBookName("");
              setCreateVisible(true);
            }}
            type="button"
          >
            <strong>＋ 新建单词本</strong>
          </button>
        </div>
      </Card>

      <ActionSheet
        actions={[
          {
            key: "batch-import",
            text: "批量导入单词",
          },
          {
            key: "article-import",
            text: "从文章中导入",
          },
          {
            key: "import",
            text: "从词库导入单词",
          },
          {
            key: "rename",
            text: "重命名",
          },
          {
            key: "delete",
            text: "删除单词本",
            danger: true,
          },
        ]}
        afterClose={() => {
          if (pendingImportMode === "batch") {
            setBatchImportVisible(true);
          } else if (pendingImportMode === "article") {
            setArticleImportVisible(true);
          }
          setPendingImportMode(null);
        }}
        cancelText="取消"
        extra={activeBook ? activeBook.name : "单词本操作"}
        onAction={(action) => {
          if (!activeBook) {
            return;
          }
          if (action.key === "batch-import") {
            setBatchImportText("");
            setPendingImportMode("batch");
            setActionVisible(false);
            return;
          }
          if (action.key === "article-import") {
            setArticleImportText("");
            setPendingImportMode("article");
            setActionVisible(false);
            return;
          }
          if (action.key === "import") {
            setActionVisible(false);
            setImportVisible(true);
            return;
          }
          if (action.key === "rename") {
            setRenameBookName(activeBook.name);
            setActionVisible(false);
            setRenameVisible(true);
            return;
          }
          if (action.key !== "delete") {
            return;
          }
          setState(deleteBook(activeBook.id));
          Toast.show({ content: `已删除 ${activeBook.name}` });
          setActiveBook(null);
          setActionVisible(false);
        }}
        onClose={() => {
          setActionVisible(false);
        }}
        visible={actionVisible}
      />

      <Popup
        bodyClassName="word-import-popup"
        destroyOnClose
        onClose={() => {
          setImportVisible(false);
          setActiveBook(null);
        }}
        position="right"
        visible={importVisible}
      >
        <div className="word-import-page">
          <NavBar
            className="word-import-navbar"
            onBack={() => {
              setImportVisible(false);
              setActiveBook(null);
            }}
          >
            从词库导入单词
          </NavBar>
          <List className="word-import-list">
            {dictionaryWords.map((item, index) => {
              const color = importWordColors[index % importWordColors.length] ?? defaultImportWordColor;
              const isImported = activeBook?.wordsByAdd.includes(item.word) ?? false;
              return (
                <List.Item
                  arrow={false}
                  className={isImported ? "is-imported" : undefined}
                  extra={isImported ? <span className="word-import-added">已添加</span> : null}
                  key={item.word}
                  onClick={() => importWord(item.word, color)}
                  prefix={<span className="word-import-color" style={{ background: color }} />}
                >
                  <span className="word-import-word">{item.word}</span>
                </List.Item>
              );
            })}
          </List>
        </div>
      </Popup>

      <Popup
        bodyClassName="article-import-popup"
        destroyOnClose
        onClose={closeArticleImport}
        position="right"
        visible={articleImportVisible}
      >
        <div className="article-import-page">
          <NavBar
            className="article-import-navbar"
            onBack={closeArticleImport}
            right={
              <button
                className="article-import-submit"
                disabled={articleTokens.length === 0}
                onClick={confirmArticleImport}
                type="button"
              >
                导入
              </button>
            }
          >
            从文章中导入
          </NavBar>
          <div className="article-import-editor">
            <label className="visually-hidden" htmlFor="article-import-text">
              粘贴英文文章
            </label>
            <TextArea
              autoFocus
              id="article-import-text"
              maxLength={100000}
              onChange={setArticleImportText}
              placeholder="Paste an English article here..."
              value={articleImportText}
            />
          </div>
          <div className="article-import-summary">
            <span>{articleTokens.length} 个单词</span>
            <span>{articleOccurrenceCount} 次出现</span>
          </div>
        </div>
      </Popup>

      <Popup
        bodyClassName="batch-import-popup"
        destroyOnClose
        onClose={closeBatchImport}
        position="right"
        visible={batchImportVisible}
      >
        <div className="batch-import-page">
          <NavBar
            className="batch-import-navbar"
            onBack={closeBatchImport}
            right={
              <button
                className="batch-import-submit"
                disabled={!batchImportText.trim()}
                onClick={confirmBatchImport}
                type="button"
              >
                导入
              </button>
            }
          >
            批量导入单词
          </NavBar>
          <div className="batch-import-editor">
            <label className="visually-hidden" htmlFor="batch-import-words">
              批量导入单词，每行一个
            </label>
            <TextArea
              autoFocus
              id="batch-import-words"
              maxLength={10000}
              onChange={setBatchImportText}
              placeholder={"apple\nbanana\norange"}
              value={batchImportText}
            />
          </div>
        </div>
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
              text: "创建",
              bold: true,
            },
          ],
        ]}
        closeOnAction={false}
        content={
          <div className="create-book-input-wrap">
            <Input
              autoFocus
              clearable
              maxLength={20}
              onChange={setNewBookName}
              onEnterPress={confirmCreateBook}
              placeholder="请输入单词本名称"
              value={newBookName}
            />
          </div>
        }
        onAction={(action) => {
          if (action.key === "cancel") {
            setCreateVisible(false);
            return;
          }
          confirmCreateBook();
        }}
        onClose={() => setCreateVisible(false)}
        title="新建单词本"
        visible={createVisible}
      />

      <Dialog
        actions={[
          [
            {
              key: "cancel",
              text: "取消",
            },
            {
              key: "confirm",
              text: "保存",
              bold: true,
            },
          ],
        ]}
        closeOnAction={false}
        content={
          <div className="create-book-input-wrap">
            <Input
              autoFocus
              clearable
              maxLength={20}
              onChange={setRenameBookName}
              onEnterPress={confirmRenameBook}
              placeholder="请输入单词本名称"
              value={renameBookName}
            />
          </div>
        }
        onAction={(action) => {
          if (action.key === "cancel") {
            setRenameVisible(false);
            setActiveBook(null);
            return;
          }
          confirmRenameBook();
        }}
        onClose={() => {
          setRenameVisible(false);
          setActiveBook(null);
        }}
        title="重命名单词本"
        visible={renameVisible}
      />
    </div>
  );
}
