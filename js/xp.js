import { i18n } from "./site.js?v=970ff2d9";

/* Windows XP 桌面与 IE 窗口的脚本。

   职责：
   - 桌面图标：单击选中，双击（或回车、触屏单击）用 IE 窗口打开目标
   - IE 窗口：拖动、置前、最小化、最大化、关闭，地址栏跟着走
   - 菜单栏：文件/编辑/查看/收藏夹/工具/帮助，每一条命令都有实际行为
   - 对话框：关于、页面属性、找不到页面、关机与注销
   - 任务栏：窗口按钮、快速启动、语言切换
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
const modalEl = document.getElementById("xpModal");
const dlgIcon = document.getElementById("xpDlgIcon");
const dlgTitle = document.getElementById("xpDlgTitle");
const dlgBody = document.getElementById("xpDlgBody");
const dlgFoot = document.getElementById("xpDlgFoot");
const shutdownEl = document.getElementById("xpShutdown");
const logonEl = document.getElementById("xpLogon");

const windows = new Map();
let zTop = 20;
let cascade = 0;
let seq = 0;
let mapView = null;
let mapNodes = [];
let activeKey = null;

const isEn = () => document.documentElement.lang === "en";

/* 站点根目录由构建期按页面深度写在 <html data-root> 上。
   开始菜单、收藏夹里的地址都是相对站点根写的：在 /blog/ 页面上，
   相对当前页去解析 "projects/site/" 会解析到 /blog/projects/site/，那是错的。 */
const siteRoot = () => document.documentElement.dataset.root || "./";
const siteUrl = (href) => siteRoot() + String(href).replace(/^\/+/, "");
const siteHome = () => new URL(siteRoot(), location.href).href;

/* 站点首页就是桌面本身。窗口里再显示一次桌面只会套出一层子桌面，
   所以窗口里任何指向首页的跳转都改成「回到桌面」：关掉这个窗口。 */
function isHomeUrl(url, base) {
  try {
    const target = new URL(url, base || location.href);
    const home = new URL(siteHome());
    if (target.origin !== home.origin) return false;
    return target.pathname === home.pathname || target.pathname === home.pathname + "index.html";
  } catch (err) {
    return false;
  }
}

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

function el(tag, text) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  return node;
}

/* 地址栏里敲的东西：网址照办，站内路径补上根目录，看着像域名就当域名。 */
function resolveUrl(text) {
  const value = text.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return siteUrl(value);
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/.*)?$/.test(value)) return "https://" + value;
  const path = /\/|\.[a-z0-9]{1,5}$/i.test(value) ? value : value.replace(/\/+$/, "") + "/";
  return siteUrl(path);
}

/* ---------------------------------------------------------------- 对话框 */

function iconSvg(name) {
  const node = document.querySelector('#xpIconStore [data-icon="' + name + '"]');
  return node ? node.innerHTML : "";
}

function closeDialog() {
  if (!modalEl) return;
  modalEl.hidden = true;
  dlgBody.textContent = "";
  dlgFoot.textContent = "";
}

function openDialog({ icon = "", title = "", body = null, buttons = [] }) {
  if (!modalEl) return;
  dlgIcon.innerHTML = icon;
  dlgTitle.textContent = title;
  dlgBody.textContent = "";
  if (body) dlgBody.append(body);
  dlgFoot.textContent = "";
  buttons.forEach((item) => {
    const btn = el("button", item.label);
    btn.type = "button";
    btn.className = "btn";
    btn.addEventListener("click", () => {
      closeDialog();
      if (item.onClick) item.onClick();
    });
    dlgFoot.append(btn);
  });
  modalEl.hidden = false;
  const first = dlgFoot.querySelector("button");
  if (first) first.focus();
}

function showAbout() {
  const body = el("div");
  body.append(el("p", i18n.t("home.title")), el("p", i18n.t("home.lede")));
  const link = el("a", "github.com/LinuxLinking/linuxlinking.github.io");
  link.href = "https://github.com/LinuxLinking/linuxlinking.github.io";
  body.append(link);
  openDialog({
    icon: iconSvg("info"),
    title: i18n.t("dlg.about.title"),
    body,
    buttons: [{ label: i18n.t("dlg.ok") }],
  });
}

function showProperties(win, entry) {
  const url = addressOf(win);
  const body = el("div");
  body.append(el("p", entry ? entry.title : document.title), el("p", url));
  openDialog({
    icon: iconSvg("info"),
    title: i18n.t("dlg.props.title"),
    body,
    buttons: [
      { label: i18n.t("dlg.copy"), onClick: () => copyText(url) },
      { label: i18n.t("dlg.ok") },
    ],
  });
}

