import { escapeHtml } from "./shared.js?v=33539a65";
import { postHref } from "./nodes.js?v=192a1a44";

/* 首页默认视图：海报式排版 —— 巨型重体标题 + 编号索引行 + 文字条目。
   图纸退居第二视图（见 app.js），两套视图读的是同一份 projects.json / posts.json。 */

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

/* 行本身是 div，标题里的链接用 ::after 撑满整行（stretched link）。
   行内还要放文章链接，嵌套 <a> 是非法 HTML —— 浏览器会把外层提前闭合。 */
function projectRow(node, index, related) {
  const stack = (node.stack || []).slice(0, MAX_STACK);
  const meta = [node.year, ...stack].filter(Boolean).join(" · ");
  const links = related.length
    ? `<span class="index-posts">${related
        .map(
          (post) =>
            `<a class="index-post" href="${escapeHtml(post.href)}">${escapeHtml(post.title)}</a>`
        )
        .join('<span class="index-post-sep">·</span>')}</span>`
    : "";

  return `<div class="index-row">
    <span class="index-num">${pad(index)}</span>
    <span class="index-body">
      <span class="index-title">${swatch(node)}<a class="index-link" href="${escapeHtml(node.href)}">${escapeHtml(node.titleText)}</a></span>
      <span class="index-tagline">${escapeHtml(node.taglineText)}</span>
      ${links}
    </span>
    <span class="index-meta">${escapeHtml(meta)}</span>
  </div>`;
}

function postLine(post, lang) {
  const title = post.title?.[lang] ?? post.title?.zh ?? post.slug;
  const summary = summarize(post.summary?.[lang] ?? post.summary?.zh ?? "");
  const href = postHref(post);

  return `<a class="post-line" href="${escapeHtml(href)}">
    <span class="post-line-date">${escapeHtml(post.date || "")}</span>
    <span class="post-line-body">
      <span class="post-line-title">${escapeHtml(title)}</span>
      ${summary ? `<span class="post-line-sum">${escapeHtml(summary)}</span>` : ""}
    </span>
  </a>`;
}

/** Now 区：此刻正在做的事。数据来自 data/now.json，作者维护。 */
function nowSection(now, lang, t) {
  const items = now?.[lang]?.items ?? now?.zh?.items ?? [];
  if (!items.length) return "";
  const rows = items
    .map((item) => {
      const kind = t(`now.label.${item.kind}`) || item.kind;
      const raw = item.text;
      const text = escapeHtml(typeof raw === "string" ? raw : raw?.[lang] ?? raw?.zh ?? "");
      const body = item.href
        ? `<a class="now-text" href="${escapeHtml(item.href)}">${text}</a>`
        : `<span class="now-text">${text}</span>`;
      return `<div class="now-item"><span class="now-kind">${escapeHtml(kind)}</span>${body}</div>`;
    })
    .join("");
  return `<section class="now-panel">
    <p class="section-label">${escapeHtml(t("now.kicker"))}</p>
    <div class="now-list">${rows}</div>
  </section>`;
}

/**
 * 渲染首页。
 *
 * @param {HTMLElement} root 容器
 * @param {object} data
 * @param {Array} data.nodes projects.json 里的条目（已 localize，含 href/titleText）
 * @param {Array} data.posts posts.json 里的文章
 * @param {object} data.now now.json 的语言分桶
 * @param {string} data.lang 当前语言
 * @param {Function} data.t i18n 取值函数
 */
export function renderHome(root, { nodes, posts, now, lang, t }) {
  if (!root) return;

  const projects = nodes.filter((node) => node.kind === "project");
  const moon = nodes.find((node) => node.kind === "moon");

  // 文章挂在项目下：先按 projectId 归组，标题按当前语言取。
  const byProject = new Map();
  for (const post of posts) {
    if (!post.projectId) continue;
    const title = post.title?.[lang] ?? post.title?.zh ?? post.slug;
    const href = postHref(post);
    if (!byProject.has(post.projectId)) byProject.set(post.projectId, []);
    byProject.get(post.projectId).push({ title, href });
  }

  const parts = [];

  parts.push(nowSection(now, lang, t));

  parts.push(`<section class="home-section">
    <h2 class="section-label">${escapeHtml(t("home.index"))}</h2>
    <div class="index-list">${projects
      .map((node, i) => projectRow(node, i + 1, byProject.get(node.id) || []))
      .join("")}</div>
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
