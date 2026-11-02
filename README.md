# linuxlinking.github.io

Personal site of [LinuxLinking](https://github.com/LinuxLinking) — live at **[linuxlinking.github.io](https://linuxlinking.github.io)**.

A hand-written static site with **zero dependencies**: no framework, no CDN, no npm. The published
artifact is plain HTML + CSS + ES modules.

> There *is* a build step — a single stdlib-only Python script that assembles pages from
> templates, renders Markdown into post pages, stamps content hashes for cache busting, and emits
> `sitemap.xml` / `robots.txt`. It runs locally and its output is committed; the site itself
> still needs no build to be served, which is what GitHub Pages requires.

## What's inside

- **Poster index** (default home view) — an oversized display headline, a full-width vermillion
  "right now" band, then projects as a numbered index (`01 │ Mdeditor │ 2026`), each with its own
  accent swatch and the posts written about it
- **Schematic** (second view, 图纸) — the whole site drawn as a directory sheet: one spine per
  column, section headings, posts nested under Writing. Drag, scroll to zoom, double-click to reset
- **Ink poster design** — warm-black ground, bone-white text, one vermillion accent, high-contrast
  serif display type, hard edges. No glass, no blur, no glow, no rounded corners.
- **zh / en switching** across all pages (`?lang=en` → `localStorage` → `navigator.language`).
  Both languages are written into the HTML at build time; the toggle only flips `html[lang]`, so
  the page works without JavaScript and search engines read both.
- [Writing](https://linuxlinking.github.io/blog/) — a blog
- [Soul for U](https://linuxlinking.github.io/soul-for-u/) — a page written for one person
- **One address per project** — `/projects/<slug>/` is a real static page, shareable and indexable;
  the old `project.html?id=<slug>` links redirect there
- **SEO ready** — canonical URLs, Open Graph / Twitter cards, JSON-LD, `sitemap.xml`, `robots.txt`,
  and internal links between projects, posts and the home index

## Stack

Native HTML, CSS and ES modules. The only build tooling is `tools/build.py` (Python 3.9+, standard
library only). Unit tests use standard runners — `python -m unittest` for the build rules and
`node --test` for the JS module — with no packages to install:

```bash
python -m unittest discover -s tools -p "test_*.py"
node --test js/nodes.test.mjs
```

## Design system

Ink poster: warm-black ground, bone-white text, one vermillion accent, serif display type, hard
edges. Everything is a token in `:root` in `css/base.css` — retheming means editing that one block,
not the stylesheets.

| token | value | used for |
|---|---|---|
| `--bg` | `#14120f` | warm-black ground |
| `--fg` / `--fg-dim` / `--fg-faint` | `#f2ece0` / `#b5ac9d` / `#8d8577` | bone-white ink, secondary, tertiary |
| `--line` / `--line-strong` | `#2f2a23` / `#4a4237` | hairlines, rules |
| `--surface` / `--surface-soft` | `#1b1814` / `#201c17` | panels, code chips |
| `--accent` | `#f2603f` | the single accent: active state, links, selection, the "right now" band |
| `--on-accent` | `#14120f` | text on the accent |
| `--radius-lg` / `--radius-md` | `0` / `0` | hard edges — the poster has no rounded corners |
| `--font-display` / `--font-read` / `--font-sans` / `--font-mono` | serif / serif / sans / mono stacks | headings, long-form body, UI, meta |

Type is **system fonts only** — no web fonts, no CDN:

- `--font-display` is the editorial voice: a high-contrast serif stack (`Bodoni MT` / `Didot` /
  `Playfair Display` → Georgia) for Latin, heavy CJK for Chinese.
- `--font-read` is the long-form voice: `Iowan Old Style` / Georgia for Latin, a Song face for
  Chinese — article bodies stay readable instead of shouting.
- Chinese needs its own rules. `css/base.css` declares two `local()`-only `@font-face` families,
  `Display CJK` (heavy, for headings) and `Read CJK` (serif, for body copy), each with a
  `unicode-range` covering CJK ranges so those glyphs never fall back to a Latin face.
  `local()` means nothing is downloaded.
- `--font-mono` carries numbers, dates and labels; `.kicker` and `.section-label` are mono
  uppercase with tabular numerals.

Background is a static inline SVG print-noise texture on `body` — no canvas, no JS starfield.
`prefers-reduced-motion` collapses every transition and animation to ~0.

## Directory map

```
/
├─ layouts/                 page shells
│  ├─ base.html             shared chrome: topbar, footer, blocks, SEO head slot
│  └─ post.html             Markdown post shell (front matter + body)
├─ pages/                   page fragments — the parts you actually edit
│  ├─ index.html            home (index + schematic)
│  ├─ detail.html           project detail template (one page per project)
│  ├─ project.html          old project address → redirect page
│  ├─ blog.html             blog index
│  └─ 404.html              not-found
├─ data/                    the single source of truth for content
│  ├─ projects.json         9 entries: 7 projects + the Writing node + Soul for U
│  ├─ posts.json            blog index (slug / date / bilingual title+summary /
│  │                         projectId / label / monogram / url)
│  ├─ now.json              what I'm working on right now (author-maintained)
│  └─ i18n.json             every UI string, zh + en
├─ tools/
│  ├─ build.py              assembler: templates → pages, SEO head, sitemap, hashes, validation
│  ├─ markdown.py           the Markdown subset used by the posts
│  ├─ og_image.py           draws assets/og.png (1200×630 social card) with stdlib only
│  └─ test_*.py             unit tests
├─ css/                     base.css (tokens + primitives) + per-page stylesheets
│                           home.css (home index) · map.css (schematic) · detail.css
│                           blog.css · post.css
├─ js/                      ES modules
│                           site.js boots the shared i18n (language toggle) on every page
│                           shared.js holds escapeHtml + the common boot sequence
│                           app.js wires the home page: schematic view + about panel
│                           map.js draws the schematic (directory layout + pan/zoom)
│                           nodes.js merges projects + posts into the site node list
│                           post.js lazily renders mermaid diagrams inside a post
│                           project-redirect.js sends the old ?id= links to the new pages
├─ blog/<slug>/             post.md (source) + generated index.html
├─ projects/<id>/           generated project page — one directory per project
├─ assets/                  favicon.svg + og.png (social card)
├─ soul-for-u/              untouched sub-site
└─ docs/superpowers/specs/  design specs
```

Generated files (root `index.html`, `project.html`, `404.html`, `blog/index.html`,
`blog/*/index.html`, `projects/*/index.html`, `sitemap.xml`, `robots.txt`) are committed to the
repo so GitHub Pages can serve them directly. **Edit `layouts/`, `pages/` and `data/`, not the
generated HTML.**

## Build

```bash
python tools/build.py          # assemble + stamp hashes
python tools/build.py --check  # validate only, fail if anything is stale
python tools/og_image.py       # redraw assets/og.png
```

`build.py` does seven things:

1. Renders `layouts/base.html` + each `pages/*.html` fragment into the root pages.
2. Renders `layouts/post.html` for every entry in `data/posts.json` into `blog/<slug>/index.html`,
   with the Markdown rendered to HTML at build time by `tools/markdown.py`.
3. Renders `pages/detail.html` once per project into `projects/<id>/index.html`.
4. Renders the home index, the blog index and every project page **into static HTML**. Nothing on
   those pages depends on a runtime `fetch`, so a crawler, a reader with JavaScript disabled and a
   social-preview bot all see the same content.
5. Writes the SEO head for every page: `canonical`, Open Graph, Twitter card and JSON-LD
   (`WebSite` + `Person` + `ItemList` on the home page, `SoftwareApplication` per project,
   `BlogPosting` per post), plus `sitemap.xml` and `robots.txt`.
6. Rewrites `?v=<hash>` on every CSS/JS reference and on every ES module import, using the
   file's content hash. A module's hash folds in the hashes of the modules it imports, so
   changing one file re-stamps every page that depends on it — returning visitors get the new
   file instead of a stale cached copy. An existing `?v=` in the file is normalised away, so
   the script stays idempotent.
7. Regenerates the copy block in `js/i18n.js` from `data/i18n.json`, so the two never drift.

`--check` verifies JSON validity, that project ids and post slugs are unique, that a project id
can be used as a directory name, that project links resolve, that every registered post has a
`post.md`, that `now.json` links point at real pages, that `assets/og.png` exists, and that no
generated file is stale.

## Bilingual

Every translatable string is written **twice** into the HTML:

```html
<span class="i18n-zh" lang="zh-CN">作品与文字</span>
<span class="i18n-en" lang="en">Projects &amp; Writing</span>
```

`css/base.css` hides one of them based on `html[lang]`, and `js/site.js` is the only thing that
flips that attribute. Consequences worth knowing:

- no runtime string bundle to fetch, and no relative-path juggling per page depth
- search engines read both languages from the same URL (no fake `hreflang`)
- the page still reads with JavaScript disabled

The `lang` attribute on each English span tells screen readers which language to pronounce.

## Writing a new post

1. Create `blog/<slug>/post.md` with YAML-ish front matter:

   ```markdown
   ---
   title: 文章标题
   date: 2026-11-02
   tag: PROJECT TAG
   lede: 一两句话的导读（可选）
   ---

   正文……
   ```

   Mermaid diagrams work: write a ```` ```mermaid ```` block and it is lazily rendered on the page.

2. Register it in `data/posts.json`:

   ```json
   {
     "slug": "my-new-post",
     "date": "2026-11-02",
     "projectId": "intent-os",
     "label": { "zh": "短标签", "en": "Short label" },
     "monogram": "文",
     "title": { "zh": "文章标题", "en": "Post title" },
     "summary": { "zh": "摘要。", "en": "Summary." },
     "url": "my-new-post/"
   }

   `label` 与 `monogram` 是图纸节点要用的，必填；`projectId` 可以留空（独立文章），
   填了就必须是一个存在的项目 id，否则 `build.py --check` 会报错。
   ```

3. Run `python tools/build.py`. The article page appears in the blog index and on the home index
   automatically.

Posts are listed on the home page and the blog index straight from `posts.json` — no page needs to
be touched by hand.

### Why no `tags` field?

`posts.json` deliberately has no `tags` array. The site has four posts and no tag index, tag
filtering, or tag pages; a tag field with no consumer is a field that will drift out of sync with
the Markdown front matter (which does carry a single `tag:` label used as a kicker). If tag
browsing is ever added, add the field and the index page in the same change.

## Editing content

- **Projects** — edit `data/projects.json`, then rebuild. `id`, `kind` (`project` / `blog` / `moon`),
  `order`, `monogram`, `accent`, `year`, `stack`, `keywords`, `title`/`label`/`tagline`/`summary`
  (bilingual), `links`, `repo` are all read from there. `order` decides the index order and the
  schematic layout — the first three are the featured ones.
- **Now** — edit `data/now.json`. `kind` is `building` or `writing`; `text` is a plain
  string (or a `zh`/`en` object); `href` is optional and must point at a page that exists.
- **Posts** — edit `data/posts.json`, then rebuild. `projectId` links a post to a project (empty for
  standalone posts); `label` and `monogram` are what the schematic shows for it.
- **UI copy** — edit `data/i18n.json`, then rebuild. `js/i18n.js` keeps a generated copy of the
  same strings, which is what the browser actually reads.
- **Site entry** — the `site` project in `projects.json` describes this site itself and feeds the
  detail page.

## Conventions

- UTF-8, **no BOM**; LF line endings (enforced by `.gitattributes` and `.editorconfig`).
- 2-space indentation in `js` / `css` / `html` / `json`.
- No npm, no bundler, no CDN. `js/vendor/` holds the checked-in mermaid ES module — the only
  exception to "hand-written", and it is vendored on purpose.
- CSS design tokens live in `:root` in `css/base.css`; use them instead of hard-coded colors,
  radii, shadows and z-index values. Shared primitives: `.pill`, `.card`, `.orb`, `.page-wrap`.
- No `backdrop-filter`, no blur, no glow, no glass — the visual language is flat ink on a dark
  ground, with hard edges instead of rounded corners.
- Keep `?v=` hashes out of hand-written files — `build.py` owns them.
- GitHub Pages: the published tree is plain static files, `.nojekyll` is committed, the whole
  repo is a few megabytes, and nothing on the site needs a server-side runtime.

## Run locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

ES modules require serving over `http://` — opening `index.html` directly from disk won't work.
