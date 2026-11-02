import { escapeHtml } from "./shared.js?v=a89b5bc1";

/* 首页默认视图：编辑式排版 —— 大标题 + 编号索引行 + 文字条目。
   蜂窝星图退居第二视图（见 app.js），两套视图读的是同一份 projects.json / posts.json。 */

const MAX_STACK = 4;

/** 摘要太长时取第一句，作为一行预览。 */
function summarize(text, limit = 96) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const stop = clean.search(/[。.!?！？]/);
  const first = stop > 0 ? clean.slice(0, stop) : clean;
  return first.length > limit ? `${first.slice(0, limit - 1)}…` : first;
}

/** 两位编号：01 / 02 … */
function pad(n) {
  return String(n).padStart(2, "0");
}

/** 一枚项目色卡：项目自己的颜色在这里只剩 10px 见方。 */
function swatch(node) {
  const c1 = (node.accent && node.accent[0]) || "#7c5cff";
  return `<span class="index-swatch" style="--c1:${escapeHtml(c1)}" aria-hidden="true"></span>`;
}

function projectRow(node, index) {
  const stack = (node.stack || []).slice(0, MAX_STACK);
  const meta = [node.year, ...stack].filter(Boolean).join(" · ");

  return `<a class="index-row" href="${escapeHtml(node.href)}">
    <span class="index-num">${pad(index)}</span>
    <span class="index-body">
      <span class="index-title">${swatch(node)}${escapeHtml(node.titleText)}</span>
      <span class="index-tagline">${escapeHtml(node.taglineText)}</span>
    </span>
    <span class="index-meta">${escapeHtml(meta)}</span>
  </a>`;
}

function postLine(post, lang) {
  const title = post.title?.[lang] ?? post.title?.zh ?? post.slug;
  const summary = summarize(post.summary?.[lang] ?? post.summary?.zh ?? "");
  const href = post.url || `${post.slug}/`;

  return `<a class="post-line" href="${escapeHtml(href)}">
    <span class="post-line-date">${escapeHtml(post.date || "")}</span>
    <span class="post-line-body">
      <span class="post-line-title">${escapeHtml(title)}</span>
      ${summary ? `<span class="post-line-sum">${escapeHtml(summary)}</span>` : ""}
    </span>
  </a>`;
}

/**
 * 渲染首页。
 *
 * @param {HTMLElement} root 容器
 * @param {object} data
 * @param {Array} data.nodes projects.json 里的条目（已 localize，含 href/titleText）
 * @param {Array} data.posts posts.json 里的文章
 * @param {string} data.lang 当前语言
 * @param {Function} data.t i18n 取值函数
 */
export function renderHome(root, { nodes, posts, lang, t }) {
  if (!root) return;

  const projects = nodes.filter((node) => node.kind === "project");
  const moon = nodes.find((node) => node.kind === "moon");

  const parts = [];

  parts.push(`<section class="home-section">
    <h2 class="section-label">${escapeHtml(t("home.index"))}</h2>
    <div class="index-list">${projects.map(projectRow).join("")}</div>
  </section>`);

  if (posts.length) {
    parts.push(`<section class="home-section">
      <h2 class="section-label">${escapeHtml(t("home.writing"))}</h2>
      <div class="post-list">${posts
        .slice()
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
        .map((post) => postLine(post, lang))
        .join("")}</div>
    </section>`);
  }

  if (moon) {
    parts.push(`<a class="moon-line" href="${escapeHtml(moon.href)}">
      <span class="moon-glyph" aria-hidden="true">☾</span>
      <span class="moon-body">
        <span class="moon-title">${escapeHtml(moon.titleText)}</span>
        <span class="moon-sub">${escapeHtml(moon.taglineText)}</span>
      </span>
      <span class="moon-go" aria-hidden="true">↗</span>
    </a>`);
  }

  root.innerHTML = parts.join("");
}
