// The post editor and post viewer drawers, openable from any page.
import { CheckOutlined, DeleteOutlined, EditOutlined, EyeOutlined, LikeOutlined, MessageOutlined, UploadOutlined } from "@ant-design/icons";
import {
  App, Avatar, Button, DatePicker, Descriptions, Divider, Drawer, Flex, Form, Grid, Input, Popconfirm, QRCode,
  Radio, Rate, Select, Space, Statistic, Steps, Switch, Tag, Typography, Upload,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CATEGORIES, TAGS, TODAY, type Post, type Status } from "./data.ts";
import { nextPostId, useAuthors, useStore } from "./store.tsx";

export const STATUS_COLOR: Record<Status, string> = {
  draft: "default", scheduled: "processing", published: "success", archived: "warning",
};
export const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2);

/** One clickable row for Listy (antd 6.6+ replacement for List): optional avatar, title, description. */
export function ItemRow({ avatar, title, description, onOpen }: { avatar?: ReactNode; title: ReactNode; description?: ReactNode; onOpen?: () => void }) {
  return (
    <div className={`item-row${onOpen ? " clickable" : ""}`} onClick={onOpen} role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined} onKeyDown={(e) => onOpen && (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())}>
      {avatar}
      <div className="item-text">
        <div className="item-title">{title}</div>
        {description && <div className="item-desc">{description}</div>}
      </div>
    </div>
  );
}

type Drawers = { openEditor: (post?: Post) => void; openView: (id: string) => void };
const Ctx = createContext<Drawers | null>(null);
export const useDrawers = () => useContext(Ctx)!;

export function DrawersProvider({ children }: { children: ReactNode }) {
  const [editing, setEditing] = useState<{ post?: Post; key: number } | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const value = useMemo<Drawers>(() => ({
    openEditor: (post) => { setViewing(null); setEditing({ post, key: Date.now() }); },
    openView: (id) => setViewing(id),
  }), []);
  return (
    <Ctx.Provider value={value}>
      {children}
      <PostView id={viewing} onClose={() => setViewing(null)} />
      {editing && <PostEditor key={editing.key} post={editing.post} onClose={() => setEditing(null)} />}
    </Ctx.Provider>
  );
}

type FormValues = {
  title: string; category: Post["category"]; authorId: string; tags: string[]; excerpt: string; body: string;
  status: Status; publishAt?: Dayjs; featured: boolean; rating: number;
};
const STEPS = [
  { title: "Basics", fields: ["title", "category", "authorId", "tags"] },
  { title: "Content", fields: ["excerpt", "body"] },
  { title: "Publish", fields: ["status", "publishAt", "featured", "rating"] },
] as const;

function PostEditor({ post, onClose }: { post?: Post; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const [form] = Form.useForm<FormValues>();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);
  const status = Form.useWatch("status", form);

  const initial: Partial<FormValues> = post
    ? { ...post, publishAt: dayjs(post.publishAt) }
    : { status: "draft", featured: false, rating: 0, tags: [], authorId: state.authors[0]?.id, category: "Engineering" };

  const next = async () => {
    try {
      await form.validateFields([...STEPS[step].fields]);
      setStep(step + 1);
    } catch { /* errors are shown under the fields */ }
  };
  const save = async () => {
    // Validate every step; jump to the first step with an error.
    try { await form.validateFields(); } catch (e) {
      const bad = (e as { errorFields: { name: string[] }[] }).errorFields[0]?.name[0];
      setStep(STEPS.findIndex((s) => (s.fields as readonly string[]).includes(bad)));
      return;
    }
    const v = form.getFieldsValue(true) as FormValues;
    const now = new Date().toISOString();
    dispatch({
      type: "save",
      post: {
        ...(post ?? { id: nextPostId(state.posts), views: 0, likes: 0, comments: 0, createdAt: now }),
        title: v.title.trim(), category: v.category, authorId: v.authorId, tags: v.tags, excerpt: v.excerpt.trim(),
        body: v.body.trim(), status: v.status, featured: v.featured, rating: v.rating,
        publishAt: (v.publishAt ?? dayjs()).toISOString(),
      },
    });
    message.success(post ? "Post updated" : "Post created");
    setOpen(false);
  };

  return (
    <Drawer
      title={post ? "Edit post" : "New post"}
      open={open}
      onClose={() => setOpen(false)}
      afterOpenChange={(o) => !o && onClose()}
      size={screens.md ? 640 : "100%"}
      destroyOnHidden
      extra={<Button type="primary" icon={<CheckOutlined />} onClick={save}>Save</Button>}
      footer={
        <Flex justify="space-between">
          <Button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
          {step < STEPS.length - 1
            ? <Button type="primary" onClick={next}>Next</Button>
            : <Button type="primary" onClick={save}>Save post</Button>}
        </Flex>
      }
    >
      <Steps current={step} onChange={(s) => setStep(s)} items={STEPS.map((s) => ({ title: s.title }))} size="small" style={{ marginBottom: 24 }} />
      <Form form={form} layout="vertical" initialValues={initial} requiredMark="optional" preserve>
        <div hidden={step !== 0}>
          <Form.Item name="title" label="Title" rules={[{ required: true, whitespace: true, message: "Give the post a title" }, { min: 5, message: "At least 5 characters" }, { max: 120 }]}>
            <Input showCount maxLength={120} placeholder="What is this post about?" />
          </Form.Item>
          <Flex gap={16} wrap>
            <Form.Item name="category" label="Category" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
              <Select options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="authorId" label="Author" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
              <Select
                showSearch={{ optionFilterProp: "label" }}
                options={state.authors.map((a) => ({ value: a.id, label: a.name }))}
              />
            </Form.Item>
          </Flex>
          <Form.Item name="tags" label="Tags" rules={[{ type: "array", max: 6, message: "Up to 6 tags" }]} extra="Pick or type new tags">
            <Select mode="tags" options={TAGS.map((t) => ({ value: t, label: t }))} tokenSeparators={[",", " "]} />
          </Form.Item>
          <Form.Item label="Cover image" extra="Stays in your browser; nothing is uploaded.">
            <Upload listType="picture-card" accept="image/*" maxCount={1} beforeUpload={() => false}>
              <div><UploadOutlined /><div style={{ marginTop: 8 }}>Upload</div></div>
            </Upload>
          </Form.Item>
        </div>
        <div hidden={step !== 1}>
          <Form.Item name="excerpt" label="Excerpt" rules={[{ required: true, whitespace: true, message: "A short summary is required" }, { max: 300 }]}>
            <Input.TextArea rows={3} showCount maxLength={300} />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true, whitespace: true, message: "Write something" }, { min: 20, message: "At least 20 characters" }]}>
            <Input.TextArea autoSize={{ minRows: 8, maxRows: 18 }} showCount />
          </Form.Item>
        </div>
        <div hidden={step !== 2}>
          <Form.Item name="status" label="Status">
            <Radio.Group optionType="button" buttonStyle="solid" options={[
              { value: "draft", label: "Draft" }, { value: "scheduled", label: "Scheduled" },
              { value: "published", label: "Published" }, { value: "archived", label: "Archived" },
            ]} />
          </Form.Item>
          <Form.Item
            name="publishAt"
            label="Publish at"
            rules={[{ required: status === "scheduled", message: "Pick a date for a scheduled post" }, {
              validator: (_, v?: Dayjs) => status === "scheduled" && v && v.isBefore(dayjs(TODAY)) ? Promise.reject(new Error("A scheduled date must be in the future")) : Promise.resolve(),
            }]}
            dependencies={["status"]}
          >
            <DatePicker showTime={{ format: "HH:mm" }} format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Flex gap={32} wrap>
            <Form.Item name="featured" label="Featured" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="rating" label="Editor rating"><Rate allowClear /></Form.Item>
          </Flex>
        </div>
      </Form>
    </Drawer>
  );
}

