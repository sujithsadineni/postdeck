// Generated sample data. Same seed → same data on every load; "Regenerate" picks a new seed.
import { faker as f } from "@faker-js/faker/locale/en"; // English only: keeps the bundle small

export const STATUSES = ["draft", "scheduled", "published", "archived"] as const;
export type Status = (typeof STATUSES)[number];
export const CATEGORIES = ["Engineering", "Design", "Product", "Career", "AI", "Cloud", "Frontend", "Data"] as const;
export const ROLES = ["Editor", "Writer", "Contributor", "Guest"] as const;
export const TAGS = [
  "react", "typescript", "antd", "graphql", "aws", "node", "css", "testing",
  "performance", "a11y", "postgres", "llm", "devops", "ux", "career", "open-source",
];

export type Author = {
  id: string; name: string; email: string; role: (typeof ROLES)[number];
  bio: string; city: string; joined: string; followers: number; color: string;
};
export type Post = {
  id: string; title: string; excerpt: string; body: string; authorId: string;
  category: (typeof CATEGORIES)[number]; tags: string[]; status: Status;
  views: number; likes: number; comments: number; rating: number; featured: boolean;
  createdAt: string; publishAt: string;
};
export type Data = { seed: number; authors: Author[]; posts: Post[] };

/** Fixed "today" so the generated dates and the charts never drift. */
export const TODAY = new Date("2026-11-21T12:00:00Z");
const COLORS = ["#1677ff", "#722ed1", "#13c2c2", "#eb2f96", "#fa8c16", "#52c41a", "#2f54eb", "#fa541c"];

export function generate(seed = 42, postCount = 120): Data {
  f.seed(seed);
  const day = 86_400_000;

  const authors: Author[] = Array.from({ length: 18 }, (_, i) => {
    const first = f.person.firstName(), last = f.person.lastName();
    return {
      id: `a${i + 1}`,
      name: `${first} ${last}`,
      email: f.internet.email({ firstName: first, lastName: last, provider: "example.com" }).toLowerCase(),
      role: f.helpers.arrayElement(ROLES),
      bio: f.lorem.sentences({ min: 1, max: 4 }),
      city: f.location.city(),
      joined: f.date.past({ years: 4, refDate: TODAY }).toISOString(),
      followers: f.number.int({ min: 40, max: 25_000 }),
      color: COLORS[i % COLORS.length],
    };
  });

  const posts: Post[] = Array.from({ length: postCount }, (_, i) => {
    const status = f.helpers.weightedArrayElement([
      { value: "published" as const, weight: 6 },
      { value: "draft" as const, weight: 2 },
      { value: "scheduled" as const, weight: 1.5 },
      { value: "archived" as const, weight: 1 },
    ]);
    const created = new Date(TODAY.getTime() - f.number.int({ min: 0, max: 180 }) * day - f.number.int({ min: 0, max: day }));
    const publishAt = status === "scheduled"
      ? new Date(TODAY.getTime() + f.number.int({ min: 1, max: 40 }) * day)
      : new Date(created.getTime() + f.number.int({ min: 0, max: 3 }) * day);
    const live = status === "published" || status === "archived";
    const views = live ? f.number.int({ min: 50, max: 40_000 }) : 0;
    const title = f.helpers.arrayElement([
      () => `How we ${f.hacker.verb()} the ${f.hacker.noun()} in ${f.number.int({ min: 2, max: 12 })} weeks`,
      () => `${f.company.buzzPhrase().replace(/^\w/, (c) => c.toUpperCase())}`,
      () => `A practical guide to ${f.hacker.adjective()} ${f.hacker.noun()}s`,
      () => `${f.number.int({ min: 3, max: 10 })} lessons from ${f.hacker.ingverb()} ${f.hacker.noun()}s`,
      () => `Why ${f.hacker.abbreviation()} still matters for ${f.helpers.arrayElement(CATEGORIES).toLowerCase()} teams`,
    ])();
    return {
      id: `p${String(i + 1).padStart(3, "0")}`,
      title,
      excerpt: f.lorem.sentences(2),
      body: f.lorem.paragraphs(3, "\n\n"),
      authorId: f.helpers.arrayElement(authors).id,
      category: f.helpers.arrayElement(CATEGORIES),
      tags: f.helpers.arrayElements(TAGS, { min: 1, max: 4 }),
      status,
      views,
      likes: live ? Math.round(views * f.number.float({ min: 0.01, max: 0.12 })) : 0,
      comments: live ? f.number.int({ min: 0, max: 180 }) : 0,
      rating: live ? f.number.int({ min: 2, max: 5 }) : 0,
      featured: live && f.datatype.boolean(0.12),
      createdAt: created.toISOString(),
      publishAt: publishAt.toISOString(),
    };
  });
  return { seed, authors, posts };
}
