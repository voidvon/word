import { Card, List, Tag } from "antd-mobile";
import { useNavigate } from "react-router-dom";

const recommendations = [
  {
    word: "versatility",
    note: "多功能性；适合用来强化名词后缀 -ity 的感知。",
    tags: ["CET6", "高频表达"],
  },
  {
    word: "terminate",
    note: "终止；适合和 complete、cease 一起做近义辨析。",
    tags: ["商务", "动词"],
  },
  {
    word: "coherent",
    note: "连贯的；写作和口语里都很常见。",
    tags: ["写作", "形容词"],
  },
];

export function DailyRecommendPage() {
  const navigate = useNavigate();

  return (
    <div className="page-grid">
      <Card className="mobile-card">
        <div>
          <p className="eyebrow">每日推荐</p>
          <h2>今天建议过一遍这 3 个词</h2>
          <p className="section-note">当前先用静态推荐占位，后续可接真实推荐策略。</p>
        </div>
      </Card>

      <Card className="mobile-card" title="推荐词单">
        <List>
          {recommendations.map((item) => (
            <List.Item
              key={item.word}
              clickable
              description={item.note}
              onClick={() => navigate(`/word?wd=${encodeURIComponent(item.word)}&l=en`)}
            >
              <div className="list-title-row">
                <span>{item.word}</span>
                <div className="tag-inline-group">
                  {item.tags.map((tag) => (
                    <Tag key={tag} color="warning" fill="outline">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </List.Item>
          ))}
        </List>
      </Card>
    </div>
  );
}