function PostView({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const authors = useAuthors();
  const { openEditor } = useDrawers();
  const { message } = App.useApp();
  const screens = Grid.useBreakpoint();
  const post = state.posts.find((p) => p.id === id);
  const author = post && authors.get(post.authorId);
  const shareUrl = `${location.origin}${import.meta.env.BASE_URL}#/posts?view=${post?.id ?? ""}`;

  return (
    <Drawer open={!!post} onClose={onClose} size={screens.md ? 560 : "100%"} title={post?.id.toUpperCase()}
      extra={post && (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditor(post)}>Edit</Button>
          <Popconfirm title="Delete this post?" okText="Delete" okButtonProps={{ danger: true }}
            onConfirm={() => { dispatch({ type: "delete", ids: [post.id] }); message.success("Post deleted"); onClose(); }}>
            <Button danger icon={<DeleteOutlined />} aria-label="Delete post" />
          </Popconfirm>
        </Space>
      )}
    >
      {post && (
        <>
          <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
            <Tag color={STATUS_COLOR[post.status]}>{post.status}</Tag>
            <Tag>{post.category}</Tag>
            {post.featured && <Tag color="gold">featured</Tag>}
          </Space>
          <Typography.Title level={3} style={{ marginTop: 0 }}>{post.title}</Typography.Title>
          <Space style={{ marginBottom: 16 }}>
            <Avatar style={{ background: author?.color }}>{author && initials(author.name)}</Avatar>
            <div>
              <Typography.Text strong>{author?.name}</Typography.Text>
              <br />
              <Typography.Text type="secondary">{dayjs(post.publishAt).format("D MMM YYYY, HH:mm")}</Typography.Text>
            </div>
          </Space>
          <Flex gap={24} wrap style={{ marginBottom: 16 }}>
            <Statistic title="Views" value={post.views} prefix={<EyeOutlined />} />
            <Statistic title="Likes" value={post.likes} prefix={<LikeOutlined />} />
            <Statistic title="Comments" value={post.comments} prefix={<MessageOutlined />} />
          </Flex>
          <Typography.Paragraph type="secondary" italic>{post.excerpt}</Typography.Paragraph>
          {post.body.split("\n\n").map((para, i) => <Typography.Paragraph key={i}>{para}</Typography.Paragraph>)}
          <Divider />
          <Descriptions column={1} size="small" bordered items={[
            { key: "tags", label: "Tags", children: <Space size={[4, 4]} wrap>{post.tags.map((t) => <Tag key={t}>#{t}</Tag>)}</Space> },
            { key: "rating", label: "Editor rating", children: <Rate disabled value={post.rating} /> },
            { key: "created", label: "Created", children: dayjs(post.createdAt).format("D MMM YYYY") },
            { key: "email", label: "Author email", children: author?.email },
          ]} />
          <Divider titlePlacement="start">Share</Divider>
          <Flex gap={16} align="center" wrap>
            <QRCode value={shareUrl} size={128} bordered />
            <Typography.Paragraph copyable={{ text: shareUrl, tooltips: ["Copy link", "Copied"] }} style={{ margin: 0, wordBreak: "break-all", flex: 1, minWidth: 0 }}>
              {shareUrl}
            </Typography.Paragraph>
          </Flex>
        </>
      )}
    </Drawer>
  );
}
