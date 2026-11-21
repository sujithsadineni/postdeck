// App state: generated data + user edits + settings, saved in localStorage (per browser).
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { generate, type Data, type Post, type Status } from "./data.ts";

export type Settings = {
  dark: boolean; compact: boolean; primary: string; radius: number;
  locale: "en" | "hi"; watermark: boolean; siderCollapsed: boolean;
};
export const DEFAULT_SETTINGS: Settings = {
  dark: typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches,
  compact: false, primary: "#1677ff", radius: 8, locale: "en", watermark: false, siderCollapsed: false,
};

type State = Data & { settings: Settings };
type Action =
  | { type: "save"; post: Post }
  | { type: "delete"; ids: string[] }
  | { type: "status"; ids: string[]; status: Status }
  | { type: "import"; posts: Post[] }
  | { type: "regenerate"; seed: number }
  | { type: "settings"; patch: Partial<Settings> };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "save": {
      const exists = s.posts.some((p) => p.id === a.post.id);
      return { ...s, posts: exists ? s.posts.map((p) => (p.id === a.post.id ? a.post : p)) : [a.post, ...s.posts] };
    }
    case "delete": {
      const ids = new Set(a.ids);
      return { ...s, posts: s.posts.filter((p) => !ids.has(p.id)) };
    }
    case "status": {
      const ids = new Set(a.ids);
      return { ...s, posts: s.posts.map((p) => (ids.has(p.id) ? { ...p, status: a.status } : p)) };
    }
    case "import": {
      const byId = new Map(s.posts.map((p) => [p.id, p]));
      for (const p of a.posts) byId.set(p.id, p);
      return { ...s, posts: [...byId.values()] };
    }
    case "regenerate":
      return { ...generate(a.seed), settings: s.settings };
    case "settings":
      return { ...s, settings: { ...s.settings, ...a.patch } };
  }
}

const KEY = "postdeck.v1";
function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved?.posts && saved?.authors) return { ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
  } catch { /* blocked or corrupt storage: start fresh */ }
  return { ...generate(), settings: DEFAULT_SETTINGS };
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state]);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}

/** author id → author, rebuilt only when authors change */
export function useAuthors() {
  const { state } = useStore();
  return useMemo(() => new Map(state.authors.map((a) => [a.id, a])), [state.authors]);
}

export const nextPostId = (posts: Post[]) =>
  `p${String(Math.max(0, ...posts.map((p) => Number(p.id.slice(1)) || 0)) + 1).padStart(3, "0")}`;
