import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  List,
  Picker,
  Selector,
  Space,
  Tag,
  Toast,
} from "antd-mobile";
import { useSearchParams } from "react-router-dom";
import { getWord } from "../services/dictionary";
import { addWordToStudy, loadUserState, touchSearchWord } from "../services/userState";
import type { DictionaryWord } from "../types";

export function WordDetailPage() {
  const [searchParams] = useSearchParams();
  const [wordData, setWordData] = useState<DictionaryWord | null | undefined>(undefined);
  const [state, setState] = useState(() => loadUserState());
  const word = searchParams.get("wd")?.trim().toLowerCase() ?? "";
  const [selectedBookId, setSelectedBookId] = useState<number[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    if (!word) {
      setWordData(null);
      return;
    }

    const next = touchSearchWord(word);
    setState(next);
    void getWord(word).then(setWordData);
  }, [word]);

  const books = useMemo(
    () =>
      state.wordBookList
        .map((id) => state.wordBookMap[id])
        .filter((item): item is NonNullable<typeof item> => item !== undefined)
        .filter((item) => item.kind === "book"),
    [state],
  );

  useEffect(() => {
    if (selectedBookId.length === 0 && books[0]) {
      setSelectedBookId([books[0].id]);
    }
  }, [books, selectedBookId]);

  return (
    <section className="detail-panel">
      {!word ? <Card className="mobile-card" title="缺少查询词" /> : null}
      {word && wordData === undefined ? <Card className="mobile-card" title="加载中..." /> : null}
      {word && wordData === null ? (
        <Card className="mobile-card" title={word}>
          本地词典中未找到该词条。
        </Card>
      ) : null}
      {wordData ? (
        <>
          <Card className="mobile-card">
            <div className="detail-hero">
              <div>
                <p className="eyebrow">查词详情</p>
                <h2>{wordData.word}</h2>
                <p className="detail-ipa">{wordData.ipa ?? "暂无音标"}</p>
                {wordData.frm ? <p className="detail-frm">{wordData.frm}</p> : null}
              </div>
            </div>
            <Space wrap className="tag-row">
              {wordData.tags?.slice(0, 6).map((tag) => (
                <Tag key={tag} color="warning" fill="solid">
                  {tag}
                </Tag>
              ))}
            </Space>
          </Card>

          <Card className="mobile-card" title="释义">
            <List>
              {wordData.trans?.map((item, index) => (
                <List.Item key={`${item.pos}-${index}`} prefix={<strong>{item.pos}</strong>}>
                  {item.text}
                </List.Item>
              ))}
            </List>
          </Card>

          <Card className="mobile-card" title="学习操作">
            <div>
              <p>把当前词加入学习流，并同步写入单词本。</p>
            </div>
            <Space direction="vertical" block>
              <Selector
                columns={2}
                showCheckMark
                options={books.map((book) => ({
                  label: book.name,
                  value: book.id,
                }))}
                value={selectedBookId}
                onChange={(value) => setSelectedBookId(value.slice(-1))}
              />
              <Button
                color="primary"
                block
                disabled={selectedBookId.length === 0}
                onClick={() => {
                  const targetBookId = selectedBookId[0];
                  if (!targetBookId) {
                    return;
                  }
                  setState(addWordToStudy(wordData.word, targetBookId));
                  Toast.show({
                    content: `已将 ${wordData.word} 加入学习流`,
                  });
                }}
              >
                加入学习流
              </Button>
              <Button fill="none" onClick={() => setPickerVisible(true)}>
                用 Picker 选择单词本
              </Button>
            </Space>
            <div className="status-line">
              当前状态：{state.wordUserMap[wordData.word]?.s ?? "未记录"}，查询次数：
              {state.wordUserMap[wordData.word]?.sc ?? 0}
            </div>
            <Picker
              visible={pickerVisible}
              value={selectedBookId}
              columns={[
                books.map((book) => ({
                  label: book.name,
                  value: book.id,
                })),
              ]}
              onClose={() => setPickerVisible(false)}
              onConfirm={(value) => setSelectedBookId(value as number[])}
            />
          </Card>
        </>
      ) : null}
    </section>
  );
}
