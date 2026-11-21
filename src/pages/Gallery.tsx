// Everything else Ant Design ships, grouped by job, wired to the sample data where it makes sense.
import {
  CheckCircleOutlined, CloudUploadOutlined, DownloadOutlined, HeartOutlined, LoadingOutlined, PlusOutlined,
  SearchOutlined, SmileOutlined, SyncOutlined,
} from "@ant-design/icons";
import {
  Alert, Anchor, App, Avatar, Badge, BorderBeam, Button, Card, Carousel, Cascader, Col, Collapse, ColorPicker, DatePicker,
  Divider, Empty, Flex, Grid, Image, InputNumber, Mentions, Popover, Progress, Result, Row, Segmented, Skeleton, Slider,
  Space, Spin, Steps, Switch, Tabs, Tag, TimePicker, Tooltip, Transfer, Tree, TreeSelect, Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "../data.ts";
import { initials } from "../PostDrawers.tsx";
import { useStore } from "../store.tsx";

const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
  <Card id={id} title={title} style={{ scrollMarginTop: 80 }}>{children}</Card>
);

const SLIDES = [
  ["Write", "Three-step editor with validation", "#1677ff"],
  ["Schedule", "Calendar view of every publish date", "#722ed1"],
  ["Measure", "Views, likes and comments per post", "#13c2c2"],
  ["Export", "CSV and Excel, filtered or selected rows", "#eb2f96"],
];

