// Run: node src/io.check.ts   (export → import round trip, CSV edge cases, formula guard)
import assert from "node:assert/strict";
import { generate } from "./data.ts";
import { fromCsv, parseCsv, toCsv } from "./io.ts";

assert.deepEqual(parseCsv('a,b\r\n"x, ""y""",2\n'), [["a", "b"], ['x, "y"', "2"]]);
assert.deepEqual(parseCsv('a\n"line1\nline2"'), [["a"], ["line1\nline2"]]);

const data = generate(7, 30);
const authors = new Map(data.authors.map((a) => [a.id, a]));
data.posts[0].title = '=HYPERLINK("http://evil")';
data.posts[1].title = 'Quotes "and", commas';
const csv = toCsv(data.posts, authors);
assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`), "formula cells are prefixed");

const back = fromCsv(csv, data.authors);
assert.deepEqual(back.errors, []);
assert.equal(back.posts.length, 30);
assert.equal(back.posts[0].title, '=HYPERLINK("http://evil")', "prefix removed on import");
assert.equal(back.posts[1].title, 'Quotes "and", commas');
for (const [i, p] of back.posts.entries()) {
  const o = data.posts[i];
  assert.deepEqual([p.id, p.status, p.category, p.authorId, p.views, p.tags.join()], [o.id, o.status, o.category, o.authorId, o.views, o.tags.join()]);
}

const bad = fromCsv("id,title,category,status\np1,Hi,Nope,draft\np2,,AI,draft\np3,Ok,AI,live\np4,Fine,AI,draft", data.authors);
assert.equal(bad.posts.length, 1);
assert.equal(bad.errors.length, 3);
assert.deepEqual(fromCsv("title\nx", data.authors).errors, ["Missing columns: id, category, status"]);

assert.deepEqual(generate(42).posts.slice(0, 3), generate(42).posts.slice(0, 3), "same seed → same data");
console.log("io: all checks pass");
