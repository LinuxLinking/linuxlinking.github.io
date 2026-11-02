const LANGS = ["zh", "en"];
const STORE_KEY = "lang";

/* 离线兜底文案。由 tools/build.py 从 data/i18n.json 生成 —— 别手改这里，
   改文案请改 data/i18n.json，然后跑 `python tools/build.py`。 */
/* FALLBACK:BEGIN */
const FALLBACK = {
  en: {
    "a11y.lang": "Language",
    "a11y.nodes": "Project map",
    "a11y.view": "View",
    "about.blog": "Writing ↗",
    "about.body": "Running models locally, compiling intent into rollback-safe chains, switching JDKs with a batch file. Code by day, writing at night, and once in a while a page that only glows for one person.",
    "about.close": "Close",
    "about.github": "GitHub ↗",
    "about.kicker": "About",
    "about.soul": "Soul for U ↗",
    "about.title": "About this site",
    "blog.back": "Back home",
    "blog.empty": "No posts yet.",
    "blog.emptyHint": "Some words are still on the way. Have a look at the projects instead.",
    "blog.kicker": "Writing",
    "blog.title": "Written down",
    "brand": "Zhong Shanshan",
    "detail.back": "Back home",
    "detail.download": "Download APK",
    "detail.highlights": "Highlights",
    "detail.next": "Next",
    "detail.notFound": "Project not found",
    "detail.notFoundBody": "This link may be out of date, or this entry isn't public yet.",
    "detail.open": "Open",
    "detail.prev": "Previous",
    "detail.stack": "Stack",
    "detail.viewRepo": "View on GitHub",
    "error.data": "The data couldn't be loaded.",
    "error.dataHint": "Try refreshing, or go straight to GitHub.",
    "hint.gesture": "Drag · Scroll to zoom · Double-click to reset",
    "home.index": "Selected work",
    "home.kicker": "Projects & Writing",
    "home.lede": "First, what I'm on right now — then what I've built and the words I haven't finished.",
    "home.title": "I build tools, and I write",
    "home.writing": "Writing",
    "meta.desc.home": "I build tools, and I write. What I'm on now, seven projects, four pieces of writing.",
    "meta.title.home": "Zhong Shanshan — Projects & Writing",
    "nav.about": "About",
    "nav.grid": "Projects",
    "nav.honeycomb": "Star map",
    "nav.writing": "Writing",
    "nf.back": "Back home",
    "nf.body": "That address doesn't exist. Head back home — seven projects and a few unfinished pieces of writing are waiting there.",
    "nf.title": "Nothing here",
    "now.kicker": "Right now",
    "now.label.building": "Building",
    "now.label.writing": "Writing",
  },
  zh: {
    "a11y.lang": "语言",
    "a11y.nodes": "项目星图",
    "a11y.view": "视图",
    "about.blog": "文字 ↗",
    "about.body": "在本地跑模型、把意图编译成可回滚的执行链、用一行批处理切换 JDK。白天写代码，夜里写字，偶尔给某个人做一个只会发光的页面。",
    "about.close": "关闭",
    "about.github": "GitHub ↗",
    "about.kicker": "关于",
    "about.soul": "Soul for U ↗",
    "about.title": "关于这个站",
    "blog.back": "回到首页",
    "blog.empty": "还没有文章。",
    "blog.emptyHint": "有些话还在路上。先去看看做过的项目吧。",
    "blog.kicker": "文字",
    "blog.title": "写下的东西",
    "brand": "钟闪闪",
    "detail.back": "回到首页",
    "detail.download": "下载 APK",
    "detail.highlights": "亮点",
    "detail.next": "下一个",
    "detail.notFound": "没有找到这个项目",
    "detail.notFoundBody": "链接可能已经过期，或者这个条目还没公开。",
    "detail.open": "打开",
    "detail.prev": "上一个",
    "detail.stack": "技术栈",
    "detail.viewRepo": "在 GitHub 查看",
    "error.data": "数据没能加载出来。",
    "error.dataHint": "刷新试试，或者直接去 GitHub。",
    "hint.gesture": "拖动 · 滚轮缩放 · 双击复位",
    "home.index": "选集",
    "home.kicker": "作品与文字",
    "home.lede": "先看此刻在做什么，再看做过的东西和还没写完的字。",
    "home.title": "写工具，也写字",
    "home.writing": "文字",
    "meta.desc.home": "写工具，也写字。此刻在做的事，做过的七个项目，四篇文章。",
    "meta.title.home": "钟闪闪 · 作品与文字",
    "nav.about": "关于",
    "nav.grid": "项目",
    "nav.honeycomb": "星图",
    "nav.writing": "文字",
    "nf.back": "回到首页",
    "nf.body": "这个地址不存在。回到首页，那里有七个项目和几篇没写完的字。",
    "nf.title": "这一页是空的",
    "now.kicker": "此刻",
    "now.label.building": "在做",
    "now.label.writing": "在写",
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

export async function loadStrings(path = "data/i18n.json") {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.zh) throw new Error("missing zh bundle");
    return data;
  } catch (err) {
    console.warn("[i18n] falling back to built-in strings:", err);
    return null;
  }
}

export function createI18n({ strings, lang }) {
  const source = strings && strings.zh ? strings : FALLBACK;
  let current = LANGS.includes(lang) ? lang : "zh";
  const listeners = new Set();

  function t(key) {
    const bucket = source[current] || {};
    if (bucket[key] != null) return bucket[key];
    if (source.zh && source.zh[key] != null) return source.zh[key];
    return key;
  }

  function apply(root = document) {
    document.documentElement.lang = current === "zh" ? "zh-CN" : "en";

    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const value = t(el.dataset.i18n);
      if (value != null) el.textContent = value;
    });

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
