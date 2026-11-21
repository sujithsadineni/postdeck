import { Area, Column, Pie } from "@ant-design/plots";
import { EyeOutlined, FileTextOutlined, LikeOutlined, RiseOutlined, TrophyOutlined } from "@ant-design/icons";
import { Avatar, BorderBeam, Card, Col, Flex, Listy, Progress, Row, Segmented, Statistic, Tag, Timeline, Typography, theme } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { STATUSES, TODAY } from "../data.ts";
import { initials, ItemRow, STATUS_COLOR, useDrawers } from "../PostDrawers.tsx";
import { useAuthors, useStore } from "../store.tsx";

/** Counts up to `value` once (≈0.8 s); instant when the user prefers reduced motion. */
function useCountUp(value: number) {
  const [n, setN] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(value); return; }
    const start = performance.now(), base = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 800), eased = 1 - (1 - k) ** 3;
      setN(Math.round(base + (value - base) * eased));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return n;
}

function Kpi({ title, value, icon, suffix, beam }: { title: string; value: number; icon: React.ReactNode; suffix?: string; beam?: boolean }) {
  const n = useCountUp(value);
  const card = (
    <Card variant="borderless" className="kpi">
      <Statistic title={title} value={n} prefix={icon} suffix={suffix} />
    </Card>
  );
  return beam ? <BorderBeam duration={6} size={80}>{card}</BorderBeam> : card;
}

export default function Dashboard() {
  const { state } = useStore();
  const authors = useAuthors();
  const { openView } = useDrawers();
  const { token } = theme.useToken();
  const [range, setRange] = useState<"90" | "180">("90");
  const dark = state.settings.dark;
  const posts = state.posts;

  const live = posts.filter((p) => p.status === "published" || p.status === "archived");
  const totals = {
    posts: posts.length,
    views: live.reduce((s, p) => s + p.views, 0),
    likes: live.reduce((s, p) => s + p.likes, 0),
    published: posts.filter((p) => p.status === "published").length,
  };

  const weekly = useMemo(() => {
    const from = dayjs(TODAY).subtract(Number(range), "day");
    const byWeek = new Map<string, number>();
    for (let d = from.startOf("week"); d.isBefore(TODAY); d = d.add(1, "week")) byWeek.set(d.format("YYYY-MM-DD"), 0);
    for (const p of live) {
      const d = dayjs(p.publishAt);
      if (d.isAfter(from)) {
        const k = d.startOf("week").format("YYYY-MM-DD");
        byWeek.set(k, (byWeek.get(k) ?? 0) + p.views);
      }
    }
    return [...byWeek].map(([week, views]) => ({ week, views }));
  }, [live, range]);

  const byCategory = useMemo(() => {
    const rows: { category: string; status: string; count: number }[] = [];
    const counts = new Map<string, number>();
    for (const p of posts) counts.set(`${p.category}|${p.status}`, (counts.get(`${p.category}|${p.status}`) ?? 0) + 1);
    for (const [k, count] of counts) { const [category, status] = k.split("|"); rows.push({ category, status, count }); }
    return rows.sort((a, b) => a.category.localeCompare(b.category));
  }, [posts]);
  const byStatus = STATUSES.map((s) => ({ status: s, count: posts.filter((p) => p.status === s).length }));

  const top = [...live].sort((a, b) => b.views - a.views).slice(0, 5);
  const recent = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const goal = 80;
  const thisMonth = posts.filter((p) => p.status === "published" && dayjs(p.publishAt).isSame(TODAY, "month")).length;
  const chartTheme = dark ? "classicDark" : "classic";

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={3} style={{ margin: 0 }}>Dashboard</Typography.Title>
        <Typography.Text type="secondary">Numbers for {dayjs(TODAY).format("D MMMM YYYY")}</Typography.Text>
      </Flex>

      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Kpi title="Total posts" value={totals.posts} icon={<FileTextOutlined />} beam /></Col>
        <Col xs={12} lg={6}><Kpi title="Views" value={totals.views} icon={<EyeOutlined />} /></Col>
        <Col xs={12} lg={6}><Kpi title="Likes" value={totals.likes} icon={<LikeOutlined />} /></Col>
        <Col xs={12} lg={6}><Kpi title="Published" value={Math.round((totals.published / Math.max(1, totals.posts)) * 100)} suffix="%" icon={<RiseOutlined />} /></Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Card title="Views by publish week" extra={
            <Segmented size="small" value={range} onChange={(v) => setRange(v as "90" | "180")} options={[{ value: "90", label: "90 days" }, { value: "180", label: "180 days" }]} />
          }>
            <Area data={weekly} xField="week" yField="views" height={280} theme={chartTheme}
              style={{ fill: `linear-gradient(-90deg, ${token.colorBgContainer} 0%, ${token.colorPrimary} 100%)` }}
              axis={{ x: { labelFormatter: (v: string) => dayjs(v).format("D MMM") } }}
              line={{ style: { stroke: token.colorPrimary, strokeWidth: 2 } }} />
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="Posts by status">
            <Pie data={byStatus} angleField="count" colorField="status" height={280} innerRadius={0.6} theme={chartTheme}
              label={{ text: "count", style: { fontWeight: 600 } }} legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title="Posts per category">
            <Column data={byCategory} xField="category" yField="count" colorField="status" stack height={300} theme={chartTheme}
              axis={{ x: { labelAutoRotate: true } }} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card title={<><TrophyOutlined /> Top posts</>}>
            <Listy items={top} rowKey="id" itemRender={(p, i) => (
              <ItemRow onOpen={() => openView(p.id)}
                avatar={<Avatar style={{ background: i === 0 ? token.colorWarning : token.colorFillSecondary, color: i === 0 ? "#fff" : token.colorText }}>{i + 1}</Avatar>}
                title={<Typography.Text ellipsis={{ tooltip: p.title }}>{p.title}</Typography.Text>}
                description={`${p.views.toLocaleString()} views`} />
            )} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card title="This month">
            <Flex vertical align="center" gap={8}>
              <Progress type="dashboard" percent={Math.round((thisMonth / goal) * 100)} format={() => `${thisMonth}/${goal}`} />
              <Typography.Text type="secondary">posts published towards the monthly goal</Typography.Text>
            </Flex>
            <Typography.Title level={5} style={{ marginTop: 16 }}>Latest activity</Typography.Title>
            <Timeline items={recent.map((p) => ({
              color: STATUS_COLOR[p.status] === "success" ? "green" : STATUS_COLOR[p.status] === "processing" ? "blue" : "gray",
              content: (
                <span className="clickable" onClick={() => openView(p.id)}>
                  <Avatar size="small" style={{ background: authors.get(p.authorId)?.color, marginInlineEnd: 6 }}>
                    {initials(authors.get(p.authorId)?.name ?? "?")}
                  </Avatar>
                  <Typography.Text ellipsis style={{ maxWidth: 170 }}>{p.title}</Typography.Text>
                  <br />
                  <Tag color={STATUS_COLOR[p.status]} style={{ marginTop: 4 }}>{p.status}</Tag>
                  <Typography.Text type="secondary">{dayjs(p.createdAt).format("D MMM")}</Typography.Text>
                </span>
              ),
            }))} />
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}
