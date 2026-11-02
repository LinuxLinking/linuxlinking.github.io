import { i18n } from "./site.js?v=ed800fe7";

/* Windows XP 桌面与 IE 窗口的脚本。

   职责：
   - 桌面图标：单击选中，双击（或回车、触屏单击）用 IE 窗口打开目标
   - IE 窗口：拖动、置前、最小化、最大化、关闭，地址栏跟着走
   - 任务栏：窗口按钮、系统托盘时钟、语言切换
   - 开始菜单：开合，以及里面的快捷方式
   - 图纸：桌面上的一个全屏应用，点节点也是开 IE 窗口

   没有 JS 时图标仍是普通链接，点开就是那个页面 —— 页面自己也是一个 IE 窗口。 */

const desktopEl = document.getElementById("xpDesktop");
const iconsEl = document.getElementById("xpIcons");
const tasksEl = document.getElementById("xpTasks");
const startBtn = document.getElementById("xpStart");
const startMenu = document.getElementById("xpStartMenu");
const clockEl = document.getElementById("xpClock");
const toastEl = document.getElementById("xpToast");
const mapEl = document.getElementById("map");
const stageEl = document.getElementById("stage");

const windows = new Map();
let zTop = 20;
let cascade = 0;
let seq = 0;
let mapView = null;
let mapNodes = [];

const isEn = () => document.documentElement.lang === "en";

/* 窗口里的页面是另一个文档，它读 localStorage 才知道现在是什么语言。
   干脆把语言写在地址上：桌面切了语言，重开的窗口一定跟着走。 */
function withLang(url) {
  const sep = url.includes("?") ? "&" : "?";
  return url + sep + "lang=" + i18n.lang;
}

/* ---------------------------------------------------------------- 小工具 */

function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("is-open");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toastEl.classList.remove("is-open"), 2600);
}

function tickClock() {
  if (!clockEl) return;
  const d = new Date();
  clockEl.textContent = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
}

function label(el) {
  return (isEn() ? el.dataset.titleEn : el.dataset.titleZh) || el.dataset.url || "";
}

/* ---------------------------------------------------------------- 窗口 */

/* 窗口里的页面是 iframe，而 iframe 自己不会滚动：内容会被裁掉，也看不见滚动条。
   把 iframe 撑到内容高度，滚动交给外层的 .xp-view —— 两种窗口共用一套滚动条。 */
function fitFrame(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    frame.style.height = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight) + "px";
  } catch (err) {
    /* 跨域读不到内容高度，保持原样 */
  }
}

function openWindow({ url, title, titleEn, iconSvg }) {
  const tpl = document.getElementById("xpWinTpl");
  if (!tpl || !desktopEl || !desktopEl.clientWidth) return null;

  const win = tpl.content.firstElementChild.cloneNode(true);
  const key = "w" + ++seq;

  win.dataset.titleZh = title || "";
  win.dataset.titleEn = titleEn || title || "";
  win.querySelector('[data-slot="icon"]').innerHTML = iconSvg || "";
  win.querySelector('[data-slot="title"]').textContent = win.dataset.titleZh;
  win.querySelector('[data-slot="url"]').value = new URL(withLang(url), location.href).href;

  const view = win.querySelector('[data-slot="view"]');
  view.innerHTML = '<iframe title="内容" loading="lazy"></iframe>';
  const frame = view.querySelector("iframe");
  frame.src = withLang(url);
  frame.addEventListener("load", () => {
    fitFrame(frame);
    try {
      const doc = frame.contentDocument;
      // mermaid 图是异步画上去的，画完高度变了要再量一次
      if (doc && doc.body && !frame.dataset.xpWatch) {
        frame.dataset.xpWatch = "1";
        new MutationObserver(() => fitFrame(frame)).observe(doc.body, {
          childList: true,
          subtree: true,
        });
      }
    } catch (err) {
      /* 跨域 */
    }
  });

  const left = 40 + (cascade % 6) * 26;
  const top = 26 + (cascade % 6) * 24;
  cascade += 1;
  const w = Math.min(980, Math.max(460, Math.round(desktopEl.clientWidth * 0.72)));
  const h = Math.min(660, Math.max(320, Math.round(desktopEl.clientHeight * 0.76)));
  win.style.left = Math.min(left, Math.max(8, desktopEl.clientWidth - w - 8)) + "px";
  win.style.top = Math.min(top, Math.max(8, desktopEl.clientHeight - h - 8)) + "px";
  win.style.width = w + "px";
  win.style.height = h + "px";

  desktopEl.appendChild(win);
  i18n.apply(win);
  win.dataset.key = key;
  windows.set(key, { win, frame, taskBtn: null, title: win.dataset.titleZh, url });
  focusWindow(key);
  addTaskButton(key, win.dataset.titleZh, iconSvg);
  wireWindow(key);
  return key;
}

