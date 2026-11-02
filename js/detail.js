import { bootPage, escapeHtml } from "./shared.js?v=391cfcd3";

/* 项目详情：页面在构建期就生成了静态的 projects/<id>/index.html，
   项目数据由构建期内联进页面里的 application/json —— 不用再运行时查表，
   禁 JS 也能看到标题、tagline 与摘要。 */

const wrap = document.getElementById("detail");
const dataEl = document.getElementById("project-data");
let i18n = null;
let data = null;

function pick(obj, lang, fallback = "") {
  if (!obj) return fallback;
  return obj[lang] ?? obj.zh ?? fallback;
}

function renderError() {
  wrap.innerHTML = `<div class="card detail-card detail-notice">
    <p class="kicker">error</p>
    <h1>${escapeHtml(i18n.t("error.data"))}</h1>
    <p>${escapeHtml(i18n.t("error.dataHint"))}</p>
    <a class="btn primary" href="../../">${escapeHtml(i18n.t("detail.back"))}</a>
  </div>`;
}

function renderProject(lang) {
  const project = data.project;
  const title = pick(project.title, lang);
  const tagline = pick(project.tagline, lang);
  const summary = pick(project.summary, lang);
  const highlights = project.highlights?.[lang] || project.highlights?.zh || [];
  const stack = project.stack || [];
  const meta = [project.year, ...stack].filter(Boolean).join(" · ");
  const c1 = project.accent?.[0] || "#7c5cff";
  const c2 = project.accent?.[1] || "#3ad0ff";
  const prev = `../../projects/${encodeURIComponent(data.prev)}/`;
  const next = `../../projects/${encodeURIComponent(data.next)}/`;

  const stackSection = stack.length
    ? `<section class="detail-section">
        <h2>${escapeHtml(i18n.t("detail.stack"))}</h2>
        <ul class="detail-stack">${stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
      </section>`
    : "";

  const highlightItem = (item) => {
    if (item && typeof item === "object" && item.title) {
      return `<li class="is-titled">
          <p class="highlight-title">${escapeHtml(item.title)}</p>
          <p class="highlight-body">${escapeHtml(item.body || "")}</p>
        </li>`;
    }
    const text = typeof item === "string" ? item : (item && item.body) || "";
    return `<li><p class="highlight-body">${escapeHtml(text)}</p></li>`;
  };

  const highlightsSection = highlights.length
    ? `<section class="detail-section">
        <h2>${escapeHtml(i18n.t("detail.highlights"))}</h2>
        <ol class="highlights">${highlights.map(highlightItem).join("")}</ol>
      </section>`
    : "";

  const download = project.download && project.download.href ? project.download : null;
  const downloadBits = download
    ? [
        `<a class="btn primary" href="${escapeHtml(download.href)}">${escapeHtml(i18n.t("detail.download"))} ↓</a>`,
        ...(download.note
          ? [`<span class="action-note">${escapeHtml(pick(download.note, lang))}</span>`]
          : [])
      ]
    : [];

  const repoAction = project.repo
    ? [
        `<a class="btn${download ? "" : " primary"}" href="${escapeHtml(project.repo)}" target="_blank" rel="noopener">${escapeHtml(
          i18n.t("detail.viewRepo")
        )} ↗</a>`
      ]
    : project.path
      ? [`<a class="btn primary" href="${escapeHtml(project.path)}">${escapeHtml(i18n.t("detail.open"))} ↗</a>`]
      : [];

  const linkChips = (Array.isArray(project.links) ? project.links : [])
    .filter((link) => link && link.href)
    .map((link) => {
      const external = /^https?:/i.test(link.href);
      return `<a class="chip" href="${escapeHtml(link.href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(
        pick(link.label, lang)
      )} ↗</a>`;
    });

  const actions = [...downloadBits, ...repoAction, ...linkChips];
  const actionsSection = actions.length ? `<div class="detail-actions">${actions.join("")}</div>` : "";

  wrap.innerHTML = `<div class="page-wrap detail-wrap">
    <article class="card detail-card">
      <header class="detail-head">
        <span class="orb" style="--c1:${c1};--c2:${c2}"><span>${escapeHtml(project.monogram || "·")}</span></span>
        <div>
          <p class="detail-meta">${escapeHtml(meta)}</p>
          <h1 class="detail-title">${escapeHtml(title)}</h1>
          <p class="detail-tagline">${escapeHtml(tagline)}</p>
        </div>
      </header>
      <p class="detail-summary">${escapeHtml(summary)}</p>
      ${stackSection}
      ${highlightsSection}
      ${actionsSection}
    </article>
    <nav class="detail-nav" aria-label="Project navigation">
      <a class="btn" href="${prev}">← ${escapeHtml(i18n.t("detail.prev"))}</a>
      <a class="btn" href="../../">${escapeHtml(i18n.t("detail.back"))}</a>
      <a class="btn" href="${next}">${escapeHtml(i18n.t("detail.next"))} →</a>
    </nav>
  </div>`;

  document.title = `${title} · ${i18n.t("brand")}`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", summary);
}

async function boot() {
  i18n = await bootPage({ stringsPath: "../../data/i18n.json" });

  try {
    data = JSON.parse(dataEl.textContent);
  } catch (err) {
    console.error("[detail] inline data missing:", err);
    renderError();
    return;
  }

  i18n.onChange((lang) => renderProject(lang));
  renderProject(i18n.lang);
}

boot();
