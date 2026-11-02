import { bootPage } from "./shared.js?v=391cfcd3";

// 404 页可能出现在任意路径下（GitHub Pages 会把 404.html 送到缺失的地址），
// 所以这里一律用站点根的绝对路径，不能用相对路径。
await bootPage({ stringsPath: "/data/i18n.json" });