function showShortcuts() {
  const body = el("div");
  const list = el("ul");
  [
    ["Enter", "kbd.enter"],
    ["Esc", "kbd.esc"],
    ["Alt + F", "kbd.altF"],
  ].forEach(([key, labelKey]) => {
    list.append(el("li", key + " — " + i18n.t(labelKey)));
  });
  body.append(list);
  openDialog({
    icon: iconSvg("info"),
    title: i18n.t("dlg.shortcuts.title"),
    body,
    buttons: [{ label: i18n.t("dlg.ok") }],
  });
}

function askShutDown() {
  openDialog({
    icon: iconSvg("warn"),
    title: i18n.t("dlg.shutdown.title"),
    body: el("p", i18n.t("dlg.shutdown.body")),
    buttons: [
      { label: i18n.t("dlg.ok"), onClick: showShutdown },
      { label: i18n.t("dlg.cancel") },
    ],
  });
}

function askLogOff() {
  openDialog({
    icon: iconSvg("warn"),
    title: i18n.t("dlg.logoff.title"),
    body: el("p", i18n.t("dlg.logoff.body")),
    buttons: [
      { label: i18n.t("dlg.ok"), onClick: showLogon },
      { label: i18n.t("dlg.cancel") },
    ],
  });
}

function showShutdown() {
  if (!shutdownEl) return;
  shutdownEl.hidden = false;
  refreshScreens();
}

function showLogon() {
  if (!logonEl) return;
  logonEl.hidden = false;
  refreshScreens();
}

/* 关机屏与登录屏上的字也是文案：切语言要跟着换。 */
function refreshScreens() {
  const text = document.getElementById("xpShutdownText");
  if (text) text.textContent = i18n.t("dlg.shutdown.now");
  const restart = document.getElementById("xpRestart");
  if (restart) restart.textContent = i18n.t("dlg.restart");
  const title = document.getElementById("xpLogonTitle");
  if (title) title.textContent = i18n.t("dlg.logon.title");
  const hint = document.getElementById("xpLogonHint");
  if (hint) hint.textContent = i18n.t("dlg.logon.hint");
  const name = document.getElementById("xpLogonName");
  if (name) name.textContent = isEn() ? "Zhong Shanshan" : "钟闪闪";
}

/* ---------------------------------------------------------------- 窗口 */

/* 窗口里的页面是 iframe，而 iframe 自己不会滚动：内容会被裁掉，也看不见滚动条。
   把 iframe 撑到内容高度，滚动交给外层的 .xp-view。

   但有些页面用的是视口单位（soul-for-u 的 100vh）：撑高它，内容又跟着变高，
   于是里面外面各滚一条。那种页面自己管滚动，窗口就让位给它们。 */
