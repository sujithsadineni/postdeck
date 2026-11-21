// Export to CSV / Excel and import from CSV. No network: files are made and read in the browser.
import { CATEGORIES, STATUSES, type Author, type Post } from "./data.ts";

export const COLUMNS = [
  "id", "title", "author", "category", "status", "tags", "views", "likes", "comments",
  "rating", "featured", "createdAt", "publishAt", "excerpt",
] as const;

const row = (p: Post, authors: Map<string, Author>) => [
  p.id, p.title, authors.get(p.authorId)?.name ?? "", p.category, p.status, p.tags.join(" "),
  p.views, p.likes, p.comments, p.rating, p.featured ? "yes" : "no", p.createdAt, p.publishAt, p.excerpt,
];

/** Spreadsheet apps run cells that start with = + - @ as formulas; prefix them so they stay text. */
const safeCell = (v: string | number) => (typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

export function toCsv(posts: Post[], authors: Map<string, Author>): string {
  const esc = (v: string | number) => {
    const s = String(safeCell(v));
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [COLUMNS.join(","), ...posts.map((p) => row(p, authors).map(esc).join(","))].join("\r\n");
}

export async function toXlsx(posts: Post[], authors: Map<string, Author>): Promise<Blob> {
  const { default: ExcelJS } = await import("exceljs"); // ~1 MB, loaded only when someone exports
  const wb = new ExcelJS.Workbook();
  wb.creator = "postdeck";
  const ws = wb.addWorksheet("Posts", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = COLUMNS.map((key) => ({ header: key, key, width: key === "title" || key === "excerpt" ? 48 : 14 }));
  ws.getRow(1).font = { bold: true };
  for (const p of posts) ws.addRow(row(p, authors).map(safeCell));
  ws.autoFilter = { from: "A1", to: { row: 1, column: COLUMNS.length } };
  return new Blob([await wb.xlsx.writeBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function download(data: Blob | string, name: string) {
  const blob = typeof data === "string" ? new Blob(["﻿" + data], { type: "text/csv;charset=utf-8" }) : data;
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** RFC 4180 CSV → rows (quoted fields, "" escapes, CRLF or LF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "", rowCells: string[] = [], quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { rowCells.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      rowCells.push(field); rows.push(rowCells); rowCells = []; field = "";
    } else field += c;
  }
  if (field || rowCells.length) { rowCells.push(field); rows.push(rowCells); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export type ImportResult = { posts: Post[]; errors: string[] };

/** CSV (same columns as the export) → posts. Bad rows are skipped and reported, never half-imported. */
export function fromCsv(text: string, authors: Author[], max = 2000): ImportResult {
  const [header, ...lines] = parseCsv(text);
  const errors: string[] = [];
  if (!header) return { posts: [], errors: ["The file is empty"] };
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  const missing = ["id", "title", "category", "status"].filter((k) => !(k in col));
  if (missing.length) return { posts: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  if (lines.length > max) errors.push(`Only the first ${max} rows were read`);

  const byName = new Map(authors.map((a) => [a.name.toLowerCase(), a.id]));
  const num = (v: string | undefined) => Math.max(0, Math.round(Number(v) || 0));
  const unquote = (v: string) => (v.startsWith("'") && /^'[=+\-@]/.test(v) ? v.slice(1) : v);
  const posts: Post[] = [];
  lines.slice(0, max).forEach((r, i) => {
    const get = (k: string) => (k in col ? unquote((r[col[k]] ?? "").trim()) : "");
    const line = i + 2;
    const id = get("id"), title = get("title"), category = get("category"), status = get("status");
    if (!/^[\w-]{1,40}$/.test(id)) return errors.push(`Row ${line}: id is missing or invalid`);
    if (!title) return errors.push(`Row ${line}: title is empty`);
    if (!(CATEGORIES as readonly string[]).includes(category)) return errors.push(`Row ${line}: unknown category "${category}"`);
    if (!(STATUSES as readonly string[]).includes(status)) return errors.push(`Row ${line}: unknown status "${status}"`);
    const date = (k: string) => (Number.isNaN(Date.parse(get(k))) ? new Date().toISOString() : new Date(get(k)).toISOString());
    posts.push({
      id, title: title.slice(0, 200), category: category as Post["category"], status: status as Post["status"],
      authorId: byName.get(get("author").toLowerCase()) ?? authors[0]?.id ?? "a1",
      tags: get("tags").split(/\s+/).filter(Boolean).slice(0, 10),
      views: num(get("views")), likes: num(get("likes")), comments: num(get("comments")),
      rating: Math.min(5, num(get("rating"))), featured: get("featured") === "yes",
      createdAt: date("createdAt"), publishAt: date("publishAt"),
      excerpt: get("excerpt").slice(0, 500), body: get("excerpt"),
    });
  });
  return { posts, errors };
}
