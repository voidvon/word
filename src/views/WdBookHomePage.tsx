import { useMemo, useState } from "react";
import { ActionSheet, Card, Dialog, Input, Toast } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { computeAiBuckets, getBookReport, isBook } from "../services/wdbook";
import {
  BUILTIN_BOOK_ID,
  createBook,
  deleteBook,
  loadUserState,
  renameBook,
} from "../services/userState";
import type { WordBook } from "../types";

const fallbackBookColors = ["#2f80ed", "#27ae60", "#f2994a", "#eb5757", "#9b51e0", "#00a6a6"];

export function WdBookHomePage() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => loadUserState());
  const [activeBook, setActiveBook] = useState<WordBook | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [newBookName, setNewBookName] = useState("");
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameBookName, setRenameBookName] = useState("");

  const aiBuckets = useMemo(
    () => computeAiBuckets(state),
    [state],
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

  return (
    <div className="page-grid">
      <Card className="mobile-card hero-mobile-card">
        <div className="hero-stats hero-stats-mobile">
          <Card>
            <span>总词汇量</span>
            <strong>{Object.keys(state.wordUserMap).length}</strong>
          </Card>
          <Card>
            <span>搜索历史</span>
            <strong>{state.searchList.length}</strong>
          </Card>
          <Card>
            <span>待复习</span>
            <strong>{state.studyList.length}</strong>
          </Card>
        </div>
      </Card>

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
                {book.id !== BUILTIN_BOOK_ID ? (
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
                ) : null}
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
            key: "rename",
            text: "重命名",
          },
          {
            key: "delete",
            text: "删除单词本",
            danger: true,
          },
        ]}
        cancelText="取消"
        extra={activeBook ? activeBook.name : "单词本操作"}
        onAction={(action) => {
          if (!activeBook) {
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
          setActiveBook(null);
        }}
        visible={actionVisible}
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
