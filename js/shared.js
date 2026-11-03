import { createI18n, resolveLang } from "./i18n.js?v=914d88f8";

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
 * 启动一个页面：建立 i18n、接上语言按钮。
 *
 * 文案不在运行时拉取：data/i18n.json 的内容在构建期写进了 js/i18n.js 的兜底块。
 * 少一次请求，也不用管相对路径在不同层级的页面里怎么拼。
 *
 * @param {object} [options]
 * @param {string} [options.lang] 强制语言，省略则按 URL/localStorage/浏览器判断
 * @returns {object} 建好的 i18n 实例
 */
export function bootPage({ lang } = {}) {
  const i18n = createI18n({ lang: lang ?? resolveLang() });

  document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.langBtn !== i18n.lang) i18n.setLang(btn.dataset.langBtn);
    });
  });

  return i18n;
}
