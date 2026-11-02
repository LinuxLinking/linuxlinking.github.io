/* 旧地址的跳转页：project.html?id=<slug> -> projects/<slug>/。
   项目详情改成构建期生成的静态页之后，老链接还得能用，映射表由构建期内联进页面。 */
const map = JSON.parse(document.getElementById("redirect-map").textContent);
const id = new URLSearchParams(location.search).get("id");
location.replace((id && map[id]) || "./");
