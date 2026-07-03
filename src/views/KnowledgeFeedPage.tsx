import { Card, List, Tag } from "antd-mobile";
import { useNavigate } from "react-router-dom";

const feedItems = [
  {
    title: "词根联想",
    text: "把 terminate、determine、exterminate 放在一起看，能更快建立词形记忆。",
    word: "terminate",
  },
  {
    title: "易混辨析",
    text: "ignore 和 neglect 不完全等价，前者更偏主动忽略，后者常带疏于处理的语义。",
    word: "ignore",
  },
  {
    title: "表达积累",
    text: "在写作里把 very useful 替换成 versatile，表达会更紧凑。",
    word: "versatile",
  },
];

export function KnowledgeFeedPage() {
  const navigate = useNavigate();

  return (
    <div className="page-grid">
      <Card className="mobile-card">
        <div>
          <p className="eyebrow">知识圈</p>
          <h2>词汇知识流</h2>
          <p className="section-note">当前先保留独立模块入口，内容流后续再扩展。</p>
        </div>
      </Card>

      <Card className="mobile-card" title="内容流">
        <List>
          {feedItems.map((item) => (
            <List.Item
              key={item.title}
              clickable
              description={item.text}
              onClick={() => navigate(`/?q=${encodeURIComponent(item.word)}`)}
            >
              <div className="list-title-row">
                <span>{item.title}</span>
                <Tag color="primary" fill="outline">
                  {item.word}
                </Tag>
              </div>
            </List.Item>
          ))}
        </List>
      </Card>
    </div>
  );
}