export default function Gallery() {
  const { state } = useStore();
  const { message, notification, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(30);
  const [step, setStep] = useState(1);
  const [targets, setTargets] = useState<string[]>(["a1", "a2"]);
  const [skeleton, setSkeleton] = useState(true);

  // Animated progress: loops 0 → 100 while the gallery is open (static with reduced motion).
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setPercent((p) => (p >= 100 ? 0 : p + 5)), 400);
    return () => clearInterval(t);
  }, []);

  const tree = useMemo(() => CATEGORIES.map((c) => ({
    title: c, key: c, value: c,
    children: state.posts.filter((p) => p.category === c).slice(0, 4).map((p) => ({ title: p.title, key: p.id, value: p.id, isLeaf: true })),
  })), [state.posts]);

  const fakeSave = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); message.success("Saved"); }, 1200);
  };

  const sections = [
    { key: "buttons", title: "Buttons" }, { key: "feedback", title: "Feedback" }, { key: "motion", title: "Motion" },
    { key: "data", title: "Data display" }, { key: "inputs", title: "Inputs" }, { key: "navigation", title: "Navigation" },
    { key: "trees", title: "Trees & transfer" }, { key: "states", title: "Empty & result" },
  ];

  return (
    <Row gutter={24}>
      <Col xs={24} lg={19}>
        <Flex vertical gap={16}>
          <Typography.Title level={3} style={{ margin: 0 }}>Component gallery</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
            The rest of Ant Design 6, beyond the pages: every control follows the theme, colour and density from Settings.
          </Typography.Paragraph>

          <Section id="buttons" title="Buttons">
            <Flex vertical gap={12}>
              <Space wrap>
                <Button type="primary">Primary</Button>
                <Button>Default</Button>
                <Button type="dashed">Dashed</Button>
                <Button type="text">Text</Button>
                <Button type="link">Link</Button>
                <Button color="purple" variant="solid">Purple solid</Button>
                <Button color="cyan" variant="outlined">Cyan outlined</Button>
                <Button color="pink" variant="filled">Pink filled</Button>
              </Space>
              <Space wrap>
                <Button type="primary" icon={<DownloadOutlined />} size="large">Large</Button>
                <Button icon={<SearchOutlined />} shape="circle" aria-label="Search" />
                <Button type="primary" loading={loading} onClick={fakeSave} icon={<CloudUploadOutlined />}>{loading ? "Saving" : "Click to save"}</Button>
                <Button danger>Danger</Button>
                <Button type="primary" danger>Danger primary</Button>
                <Button disabled>Disabled</Button>
                <Button size="small">Small</Button>
              </Space>
              <Space.Compact>
                <Button>Day</Button><Button type="primary">Week</Button><Button>Month</Button>
              </Space.Compact>
              <Button type="dashed" block icon={<PlusOutlined />}>Block button</Button>
            </Flex>
          </Section>

          <Section id="feedback" title="Feedback">
            <Flex vertical gap={12}>
              <Space wrap>
                <Button onClick={() => message.info("This is a message")}>Message</Button>
                <Button onClick={() => message.loading("Working…", 1.5).then(() => message.success("Done"))}>Message chain</Button>
                <Button onClick={() => notification.success({ title: "Post published", description: "It is live on the blog now.", showProgress: true, pauseOnHover: true })}>Notification</Button>
                <Button onClick={() => modal.confirm({ title: "Archive 12 posts?", content: "You can restore them later.", okText: "Archive" })}>Confirm modal</Button>
                <Button onClick={() => modal.success({ title: "Export ready", content: "Your CSV file has been created." })}>Success modal</Button>
                <Popover title="Popover" content="Rich content on hover or click"><Button>Popover</Button></Popover>
                <Tooltip title="A tooltip"><Button>Tooltip</Button></Tooltip>
              </Space>
              <Alert type="info" showIcon title="Info" description="Sample data is generated in your browser." />
              <Alert type="success" showIcon title="Saved" closable />
              <Alert type="warning" showIcon title="3 posts are scheduled for today" />
              <Alert type="error" showIcon title="Import failed for 2 rows" action={<Button size="small" danger>Details</Button>} />
              <Flex gap={24} wrap align="center">
                <Progress type="circle" percent={percent} size={80} />
                <Progress type="dashboard" percent={75} size={80} strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }} />
                <Progress percent={percent} status="active" style={{ flex: 1, minWidth: 200 }} />
                <Progress steps={8} percent={60} />
              </Flex>
            </Flex>
          </Section>

          <Section id="motion" title="Motion">
            <Flex vertical gap={16}>
              <Flex gap={16} wrap>
                <BorderBeam duration={4} size={70}>
                  <Card size="small" style={{ width: 220 }}><Typography.Text strong>BorderBeam</Typography.Text><br />A light that runs around the edge.</Card>
                </BorderBeam>
                <BorderBeam duration={8} count={2} color="#eb2f96">
                  <Card size="small" style={{ width: 220 }}><Typography.Text strong>Two beams</Typography.Text><br />Slower, in pink.</Card>
                </BorderBeam>
              </Flex>
              <Space size="large" wrap>
                <Spin /><Spin size="large" /><Spin indicator={<LoadingOutlined spin />} />
                <SyncOutlined spin style={{ fontSize: 22 }} />
                <Badge count={<SmileOutlined style={{ color: "#f5222d" }} />}><Avatar shape="square" /></Badge>
                <Badge dot status="processing" text="Processing (pulses)" />
              </Space>
              <Flex gap={16} align="center" wrap>
                <Switch checked={skeleton} onChange={setSkeleton} checkedChildren="Loading" unCheckedChildren="Loaded" />
                <Card size="small" style={{ flex: 1, minWidth: 260 }}>
                  <Skeleton loading={skeleton} active avatar>
                    <Card.Meta avatar={<Avatar style={{ background: state.authors[0]?.color }}>{initials(state.authors[0]?.name ?? "?")}</Avatar>}
                      title={state.authors[0]?.name} description={state.authors[0]?.bio} />
                  </Skeleton>
                </Card>
              </Flex>
              <Carousel autoplay={{ dotDuration: true }} autoplaySpeed={3000} effect="fade">
                {SLIDES.map(([t, d, c]) => (
                  <div key={t}><div className="slide" style={{ background: `linear-gradient(135deg, ${c}, #141414)` }}><h3>{t}</h3><p>{d}</p></div></div>
                ))}
              </Carousel>
            </Flex>
          </Section>

          <Section id="data" title="Data display">
            <Flex vertical gap={12}>
              <Space wrap>
                <Avatar.Group max={{ count: 5, style: { background: "#fde3cf", color: "#f56a00" } }}>
                  {state.authors.slice(0, 9).map((a) => <Avatar key={a.id} style={{ background: a.color }}>{initials(a.name)}</Avatar>)}
                </Avatar.Group>
                <Badge count={state.posts.filter((p) => p.status === "draft").length}><Button>Drafts</Button></Badge>
                <Badge.Ribbon text="New" color="purple"><Card size="small" style={{ width: 160 }}>Ribbon badge</Card></Badge.Ribbon>
              </Space>
              <Space size={[4, 8]} wrap>
                {["magenta", "red", "volcano", "orange", "gold", "lime", "green", "cyan", "blue", "geekblue", "purple"].map((c) => <Tag key={c} color={c}>{c}</Tag>)}
                <Tag icon={<CheckCircleOutlined />} color="success">success</Tag>
                <Tag icon={<SyncOutlined spin />} color="processing">processing</Tag>
                <Tag.CheckableTag checked>checkable</Tag.CheckableTag>
              </Space>
              <Image.PreviewGroup>
                <Space wrap>
                  {SLIDES.map(([t, , c]) => (
                    <Image key={t} width={120} alt={`${t} preview`}
                      src={`data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="${c}"/><text x="50%" y="55%" font-size="64" fill="white" text-anchor="middle" font-family="sans-serif">${t}</text></svg>`)}`} />
                  ))}
                </Space>
              </Image.PreviewGroup>
              <Collapse items={state.posts.slice(0, 3).map((p) => ({ key: p.id, label: p.title, children: <p>{p.excerpt}</p> }))} defaultActiveKey={[state.posts[0]?.id]} />
              <Typography.Paragraph ellipsis={{ rows: 2, expandable: "collapsible" }} copyable>{state.posts[1]?.body}</Typography.Paragraph>
            </Flex>
          </Section>

          <Section id="inputs" title="Inputs">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}><Cascader style={{ width: "100%" }} placeholder="Category → post" options={tree.map((t) => ({ value: t.value, label: t.title, children: t.children.map((c) => ({ value: c.value, label: c.title })) }))} /></Col>
              <Col xs={24} md={12}><Mentions style={{ width: "100%" }} placeholder="Type @ to mention an author" options={state.authors.map((a) => ({ value: a.name.replace(/\s/g, ""), label: a.name }))} /></Col>
              <Col xs={12} md={6}><InputNumber min={0} max={100} defaultValue={42} style={{ width: "100%" }} aria-label="Number" /></Col>
              <Col xs={12} md={6}><TimePicker style={{ width: "100%" }} aria-label="Time" /></Col>
              <Col xs={24} md={12}><DatePicker.RangePicker style={{ width: "100%" }} /></Col>
              <Col xs={24} md={12}><Slider range defaultValue={[20, 60]} /></Col>
              <Col xs={24} md={12}><Space><ColorPicker defaultValue="#722ed1" /><Switch defaultChecked /><Segmented options={["Daily", "Weekly", "Monthly"]} /></Space></Col>
            </Row>
          </Section>

          <Section id="navigation" title="Navigation">
            <Flex vertical gap={16}>
              <Steps current={step} onChange={setStep} items={[{ title: "Draft" }, { title: "Review", content: "Editor checks" }, { title: "Schedule" }, { title: "Live" }]} />
              <Tabs items={[
                { key: "1", label: "Overview", children: "Tabs switch content without leaving the page." },
                { key: "2", label: "Comments", icon: <HeartOutlined />, children: `${state.posts.reduce((s, p) => s + p.comments, 0).toLocaleString()} comments in total.` },
                { key: "3", label: "History", children: "Card-style tabs, below.", disabled: false },
              ]} />
              <Tabs type="card" items={["Week", "Month", "Year"].map((k) => ({ key: k, label: k, children: `${k} view` }))} />
            </Flex>
          </Section>

          <Section id="trees" title="Trees & transfer">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}><Tree checkable defaultExpandedKeys={[CATEGORIES[0]]} treeData={tree} height={240} /></Col>
              <Col xs={24} md={12}>
                <TreeSelect style={{ width: "100%" }} treeData={tree} placeholder="Pick posts" treeCheckable showCheckedStrategy={TreeSelect.SHOW_PARENT} maxTagCount="responsive" />
              </Col>
              <Col span={24}>
                <Transfer
                  dataSource={state.authors.map((a) => ({ key: a.id, title: a.name }))}
                  targetKeys={targets} onChange={(k) => setTargets(k as string[])} render={(i) => i.title}
                  titles={["Authors", "Newsletter"]} showSearch
                  styles={{ section: { width: screens.md ? 280 : "100%", height: 260 } }}
                />
              </Col>
            </Row>
          </Section>

          <Section id="states" title="Empty & result">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}><Empty description="No drafts" /></Col>
              <Col xs={24} md={16}><Result status="success" title="Post published" subTitle="It is live now." extra={<Button type="primary">View post</Button>} /></Col>
            </Row>
            <Divider />
            <Result status="403" title="403" subTitle="Only editors can see this page." />
          </Section>
        </Flex>
      </Col>
      {screens.lg && (
        <Col lg={5}>
          <Anchor offsetTop={80} items={sections.map((s) => ({ key: s.key, href: `#${s.key}`, title: s.title }))}
            getCurrentAnchor={(a) => a} onClick={(e, link) => { e.preventDefault(); document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: "smooth" }); }} />
        </Col>
      )}
    </Row>
  );
}
