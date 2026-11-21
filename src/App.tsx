import {
  AppstoreOutlined, BulbOutlined, CalendarOutlined, DashboardOutlined, FileTextOutlined, GithubOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, MoonOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined, SettingOutlined,
  SunOutlined, TeamOutlined,
} from "@ant-design/icons";
import {
  App as AntApp, AutoComplete, Breadcrumb, Button, ConfigProvider, FloatButton, Grid, Layout, Menu,
  Result, Spin, Tooltip, Tour, Watermark, theme, type TourProps,
} from "antd";
import enUS from "antd/locale/en_US";
import hiIN from "antd/locale/hi_IN";
import dayjs from "dayjs";
import "dayjs/locale/hi";
import { lazy, Suspense, useMemo, useState } from "react";
import { HashRouter, Link, Route, Routes, useLocation, useNavigate } from "react-router";
import { DrawersProvider, useDrawers } from "./PostDrawers.tsx";
import { StoreProvider, useStore } from "./store.tsx";

const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Posts = lazy(() => import("./pages/Posts.tsx"));
const Authors = lazy(() => import("./pages/Authors.tsx"));
const CalendarPage = lazy(() => import("./pages/CalendarPage.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Gallery = lazy(() => import("./pages/Gallery.tsx"));

const PAGES = [
  { path: "/", label: "Dashboard", icon: <DashboardOutlined /> },
  { path: "/posts", label: "Posts", icon: <FileTextOutlined /> },
  { path: "/authors", label: "Authors", icon: <TeamOutlined /> },
  { path: "/calendar", label: "Calendar", icon: <CalendarOutlined /> },
  { path: "/components", label: "Components", icon: <AppstoreOutlined /> },
  { path: "/settings", label: "Settings", icon: <SettingOutlined /> },
];

export default function App() {
  return (
    <StoreProvider>
      <Themed />
    </StoreProvider>
  );
}

function Themed() {
  const { settings: s } = useStore().state;
  dayjs.locale(s.locale === "hi" ? "hi" : "en");
  const algorithm = [s.dark ? theme.darkAlgorithm : theme.defaultAlgorithm, ...(s.compact ? [theme.compactAlgorithm] : [])];
  return (
    <ConfigProvider
      locale={s.locale === "hi" ? hiIN : enUS}
      theme={{ algorithm, token: { colorPrimary: s.primary, borderRadius: s.radius }, cssVar: { key: "pd" } }}
    >
      <AntApp>
        <HashRouter>
          <DrawersProvider>
            <Shell />
          </DrawersProvider>
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  );
}

function Shell() {
  const { state, dispatch } = useStore();
  const { settings: s } = state;
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const phone = !screens.md;
  const location = useLocation();
  const navigate = useNavigate();
  const { openEditor, openView } = useDrawers();
  const [tourOpen, setTourOpen] = useState(false);
  const [query, setQuery] = useState("");
  const current = PAGES.find((p) => p.path === location.pathname);

  // Header search: jump to any post by title.
  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return state.posts.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 8)
      .map((p) => ({ value: p.id, label: p.title }));
  }, [query, state.posts]);

  const byId = (id: string) => () => document.getElementById(id)!;
  const steps: TourProps["steps"] = [
    { title: "Pages", description: "Dashboard, posts table, authors, calendar, a component gallery and settings.", target: byId("tour-menu") },
    { title: "Find any post", description: "Type two letters to search post titles and open one.", target: byId("tour-search") },
    { title: "Write a post", description: "Opens the editor: a three-step form with validation.", target: byId("tour-new") },
    { title: "Light or dark", description: "Switch the theme. More options (compact, colour, Hindi) are in Settings.", target: byId("tour-theme") },
  ];

  const menu = (
    <Menu
      id="tour-menu"
      mode="inline"
      selectedKeys={[location.pathname]}
      items={PAGES.map((p) => ({ key: p.path, icon: p.icon, label: <Link to={p.path}>{p.label}</Link> }))}
      style={{ borderInlineEnd: 0 }}
    />
  );

  const shell = (
    <Layout style={{ minHeight: "100vh" }}>
      {!phone && (
        <Layout.Sider
          theme="light"
          collapsible
          collapsed={s.siderCollapsed}
          trigger={null}
          width={220}
          style={{ position: "sticky", top: 0, height: "100vh", borderInlineEnd: `1px solid ${token.colorSplit}` }}
        >
          <Link to="/" className="brand" aria-label="postdeck home">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={32} height={32} />
            {!s.siderCollapsed && <span>postdeck</span>}
          </Link>
          {menu}
        </Layout.Sider>
      )}
      <Layout>
        <Layout.Header
          className="header"
          style={{ background: token.colorBgContainer, borderBottom: `1px solid ${token.colorSplit}`, paddingInline: phone ? 12 : 24 }}
        >
          {phone ? (
            <Link to="/" className="brand small" aria-label="postdeck home">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width={28} height={28} />
            </Link>
          ) : (
            <Button
              type="text"
              aria-label={s.siderCollapsed ? "Expand menu" : "Collapse menu"}
              icon={s.siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => dispatch({ type: "settings", patch: { siderCollapsed: !s.siderCollapsed } })}
            />
          )}
          <AutoComplete
            id="tour-search"
            options={options}
            onSelect={(id: string) => { setQuery(""); openView(id); }}
            style={{ flex: 1, maxWidth: 420 }}
            value={query}
            onChange={setQuery}
            placeholder="Search posts…"
            aria-label="Search posts"
            allowClear
            prefix={<SearchOutlined />}
            notFoundContent={query.trim().length >= 2 ? "No posts match" : null}
          />
          <Tooltip title="New post">
            <Button id="tour-new" type="primary" icon={<PlusOutlined />} onClick={() => openEditor()} aria-label="New post">
              {!phone && "New post"}
            </Button>
          </Tooltip>
          <Tooltip title={s.dark ? "Light theme" : "Dark theme"}>
            <Button
              id="tour-theme"
              shape="circle"
              aria-label={s.dark ? "Switch to light theme" : "Switch to dark theme"}
              icon={s.dark ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => dispatch({ type: "settings", patch: { dark: !s.dark } })}
            />
          </Tooltip>
          {!phone && (
            <Tooltip title="Code on GitHub">
              <Button shape="circle" icon={<GithubOutlined />} href="https://github.com/sujithsadineni/postdeck" target="_blank" aria-label="Code on GitHub" />
            </Tooltip>
          )}
        </Layout.Header>

        <Layout.Content style={{ padding: phone ? 12 : 24, paddingBottom: phone ? 88 : 24 }}>
          <Breadcrumb
            style={{ marginBottom: 16 }}
            items={[{ title: <Link to="/">postdeck</Link> }, ...(current && current.path !== "/" ? [{ title: current.label }] : [])]}
          />
          <div key={location.pathname} className="page-enter">
            <Suspense fallback={<div className="center"><Spin size="large" /></div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/components" element={<Gallery />} />
                <Route path="/settings" element={<Settings onTour={() => setTourOpen(true)} />} />
                <Route path="*" element={
                  <Result status="404" title="404" subTitle="This page does not exist."
                    extra={<Button type="primary" onClick={() => navigate("/")}>Back to dashboard</Button>} />
                } />
              </Routes>
            </Suspense>
          </div>
        </Layout.Content>
        <Layout.Footer style={{ textAlign: "center", color: token.colorTextSecondary }}>
          postdeck · Ant Design 6 · sample data generated with faker (seed {state.seed})
        </Layout.Footer>
      </Layout>

      {phone && (
        <nav className="tabbar" style={{ background: token.colorBgContainer, borderTop: `1px solid ${token.colorSplit}` }} aria-label="Pages">
          {PAGES.filter((p) => p.path !== "/components").map((p) => (
            <Link key={p.path} to={p.path} className={location.pathname === p.path ? "on" : ""} style={{ color: location.pathname === p.path ? token.colorPrimary : token.colorTextSecondary }}>
              {p.icon}<span>{p.label}</span>
            </Link>
          ))}
        </nav>
      )}

      <FloatButton.Group shape="circle" style={{ insetInlineEnd: 24, bottom: phone ? 84 : 24 }}>
        <FloatButton icon={<QuestionCircleOutlined />} tooltip="Take the tour" onClick={() => setTourOpen(true)} aria-label="Take the tour" />
        <FloatButton icon={<BulbOutlined />} tooltip="Component gallery" onClick={() => navigate("/components")} aria-label="Component gallery" />
        <FloatButton.BackTop visibilityHeight={400} tooltip="Back to top" />
      </FloatButton.Group>
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={phone ? steps.slice(1) : steps} />
    </Layout>
  );

  return s.watermark ? <Watermark content={["postdeck", "sample data"]} gap={[120, 120]}>{shell}</Watermark> : shell;
}