function fitFrame(frame) {
  try {
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    const view = doc.documentElement;
    const want = Math.max(view.scrollHeight, doc.body.scrollHeight);
    frame.style.height = want + "px";
    if (view.scrollHeight > want + 1) {
      frame.style.height = "100%";
      frame.dataset.xpFit = "fill";
    } else {
      frame.dataset.xpFit = "grow";
    }
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
  const entry = {
    win,
    frame,
    taskBtn: null,
    title: win.dataset.titleZh,
    url,
    history: [],
    hIndex: -1,
  };
  windows.set(key, entry);

  frame.addEventListener("load", () => {
    // 窗口里加载了桌面 = 套出一层子桌面。回到桌面 = 关掉这个窗口。
    try {
      if (isHomeUrl(frame.contentWindow.location.href)) {
        closeWindow(key);
        return;
      }
    } catch (err) {
      /* 跨域 */
    }
    fitFrame(frame);
    syncHistory(entry);
    try {
      const doc = frame.contentDocument;
      // 窗口里的「回到首页」链接直接关窗，别让桌面在窗口里闪一下
      if (doc && !doc.documentElement.dataset.xpHome) {
        doc.documentElement.dataset.xpHome = "1";
        doc.addEventListener("click", (ev) => {
          const el = ev.target;
          const link = el && el.closest ? el.closest("a[href]") : null;
          if (!link) return;
          if (isHomeUrl(link.getAttribute("href"), doc.baseURI)) {
            ev.preventDefault();
            closeWindow(key);
          }
        });
      }
      // mermaid 图是异步画上去的，画完高度变了要再量一次
      if (doc && doc.body && !frame.dataset.xpWatch) {
        frame.dataset.xpWatch = "1";
        new MutationObserver(() => {
          // 自己管滚动的页面撑了也没用，别反复撑
          if (frame.dataset.xpFit === "fill") return;
          fitFrame(frame);
        }).observe(doc.body, {
          childList: true,
          subtree: true,
        });
      }
    } catch (err) {
      /* 跨域 */
    }
  });

  focusWindow(key);
  addTaskButton(key, win.dataset.titleZh, iconSvg);
  wireWindow(key);
  wireMenus(win);
  return key;
}

/* 窗口自己的前进后退栈。iframe 内部点链接也会被记下来，
   所以后退/前进能按真实来路走，而不是浏览器那份不可靠的历史。 */
function syncHistory(entry) {
  let href;
  try {
    href = entry.frame.contentWindow.location.href;
  } catch (err) {
    return;
  }
  if (entry.history[entry.hIndex] === href) return;
  entry.history = entry.history.slice(0, entry.hIndex + 1);
  entry.history.push(href);
  entry.hIndex = entry.history.length - 1;
  const slot = entry.win.querySelector('[data-slot="url"]');
  if (slot) slot.value = href;
  syncWindowTitle(entry);
  updateNav(entry);
}

/* 窗口里换了页面，标题栏和任务栏上的名字要跟着换 —— IE 就是这么干的。 */
function syncWindowTitle(entry) {
  let title = "";
  try {
    title = entry.frame.contentDocument?.title?.trim() || "";
  } catch (err) {
    /* 跨域读不到标题 */
  }
  if (!title) return;
  entry.win.dataset.titleZh = title;
  entry.win.dataset.titleEn = title;
  entry.title = title;
  const slot = entry.win.querySelector('[data-slot="title"]');
  if (slot) slot.textContent = title;
  if (entry.taskBtn) entry.taskBtn.querySelector("span").textContent = title;
}

function updateNav(entry) {
  const back = entry.win.querySelector('.xp-tool[data-act="back"]');
  const fwd = entry.win.querySelector('.xp-tool[data-act="fwd"]');
  if (back) back.disabled = entry.hIndex <= 0;
  if (fwd) fwd.disabled = entry.hIndex >= entry.history.length - 1;
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
  activeKey = key;
  windows.forEach((value, otherKey) => {
    value.taskBtn?.classList.toggle("is-active", otherKey === key);
  });
}

function activeWindow() {
  return activeKey ? windows.get(activeKey)?.win || null : null;
}

function closeWindow(key) {
  const entry = windows.get(key);
  if (!entry) return;
  entry.win.remove();
  entry.taskBtn?.remove();
  windows.delete(key);
  if (activeKey === key) activeKey = null;
}

function addressOf(win) {
  return win?.querySelector('[data-slot="url"]')?.value || location.href;
}

function toggleMax(win) {
  const btn = win?.querySelector('.xp-tbtn[data-act="max"]');
  if (!win) return;
  win.classList.toggle("is-max");
  if (btn) btn.textContent = win.classList.contains("is-max") ? "❐" : "□";
  const entry = windows.get(win.dataset.key);
  if (entry?.frame) requestAnimationFrame(() => fitFrame(entry.frame));
}

function wireToolbar(win, frame, key) {
  const entry = windows.get(key);

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
        if (act === "back" || act === "fwd") {
          const next = act === "back" ? entry.hIndex - 1 : entry.hIndex + 1;
          if (next < 0 || next >= entry.history.length) return;
          entry.hIndex = next;
          frame.src = entry.history[next];
          updateNav(entry);
          return;
        }
        if (act === "reload") frame.contentWindow.location.reload();
        return;
      }
      if (act === "back") history.back();
      else if (act === "fwd") history.forward();
      else if (act === "reload") location.reload();
      else if (act === "home") location.href = home;
    });
  });

  const address = win.querySelector('[data-slot="url"]');
  const go = () => {
    const target = resolveUrl(address?.value || "");
    if (!target) return;
    if (frame) {
      if (isHomeUrl(target)) {
        closeWindow(key);
        return;
      }
      frame.src = target;
    } else location.href = target;
  };
  win.querySelector(".xp-go")?.addEventListener("click", go);
  address?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") go();
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
        toggleMax(win);
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
    toggleMax(win);
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

/* ---------------------------------------------------------------- 菜单栏 */

