import { marked } from "./vendor/marked.esm.js";
import { createI18n, loadStrings, resolveLang } from "./i18n.js";
import { startStarfield } from "./starfield.js";

const langButtons = Array.from(document.querySelectorAll("[data-lang-btn]"));

const el = {
  kicker: document.getElementById("post-kicker"),
  title: document.getElementById("post-title"),
  lede: document.getElementById("post-lede"),
  body: document.getElementById("post-body"),
};

/* ---- front matter：--- 包裹的 key: value 块 ---- */

function splitFrontMatter(md) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (kv) meta[kv[1].trim()] = kv[2].trim();
  }
  return { meta, body: md.slice(m[0].length) };
}

/* ---- Markdown 渲染 ---- */

marked.setOptions({ gfm: true, breaks: false });

function renderMarkdown(md) {
  // 内容为作者本人手写，属可信来源，不做 sanitize。
  el.body.innerHTML = marked.parse(md);
}

/* ---- Mermaid：仅当文中出现语言为 mermaid 的代码块时才加载 ---- */

const MERMAID_THEME_VARS = {
  background: "transparent",
  primaryColor: "#1c2133",
  primaryTextColor: "#e8ecf6",
  primaryBorderColor: "#3a4361",
  lineColor: "#8b93a8",
  secondaryColor: "#232a40",
  tertiaryColor: "#161b2a",
  textColor: "#c9d1e4",
  fontSize: "13px",
};

async function renderMermaidBlocks() {
  const blocks = Array.from(
    el.body.querySelectorAll("pre > code.language-mermaid"),
  );
  if (!blocks.length) return;

  let mermaid;
  try {
    mermaid = (await import("./vendor/mermaid/mermaid.esm.min.mjs")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: MERMAID_THEME_VARS,
      fontFamily: "var(--font-mono, monospace)",
    });
  } catch (err) {
    console.warn("[post] mermaid load failed:", err);
    markMermaidFailure(blocks);
    return;
  }

  for (let i = 0; i < blocks.length; i++) {
    const codeEl = blocks[i];
    const source = codeEl.textContent;
    try {
      const { svg } = await mermaid.render(`mermaid-${i}-${Date.now()}`, source);
      const holder = document.createElement("figure");
      holder.className = "md-mermaid";
      holder.innerHTML = svg;
      codeEl.closest("pre").replaceWith(holder);
    } catch (err) {
      console.warn(`[post] mermaid block ${i} failed:`, err);
      markMermaidFailure([codeEl]);
    }
  }
}

function markMermaidFailure(blocks) {
  for (const codeEl of blocks) {
    const pre = codeEl.closest("pre");
    if (!pre) continue;
    pre.classList.add("md-mermaid-fail");
    const note = document.createElement("p");
    note.className = "md-mermaid-note";
    note.textContent = "（图表渲染失败，以上为 Mermaid 源码）";
    pre.after(note);
  }
}

/* ---- 引导 ---- */

async function boot() {
  startStarfield(document.getElementById("stars"));

  const strings = await loadStrings("../../data/i18n.json");
  const i18n = createI18n({ strings, lang: resolveLang() });
  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.langBtn !== i18n.lang) i18n.setLang(btn.dataset.langBtn);
    });
  });

  let md;
  try {
    const res = await fetch("./post.md", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    md = await res.text();
  } catch (err) {
    console.warn("[post] post.md failed:", err);
    el.title.textContent = "文章加载失败";
    el.lede.textContent = "找不到本文的 post.md。";
    return;
  }

  const { meta, body } = splitFrontMatter(md);

  const title = meta.title || "未命名";
  const lede = meta.lede || meta.summary || "";
  document.title = `${title} · 钟闪闪`;
  el.title.textContent = title;
  el.kicker.textContent = [meta.date, meta.tag].filter(Boolean).join(" · ");
  el.lede.textContent = lede;
  el.lede.style.display = lede ? "" : "none";

  renderMarkdown(body);
  await renderMermaidBlocks();
}

boot();
