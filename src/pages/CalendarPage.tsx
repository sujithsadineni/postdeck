import { Badge, Calendar, Card, Empty, Flex, Grid, Listy, Splitter, Tag, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { TODAY, type Post } from "../data.ts";
import { ItemRow, STATUS_COLOR, useDrawers } from "../PostDrawers.tsx";
import { useStore } from "../store.tsx";

export default function CalendarPage() {
  const { state } = useStore();
  const { openView } = useDrawers();
  const screens = Grid.useBreakpoint();
  const [day, setDay] = useState<Dayjs>(dayjs(TODAY));

  const byDay = useMemo(() => {
    const m = new Map<string, Post[]>();
    for (const p of state.posts) {
      const k = dayjs(p.publishAt).format("YYYY-MM-DD");
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return m;
  }, [state.posts]);

  const cell = (d: Dayjs) => {
    const posts = byDay.get(d.format("YYYY-MM-DD")) ?? [];
    if (!screens.md) return posts.length ? <Badge count={posts.length} size="small" color="var(--pd-color-primary)" /> : null;
    return (
      <ul className="cal-list">
        {posts.slice(0, 3).map((p) => <li key={p.id}><Badge status={STATUS_COLOR[p.status] as "success"} text={p.title} /></li>)}
        {posts.length > 3 && <li className="more">+{posts.length - 3} more</li>}
      </ul>
    );
  };

  const dayPosts = byDay.get(day.format("YYYY-MM-DD")) ?? [];
  const upcoming = state.posts.filter((p) => p.status === "scheduled").sort((a, b) => a.publishAt.localeCompare(b.publishAt)).slice(0, 6);

  const side = (
    <Flex vertical gap={16} style={{ padding: screens.md ? "0 0 0 16px" : 0 }}>
      <Card title={day.format("dddd, D MMMM")} size="small">
        {dayPosts.length ? (
          <Listy items={dayPosts} rowKey="id" itemRender={(p) => (
            <ItemRow onOpen={() => openView(p.id)} title={p.title}
              description={<><Tag color={STATUS_COLOR[p.status]}>{p.status}</Tag>{dayjs(p.publishAt).format("HH:mm")}</>} />
          )} />
        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nothing on this day" />}
      </Card>
      <Card title="Coming up" size="small">
        <Listy items={upcoming} rowKey="id" itemRender={(p) => (
          <ItemRow onOpen={() => { setDay(dayjs(p.publishAt)); openView(p.id); }} title={p.title}
            description={dayjs(p.publishAt).format("ddd D MMM, HH:mm")} />
        )} />
      </Card>
    </Flex>
  );

  return (
    <Flex vertical gap={16}>
      <Typography.Title level={3} style={{ margin: 0 }}>Publishing calendar</Typography.Title>
      {screens.lg ? (
        <Card>
          <Splitter>
            <Splitter.Panel defaultSize="68%" min="45%" max="80%">
              <Calendar value={day} onSelect={setDay} cellRender={(d, info) => (info.type === "date" ? cell(d) : null)} />
            </Splitter.Panel>
            <Splitter.Panel>{side}</Splitter.Panel>
          </Splitter>
        </Card>
      ) : (
        <>
          <Card><Calendar fullscreen={false} value={day} onSelect={setDay} cellRender={(d, info) => (info.type === "date" ? cell(d) : null)} /></Card>
          {side}
        </>
      )}
    </Flex>
  );
}