function addTaskButton(key, title, iconSvg) {
  const entry = windows.get(key);
  if (!entry || !tasksEl) return;
  const btn = document.createElement("div");
  btn.className = "xp-task";
  btn.innerHTML = (iconSvg || "") + "<span></span>";
  btn.querySelector("span").textContent = title;
  btn.addEventListener("click", () => {
    if (entry.win.style.display === "none") {
      entry.win.style.display = "";
      focusWindow(key);
    } else if (btn.classList.contains("is-active")) {
      entry.win.style.display = "none";
      btn.classList.remove("is-active");
    } else {
      focusWindow(key);
    }
  });
  tasksEl.appendChild(btn);
  entry.taskBtn = btn;
}

function focusWindow(key) {
  const entry = windows.get(key);
  if (!entry) return;
  zTop += 1;
  entry.win.style.zIndex = String(zTop);
  windows.forEach((value, otherKey) => {
    value.taskBtn?.classList.toggle("is-active", otherKey === key);
  });
}

function closeWindow(key) {
  const entry = windows.get(key);
  if (!entry) return;
  entry.win.remove();
  entry.taskBtn?.remove();
  windows.delete(key);
}

function wireToolbar(win, frame, key) {
  win.querySelectorAll(".xp-tool").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      const home = win.dataset.home || "index.html";
      if (frame) {
        if (act === "home") {
          // 桌面本身就是首页。把桌面再塞进 iframe 里只会套出一层子桌面，
          // 所以「主页」在桌面开的窗口里就是关掉窗口、回到桌面。
          closeWindow(key);
          return;
        }
        try {
          if (act === "back") frame.contentWindow.history.back();
          else if (act === "fwd") frame.contentWindow.history.forward();
          else if (act === "reload") frame.contentWindow.location.reload();
        } catch (err) {
          /* 跨域时浏览器不允许操作 frame 的历史，忽略 */
        }
        return;
      }
      if (act === "back") history.back();
      else if (act === "fwd") history.forward();
      else if (act === "reload") location.reload();
      else if (act === "home") location.href = home;
    });
  });

  win.querySelector(".xp-go")?.addEventListener("click", () => {
    const value = (win.querySelector('[data-slot="url"]')?.value || "").trim();
    if (!value) return;
    if (frame) frame.src = value;
    else location.href = value;
  });
}

