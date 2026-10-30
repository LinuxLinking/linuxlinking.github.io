import { createHoneycomb } from "./honeycomb.js?v=hex1";
import { createI18n, loadStrings, resolveLang } from "./i18n.js";
import { renderList } from "./list.js";
import { startStarfield } from "./starfield.js";

const honeyEl = document.getElementById("honeycomb");
const stageEl = document.getElementById("stage");
const listEl = document.getElementById("listView");
const aboutEl = document.getElementById("about");
const stateErrorEl = document.getElementById("stateError");
const hintEl = document.querySelector(".hint");
const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
const langButtons = Array.from(document.querySelectorAll("[data-lang-btn]"));
const aboutBtn = document.getElementById("aboutBtn");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const spotlightEl = document.querySelector(".spotlight");
if (spotlightEl && !reduced && matchMedia("(pointer: fine)").matches) {
  let spotRaf = 0;
  let spotX = 0;
  let spotY = 0;
  addEventListener("pointermove", (e) => {
    spotX = e.clientX;
    spotY = e.clientY;
    if (!spotRaf) {
      spotRaf = requestAnimationFrame(() => {
        spotRaf = 0;
        spotlightEl.style.setProperty("--mx", `${spotX}px`);
        spotlightEl.style.setProperty("--my", `${spotY}px`);
      });
    }
  }, { passive: true });
}

const state = { lang: resolveLang(), projects: [] };
let i18n = null;
let honey = null;
let lastFocus = null;

const escapeHtml = (value) =>
  String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));

function hrefFor(node) {
  if (node.kind === "blog") return node.path || "blog/";
  if (node.kind === "moon") return node.path || "soul-for-u/";
  return `project.html?id=${encodeURIComponent(node.id)}`;
}

function localize(projects, lang) {
  return projects.map((node) => ({
    ...node,
    titleText: node.title?.[lang] ?? node.title?.zh ?? node.id,
    labelText: node.label?.[lang] ?? node.label?.zh ?? node.id,
    taglineText: node.tagline?.[lang] ?? node.tagline?.zh ?? "",
    href: hrefFor(node)
  }));
}

async function loadProjects() {
  try {
    const res = await fetch("data/projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.projects) || !data.projects.length) throw new Error("bad data shape");
    return data.projects.slice().sort((a, b) => a.order - b.order);
  } catch (err) {
    console.error("[projects] load failed:", err);
    return null;
  }
}

function readView() {
  try {
    return localStorage.getItem("view") === "list" ? "list" : "honeycomb";
  } catch (err) {
    return "honeycomb";
  }
}

function refresh() {
  const nodes = localize(state.projects, state.lang);
  honey.setNodes(nodes);
  renderList(listEl, { nodes, t: i18n.t, onAbout: openAbout });
  document.title = i18n.t("meta.title.home");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", i18n.t("meta.desc.home"));
}

function setView(next, persist = true) {
  const isList = next === "list";

  if (persist) {
    try {
      localStorage.setItem("view", next);
    } catch (err) {
      /* ignore */
    }
  }

  honeyEl.classList.toggle("is-hidden", isList);
  listEl.classList.toggle("is-open", isList);
  listEl.setAttribute("aria-hidden", String(!isList));
  honeyEl.setAttribute("aria-hidden", String(isList));
  honeyEl.inert = isList;
  listEl.inert = !isList;

  viewButtons.forEach((btn) => {
    const active = btn.dataset.view === next;
    btn.setAttribute("aria-pressed", String(active));
    btn.classList.toggle("is-active", active);
  });

  if (hintEl) hintEl.classList.toggle("is-hidden", isList);
  if (!isList && honey) honey.fit(false);
}

function openAbout() {
  if (!aboutEl || !aboutEl.hidden) return;
  lastFocus = document.activeElement;
  aboutEl.hidden = false;
  requestAnimationFrame(() => aboutEl.classList.add("is-open"));
  const close = aboutEl.querySelector(".about-close");
  if (close) close.focus();
}

function closeAbout() {
  if (!aboutEl || aboutEl.hidden) return;
  aboutEl.classList.remove("is-open");
  const finish = () => {
    aboutEl.hidden = true;
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };
  if (reduced) finish();
  else setTimeout(finish, 320);
}

function showError() {
  if (!stateErrorEl) return;
  stateErrorEl.innerHTML = `<div>
    <p>${escapeHtml(i18n.t("error.data"))}</p>
    <small>${escapeHtml(i18n.t("error.dataHint"))}</small>
    <a class="btn" href="https://github.com/LinuxLinking" target="_blank" rel="noopener">GitHub ↗</a>
  </div>`;
  stateErrorEl.hidden = false;
  honeyEl.classList.add("is-hidden");
  listEl.classList.remove("is-open");
  viewButtons.forEach((btn) => {
    btn.disabled = true;
  });
}

function wireUi() {
  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  langButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.langBtn !== i18n.lang) i18n.setLang(btn.dataset.langBtn);
    });
  });

  if (aboutBtn) aboutBtn.addEventListener("click", openAbout);
  if (aboutEl) {
    aboutEl.querySelectorAll("[data-close-about]").forEach((el) => {
      el.addEventListener("click", closeAbout);
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aboutEl && !aboutEl.hidden) {
      e.preventDefault();
      closeAbout();
    }
  });
}

async function boot() {
  startStarfield(document.getElementById("stars"));

  const strings = await loadStrings("data/i18n.json");
  i18n = createI18n({ strings, lang: state.lang });
  state.lang = i18n.lang;

  const projects = await loadProjects();
  if (!projects) {
    showError();
    return;
  }

  state.projects = projects;

  honey = createHoneycomb({
    container: honeyEl,
    stage: stageEl,
    reducedMotion: reduced,
    onOpen: (node) => {
      location.href = node.href;
    }
  });

  refresh();
  wireUi();

  i18n.onChange((lang) => {
    state.lang = lang;
    refresh();
  });

  setView(readView(), false);
}

boot();
