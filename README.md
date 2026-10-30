# linuxlinking.github.io

Personal site of [LinuxLinking](https://github.com/LinuxLinking) — live at **[linuxlinking.github.io](https://linuxlinking.github.io)**.

A hand-written static site with **zero build step, zero framework, zero external libraries**.

## What's inside

- **Honeycomb project map** — anchor-point zoom, drag, pinch, double-click to reset
- **Canvas starfield** background, with a static fallback under `prefers-reduced-motion`
- **zh / en switching** across all pages
- [Writing](https://linuxlinking.github.io/blog/) — a blog
- [Soul for U](https://linuxlinking.github.io/soul-for-u/) — a page written for one person

## Stack

Native HTML, CSS and ES modules. No framework, no CDN, no build tooling.

## Run locally

```bash
python -m http.server 8000
# then open http://localhost:8000
```

ES modules require serving over `http://` — opening `index.html` directly from disk won't work.
