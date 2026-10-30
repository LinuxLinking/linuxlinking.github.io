const LANGS = ["zh", "en"];
const STORE_KEY = "lang";

const FALLBACK = {
  zh: {
    brand: "钟闪闪",
    "nav.honeycomb": "蜂窝",
    "nav.list": "列表",
    "nav.about": "关于",
    "detail.back": "返回蜂窝",
    "detail.notFound": "没有找到这个项目",
    "blog.back": "返回蜂窝",
    "blog.empty": "还没有文章。",
    "nf.back": "回到首页"
  },
  en: {
    brand: "Zhong Shanshan",
    "nav.honeycomb": "Honeycomb",
    "nav.list": "List",
    "nav.about": "About",
    "detail.back": "Back to the honeycomb",
    "detail.notFound": "Project not found",
    "blog.back": "Back to the honeycomb",
    "blog.empty": "No posts yet.",
    "nf.back": "Back home"
  }
};

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
