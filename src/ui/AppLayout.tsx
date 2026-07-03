import { SafeArea, TabBar } from "antd-mobile";
import { AppstoreOutline, SearchOutline } from "antd-mobile-icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isWordDetail = location.pathname.startsWith("/word/");
  const isWdBookList = /^\/wdbook\/.+/.test(location.pathname);
  const isImmersivePage = isWordDetail || isWdBookList;
  const activeKey = location.pathname.startsWith("/wdbook")
    ? "wdbook"
    : isHome
      ? "home"
      : "";

  return (
    <div className={`app-shell${isImmersivePage ? " is-word-detail-shell" : ""}`}>
      <main className={`page-wrap mobile-page-wrap${isHome ? " is-home-page" : ""}${isImmersivePage ? " is-word-detail-page" : ""}`}>
        <Outlet />
      </main>
      {!isImmersivePage && (
        <>
          <footer className="mobile-tabbar-shell">
            <TabBar
              activeKey={activeKey}
              safeArea
              onChange={(key) => {
                if (key === "home") {
                  navigate("/");
                  return;
                }
                if (key === "wdbook") {
                  navigate("/wdbook");
                }
              }}
            >
              <TabBar.Item key="home" icon={<SearchOutline />} title="首页" />
              <TabBar.Item key="wdbook" icon={<AppstoreOutline />} title="单词块" />
            </TabBar>
          </footer>
          <SafeArea position="bottom" />
        </>
      )}
    </div>
  );
}
