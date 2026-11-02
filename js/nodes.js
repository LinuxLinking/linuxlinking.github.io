/* 把 projects.json 与 posts.json 合成站点节点清单。

   纯函数：不碰 DOM、不 import 任何模块 —— node --test 才能直接加载它。
   顺序固定：项目(按 order) → blog 聚合 → 文章 → moon。
   星图核心节点是列表第一个，所以项目必须按 order 升序且 intent-os 在最前。 */

const NEUTRAL_ACCENT = ["#7c5cff", "#3ad0ff"];
const POST_SIZE = 0.85;

export function buildNodes({ projects = [], posts = [] } = {}) {
  const accents = new Map();
  for (const project of projects) {
    if (project.kind === "project" && project.accent) accents.set(project.id, project.accent);
  }

  const projectNodes = projects
    .filter((node) => node.kind === "project")
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const blogNodes = projects.filter((node) => node.kind === "blog");
  const moonNodes = projects.filter((node) => node.kind === "moon");

  const projectToNode = (node) => ({
    ...node,
    href: `project.html?id=${encodeURIComponent(node.id)}`
  });

  // posts.json 的 url 相对 /blog/，而节点链接是从首页发出的，所以要补前缀。
  const postToNode = (post) => ({
    id: post.slug,
    kind: "blog",
    size: POST_SIZE,
    monogram: post.monogram || "",
    accent: accents.get(post.projectId) || NEUTRAL_ACCENT,
    title: post.title || {},
    label: post.label || {},
    tagline: post.summary || {},
    href: `blog/${post.url || `${post.slug}/`}`
  });

  return [
    ...projectNodes.map(projectToNode),
    ...blogNodes.map((node) => ({ ...node, href: node.path || "blog/" })),
    ...posts.map(postToNode),
    ...moonNodes.map((node) => ({ ...node, href: node.path || "soul-for-u/" }))
  ];
}
