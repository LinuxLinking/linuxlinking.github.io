import { createI18n, loadStrings, resolveLang } from "./i18n.js?v=b69bb391";
import { startStarfield } from "./starfield.js?v=d6c07621";

const wrap = document.getElementById("detail");
const requestedId = new URLSearchParams(location.search).get("id");
const langButtons = Array.from(document.querySelectorAll("[data-lang-btn]"));

const escapeHtml = (value) =>
  String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

let i18n = null;
let projects = [];

function pick(obj, lang, fallback = "") {
  if (!obj) return fallback;
  return obj[lang] ?? obj.zh ?? fallback;
}

async function loadProjects() {
  try {
    const res = await fetch("data/projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  } catch (err) {
    console.error("[detail] load failed:", err);
    return null;
  }
}

function renderNotice(title, body, primaryLabel, primaryHref) {
  wrap.innerHTML = `<div class="detail-card detail-notice">
    <p class="kicker">404</p>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(body)}</p>
    <a class="btn primary" href="${escapeHtml(primaryHref)}">${escapeHtml(primaryLabel)}</a>
  </div>`;
  document.title = `${title} · ${i18n.t("brand")}`;
}

function renderError() {
  wrap.innerHTML = `<div class="detail-card detail-notice">
    <p class="kicker">error</p>
    <h1>${escapeHtml(i18n.t("error.data"))}</h1>
    <p>${escapeHtml(i18n.t("error.dataHint"))}</p>
    <a class="btn primary" href="./">${escapeHtml(i18n.t("detail.back"))}</a>
  </div>`;
}

function renderProject(lang) {
  const list = projects
    .filter((p) => p.kind === "project")
    .slice()
    .sort((a, b) => a.order - b.order);

  const index = list.findIndex((p) => p.id === requestedId);
  if (index === -1) {
    renderNotice(
      i18n.t("detail.notFound"),
      i18n.t("detail.notFoundBody"),
      i18n.t("detail.back"),
      "./"
    );
    return;
  }

  const project = list[index];
  const title = pick(project.title, lang);
  const tagline = pick(project.tagline, lang);
  const summary = pick(project.summary, lang);
  const highlights = project.highlights?.[lang] || project.highlights?.zh || [];
  const stack = project.stack || [];
  const meta = [project.year, ...stack].filter(Boolean).join(" · ");
  const c1 = project.accent?.[0] || "#7c5cff";
  const c2 = project.accent?.[1] || "#3ad0ff";
  const prev = list[(index - 1 + list.length) % list.length];
  const next = list[(index + 1) % list.length];

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

  wrap.innerHTML = `<div class="detail-wrap">
    <article class="detail-card">
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
      <a class="btn" href="project.html?id=${encodeURIComponent(prev.id)}">← ${escapeHtml(i18n.t("detail.prev"))}</a>
      <a class="btn" href="./">${escapeHtml(i18n.t("detail.back"))}</a>
      <a class="btn" href="project.html?id=${encodeURIComponent(next.id)}">${escapeHtml(i18n.t("detail.next"))} →</a>
    </nav>
  </div>`;

  document.title = `${title} · ${i18n.t("brand")}`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", summary);
}

async function boot() {
  startStarfield(document.getElementById("stars"));

  const strings = await loadStrings("data/i18n.json");
  i18n = createI18n({ strings, lang: resolveLang() });

  const data = await loadProjects();
  if (!data) {
    renderError();
    return;
  }
  projects = data;

  const target = projects.find((p) => p.id === requestedId);
  if (target && target.kind !== "project" && target.path) {
    location.replace(target.path);
    return;
  }

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.langBtn !== i18n.lang) i18n.setLang(btn.dataset.langBtn);
    });
  });

  i18n.onChange((lang) => renderProject(lang));
  renderProject(i18n.lang);
}

boot();
