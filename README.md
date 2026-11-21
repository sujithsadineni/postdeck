<p align="center"><img src="logo.svg" width="88" alt="postdeck logo"></p>

# postdeck

A posts admin console built with **Ant Design 6**: dashboard charts, a full-featured posts table, a three-step
editor, authors, a publishing calendar and a gallery of the rest of the component library. All data is generated
with faker in the browser, so there is no server.

**Live demo:** https://sujithsadineni.github.io/postdeck/

## What's inside

| Page | Ant Design pieces |
|---|---|
| Dashboard | Statistic (count-up), BorderBeam, Area / Pie / stacked Column charts (@ant-design/plots), Progress dashboard, Timeline, Listy, Segmented |
| Posts | Table: sorting, column filters, title search dropdown, row selection with bulk publish / draft / archive / delete, expandable rows, fixed columns, sticky header, column picker, density, pagination with quick jump · Export to CSV or Excel (shown or selected rows) · Import CSV with per-row errors · Dropdown actions, Modal.confirm, Popconfirm |
| Editor (drawer) | Form with validation across 3 Steps, Select (search + tags mode), DatePicker with time, Radio buttons, Switch, Rate, Upload (picture card, local only) |
| Post viewer (drawer) | Descriptions, Statistic, Typography (copyable), QRCode share link |
| Authors | Masonry cards, Skeleton loading, Segmented cards/table, search + sort, author drawer |
| Calendar | Calendar with posts in each day, resizable Splitter, upcoming list |
| Components | Every button style, message / notification / modal, Alerts, Progress, Spin, BorderBeam, Carousel, Avatar.Group, Badge, Tags, Image preview, Collapse, Cascader, Mentions, pickers, Slider, Steps, Tabs, Tree, TreeSelect, Transfer, Empty, Result, Anchor |
| Settings | Light / dark and compact algorithms, brand colour (ColorPicker), corner radius, Hindi component locale, Watermark, guided Tour, reset or regenerate the sample data |

Also: header search (AutoComplete), FloatButton group with back-to-top, a phone tab bar, a 404 page, and all
edits saved in `localStorage`.

## Run

```bash
npm install
npm run dev        # http://localhost:5182/postdeck/
npm run build      # type-check + production build into dist/
node src/io.check.ts   # CSV export/import round-trip check
```

## Notes

- Spreadsheet safety: exported cells that start with `=`, `+`, `-` or `@` are prefixed so Excel does not run them as formulas.
- Imports are checked row by row (id, title, category, status); bad rows are skipped and listed.
- v1 of this repo (Myposts.com: Apollo Server GraphQL API with Knex, PostgreSQL and JWT) is kept at tag `v1-graphql-knex`.
