const LANGS = ["zh", "en"];
const STORE_KEY = "lang";

/* 全站文案。由 tools/build.py 从 data/i18n.json 生成 —— 别手改这里，
   改文案请改 data/i18n.json，然后跑 `python tools/build.py`。
   页面不再运行时拉 JSON：这份兜底块就是唯一来源，省一次请求，也不用管路径。 */
/* FALLBACK:BEGIN */
const FALLBACK = {
  en: {
    "a11y.lang": "Language",
    "a11y.nodes": "Site map",
    "blog.back": "Back home",
    "blog.empty": "No posts yet.",
    "blog.emptyHint": "Some words are still on the way. Have a look at the projects instead.",
    "blog.kicker": "Writing",
    "blog.title": "Written down",
    "detail.back": "Back home",
    "detail.download": "Download APK",
    "detail.highlights": "Highlights",
    "detail.next": "Next",
    "detail.open": "Open",
    "detail.posts": "Related writing",
    "detail.prev": "Previous",
    "detail.stack": "Stack",
    "detail.viewRepo": "View on GitHub",
    "detail.writing": "More writing",
    "error.data": "The data couldn't be loaded.",
    "error.dataHint": "Try refreshing, or go straight to GitHub.",
    "hint.gesture": "Drag · Scroll to zoom · Double-click to reset",
    "home.lede": "Seven open-source tools and four essays — a Flutter Markdown editor, an agent runtime, a local Ollama coding harness, an OCR MCP server, a Windows JDK switcher, and this site.",
    "home.title": "I build tools, and I write",
    "map.other": "OTHER",
    "map.projects": "PROJECTS",
    "map.writing": "WRITING",
    "meta.desc.home": "Zhong Shanshan's projects and writing: seven open-source tools — Mdeditor (a Flutter Markdown editor), Intent OS (a runtime above the LLM), a local Ollama coding harness, an OCR MCP server and JEnv for Windows — plus four essays on agents, runtimes and guards.",
    "nf.back": "Back home",
    "nf.body": "That address doesn't exist. Head back home — seven projects and a few unfinished pieces of writing are waiting there.",
    "nf.title": "Nothing here",
    "post.related": "Keep reading",
  },
  zh: {
    "a11y.lang": "语言 / Language",
    "a11y.nodes": "站点图纸 / Site map",
    "blog.back": "回到首页",
    "blog.empty": "还没有文章。",
    "blog.emptyHint": "有些话还在路上。先去看看做过的项目吧。",
    "blog.kicker": "文字",
    "blog.title": "写下的东西",
    "detail.back": "回到首页",
    "detail.download": "下载 APK",
    "detail.highlights": "亮点",
    "detail.next": "下一个",
    "detail.open": "打开",
    "detail.posts": "相关文字",
    "detail.prev": "上一个",
    "detail.stack": "技术栈",
    "detail.viewRepo": "在 GitHub 查看",
    "detail.writing": "更多文字",
    "error.data": "数据没能加载出来。",
    "error.dataHint": "刷新试试，或者直接去 GitHub。",
    "hint.gesture": "拖动 · 滚轮缩放 · 双击复位",
    "home.lede": "七个开源工具，外加四篇文章：一个 Flutter 的 Markdown 编辑器、一层 Agent 运行时、本地 Ollama 编码助手、OCR 的 MCP 服务、Windows 上的 JDK 切换器，还有这个站本身。",
    "home.title": "写工具，也写字",
    "map.other": "其他",
    "map.projects": "作品",
    "map.writing": "文字",
    "meta.desc.home": "钟闪闪的作品与文字：七个开源项目——Flutter 的 Markdown 编辑器 Mdeditor、LLM 之上的运行时 Intent OS、本地 Ollama 编码助手、OCR 的 MCP 服务、Windows 上的 JDK 切换器 JEnv——外加四篇文章。",
    "nf.back": "回到首页",
    "nf.body": "这个地址不存在。回到首页，那里有七个项目和几篇没写完的字。",
    "nf.title": "这一页是空的",
    "post.related": "继续读",
  },
};
/* FALLBACK:END */

export function resolveLang() {
  const fromQuery = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(fromQuery)) return fromQuery;

  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch (err) {
    /* storage may be unavailable */
  }

  const nav = (navigator.language || "zh").toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

export function createI18n({ lang }) {
  const source = FALLBACK;
  let current = LANGS.includes(lang) ? lang : "zh";
  const listeners = new Set();

  function t(key) {
    const bucket = source[current] || {};
    if (bucket[key] != null) return bucket[key];
    if (source.zh && source.zh[key] != null) return source.zh[key];
    return key;
  }

  function apply(root = document) {
    const html = document.documentElement;
    html.lang = current === "zh" ? "zh-CN" : "en";

    // 双语文本在构建期就写进了 HTML，这里只切 html[lang]，由 CSS 决定显示哪一份。
    // 标题与描述也跟着换：搜索结果与社交卡片取的就是它们。
    const title = current === "zh" ? html.dataset.titleZh : html.dataset.titleEn;
    if (title) document.title = title;
    const desc = current === "zh" ? html.dataset.descZh : html.dataset.descEn;
    if (desc) {
      const meta = root.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", desc);
    }

    root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.langBtn === current));
    });
  }

  function setLang(next) {
    if (!LANGS.includes(next) || next === current) return;
    current = next;
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch (err) {
      /* ignore */
    }
    apply();
    listeners.forEach((fn) => fn(current));
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  apply();

  return {
    t,
    apply,
    setLang,
    onChange,
    get lang() {
      return current;
    }
  };
}
