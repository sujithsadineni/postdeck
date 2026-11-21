import {
  DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, FileExcelOutlined, FileTextOutlined, MoreOutlined,
  SearchOutlined, SettingOutlined, StarFilled, UploadOutlined,
} from "@ant-design/icons";
import {
  App, Avatar, Badge, Button, Card, Checkbox, Dropdown, Flex, Input, Popconfirm, Rate, Segmented, Select, Space, Table,
  Tag, Tooltip, Typography, Upload, type TableColumnsType, type TableProps,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CATEGORIES, STATUSES, type Post, type Status } from "../data.ts";
import { download, fromCsv, toCsv, toXlsx } from "../io.ts";
import { initials, STATUS_COLOR, useDrawers } from "../PostDrawers.tsx";
import { useAuthors, useStore } from "../store.tsx";

type Density = "large" | "middle" | "small";
const OPTIONAL = ["author", "category", "status", "views", "likes", "rating", "publishAt"] as const;

export default function Posts() {
  const { state, dispatch } = useStore();
  const authors = useAuthors();
  const { openEditor, openView } = useDrawers();
  const { message, modal, notification } = App.useApp();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [density, setDensity] = useState<Density>("middle");
  const [visible, setVisible] = useState<string[]>([...OPTIONAL]);
  const [loading, setLoading] = useState(true);

  // Short fake load so the table's skeleton/spinner state is visible, like a real API call.
  useEffect(() => { const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, []);
  // Share links: #/posts?view=p012 opens that post.
  useEffect(() => {
    const id = params.get("view");
    if (id) { openView(id); setParams({}, { replace: true }); }
  }, [params, openView, setParams]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.posts.filter((p) =>
      (statusFilter === "all" || p.status === statusFilter) &&
      (!q || p.title.toLowerCase().includes(q) || p.tags.some((t) => t.includes(q)) || (authors.get(p.authorId)?.name.toLowerCase().includes(q) ?? false)));
  }, [state.posts, search, statusFilter, authors]);

  const titleSearch: TableColumnsType<Post>[number] = {
    filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input autoFocus placeholder="Search title" value={selectedKeys[0] as string} style={{ marginBottom: 8, display: "block" }}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])} onPressEnter={() => confirm()} />
        <Space>
          <Button type="primary" size="small" icon={<SearchOutlined />} onClick={() => confirm()}>Search</Button>
          <Button size="small" onClick={() => { clearFilters?.(); confirm(); }}>Reset</Button>
        </Space>
      </div>
    ),
    filterIcon: (on: boolean) => <SearchOutlined style={{ color: on ? "var(--pd-color-primary)" : undefined }} />,
    onFilter: (v, p) => p.title.toLowerCase().includes(String(v).toLowerCase()),
  };

  const all: TableColumnsType<Post> = [
    {
      key: "title", title: "Title", dataIndex: "title", fixed: "left", width: 320, ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title), ...titleSearch,
      render: (t: string, p) => (
        <Space size={6}>
          {p.featured && <Tooltip title="Featured"><StarFilled style={{ color: "#faad14" }} /></Tooltip>}
          <Typography.Link onClick={() => openView(p.id)} ellipsis>{t}</Typography.Link>
        </Space>
      ),
    },
    {
      key: "author", title: "Author", width: 190,
      sorter: (a, b) => (authors.get(a.authorId)?.name ?? "").localeCompare(authors.get(b.authorId)?.name ?? ""),
      filters: state.authors.map((a) => ({ text: a.name, value: a.id })), filterSearch: true,
      onFilter: (v, p) => p.authorId === v,
      render: (_, p) => {
        const a = authors.get(p.authorId);
        return <Space><Avatar size="small" style={{ background: a?.color }}>{a && initials(a.name)}</Avatar>{a?.name}</Space>;
      },
    },
    {
      key: "category", title: "Category", dataIndex: "category", width: 130,
      filters: CATEGORIES.map((c) => ({ text: c, value: c })), onFilter: (v, p) => p.category === v,
    },
    {
      key: "status", title: "Status", dataIndex: "status", width: 120,
      render: (s: Status) => <Badge status={STATUS_COLOR[s] as "success"} text={s} />,
    },
    { key: "views", title: "Views", dataIndex: "views", width: 100, align: "right", sorter: (a, b) => a.views - b.views, render: (n: number) => n.toLocaleString() },
    { key: "likes", title: "Likes", dataIndex: "likes", width: 90, align: "right", sorter: (a, b) => a.likes - b.likes, render: (n: number) => n.toLocaleString() },
    { key: "rating", title: "Rating", dataIndex: "rating", width: 150, sorter: (a, b) => a.rating - b.rating, render: (r: number) => <Rate disabled value={r} style={{ fontSize: 13 }} /> },
    {
      key: "publishAt", title: "Publish date", dataIndex: "publishAt", width: 140, defaultSortOrder: "descend",
      sorter: (a, b) => a.publishAt.localeCompare(b.publishAt), render: (d: string) => dayjs(d).format("D MMM YYYY"),
    },
    {
      key: "actions", title: "", fixed: "right", width: 60, align: "center",
      render: (_, p) => (
        <Dropdown trigger={["click"]} menu={{
          items: [
            { key: "view", icon: <EyeOutlined />, label: "View" },
            { key: "edit", icon: <EditOutlined />, label: "Edit" },
            { type: "divider" },
            ...STATUSES.filter((s) => s !== p.status).map((s) => ({ key: `status:${s}`, label: `Mark ${s}` })),
            { type: "divider" },
            { key: "delete", icon: <DeleteOutlined />, label: "Delete", danger: true },
          ],
          onClick: ({ key }) => {
            if (key === "view") openView(p.id);
            else if (key === "edit") openEditor(p);
            else if (key.startsWith("status:")) { dispatch({ type: "status", ids: [p.id], status: key.slice(7) as Status }); message.success(`Marked ${key.slice(7)}`); }
            else if (key === "delete") modal.confirm({
              title: "Delete this post?", content: p.title, okText: "Delete", okButtonProps: { danger: true },
              onOk: () => { dispatch({ type: "delete", ids: [p.id] }); message.success("Post deleted"); },
            });
          },
        }}>
          <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${p.title}`} />
        </Dropdown>
      ),
    },
  ];
  const columns = all.filter((c) => !OPTIONAL.includes(c.key as never) || visible.includes(c.key as string));

  const bulk = (status: Status) => {
    dispatch({ type: "status", ids: selected as string[], status });
    message.success(`${selected.length} posts marked ${status}`);
    setSelected([]);
  };
  const exportAs = async (kind: "csv" | "xlsx", scope: "selected" | "filtered") => {
    const list = scope === "selected" ? rows.filter((p) => selected.includes(p.id)) : rows;
    const name = `postdeck-${scope}-${dayjs().format("YYYYMMDD-HHmm")}`;
    if (kind === "csv") download(toCsv(list, authors), `${name}.csv`);
    else {
      const hide = message.loading("Building the Excel file…", 0);
      try { download(await toXlsx(list, authors), `${name}.xlsx`); } finally { hide(); }
    }
    message.success(`Exported ${list.length} posts`);
  };
  const importCsv = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { message.error("CSV files up to 5 MB"); return false; }
    const { posts, errors } = fromCsv(await file.text(), state.authors);
    if (posts.length) dispatch({ type: "import", posts });
    notification[errors.length ? "warning" : "success"]({
      title: `Imported ${posts.length} posts`,
      description: errors.length ? <>{errors.slice(0, 5).map((e) => <div key={e}>{e}</div>)}{errors.length > 5 && <div>…and {errors.length - 5} more</div>}</> : "Posts with the same id were updated.",
    });
    return false; // handled here; antd must not upload anywhere
  };

  const rowSelection: TableProps<Post>["rowSelection"] = {
    selectedRowKeys: selected, onChange: setSelected, fixed: true,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Title level={3} style={{ margin: 0 }}>Posts</Typography.Title>
        <Space wrap>
          <Upload accept=".csv,text/csv" showUploadList={false} beforeUpload={importCsv}>
            <Button icon={<UploadOutlined />}>Import CSV</Button>
          </Upload>
          <Dropdown trigger={["click"]} menu={{
            items: [
              { key: "csv:filtered", icon: <FileTextOutlined />, label: `CSV: ${rows.length} shown` },
              { key: "xlsx:filtered", icon: <FileExcelOutlined />, label: `Excel: ${rows.length} shown` },
              { type: "divider" },
              { key: "csv:selected", icon: <FileTextOutlined />, label: `CSV: ${selected.length} selected`, disabled: !selected.length },
              { key: "xlsx:selected", icon: <FileExcelOutlined />, label: `Excel: ${selected.length} selected`, disabled: !selected.length },
            ],
            onClick: ({ key }) => { const [k, s] = key.split(":"); exportAs(k as "csv", s as "filtered"); },
          }}>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
        </Space>
      </Flex>

      <Card styles={{ body: { padding: 0 } }}>
        <Flex gap={8} wrap align="center" style={{ padding: 12 }}>
          <Input.Search allowClear placeholder="Search title, tag or author" style={{ maxWidth: 300 }} onChange={(e) => setSearch(e.target.value)} aria-label="Search posts table" />
          <div className="scroll-x"><Segmented value={statusFilter} onChange={(v) => setStatusFilter(v as Status)} options={[
            { value: "all", label: `All ${state.posts.length}` },
            ...STATUSES.map((s) => ({ value: s, label: `${s[0].toUpperCase()}${s.slice(1)} ${state.posts.filter((p) => p.status === s).length}` })),
          ]} /></div>
          <Flex gap={8} style={{ marginInlineStart: "auto" }}>
            <Select<Density> value={density} onChange={setDensity} aria-label="Row density" style={{ width: 120 }}
              options={[{ value: "large", label: "Roomy" }, { value: "middle", label: "Default" }, { value: "small", label: "Compact" }]} />
            <Dropdown trigger={["click"]} popupRender={() => (
              <Card size="small" title="Columns" style={{ width: 200 }}>
                <Checkbox.Group value={visible} onChange={(v) => setVisible(v as string[])} style={{ display: "grid", gap: 6 }}
                  options={OPTIONAL.map((k) => ({ value: k, label: all.find((c) => c.key === k)?.title as string }))} />
              </Card>
            )}>
              <Button icon={<SettingOutlined />} aria-label="Choose columns" />
            </Dropdown>
          </Flex>
        </Flex>

        {selected.length > 0 && (
          <Flex className="bulkbar" gap={8} align="center" wrap>
            <Typography.Text strong>{selected.length} selected</Typography.Text>
            <Button size="small" onClick={() => bulk("published")}>Publish</Button>
            <Button size="small" onClick={() => bulk("draft")}>Move to draft</Button>
            <Button size="small" onClick={() => bulk("archived")}>Archive</Button>
            <Popconfirm title={`Delete ${selected.length} posts?`} okText="Delete" okButtonProps={{ danger: true }}
              onConfirm={() => { dispatch({ type: "delete", ids: selected as string[] }); message.success(`${selected.length} posts deleted`); setSelected([]); }}>
              <Button size="small" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
            <Button size="small" type="link" onClick={() => setSelected([])}>Clear</Button>
          </Flex>
        )}

        <Table<Post>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          size={density}
          rowSelection={rowSelection}
          scroll={{ x: 1300 }}
          sticky
          expandable={{
            expandedRowRender: (p) => (
              <Flex vertical gap={8} style={{ maxWidth: 820 }}>
                <Typography.Paragraph style={{ margin: 0 }}>{p.excerpt}</Typography.Paragraph>
                <Space size={[4, 4]} wrap>
                  <Tag>{p.category}</Tag>
                  {p.tags.map((t) => <Tag key={t} color="blue">#{t}</Tag>)}
                  <Typography.Text type="secondary">{p.comments} comments · created {dayjs(p.createdAt).format("D MMM YYYY")}</Typography.Text>
                </Space>
              </Flex>
            ),
          }}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (t, [a, b]) => `${a}–${b} of ${t} posts`, showQuickJumper: true }}
        />
      </Card>
    </Flex>
  );
}
