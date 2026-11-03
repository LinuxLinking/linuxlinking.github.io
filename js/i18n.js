const LANGS = ["zh", "en"];
const STORE_KEY = "lang";

/* 全站文案。由 tools/build.py 从 data/i18n.json 生成 —— 别手改这里，
   改文案请改 data/i18n.json，然后跑 `python tools/build.py`。
   页面不再运行时拉 JSON：这份兜底块就是唯一来源，省一次请求，也不用管路径。 */
/* FALLBACK:BEGIN */
const FALLBACK = {
  en: {
    "a11y.lang": "Language",
    "a11y.nodes": "Site map",
    "blog.back": "Back home",
    "blog.empty": "No posts yet.",
    "blog.emptyHint": "Some words are still on the way. Have a look at the projects instead.",
    "blog.kicker": "Writing",
    "blog.title": "Written down",
    "detail.back": "Back home",
    "detail.download": "Download APK",
    "detail.highlights": "Highlights",
    "detail.next": "Next",
    "detail.open": "Open",
    "detail.posts": "Related writing",
    "detail.prev": "Previous",
    "detail.stack": "Stack",
    "detail.viewRepo": "View on GitHub",
    "detail.writing": "More writing",
    "dlg.about.title": "About This Site",
    "dlg.cancel": "Cancel",
    "dlg.copied": "Copied to the clipboard",
    "dlg.copy": "Copy",
    "dlg.logoff.body": "Are you sure you want to log off?",
    "dlg.logoff.title": "Log Off Windows",
    "dlg.logon.back": "Log On",
    "dlg.logon.hint": "To begin, click your user name",
    "dlg.notfound.body": "That address doesn't exist. Check the spelling, or open it again from the desktop.",
    "dlg.notfound.title": "Cannot Find Page",
    "dlg.ok": "OK",
    "dlg.props.title": "Page Properties",
    "dlg.restart": "Restart",
    "dlg.selected": "The page text is selected",
    "dlg.shortcuts.title": "Keyboard Shortcuts",
    "dlg.shutdown.body": "What do you want the computer to do?",
    "dlg.shutdown.now": "It is now safe to turn off your computer.",
    "dlg.shutdown.title": "Shut Down Windows",
    "error.data": "The data couldn't be loaded.",
    "error.dataHint": "Try refreshing, or go straight to GitHub.",
    "hint.gesture": "Drag · Scroll to zoom · Double-click to reset",
    "home.lede": "Seven open-source projects: Mdeditor, a Markdown editor for Android; Intent OS, a deterministic runtime above the LLM; a local Ollama coding assistant for the terminal; a Claude Code hook that locks down MiniMax and nothing else; an OCR MCP server; a pure-batch JDK switcher for Windows; and this site. Four essays run along the same thread: the model proposes, the code decides.",
    "home.title": "I build the tools, and I write down the hard parts",
    "kbd.altF": "Open the File menu",
    "kbd.enter": "Open the selected desktop icon",
    "kbd.esc": "Close menus and dialogs",
    "map.other": "OTHER",
    "map.projects": "PROJECTS",
    "map.writing": "WRITING",
    "menu.edit": "Edit(E)",
    "menu.edit.copyAddr": "Copy Address",
    "menu.edit.copyText": "Copy Page Text",
    "menu.edit.selectAll": "Select All",
    "menu.fav": "Favorites(A)",
    "menu.file": "File(F)",
    "menu.file.close": "Close",
    "menu.file.open": "Open…",
    "menu.file.print": "Print…",
    "menu.file.props": "Properties…",
    "menu.help": "Help(H)",
    "menu.help.about": "About",
    "menu.help.shortcuts": "Keyboard Shortcuts",
    "menu.tools": "Tools(T)",
    "menu.tools.about": "About This Site",
    "menu.tools.lang": "Language",
    "menu.tools.langEn": "English",
    "menu.tools.langZh": "Chinese",
    "menu.tools.map": "Site Map",
    "menu.view": "View(V)",
    "menu.view.full": "Full Screen",
    "menu.view.reload": "Refresh",
    "menu.view.toolbar": "Toolbar",
    "menu.view.zoomIn": "Zoom In",
    "menu.view.zoomOut": "Zoom Out",
    "menu.view.zoomReset": "Actual Size",
    "meta.desc.home": "Open-source projects by Zhong Shanshan: an Android Markdown editor, a runtime above the LLM, a local Ollama coding assistant, an OCR MCP server and a JDK switcher for Windows.",
    "nf.back": "Back home",
    "nf.body": "That address doesn't exist. Head back home — seven projects and a few unfinished pieces of writing are waiting there.",
    "nf.title": "Nothing here",
    "post.related": "Keep reading",
    "quick.desktop": "Show Desktop",
    "quick.ie": "Open the site home in a new tab",
    "quick.map": "Site Map",
    "win.address": "Address",
    "win.back": "Back",
    "win.close": "Close",
    "win.content": "Content",
    "win.done": "Done",
    "win.fwd": "Forward",
    "win.go": "Go",
    "win.home": "Home",
    "win.max": "Maximize",
    "win.min": "Minimize",
    "win.reload": "Refresh",
  },
  zh: {
    "a11y.lang": "语言 / Language",
    "a11y.nodes": "站点图纸 / Site map",
    "blog.back": "回到首页",
    "blog.empty": "还没有文章。",
    "blog.emptyHint": "有些话还在路上。先去看看做过的项目吧。",
    "blog.kicker": "文字",
    "blog.title": "写下的东西",
    "detail.back": "回到首页",
    "detail.download": "下载 APK",
    "detail.highlights": "亮点",
    "detail.next": "下一个",
    "detail.open": "打开",
    "detail.posts": "相关文字",
    "detail.prev": "上一个",
    "detail.stack": "技术栈",
    "detail.viewRepo": "在 GitHub 查看",
    "detail.writing": "更多文字",
    "dlg.about.title": "关于本站",
    "dlg.cancel": "取消",
    "dlg.copied": "已复制到剪贴板",
    "dlg.copy": "复制",
    "dlg.logoff.body": "确定要注销吗？",
    "dlg.logoff.title": "注销 Windows",
    "dlg.logon.back": "重新登录",
    "dlg.logon.hint": "要开始，请单击您的用户名",
    "dlg.notfound.body": "找不到这个地址。检查一下拼写，或者回桌面重新打开。",
    "dlg.notfound.title": "无法找到页面",
    "dlg.ok": "确定",
    "dlg.props.title": "页面属性",
    "dlg.restart": "重新启动",
    "dlg.selected": "页面文字已选中",
    "dlg.shortcuts.title": "键盘快捷键",
    "dlg.shutdown.body": "您希望计算机做什么？",
    "dlg.shutdown.now": "现在可以安全地关闭计算机了。",
    "dlg.shutdown.title": "关闭 Windows",
    "error.data": "数据没能加载出来。",
    "error.dataHint": "刷新试试，或者直接去 GitHub。",
    "hint.gesture": "拖动 · 滚轮缩放 · 双击复位",
    "home.lede": "七个开源项目：Android 上的 Markdown 编辑器 Mdeditor、跑在 LLM 之上的确定性运行时 Intent OS、终端里的本地 Ollama 编程助手、只锁 MiniMax 一个模型的 Claude Code hook、OCR 的 MCP 服务、Windows 上的纯批处理 JDK 切换器，还有这个站本身。四篇文章写的是同一条线索：模型负责提议，代码负责裁决。",
    "home.title": "我做工具，也把难的地方写下来",
    "kbd.altF": "打开「文件」菜单",
    "kbd.enter": "打开选中的桌面图标",
    "kbd.esc": "关闭菜单或对话框",
    "map.other": "其他",
    "map.projects": "作品",
    "map.writing": "文字",
    "menu.edit": "编辑(E)",
    "menu.edit.copyAddr": "复制地址",
    "menu.edit.copyText": "复制页面文字",
    "menu.edit.selectAll": "全选",
    "menu.fav": "收藏夹(A)",
    "menu.file": "文件(F)",
    "menu.file.close": "关闭",
    "menu.file.open": "打开…",
    "menu.file.print": "打印…",
    "menu.file.props": "页面属性…",
    "menu.help": "帮助(H)",
    "menu.help.about": "关于",
    "menu.help.shortcuts": "键盘快捷键",
    "menu.tools": "工具(T)",
    "menu.tools.about": "关于本站",
    "menu.tools.lang": "语言",
    "menu.tools.langEn": "英文",
    "menu.tools.langZh": "中文",
    "menu.tools.map": "站点图纸",
    "menu.view": "查看(V)",
    "menu.view.full": "全屏",
    "menu.view.reload": "刷新",
    "menu.view.toolbar": "工具栏",
    "menu.view.zoomIn": "放大",
    "menu.view.zoomOut": "缩小",
    "menu.view.zoomReset": "实际大小",
    "meta.desc.home": "钟闪闪的开源项目与文章：Android 上的 Markdown 编辑器 Mdeditor、LLM 之上的确定性运行时 Intent OS、本地 Ollama 编程助手、只锁 MiniMax 的 Claude Code hook、OCR 的 MCP 服务、Windows 上的 JDK 切换器，以及四篇文章。",
    "nf.back": "回到首页",
    "nf.body": "这个地址不存在。回到首页，那里有七个项目和几篇没写完的字。",
    "nf.title": "这一页是空的",
    "post.related": "继续读",
    "quick.desktop": "显示桌面",
    "quick.ie": "在新标签页打开站点首页",
    "quick.map": "站点图纸",
    "win.address": "地址",
    "win.back": "后退",
    "win.close": "关闭",
    "win.content": "内容",
    "win.done": "完成",
    "win.fwd": "前进",
    "win.go": "转到",
    "win.home": "主页",
    "win.max": "最大化",
    "win.min": "最小化",
    "win.reload": "刷新",
  },
};
/* FALLBACK:END */