function wireWindow(key) {
  const entry = windows.get(key);
  if (!entry) return;
  const { win, frame } = entry;

  win.addEventListener("mousedown", () => focusWindow(key), true);

  win.querySelectorAll(".xp-tbtn[data-act]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      const act = btn.dataset.act;
      if (act === "close") closeWindow(key);
      else if (act === "min") {
        win.style.display = "none";
        entry.taskBtn?.classList.remove("is-active");
      } else if (act === "max") {
        win.classList.toggle("is-max");
        btn.textContent = win.classList.contains("is-max") ? "❐" : "□";
        if (frame) requestAnimationFrame(() => fitFrame(frame));
      }
    });
  });

  wireToolbar(win, frame, key);

  const title = win.querySelector(".xp-title");
  let drag = null;

  title.addEventListener("mousedown", (event) => {
    if (event.target.closest(".xp-tbtn") || win.classList.contains("is-max")) return;
    const rect = win.getBoundingClientRect();
    drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
    focusWindow(key);
  });

  title.addEventListener("dblclick", (event) => {
    if (event.target.closest(".xp-tbtn")) return;
    win.classList.toggle("is-max");
  });

  window.addEventListener("mousemove", (event) => {
    if (!drag) return;
    const maxX = desktopEl.clientWidth - 80;
    const maxY = desktopEl.clientHeight - 40;
    win.style.left = Math.max(-40, Math.min(maxX, event.clientX - drag.dx)) + "px";
    win.style.top = Math.max(0, Math.min(maxY, event.clientY - drag.dy)) + "px";
  });

  window.addEventListener("mouseup", () => {
    drag = null;
  });
}

/* ---------------------------------------------------------------- 桌面图标 */

function selectIcon(icon) {
  if (!iconsEl) return;
  iconsEl.querySelectorAll(".xp-icon.is-selected").forEach((el) => el.classList.remove("is-selected"));
  if (icon) icon.classList.add("is-selected");
}

function openIcon(icon) {
  if (icon.dataset.action === "map") {
    openMap();
    return;
  }
  const svg = icon.querySelector(".ic svg");
  openWindow({
    url: icon.dataset.url,
    title: label(icon),
    titleEn: icon.dataset.titleEn,
    iconSvg: svg ? svg.outerHTML : "",
  });
}

function wireIcons() {
  if (!iconsEl) return;
  const touch = matchMedia("(hover: none)").matches;

  iconsEl.querySelectorAll(".xp-icon").forEach((icon) => {
    icon.addEventListener("click", (event) => {
      event.preventDefault();
      selectIcon(icon);
      if (touch) openIcon(icon);
    });
    icon.addEventListener("dblclick", (event) => {
      event.preventDefault();
      if (!touch) openIcon(icon);
    });
    icon.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      openIcon(icon);
    });
  });
}

/* ---------------------------------------------------------------- 开始菜单 */

function toggleStartMenu(force) {
  if (!startMenu) return;
  const open = force === undefined ? !startMenu.classList.contains("is-open") : force;
  startMenu.classList.toggle("is-open", open);
  startBtn?.setAttribute("aria-expanded", String(open));
}

function wireStartMenu() {
  startBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleStartMenu();
  });

  startMenu?.querySelectorAll("[data-url]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      toggleStartMenu(false);
      if (item.dataset.action === "map") {
        openMap();
        return;
      }
      const svg = item.querySelector(".ic svg");
      openWindow({
        url: item.dataset.url,
        title: label(item),
        titleEn: item.dataset.titleEn,
        iconSvg: svg ? svg.outerHTML : "",
      });
    });
  });

  startMenu?.querySelectorAll("[data-close-sm]").forEach((item) => {
    item.addEventListener("click", () => {
      toggleStartMenu(false);
      if (item.dataset.toast) toast(item.dataset.toast);
    });
  });

  document.addEventListener("click", (event) => {
    if (!startMenu?.classList.contains("is-open")) return;
    if (event.target.closest("#xpStartMenu") || event.target.closest("#xpStart")) return;
    toggleStartMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") toggleStartMenu(false);
  });
}

/* ---------------------------------------------------------------- 图纸 */

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function localize(nodes, lang) {
  return nodes.map((node) => ({
    ...node,
    titleText: node.title?.[lang] ?? node.title?.zh ?? node.id,
    labelText: node.label?.[lang] ?? node.label?.zh ?? node.id,
    taglineText: node.tagline?.[lang] ?? node.tagline?.zh ?? "",
  }));
}

