import { escapeHtml } from "./shared.js?v=2e114873";

/* 首页的默认视图：项目网格 + 文字列表 + 一张安静的收尾卡片。
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

function projectCard(node) {
  const c1 = (node.accent && node.accent[0]) || "#7c5cff";
  const c2 = (node.accent && node.accent[1]) || "#3ad0ff";
  const stack = (node.stack || []).slice(0, MAX_STACK);
  const chips = stack.length
    ? `<span class="grid-chips">${stack
        .map((item) => `<span class="grid-chip">${escapeHtml(item)}</span>`)
        .join("")}</span>`
    : "";

  return `<a class="grid-card" href="${escapeHtml(node.href)}">
    <span class="grid-card-top">
      <span class="orb grid-orb" style="--c1:${c1};--c2:${c2}"><span>${escapeHtml(node.monogram || "·")}</span></span>
      <span class="grid-card-meta">
        <h3 class="grid-card-title">${escapeHtml(node.titleText)}</h3>
        ${node.year ? `<span class="grid-card-year">${escapeHtml(node.year)}</span>` : ""}
      </span>
      <span class="grid-card-go" aria-hidden="true">↗</span>
    </span>
    <span class="grid-card-tagline">${escapeHtml(node.taglineText)}</span>
    ${chips}
  </a>`;
}

function postRow(post, lang) {
  const title = post.title?.[lang] ?? post.title?.zh ?? post.slug;
  const summary = summarize(post.summary?.[lang] ?? post.summary?.zh ?? "");
  const href = post.url || `${post.slug}/`;

  return `<a class="grid-post" href="${escapeHtml(href)}">
    <span class="grid-post-date">${escapeHtml(post.date || "")}</span>
    <span class="grid-post-main">
      <span class="grid-post-title">${escapeHtml(title)}</span>
      ${summary ? `<span class="grid-post-sum">${escapeHtml(summary)}</span>` : ""}
    </span>
    <span class="grid-post-go" aria-hidden="true">↗</span>
  </a>`;
}

/**
 * 渲染首页网格。
 *
 * @param {HTMLElement} root 容器
 * @param {object} data
 * @param {Array} data.nodes projects.json 里的条目（已 localize，含 href/titleText）
 * @param {Array} data.posts posts.json 里的文章
 * @param {string} data.lang 当前语言
 * @param {Function} data.t i18n 取值函数
 */
export function renderGrid(root, { nodes, posts, lang, t }) {
  if (!root) return;

  const projects = nodes.filter((node) => node.kind === "project");
  const moon = nodes.find((node) => node.kind === "moon");

  const parts = [];

  parts.push(`<section class="grid-section">
    <h2 class="grid-section-title" data-i18n="grid.projects">${escapeHtml(t("grid.projects"))}</h2>
    <div class="grid-cards">${projects.map(projectCard).join("")}</div>
  </section>`);

  if (posts.length) {
    parts.push(`<section class="grid-section">
      <h2 class="grid-section-title" data-i18n="grid.writing">${escapeHtml(t("grid.writing"))}</h2>
      <div class="grid-posts">${posts
        .slice()
        .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
        .map((post) => postRow(post, lang))
        .join("")}</div>
    </section>`);
  }

  if (moon) {
    parts.push(`<a class="grid-moon" href="${escapeHtml(moon.href)}">
      <span class="grid-moon-orb" aria-hidden="true">☾</span>
      <span class="grid-moon-main">
        <span class="grid-moon-title">${escapeHtml(moon.titleText)}</span>
        <span class="grid-moon-sub">${escapeHtml(moon.taglineText)}</span>
      </span>
      <span class="grid-moon-go" aria-hidden="true">↗</span>
    </a>`);
  }

  root.innerHTML = parts.join("");
}
