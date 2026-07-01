import { useMemo, useState } from "react";
import { Badge, Button, Card, Grid, List, Space } from "antd-mobile";
import { useNavigate } from "react-router-dom";
import { computeAiBuckets, getBookReport, isBook } from "../services/wdbook";
import { createBook, loadUserState } from "../services/userState";

export function WdBookHomePage() {
  const navigate = useNavigate();
  const [state, setState] = useState(() => loadUserState());

  const aiBuckets = useMemo(() => computeAiBuckets(state), [state]);
  const books = useMemo(
    () =>
      state.wordBookList
        .map((id) => state.wordBookMap[id])
        .filter((item): item is NonNullable<typeof item> => item !== undefined)
        .filter(isBook),
    [state],
  );

  return (
    <div className="page-grid">
      <Card className="mobile-card hero-mobile-card">
        <div>
          <p className="eyebrow">单词块首页</p>
          <h2>AI 单词本</h2>
          <p>顶部统计区当前只做占位，真实数据后续再接。</p>
        </div>
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

      <Card className="mobile-card" title="AI 单词本">
        <div className="section-note">基于本地用户状态动态计算</div>
        <Grid columns={2} gap={12}>
          {aiBuckets.map((bucket) => (
            <Grid.Item key={bucket.key}>
              <Card className={`bucket-card tone-${bucket.tone}`}>
                <span>{bucket.title}</span>
                <strong>{bucket.count}</strong>
              </Card>
            </Grid.Item>
          ))}
        </Grid>
      </Card>

      <Card
        className="mobile-card"
        title="我的单词本"
        extra={
          <Button
            size="small"
            fill="outline"
            onClick={() => setState(createBook(`新建单词本 ${state.wordBookList.length + 1}`))}
          >
            新建单词本
          </Button>
        }
      >
        <List>
          {books.map((book) => {
            const report = getBookReport(state, book);
            return (
              <List.Item
                key={book.id}
                clickable
                arrowIcon
                onClick={() => navigate(`/wdbook/${book.id}`)}
                description={`已掌握 ${report.mastered}`}
                extra={<Badge content={`${report.total} 词`} />}
              >
                <Space direction="vertical" block>
                  <span>{book.name}</span>
                </Space>
              </List.Item>
            );
          })}
        </List>
      </Card>
    </div>
  );
}
