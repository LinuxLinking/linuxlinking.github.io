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

test("合并后共 13 个节点", () => {
  assert.equal(buildNodes({ projects, posts }).length, 13);
});

test("顺序为 项目 → blog 聚合 → 文章 → moon，前三是精选的三个项目", () => {
  const ids = buildNodes({ projects, posts }).map((n) => n.id);
  assert.equal(ids[0], "mdeditor");
  assert.equal(ids[1], "intent-os");
  assert.equal(ids[2], "ollama-harness");
  assert.equal(ids[7], "blog");
  assert.equal(ids[12], "soul-for-u");
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
  assert.equal(post.monogram, "守");
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
