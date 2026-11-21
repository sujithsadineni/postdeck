import { AppstoreOutlined, BarsOutlined, EnvironmentOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import {
  Avatar, Card, Drawer, Empty, Flex, Grid, Input, Listy, Masonry, Segmented, Select, Skeleton, Space, Statistic, Table, Tag, Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import type { Author } from "../data.ts";
import { initials, ItemRow, STATUS_COLOR, useDrawers } from "../PostDrawers.tsx";
import { useStore } from "../store.tsx";

const ROLE_COLOR: Record<Author["role"], string> = { Editor: "purple", Writer: "blue", Contributor: "cyan", Guest: "default" };
type Sort = "name" | "posts" | "followers" | "views";

export default function Authors() {
  const { state } = useStore();
  const { openView } = useDrawers();
  const screens = Grid.useBreakpoint();
  const [view, setView] = useState<"cards" | "table">("cards");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("posts");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Author | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const stats = useMemo(() => {
    const m = new Map<string, { posts: number; views: number }>();
    for (const p of state.posts) {
      const s = m.get(p.authorId) ?? { posts: 0, views: 0 };
      s.posts++; s.views += p.views;
      m.set(p.authorId, s);
    }
    return m;
  }, [state.posts]);

  const list = useMemo(() => {
    const s = (a: Author) => stats.get(a.id) ?? { posts: 0, views: 0 };
    return state.authors
      .filter((a) => `${a.name} ${a.city} ${a.role}`.toLowerCase().includes(q.trim().toLowerCase()))
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name)
        : sort === "followers" ? b.followers - a.followers
        : sort === "views" ? s(b).views - s(a).views : s(b).posts - s(a).posts);
  }, [state.authors, q, sort, stats]);

  const card = (a: Author) => (
    <Card hoverable onClick={() => setOpen(a)} className="author-card"
      tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen(a)} aria-label={`Open ${a.name}`}>
      <Card.Meta
        avatar={<Avatar size={48} style={{ background: a.color }}>{initials(a.name)}</Avatar>}
        title={a.name}
        description={<Space size={4}><Tag color={ROLE_COLOR[a.role]}>{a.role}</Tag><EnvironmentOutlined />{a.city}</Space>}
      />
      <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>{a.bio}</Typography.Paragraph>
      <Flex justify="space-between">
        <Statistic title="Posts" value={stats.get(a.id)?.posts ?? 0} />
        <Statistic title="Views" value={stats.get(a.id)?.views ?? 0} />
        <Statistic title="Followers" value={a.followers} />
      </Flex>
    </Card>
  );

  const authorPosts = open ? state.posts.filter((p) => p.authorId === open.id).sort((a, b) => b.publishAt.localeCompare(a.publishAt)) : [];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={3} style={{ margin: 0 }}>Authors</Typography.Title>
        <Space wrap>
          <Input.Search allowClear placeholder="Name, city or role" onChange={(e) => setQ(e.target.value)} style={{ width: 220 }} aria-label="Search authors" />
          <Select<Sort> value={sort} onChange={setSort} style={{ width: 160 }} aria-label="Sort authors" options={[
            { value: "posts", label: "Most posts" }, { value: "views", label: "Most views" },
            { value: "followers", label: "Most followers" }, { value: "name", label: "Name A–Z" },
          ]} />
          <Segmented value={view} onChange={(v) => setView(v as "cards")} options={[
            { value: "cards", icon: <AppstoreOutlined />, label: "Cards" },
            { value: "table", icon: <BarsOutlined />, label: "Table" },
          ]} />
        </Space>
      </Flex>

      {loading ? (
        <Flex gap={16} wrap>
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} style={{ width: screens.md ? "calc(33% - 11px)" : "100%" }}><Skeleton avatar active paragraph={{ rows: 3 }} /></Card>
          ))}
        </Flex>
      ) : list.length === 0 ? (
        <Empty description="No authors match" />
      ) : view === "cards" ? (
        <Masonry columns={{ xs: 1, sm: 2, lg: 3, xxl: 4 }} gutter={16}
          items={list.map((a) => ({ key: a.id, data: a }))} itemRender={({ data }) => card(data)} />
      ) : (
        <Table<Author> rowKey="id" dataSource={list} pagination={false} scroll={{ x: 760 }} onRow={(a) => ({ onClick: () => setOpen(a), className: "clickable" })}
          columns={[
            { title: "Author", key: "name", render: (_, a) => <Space><Avatar style={{ background: a.color }}>{initials(a.name)}</Avatar>{a.name}</Space> },
            { title: "Role", dataIndex: "role", render: (r: Author["role"]) => <Tag color={ROLE_COLOR[r]}>{r}</Tag> },
            { title: "City", dataIndex: "city" },
            { title: "Posts", key: "posts", align: "right", render: (_, a) => stats.get(a.id)?.posts ?? 0 },
            { title: "Followers", dataIndex: "followers", align: "right", render: (n: number) => n.toLocaleString() },
            { title: "Joined", dataIndex: "joined", render: (d: string) => dayjs(d).format("MMM YYYY") },
          ]} />
      )}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name} size={screens.md ? 480 : "100%"}>
        {open && (
          <>
            <Flex gap={16} align="center" style={{ marginBottom: 16 }}>
              <Avatar size={64} style={{ background: open.color }} icon={<UserOutlined />}>{initials(open.name)}</Avatar>
              <div>
                <Tag color={ROLE_COLOR[open.role]}>{open.role}</Tag>
                <div><MailOutlined /> {open.email}</div>
                <Typography.Text type="secondary">Joined {dayjs(open.joined).format("MMMM YYYY")} · {open.city}</Typography.Text>
              </div>
            </Flex>
            <Typography.Paragraph>{open.bio}</Typography.Paragraph>
            <Typography.Title level={5} className="list-head">{authorPosts.length} posts</Typography.Title>
            <Listy items={authorPosts} rowKey="id" itemRender={(p) => (
              <ItemRow onOpen={() => openView(p.id)} title={p.title}
                description={<Space><Tag color={STATUS_COLOR[p.status]}>{p.status}</Tag>{dayjs(p.publishAt).format("D MMM YYYY")}</Space>} />
            )} />
          </>
        )}
      </Drawer>
    </Flex>
  );
}