async function buildMap() {
  if (mapView || !mapEl || !stageEl) return;
  try {
    const [{ createMap }, { buildNodes }] = await Promise.all([
      import("./map.js?v=0bda1abc"),
      import("./nodes.js?v=89d92837"),
    ]);
    const [projects, posts] = await Promise.all([
      fetchJson("data/projects.json"),
      fetchJson("data/posts.json"),
    ]);
    mapNodes = buildNodes({ projects: projects.projects || projects, posts: posts.posts || posts });
    mapView = createMap({
      container: mapEl,
      stage: stageEl,
      labels: {
        projects: i18n.t("map.projects"),
        writing: i18n.t("map.writing"),
        other: i18n.t("map.other"),
      },
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      onOpen: (node) => {
        closeMap();
        openWindow({ url: node.href, title: node.titleText || node.id });
      },
    });
    mapView.setNodes(localize(mapNodes, i18n.lang));
  } catch (err) {
    console.warn("[map] load failed:", err);
    const box = document.getElementById("stateError");
    if (box) box.hidden = false;
    closeMap();
  }
}

function openMap() {
  if (!mapEl) return;
  mapEl.classList.remove("is-hidden");
  mapEl.removeAttribute("inert");
  mapEl.setAttribute("aria-hidden", "false");
  buildMap().then(() => mapView?.fit(false));
}

function closeMap() {
  if (!mapEl) return;
  mapEl.classList.add("is-hidden");
  mapEl.setAttribute("inert", "");
  mapEl.setAttribute("aria-hidden", "true");
}

function wireMap() {
  document.querySelectorAll("[data-map-exit]").forEach((btn) => {
    btn.addEventListener("click", closeMap);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mapEl && !mapEl.classList.contains("is-hidden")) closeMap();
  });
}

/* ---------------------------------------------------------------- 启动 */

function syncTitles() {
  // 切语言时，窗口标题栏和任务栏上的按钮要一起换
  windows.forEach((entry) => {
    const win = entry.win;
    const title = (isEn() ? win.dataset.titleEn : win.dataset.titleZh) || "";
    const slot = win.querySelector('[data-slot="title"]');
    if (slot) slot.textContent = title;
    entry.title = title;
    if (entry.taskBtn) entry.taskBtn.querySelector("span").textContent = title;
  });
}

function wireStaticWindow() {
  const win = document.querySelector(".xp-window.is-page");
  if (!win) return;
  const key = "page";
  win.dataset.key = key;
  windows.set(key, { win, frame: null, taskBtn: null, title: win.dataset.titleZh || "" });
  addTaskButton(key, win.dataset.titleZh || "", win.querySelector('[data-slot="icon"]')?.innerHTML || "");
  wireWindow(key);
}

function boot() {
  tickClock();
  setInterval(tickClock, 20000);

  window.addEventListener("resize", () => {
    windows.forEach((entry) => {
      if (entry.frame) fitFrame(entry.frame);
    });
  });

  wireIcons();
  wireStartMenu();
  wireMap();
  wireStaticWindow();

  if (iconsEl) selectIcon(iconsEl.querySelector(".xp-icon"));
  syncTitles();

  document.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.quick === "map") {
        openMap();
        return;
      }
      openWindow({ url: "blog/", title: "文字 · Writing", titleEn: "Writing" });
    });
  });

  i18n.onChange(() => {
    syncTitles();
    // 窗口里的页面各有各的语言实例，只能重载一次让它们跟上
    windows.forEach((entry) => {
      if (!entry.frame || !entry.url) return;
      entry.frame.src = withLang(entry.url);
      // 地址栏也要换，不然上面还挂着上一种语言的 ?lang=
      const slot = entry.win.querySelector('[data-slot="url"]');
      if (slot) slot.value = new URL(withLang(entry.url), location.href).href;
    });
    if (mapView) mapView.setNodes(localize(mapNodes, i18n.lang));
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
