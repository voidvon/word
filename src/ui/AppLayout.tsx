import { NavBar, SafeArea, TabBar } from "antd-mobile";
import {
  AppOutline,
  CompassOutline,
  MessageOutline,
  SearchOutline,
  UnorderedListOutline,
} from "antd-mobile-icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  let activeKey = "home";

  if (location.pathname.startsWith("/daily")) {
    activeKey = "daily";
  } else if (location.pathname.startsWith("/wdbook")) {
    activeKey = "wdbook";
  } else if (location.pathname.startsWith("/knowledge")) {
    activeKey = "knowledge";
  }

  return (
    <div className="app-shell">
      <header className="topbar-shell">
        <NavBar
          back={null}
          left={<span className="topbar-mark">Word Web MVP</span>}
          right={<AppOutline />}
          className="mobile-navbar"
        >
          词典与单词块原型
        </NavBar>
      </header>
      <main className="page-wrap mobile-page-wrap">
        <Outlet />
      </main>
      <footer className="mobile-tabbar-shell">
        <TabBar
          activeKey={activeKey}
          safeArea
          onChange={(key) => {
            if (key === "home") {
              navigate("/");
              return;
            }
            navigate(`/${key}`);
          }}
        >
          <TabBar.Item key="home" icon={<SearchOutline />} title="首页" />
          <TabBar.Item key="daily" icon={<CompassOutline />} title="每日推荐" />
          <TabBar.Item key="wdbook" icon={<UnorderedListOutline />} title="单词块" />
          <TabBar.Item key="knowledge" icon={<MessageOutline />} title="知识圈" />
        </TabBar>
      </footer>
      <SafeArea position="bottom" />
    </div>
  );
}
