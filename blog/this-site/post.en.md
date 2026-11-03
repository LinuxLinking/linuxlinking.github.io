---
title: I Wrote This Site as a Windows XP Machine: Zero Dependencies, Zero Build
date: 2026-11-03
tag: LINUXLINKING.GITHUB.IO
lede: The site is a Windows XP desktop written in plain HTML, CSS and ES modules, assembled by a single Python script that uses only the standard library, with no framework, no npm, no CDN and no web fonts, and it still reads with JavaScript switched off.
---

## Three hard constraints

The site has to satisfy three things at once: it lives on GitHub Pages, which serves static files only; the content is Chinese and English; and crawlers have to read the text, and some never run JavaScript.

All three together nearly force the implementation: no server runtime, no runtime fetching, no room for two language versions.

What is left is shape. One file per page means editing a title in a dozen places, and I wanted to edit data and run one command. So I picked Windows XP, built on "static files plus a little script": the desktop is HTML, a window is an iframe, the taskbar is CSS.

## Zero dependencies, one script

There is one build command, `python tools/build.py`. It imports the standard library only — argparse, hashlib, html, json, re, sys, pathlib — plus two local modules.

It assembles the root pages from layouts and pages, renders one file per post and per project out of data/, wraps the content in the IE window shell, writes the SEO head, sitemap.xml and robots.txt, and stamps every asset with a `?v=` hash.

The output is 20 files: 18 HTML files, plus sitemap.xml and robots.txt.

The fingerprint is not a hash of the file alone: content_hash() folds in the imported modules' hashes, so changing one module re-stamps every page that imports it.

## How a page is assembled

Three templates: layouts/base.html is the shell, layouts/post.html the post shell, pages/detail.html the project page shell. The human-edited parts are the five fragments in pages/; the content lives in data/.

Assembly is string replacement: the template carries placeholders like `{{iconGrid}}` and `{{postBody}}`, and build_page() looks the key up in values. The replacement scans the template once and never rescans what it inserted — a rule I added after being bitten by it. An article that quoted `{{iconGrid}}` as plain text had it replaced with the real icon grid, and the essay vanished into it. Now a page fragment is resolved before it goes into the shell, and leaf content is never mistaken for a placeholder.

`--check` fails when an artifact drifts from its source, and .github/workflows/build-check.yml runs it on every push and pull request. The tests are light: 76 in Python (63 for build.py, 13 for markdown.py) and 8 in Node via node --test.

## A hand-written Markdown subset

The articles are Markdown, but the site pulls in no Markdown library. tools/markdown.py is a small hand-written renderer whose docstring says why not marked:

> 为什么不用浏览器那套 marked：marked 是 ES module，构建期要跑就得让 Python 构建依赖 Node。文章正文是作者手写的固定内容，一份够用的子集就够，还能省掉 marked 那份 vendor 拷贝。

In English: marked is an ES module, so running it at build time would make the Python build depend on Node.

It supports headings, paragraphs, lists, code blocks, blockquotes, bold, italic, inline code and links, but not tables, images, nested lists, footnotes or raw HTML.

The unsupported part says it plainly: better visible than silently wrong. A table I never wrote renders as a plain line of text.

## Pixels and a hand-written shell

The site has no icon font and no image icons. Every icon is a list of rectangles written by hand in tools/xp_icons.py, on a 16×16 grid, inlined into the HTML at build time with shape-rendering="crispEdges".

```python
    # 月亮（写给一个人的那个页面）
    "moon": [
        (3, 3, 9, 9, "#ffe9b0"),
        (7, 3, 7, 9, "#2a5fb0"),
        (12, 2, 2, 2, "#fff6d8"),
        (2, 11, 2, 2, "#fff6d8"),
    ],
```

js/xp.js runs the shell: windows drag, raise, minimize, maximize and close; six menus and 19 commands, all doing something real; one dialog shell for About, Page Properties, shortcuts, shut-down and log-off; a taskbar with a start button.

The site map is a full-screen application and the only place that fetches at runtime: it pulls the two JSON files in data/ and hands them to buildNodes() in js/nodes.js, which merges them into 16 nodes, and js/map.js draws them as a sheet — two columns on a wide screen, one below 760 pixels, with drag, zoom and double-click to reset.

## Two languages, one HTML file

Chinese and English are not two pages. They are two blocks in the same HTML. At build time pair() writes one piece of copy as two spans, css/base.css uses html[lang] to decide which is visible, and apply() in js/i18n.js flips that attribute.

Three consequences follow. No runtime string bundle to fetch. Search engines read both languages from one URL, with no fake hreflang. And the page still reads with JavaScript off, because both copies were in the HTML.

The article bodies work the same way: post.md is Chinese, post.en.md is English, and the build renders both into the same page.

## With JavaScript switched off

The text of every page is in the HTML: the home page carries a screen-reader-only index of the seven projects and the seven essays, and an article body is static HTML rendered at build time, so with JavaScript off you still read it to the last line.

What is missing is the shell. The whole XP chrome is script-driven: dragging windows, menus, dialogs, the taskbar, start menu, address bar and the map. Without scripts the text still reads, but the XP desktop is gone. The map is gone entirely: it is the only runtime fetch, and the site-map shortcut has an href of #map with the action in js/xp.js. A mermaid diagram shows its source as a code block.

Mermaid is the one external dependency the site has, a vendored copy under js/vendor/mermaid/, sixty-four files and about 2.4 MB. It is local rather than on a CDN because everything else is carried by hand: a CDN failure breaks only the diagrams.

## What I would change next

Three things. First, the map's JSON is the only runtime fetch on the site: I would either bake it into the HTML like everything else, or accept it as a deliberate exception, say so in the README and add a test. Second, the Markdown subset does not support tables or nested lists, and that trade is written down only in a module docstring. Third, this repository has no LICENSE file: each project page links to its own licence, but the site itself needs one.

The repository is [LinuxLinking/linuxlinking.github.io](https://github.com/LinuxLinking/linuxlinking.github.io). Build with `python tools/build.py`, check with `python tools/build.py --check`. Edit data/ and blog/, not the generated HTML.
