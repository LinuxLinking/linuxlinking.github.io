import { bootPage } from "./shared.js?v=7e36f8b7";

/* 全站共用的启动：语言按钮，以及标题/描述随语言切换。

   每个页面都加载它 —— 文章、博客列表、项目详情都是构建期渲染好的静态页面，
   不需要任何数据请求，但语言切换仍然需要这一小段脚本。 */
export const i18n = bootPage();
