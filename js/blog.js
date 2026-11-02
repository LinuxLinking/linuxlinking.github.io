import { bootPage, escapeHtml } from "./shared.js?v=2e114873";

const listEl = document.getElementById("posts");
let i18n = null;
let posts = [];

async function loadPosts() {
  try {
    const res = await fetch("../data/posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  } catch (err) {
    console.warn("[blog] posts failed:", err);
    return [];
  }
}

function renderEmpty() {
  listEl.innerHTML = `<div class="blog-empty">
    <div class="blog-empty-glyph" aria-hidden="true">✦ ✦ ✦</div>
    <h2>${escapeHtml(i18n.t("blog.empty"))}</h2>
    <p>${escapeHtml(i18n.t("blog.emptyHint"))}</p>
    <a class="btn" href="../">${escapeHtml(i18n.t("blog.back"))}</a>
  </div>`;
}

function renderPosts() {
  if (!posts.length) {
    renderEmpty();
    return;
  }

  const rows = posts
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .map((post) => {
      const title = post.title?.[i18n.lang] ?? post.title?.zh ?? post.slug;
      const summary = post.summary?.[i18n.lang] ?? post.summary?.zh ?? "";
      return `<a class="post-row" href="${escapeHtml(post.url || `${post.slug}/`)}">
        <span class="post-date">${escapeHtml(post.date || "")}</span>
        <h2 class="post-title">${escapeHtml(title)}</h2>
        <p class="post-sum">${escapeHtml(summary)}</p>
      </a>`;
    })
    .join("");

  listEl.innerHTML = rows;
}

async function boot() {
  i18n = await bootPage({ stringsPath: "../data/i18n.json" });

  posts = await loadPosts();
  i18n.onChange(() => renderPosts());
  renderPosts();
}

boot();