function closeMenus(except) {
  document.querySelectorAll(".xp-menu.is-open").forEach((menu) => {
    if (menu === except) return;
    menu.classList.remove("is-open");
    const drop = menu.querySelector(".xp-drop");
    if (drop) drop.hidden = true;
    const top = menu.querySelector(".xp-menu-top");
    if (top) top.setAttribute("aria-expanded", "false");
  });
}

function openMenu(menu) {
  closeMenus(menu);
  menu.classList.add("is-open");
  const drop = menu.querySelector(".xp-drop");
  if (drop) drop.hidden = false;
  const top = menu.querySelector(".xp-menu-top");
  if (top) top.setAttribute("aria-expanded", "true");
}

function wireMenus(root) {
  root.querySelectorAll(".xp-menu").forEach((menu) => {
    const top = menu.querySelector(".xp-menu-top");
    const drop = menu.querySelector(".xp-drop");
    if (!top || !drop) return;

    top.addEventListener("click", (event) => {
      event.stopPropagation();
      if (menu.classList.contains("is-open")) closeMenus();
      else openMenu(menu);
    });

    // 已经开着一个菜单时，鼠标移过去就换菜单 —— XP 就是这个手感
    top.addEventListener("mouseenter", () => {
      if (!document.querySelector(".xp-menu.is-open")) return;
      openMenu(menu);
    });

    drop.addEventListener("click", (event) => {
      const item = event.target.closest("[data-cmd]");
      if (!item) return;
      closeMenus();
      runCommand(item.dataset.cmd, item, menu.closest(".xp-window"));
    });
  });
}

/* 菜单里每条命令的实际行为。 */
function runCommand(cmd, item, win) {
  const entry = win ? windows.get(win.dataset.key) : null;
  const frame = entry ? entry.frame : null;

  switch (cmd) {
    case "open": {
      const address = win?.querySelector('[data-slot="url"]');
      address?.focus();
      address?.select();
      break;
    }
    case "print":
      try {
        (frame ? frame.contentWindow : window).print();
      } catch (err) {
        /* 跨域时浏览器不允许 */
      }
      break;
    case "props":
      showProperties(win, entry);
      break;
    case "close":
      if (win) closeWindow(win.dataset.key);
      break;
    case "selectAll":
      selectAllInFrame(frame);
      break;
    case "copyAddr":
      copyText(addressOf(win));
      break;
    case "copyText":
      copyText(textOfFrame(frame));
      break;
    case "reload":
      if (frame) frame.contentWindow.location.reload();
      else location.reload();
      break;
    case "zoomIn":
      zoomFrame(frame, 0.25);
      break;
    case "zoomOut":
      zoomFrame(frame, -0.25);
      break;
    case "zoomReset":
      zoomFrame(frame, 0);
      break;
    case "toolbar": {
      const bar = win?.querySelector(".xp-toolbar");
      if (bar) bar.hidden = !bar.hidden;
      break;
    }
    case "full":
      toggleMax(win);
      break;
    case "fav":
      openShortcut(item);
      break;
    case "lang-zh":
      i18n.setLang("zh");
      break;
    case "lang-en":
      i18n.setLang("en");
      break;
    case "map":
      openMap();
      break;
    case "about":
      showAbout();
      break;
    case "shortcuts":
      showShortcuts();
      break;
    default:
      break;
  }
}

function selectAllInFrame(frame) {
  try {
    const doc = frame?.contentDocument;
    if (!doc?.body) return;
    const range = doc.createRange();
    range.selectNodeContents(doc.body);
    const selection = doc.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    toast(i18n.t("dlg.selected"));
  } catch (err) {
    /* 跨域 */
  }
}

function textOfFrame(frame) {
  try {
    return frame?.contentDocument?.body?.innerText || "";
  } catch (err) {
    return "";
  }
}

async function copyText(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast(i18n.t("dlg.copied"));
  } catch (err) {
    toast(text.slice(0, 80));
  }
}

/* 放大用的是 zoom：iframe 跟着一起变大，外层那条滚动条自然就够长。 */
function zoomFrame(frame, delta) {
  if (!frame) return;
  const current = Number(frame.dataset.xpZoom || 1);
  const next = Math.min(2, Math.max(0.5, Math.round((current + delta) * 100) / 100));
  frame.dataset.xpZoom = String(next);
  frame.style.zoom = next === 1 ? "" : String(next);
  fitFrame(frame);
}

/* ---------------------------------------------------------------- 桌面图标 */

function selectIcon(icon) {
  if (!iconsEl) return;
  iconsEl.querySelectorAll(".xp-icon.is-selected").forEach((el) => el.classList.remove("is-selected"));
  if (icon) icon.classList.add("is-selected");
}

