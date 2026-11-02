import { createI18n, loadStrings, resolveLang } from "./i18n.js?v=5bcd3211";

/* 页面共用的两件事：HTML 转义，以及启动序列。

   启动序列在五个页面里原本各写了一遍（拉文案 → 建 i18n → 装语言按钮），
   顺序一改就要改五处。这里收成一处，各页面只负责自己的渲染逻辑。 */

/** 把任意值转义成可以安全塞进 innerHTML 的文本。 */
export function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

/**
 * 启动一个页面：载入文案、建立 i18n、接上语言按钮。
 *
 * @param {object} [options]
 * @param {string} [options.stringsPath] 文案 JSON 的路径（相对当前页面）
 * @param {string} [options.lang] 强制语言，省略则按 URL/localStorage/浏览器判断
 * @returns {Promise<object>} 建好的 i18n 实例
 */
export async function bootPage({ stringsPath = "data/i18n.json", lang } = {}) {
  const bundle = await loadStrings(stringsPath);
  const i18n = createI18n({ strings: bundle, lang: lang ?? resolveLang() });

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.langBtn !== i18n.lang) i18n.setLang(btn.dataset.langBtn);
    });
  });

  return i18n;
}