export function resolveLang() {
  const fromQuery = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(fromQuery)) return fromQuery;

  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch (err) {
    /* storage may be unavailable */
  }

  const nav = (navigator.language || "zh").toLowerCase();
  return nav.startsWith("zh") ? "zh" : "en";
}

export function createI18n({ lang }) {
  const source = FALLBACK;
  let current = LANGS.includes(lang) ? lang : "zh";
  const listeners = new Set();

  function t(key) {
    const bucket = source[current] || {};
    if (bucket[key] != null) return bucket[key];
    if (source.zh && source.zh[key] != null) return source.zh[key];
    return key;
  }

  function apply(root = document) {
    const html = document.documentElement;
    html.lang = current === "zh" ? "zh-CN" : "en";

    // 双语文本在构建期就写进了 HTML，这里只切 html[lang]，由 CSS 决定显示哪一份。
    // 标题与描述也跟着换：搜索结果与社交卡片取的就是它们。
    const title = current === "zh" ? html.dataset.titleZh : html.dataset.titleEn;
    if (title) document.title = title;
    const desc = current === "zh" ? html.dataset.descZh : html.dataset.descEn;
    if (desc) {
      const meta = root.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", desc);
    }

    root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });

    // 提示框里的字（标题栏按钮、地址栏）没法在构建期写成双语，运行时换。
    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.langBtn === current));
    });
  }

  function setLang(next) {
    if (!LANGS.includes(next) || next === current) return;
    current = next;
    try {
      localStorage.setItem(STORE_KEY, next);
    } catch (err) {
      /* ignore */
    }
    apply();
    listeners.forEach((fn) => fn(current));
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  apply();

  return {
    t,
    apply,
    setLang,
    onChange,
    get lang() {
      return current;
    }
  };
}
