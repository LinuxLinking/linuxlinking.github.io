import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { buildNodes, postHref } from "./nodes.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const projects = read("data/projects.json").projects;
const posts = read("data/posts.json").posts;

// 节点数跟着数据走：加一篇文章不该让这里红着
const projectIds = projects.filter((p) => p.kind === "project").map((p) => p.id);
const blogIds = projects.filter((p) => p.kind === "blog").map((p) => p.id);
const moonIds = projects.filter((p) => p.kind === "moon").map((p) => p.id);

test("每个项目、每篇文章各占一个节点", () => {
  const nodes = buildNodes({ projects, posts });
  assert.equal(nodes.length, projectIds.length + blogIds.length + posts.length + moonIds.length);
});

test("顺序为 项目 → blog 聚合 → 文章 → moon，前三是精选的三个项目", () => {
  const ids = buildNodes({ projects, posts }).map((n) => n.id);
  assert.deepEqual(ids.slice(0, 3), ["mdeditor", "intent-os", "ollama-harness"]);
  assert.deepEqual(ids.slice(projectIds.length, projectIds.length + blogIds.length), blogIds);
  assert.deepEqual(
    ids.slice(projectIds.length + blogIds.length, projectIds.length + blogIds.length + posts.length),
    posts.map((p) => p.slug)
  );
  assert.deepEqual(ids.slice(-moonIds.length), moonIds);
});

test("文章节点继承关联项目的 accent", () => {
  const nodes = buildNodes({ projects, posts });
  const post = nodes.find((n) => n.id === "harness-guard-design");
  const project = nodes.find((n) => n.id === "ollama-harness");
  assert.deepEqual(post.accent, project.accent);
});

test("文章节点用 posts.json 的 label 与 monogram", () => {
  const nodes = buildNodes({ projects, posts });
  const post = nodes.find((n) => n.id === "harness-guard-design");
  // 字形分中英两套：图纸按当前语言取
  assert.equal(post.monogram.zh, "守");
  assert.equal(post.monogram.en, "G");
  assert.equal(post.label.zh, "守卫设计");
});

test("没有 projectId 的文章用中性色", () => {
  const nodes = buildNodes({ projects, posts: [{ ...posts[0], projectId: "" }] });
  const post = nodes.find((n) => n.id === posts[0].slug);
  assert.deepEqual(post.accent, ["#7c5cff", "#3ad0ff"]);
});

test("项目节点 href 指向自己的静态页", () => {
  const nodes = buildNodes({ projects, posts });
  assert.equal(nodes.find((n) => n.id === "intent-os").href, "projects/intent-os/");
});

test("文章节点 href 指向博客下的文章页", () => {
  const nodes = buildNodes({ projects, posts });
  assert.equal(nodes.find((n) => n.id === "harness-guard-design").href, "blog/harness-guard-design/");
});

test("postHref 补上 blog 前缀", () => {
  assert.equal(postHref(posts[0]), "blog/harness-guard-design/");
  assert.equal(postHref({ slug: "x" }), "blog/x/");
});
