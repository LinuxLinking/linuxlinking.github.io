# linuxlinking.github.io

Personal site of [LinuxLinking](https://github.com/LinuxLinking) — live at **[linuxlinking.github.io](https://linuxlinking.github.io)**.

The site is a **Windows XP desktop**: the home page *is* the desktop, every project and essay sits
on it as a shortcut, and clicking one opens it in an Internet Explorer window. The XP chrome is
hand-written HTML and CSS — no framework, no CDN, no npm, no image assets beyond a favicon and the
social card.

> There *is* a build step — a single stdlib-only Python script that assembles pages from
> templates, renders Markdown into post pages, stamps content hashes for cache busting, and emits
> `sitemap.xml` / `robots.txt`. It runs locally and its output is committed; the site itself
> still needs no build to be served, which is what GitHub Pages requires.

## What's inside

- **The XP desktop** (home) — Bliss-style wallpaper drawn in pure CSS, a column-major grid of
  shortcuts (7 projects · Writing · 4 essays · Soul for U · Site Map), and a taskbar with a start
  button, quick-launch icons, a task list, a language toggle and a clock.
- **IE windows** — clicking a shortcut opens a real window: gradient title bar with
  minimize / maximize / close, menu bar, toolbar with back / forward / reload / home, an address
  bar showing the page's own URL, and a status bar. The window scrolls on its own XP scrollbar,
  except for a page that manages its own scroll (Soul for U), which keeps that instead — a window
  never shows two scrollbars.
  Windows drag, stack, minimize, maximize, close, and each one gets a taskbar button. The whole
  chrome follows the language — switch to English and the menus, tooltips and status bar switch
  with it.
- **The start menu** — the XP two-column menu: Internet Explorer / My Computer / Site Map /
  Soul for U on the left, the seven projects on the blue right column, with the "right now" note
  as the subtitle and log-off / shut-down at the bottom.
- **Site map** (图纸) — the whole site drawn as a directory sheet, opened as a full-screen
  application over the desktop. Drag, scroll to zoom, double-click to reset.
- **zh / en switching** across the whole site, from the taskbar. Both languages are written into
  the HTML at build time; the toggle only flips `html[lang]`, so the page works without
  JavaScript and search engines read both.
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

Windows XP era: white paper, IE-blue links, Times New Roman body copy, Tahoma chrome, grey
3-D controls. Everything is a token in `:root` in `css/base.css` — retheming means editing that
one block, not the stylesheets.

| token | value | used for |
|---|---|---|
| `--bg` / `--fg` | `#ffffff` / `#000000` | paper and ink |
| `--fg-dim` / `--fg-faint` / `--fg-soft` | `#333333` / `#6b6b6b` / `#1a1a1a` | secondary, tertiary, code text |
| `--fg-code` / `--fg-code-dim` | `#003366` / `#555555` | code blocks, code captions |
| `--line` / `--line-soft` / `--line-strong` | `#c0c0c0` / `#dcdcdc` / `#808080` | control edges, hairlines |
| `--surface` / `--surface-soft` | `#ffffff` / `#f3f3f3` | panels, toolbar fills |
| `--surface-hover` / `--surface-active` | `#ece9d8` / `#dcd8c8` | the XP selection colour |
| `--accent` | `#0a246a` | XP deep blue: title bars, focus rings |
| `--link` / `--link-visited` | `#0000ee` / `#551a8b` | IE link blue and visited purple |
| `--radius-lg` / `--radius-md` | `0` / `3px` | hard-edged panels, slightly rounded buttons |
| `--font-display` / `--font-read` / `--font-sans` / `--font-mono` | Tahoma / Times New Roman / Tahoma / Courier New | headings, long-form body, UI, meta |

Type is **system fonts only** — no web fonts, no CDN:

- `--font-display` and `--font-sans` are Tahoma (falling back to MS Sans Serif / Verdana), the
  XP UI voice; Chinese falls through to Microsoft YaHei / PingFang SC.
- `--font-read` is `Times New Roman` for article bodies, with SimSun / 宋体 for Chinese.
- `--font-mono` is `Courier New`, used for dates, tags and code.

The wallpaper is a pure-CSS gradient (no image), the icons are inline SVG drawn by
`tools/xp_icons.py` as 16×16 pixel art (no icon font, no sprite sheet), and
`prefers-reduced-motion` collapses every transition and animation to ~0.

## Directory map

```
/
├─ layouts/                 page shells
│  ├─ base.html             shared chrome: wallpaper, desktop, taskbar, start menu, window template
│  └─ post.html             Markdown post shell (front matter + body)
├─ pages/                   page fragments — the parts you actually edit
│  ├─ index.html            the desktop (shortcut grid + site-map overlay)
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
│  ├─ build.py              assembler: templates → pages, IE windows, SEO head, sitemap, hashes
│  ├─ markdown.py           the Markdown subset used by the posts
│  ├─ xp_icons.py           inline 16×16 pixel-art SVG icons (no image assets)
│  ├─ og_image.py           draws assets/og.png (1200×630 social card) with stdlib only
│  └─ test_*.py             unit tests
├─ css/                     base.css (tokens + primitives) + xp.css (the shell) +
│                           map.css (site map) + detail.css + blog.css + post.css
├─ js/                      ES modules
│                           xp.js runs the window manager: open/drag/minimize/close, start
│                             menu, tray clock, site map, language propagation into frames
│                           site.js boots the shared i18n (language toggle) on every page
│                           shared.js holds escapeHtml + the common boot sequence
│                           map.js draws the site map (directory layout + pan/zoom)
│                           nodes.js merges projects + posts into the site node list
│                           post.js lazily renders mermaid diagrams inside a post
│                           project-redirect.js sends the old ?id= links to the new pages
├─ blog/<slug>/             post.md (source) + post.en.md (English body) + generated index.html
├─ projects/<id>/           generated project page — one directory per project
├─ assets/                  favicon.svg + og.png (social card)
├─ .github/workflows/       build-check.yml — fails the push if the committed
│                           static output drifts from the sources
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
4. Wraps every content page in the IE window shell, and writes the desktop page with its shortcut
   grid. Nothing on those pages depends on a runtime `fetch`, so a crawler, a reader with
   JavaScript disabled and a social-preview bot all see the same content.
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
generated file is stale. `.github/workflows/build-check.yml` runs it on every push and pull
request — the published site is the committed output, so it must not drift away from the sources
that produce it.

### The legacy `project.html?id=…` URL

The previous version of this site had one `project.html` page that read the project out of
`?id=`. Each project now has its own address, and `project.html` redirects there with
JavaScript. A static server cannot read a query string, so the page also carries a plain list of
every project's new address — crawlers and text-only browsers that do not run scripts still get
somewhere useful. The page is `noindex,follow`, and `robots.txt` deliberately does not block it,
so a crawler can reach it and follow the redirect.

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

**Long-form posts** follow the same idea one level down: `blog/<slug>/post.md` is the Chinese
body and `blog/<slug>/post.en.md` is the English one. The build renders both into the same page
as two blocks, and `html[lang]` picks which one is shown — so the article text is static HTML in
both languages, not a runtime fetch.

A window opened from the desktop is an `<iframe>`, which is a separate document with its own
language state. `js/xp.js` therefore passes `?lang=` when it loads a frame, and the language
switcher reloads any open window so the inside and the outside never disagree.

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

   Mermaid diagrams work: write a ```` ````mermaid ```` block and it is lazily rendered on the page.
   Add `blog/<slug>/post.en.md` with the same front-matter shape for the English body.

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
   ```

   `label` 与 `monogram` 是图纸节点要用的，必填；`projectId` 可以留空（独立文章），
   填了就必须是一个存在的项目 id，否则 `build.py --check` 会报错。
   ```

3. Run `python tools/build.py`. The article page appears in the blog index and as a shortcut on
   the desktop automatically.

Posts are listed on the desktop and the blog index straight from `posts.json` — no page needs to
be touched by hand.

### Why no `tags` field?

`posts.json` deliberately has no `tags` array. The site has four posts and no tag index, tag
filtering, or tag pages; a tag field with no consumer is a field that will drift out of sync with
the Markdown front matter (which does carry a single `tag:` label used as a kicker). If tag
browsing is ever added, add the field and the index page in the same change.

## Editing content

- **Projects** — edit `data/projects.json`, then rebuild. `id`, `kind` (`project` / `blog` / `moon`),
  `order`, `monogram`, `accent`, `year`, `stack`, `keywords`, `title`/`label`/`tagline`/`summary`
  (bilingual), `links`, `repo` are all read from there. `order` decides the desktop order, the
  index order and the site-map layout — the first three are the featured ones.
- **Now** — edit `data/now.json`. `kind` is `building` or `writing`; `text` is a plain
  string (or a `zh`/`en` object); `href` is optional and must point at a page that exists.
- **Posts** — edit `data/posts.json`, then rebuild. `projectId` links a post to a project (empty for
  standalone posts); `label` and `monogram` are what the site map shows for it.
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
  radii, shadows and z-index values. The XP shell lives in `css/xp.css`.
- No `backdrop-filter`, no blur, no glow, no glass — the visual language is flat, light and
  hard-edged, the way a 2003 desktop was.
- Keep `?v=` hashes out of hand-written files — `build.py` owns them.
- GitHub Pages: the published tree is plain static files, `.nojekyll` is committed, the whole
  repo is a few megabytes, and nothing on the site needs a server-side runtime.

## Run locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

ES modules require serving over `http://` — opening `index.html` directly from disk won't work.