function openShortcut(item) {
  const svg = item.querySelector(".ic svg");
  openWindow({
    url: siteUrl(item.dataset.url),
    title: label(item),
    titleEn: item.dataset.titleEn,
    iconSvg: svg ? svg.outerHTML : "",
  });
}

function openIcon(icon) {
  if (icon.dataset.action === "map") {
    openMap();
    return;
  }
  const svg = icon.querySelector(".ic svg");
  openWindow({
    url: siteUrl(icon.dataset.url),
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
      openShortcut(item);
    });
  });

  startMenu?.querySelectorAll("[data-close-sm]").forEach((item) => {
    item.addEventListener("click", () => {
      toggleStartMenu(false);
      if (item.dataset.sm === "shutdown") askShutDown();
      else askLogOff();
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
    // 字形可以是一个字，也可以是 {zh, en}：项目的图标两边一样，文字和文章的图标跟着语言走
    monogram: node.monogram?.[lang] ?? node.monogram ?? "",
    titleText: node.title?.[lang] ?? node.title?.zh ?? node.id,
    labelText: node.label?.[lang] ?? node.label?.zh ?? node.id,
    taglineText: node.tagline?.[lang] ?? node.tagline?.zh ?? "",
  }));
}

/* 图纸的分区标题：作品 / 文字 / 其他 */
function mapLabels() {
  return {
    projects: i18n.t("map.projects"),
    writing: i18n.t("map.writing"),
    other: i18n.t("map.other"),
  };
}

async function buildMap() {
  if (mapView || !mapEl || !stageEl) return;
  try {
    const [{ createMap }, { buildNodes }] = await Promise.all([
      import("./map.js?v=78735bc7"),
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
      labels: mapLabels(),
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
  windows.set(key, { win, frame: null, taskBtn: null, title: win.dataset.titleZh || "", history: [], hIndex: -1 });
  addTaskButton(key, win.dataset.titleZh || "", win.querySelector('[data-slot="icon"]')?.innerHTML || "");
  wireWindow(key);
  wireMenus(win);
  // 独立内容页没有自己的历史，后退前进就该是灰的
  updateNav(windows.get(key));
}

function wireShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (modalEl && !modalEl.hidden) {
        closeDialog();
        return;
      }
      if (logonEl && !logonEl.hidden) {
        logonEl.hidden = true;
        return;
      }
      closeMenus();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      const win = activeWindow() || document.querySelector(".xp-window.is-page");
      const menu = win?.querySelector(".xp-menu");
      if (menu) openMenu(menu);
    }
  });
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
  wireShortcuts();

  document.addEventListener("click", () => closeMenus());
  modalEl?.addEventListener("click", (event) => {
    if (event.target === modalEl) closeDialog();
  });
  modalEl?.querySelector("[data-dlg-close]")?.addEventListener("click", closeDialog);
  document.getElementById("xpRestart")?.addEventListener("click", () => location.reload());
  document.getElementById("xpLogonBack")?.addEventListener("click", () => {
    if (logonEl) logonEl.hidden = true;
  });

  if (iconsEl) selectIcon(iconsEl.querySelector(".xp-icon"));
  syncTitles();
  refreshScreens();

  document.querySelectorAll("[data-quick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = btn.dataset.quick;
      if (kind === "map") {
        openMap();
        return;
      }
      if (kind === "desktop") {
        showDesktop();
        return;
      }
      // Internet Explorer：新标签页打开站点首页
      window.open(siteHome(), "_blank");
    });
  });

  i18n.onChange(() => {
    syncTitles();
    refreshScreens();
    // 窗口里的页面各有各的语言实例，只能重载一次让它们跟上
    windows.forEach((entry) => {
      if (!entry.frame || !entry.url) return;
      entry.frame.src = withLang(entry.url);
      // 地址栏也要换，不然上面还挂着上一种语言的 ?lang=
      const slot = entry.win.querySelector('[data-slot="url"]');
      if (slot) slot.value = new URL(withLang(entry.url), location.href).href;
    });
    if (mapView) {
      mapView.setNodes(localize(mapNodes, i18n.lang));
      mapView.setLabels(mapLabels());
    }
  });
}

/* 显示桌面：把窗口都收起来，桌面重新露出来。 */
function showDesktop() {
  windows.forEach((entry) => {
    if (!entry.frame) return;
    entry.win.style.display = "none";
    entry.taskBtn?.classList.remove("is-active");
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
