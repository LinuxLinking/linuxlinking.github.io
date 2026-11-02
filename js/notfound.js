import { createI18n, loadStrings, resolveLang } from "./i18n.js?v=b69bb391";
import { startStarfield } from "./starfield.js?v=d6c07621";

// 404 页可能出现在任意路径下（GitHub Pages 会把 404.html 送到缺失的地址），
// 所以这里一律用站点根的绝对路径，不能用相对路径。
const i18n = createI18n({
  strings: await loadStrings("/data/i18n.json"),
  lang: resolveLang(),
});

startStarfield(document.getElementById("stars"));

document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.langBtn !== i18n.lang) i18n.setLang(btn.dataset.langBtn);
  });
});
