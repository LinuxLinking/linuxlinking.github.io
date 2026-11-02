import { createMap } from "./map.js?v=2f8a4b40";
import { renderHome } from "./home.js?v=20d49e3c";
import { bootPage, escapeHtml } from "./shared.js?v=33539a65";
import { buildNodes } from "./nodes.js?v=b189be2a";

const mapEl = document.getElementById("map");
const stageEl = document.getElementById("stage");
const gridEl = document.getElementById("homeView");
const gridBodyEl = document.getElementById("homeBody");
const aboutEl = document.getElementById("about");
const stateErrorEl = document.getElementById("stateError");
const hintEl = document.querySelector(".hint");
const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
const aboutBtn = document.getElementById("aboutBtn");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = { lang: "zh", projects: [], posts: [], now: {} };
let i18n = null;
let mapView = null;
const mapLabels = {};
let lastFocus = null;
let gridScroll = 0;

function localize(nodes, lang) {
  return nodes.map((node) => ({
    ...node,
    titleText: node.title?.[lang] ?? node.title?.zh ?? node.id,
    labelText: node.label?.[lang] ?? node.label?.zh ?? node.id,
    taglineText: node.tagline?.[lang] ?? node.tagline?.zh ?? ""
  }));
}

async function loadPosts() {
  try {
    const res = await fetch("data/posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.posts) ? data.posts : [];
  } catch (err) {
    console.warn("[posts] load failed:", err);
    return [];
  }
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

/* 「此刻在做什么」的数据。作者维护 data/now.json，这里只负责取。 */
async function loadNow() {
  try {
    const res = await fetch("data/now.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.now || {};   // { zh: { items: [...] }, en: { items: [...] } }
  } catch (err) {
    console.warn("[now] load failed:", err);
    return {};
  }
}

const VIEWS = ["grid", "map"];

function readView() {
  try {
    const saved = localStorage.getItem("view");
    // 旧版本把第二个视图存成 "list"，现在它由网格取代；"honeycomb" 是改成图纸前的旧名
    if (saved === "list") return "grid";
    if (saved === "honeycomb") return "map";
    return VIEWS.includes(saved) ? saved : "grid";
  } catch (err) {
    return "grid";
  }
}

/* 图纸视图的分区标题跟着语言走。 */
function syncMapLabels() {
  mapLabels.projects = i18n.t("map.projects");
  mapLabels.writing = i18n.t("map.writing");
  mapLabels.other = i18n.t("map.other");
}

function refresh() {
  const nodes = localize(buildNodes({ projects: state.projects, posts: state.posts }), state.lang);
  mapView.setNodes(nodes);
  renderHome(gridBodyEl, { nodes, posts: state.posts, now: state.now, lang: state.lang, t: i18n.t });
  document.title = i18n.t("meta.title.home");
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", i18n.t("meta.desc.home"));
}

function setView(next, persist = true) {
  const isGrid = next === "grid";

  if (persist) {
    try {
      localStorage.setItem("view", next);
    } catch (err) {
      /* ignore */
    }
  }

  document.body.classList.toggle("view-map", !isGrid);
  gridEl.classList.toggle("is-hidden", !isGrid);
  gridEl.setAttribute("aria-hidden", String(!isGrid));
  gridEl.inert = !isGrid;

  mapEl.classList.toggle("is-hidden", isGrid);
  mapEl.setAttribute("aria-hidden", String(isGrid));
  mapEl.inert = isGrid;

  viewButtons.forEach((btn) => {
    const active = btn.dataset.view === next;
    btn.setAttribute("aria-pressed", String(active));
    btn.classList.toggle("is-active", active);
  });

  // 拖拽提示只属于星图视图
  if (hintEl) hintEl.classList.toggle("is-hidden", isGrid);

  // 网格是文档流、星图是固定层，切过去时把滚动位置收起来再放回去
  if (isGrid) {
    window.scrollTo(0, gridScroll);
  } else {
    gridScroll = window.scrollY;
    window.scrollTo(0, 0);
    if (mapView) mapView.fit(false);
  }
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
  mapEl.classList.add("is-hidden");
  gridEl.classList.add("is-hidden");
  viewButtons.forEach((btn) => {
    btn.disabled = true;
  });
}

function wireUi() {
  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
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
  i18n = await bootPage({ stringsPath: "data/i18n.json" });
  state.lang = i18n.lang;
  syncMapLabels();

  const projects = await loadProjects();
  if (!projects) {
    showError();
    return;
  }

  state.projects = projects;
  state.posts = await loadPosts();
  state.now = await loadNow();

  mapView = createMap({
    container: mapEl,
    stage: stageEl,
    labels: mapLabels,
    reducedMotion: reduced,
    onOpen: (node) => {
      location.href = node.href;
    }
  });

  refresh();
  wireUi();

  i18n.onChange((lang) => {
    state.lang = lang;
    syncMapLabels();
    refresh();
  });

  setView(readView(), false);
}

boot();
