#!/usr/bin/env python3
"""build.py 数据校验规则的单元测试。

    python -m unittest discover -s tools -p "test_*.py"

只用标准库。build.py 里 validate() 失败时抛 SystemExit，
所以断言用 assertRaises(SystemExit)。
"""

import copy
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import build  # noqa: E402


def load(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8"))


class ValidateTests(unittest.TestCase):
    def setUp(self):
        self.projects = load("data/projects.json")["projects"]
        self.posts = load("data/posts.json")["posts"]
        self.now = load("data/now.json")

    def test_repo_data_passes(self):
        build.validate(self.projects, self.posts, self.now)

    def test_now_item_with_bad_href_is_rejected(self):
        now = copy.deepcopy(self.now)
        now["now"]["zh"]["items"][0]["href"] = "no-such-page.html"
        with self.assertRaises(SystemExit):
            build.validate(self.projects, self.posts, now)

    def test_now_without_items_is_rejected(self):
        now = copy.deepcopy(self.now)
        now["now"]["zh"]["items"] = []
        with self.assertRaises(SystemExit):
            build.validate(self.projects, self.posts, now)

    def test_unknown_project_id_is_rejected(self):
        posts = copy.deepcopy(self.posts)
        posts[0]["projectId"] = "no-such-project"
        with self.assertRaises(SystemExit):
            build.validate(self.projects, posts, self.now)

    def test_post_without_label_is_rejected(self):
        posts = copy.deepcopy(self.posts)
        posts[0].pop("label", None)
        with self.assertRaises(SystemExit):
            build.validate(self.projects, posts, self.now)

    def test_post_without_monogram_is_rejected(self):
        posts = copy.deepcopy(self.posts)
        posts[0].pop("monogram", None)
        with self.assertRaises(SystemExit):
            build.validate(self.projects, posts, self.now)


class FingerprintTests(unittest.TestCase):
    """缓存指纹必须沿依赖链向上传播，否则改了模块老访客还拿不到新版本。"""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory(dir=ROOT)
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.dep = self.dir / "dep.js"
        self.dep.write_text("export const a = 1;\n", encoding="utf-8")
        self.mid = self.dir / "mid.js"
        self.mid.write_text('import { a } from "./dep.js?v=deadbeef";\n', encoding="utf-8")

    def test_dependency_change_changes_importer_hash(self):
        before = build.content_hash(self.mid)
        self.dep.write_text("export const a = 2;\n", encoding="utf-8")
        self.assertNotEqual(before, build.content_hash(self.mid))

    def test_stale_fingerprint_in_file_does_not_change_hash(self):
        # 文件里写着的旧指纹要被替换成依赖的真实哈希，所以结果与它无关
        first = build.content_hash(self.mid)
        self.mid.write_text('import { a } from "./dep.js?v=11111111";\n', encoding="utf-8")
        self.assertEqual(first, build.content_hash(self.mid))

    def test_hash_is_stable_when_nothing_changes(self):
        self.assertEqual(build.content_hash(self.mid), build.content_hash(self.mid))

class ProjectPageTests(unittest.TestCase):
    """阶段 2：每个项目一个静态页，旧地址改成跳转。"""

    def setUp(self):
        self.projects = load("data/projects.json")["projects"]
        self.posts = load("data/posts.json")["posts"]
        self.now = load("data/now.json")
        self.written = dict(build.build_all(build.asset_hashes()))

    def project_pages(self):
        return [p for p in self.projects if p.get("kind") == "project"]

    def test_every_project_gets_a_static_page(self):
        for project in self.project_pages():
            path = ROOT / "projects" / project["id"] / "index.html"
            self.assertIn(path, self.written, f"{project['id']} 没有生成静态页")

    def test_static_page_carries_title_and_summary_without_js(self):
        html = self.written[ROOT / "projects" / "intent-os" / "index.html"]
        self.assertIn("Intent OS", html)
        self.assertIn("把意图编译成可验证、可回滚的执行链", html)
        # 整页内容都在 HTML 里：技术栈、要点、按钮，不再依赖运行时取数据
        self.assertIn("LangGraph", html)
        self.assertIn("在 GitHub 查看", html)
        self.assertNotIn('id="project-data"', html)

    def test_static_page_uses_two_level_relative_prefixes(self):
        html = self.written[ROOT / "projects" / "intent-os" / "index.html"]
        self.assertIn('href="../../css/base.css', html)
        self.assertIn('href="../../blog/"', html)
        self.assertIn('src="../../js/site.js', html)

    def test_old_address_redirects_to_the_new_one(self):
        html = self.written[ROOT / "project.html"]
        self.assertIn('"intent-os": "projects/intent-os/"', html)
        self.assertIn('"blog": "blog/"', html)
        self.assertIn('"soul-for-u": "soul-for-u/"', html)

    def test_project_id_that_cannot_be_a_directory_is_rejected(self):
        projects = copy.deepcopy(self.projects)
        projects[0]["id"] = "Intent OS"
        with self.assertRaises(SystemExit):
            build.validate(projects, self.posts, self.now)

    def test_now_href_to_a_project_page_is_accepted(self):
        now = copy.deepcopy(self.now)
        now["now"]["zh"]["items"][0]["href"] = "projects/intent-os/"
        build.validate(self.projects, self.posts, now)

    def test_now_href_to_an_unknown_project_page_is_rejected(self):
        now = copy.deepcopy(self.now)
        now["now"]["zh"]["items"][0]["href"] = "projects/no-such-project/"
        with self.assertRaises(SystemExit):
            build.validate(self.projects, self.posts, now)


class StaticContentTests(unittest.TestCase):
    """首页、博客列表、文章正文都在构建期渲染：不靠 JS 也读得到。"""

    def setUp(self):
        self.written = dict(build.build_all(build.asset_hashes()))
        self.extra = dict(build.build_extra())

    def test_home_lists_every_project_without_js(self):
        html = self.written[ROOT / "index.html"]
        for project in load("data/projects.json")["projects"]:
            if project.get("kind") != "project":
                continue
            self.assertIn(f'href="projects/{project["id"]}/"', html)
            self.assertIn(project["tagline"]["zh"], html)

    def test_home_carries_both_languages(self):
        html = self.written[ROOT / "index.html"]
        self.assertIn('<span class="i18n-zh" lang="zh-CN">写工具，也写字</span>', html)
        self.assertIn('<span class="i18n-en" lang="en">I build tools, and I write</span>', html)

    def test_post_body_is_rendered_into_html(self):
        html = self.written[ROOT / "blog" / "cage-for-a-model" / "index.html"]
        self.assertIn("<h2>问题：笼子为什么只锁一个模型</h2>", html)
        self.assertIn('<pre><code class="language-mermaid">', html)
        self.assertNotIn("<p id=\"post-body\"></p>", html)

    def test_post_page_links_back_to_its_project(self):
        html = self.written[ROOT / "blog" / "cage-for-a-model" / "index.html"]
        self.assertIn('href="../../projects/lockdown/"', html)

    def test_blog_list_is_static(self):
        html = self.written[ROOT / "blog" / "index.html"]
        for post in load("data/posts.json")["posts"]:
            self.assertIn(f'href="{post["url"]}"', html)

    def test_no_placeholder_survives_the_build(self):
        # 外壳（任务栏、开始菜单、窗口模板）每页都要有，少给一个就留下 {{...}} 在页面上
        for path, html in self.written.items():
            leftovers = re.findall(r"\{\{[A-Za-z]+\}\}", html)
            self.assertEqual([], leftovers, f"{path} 还有没替换的占位符")

    def test_every_page_has_a_canonical_url(self):
        for path, html in self.written.items():
            rel = path.relative_to(ROOT).as_posix()
            self.assertIn('<link rel="canonical" href="https://linuxlinking.github.io/', html, rel)

    def test_project_page_has_structured_data(self):
        html = self.written[ROOT / "projects" / "ollama-harness" / "index.html"]
        self.assertIn('"@type": "SoftwareApplication"', html)
        self.assertIn("https://github.com/LinuxLinking/local_ollama_harness", html)

    def test_post_page_has_article_structured_data(self):
        html = self.written[ROOT / "blog" / "cage-for-a-model" / "index.html"]
        self.assertIn('"@type": "BlogPosting"', html)

    def test_sitemap_lists_projects_and_posts(self):
        xml = self.extra[ROOT / "sitemap.xml"]
        for project in load("data/projects.json")["projects"]:
            if project.get("kind") != "project":
                continue
            self.assertIn(f"https://linuxlinking.github.io/projects/{project['id']}/", xml)
        for post in load("data/posts.json")["posts"]:
            self.assertIn(f"https://linuxlinking.github.io/blog/{post['url']}", xml)
        # soul-for-u 是写给一个人的小房间，不进 sitemap
        self.assertNotIn("soul-for-u", xml)

    def test_robots_points_at_the_sitemap(self):
        robots = self.extra[ROOT / "robots.txt"]
        self.assertIn("Sitemap: https://linuxlinking.github.io/sitemap.xml", robots)

    def test_robots_does_not_block_the_legacy_project_url(self):
        # 旧地址是线上真实存在的 URL，爬虫得能进去才会跟着跳
        robots = self.extra[ROOT / "robots.txt"]
        self.assertNotIn("Disallow: /project.html", robots)

    def test_legacy_project_page_lists_every_project_without_js(self):
        html = self.written[ROOT / "project.html"]
        for project in load("data/projects.json")["projects"]:
            if project.get("kind") != "project":
                continue
            self.assertIn(f'href="projects/{project["id"]}/"', html)
        self.assertIn('name="robots" content="noindex,follow"', html)

    def test_og_image_is_a_real_png(self):
        data = (ROOT / "assets" / "og.png").read_bytes()
        self.assertTrue(data.startswith(b"\x89PNG\r\n\x1a\n"))
        width = int.from_bytes(data[16:20], "big")
        height = int.from_bytes(data[20:24], "big")
        self.assertEqual((width, height), (1200, 630))


class XpDesktopTests(unittest.TestCase):
    """XP 桌面：图标是真链接，内容页装在 IE 窗口里。"""

    def setUp(self):
        self.written = dict(build.build_all(build.asset_hashes()))
        self.projects = load("data/projects.json")["projects"]
        self.posts = load("data/posts.json")["posts"]

    def test_every_project_has_a_desktop_shortcut(self):
        html = self.written[ROOT / "index.html"]
        for project in self.projects:
            if project.get("kind") != "project":
                continue
            self.assertIn(f'data-url="projects/{project["id"]}/"', html)

    def test_every_post_has_a_desktop_shortcut(self):
        html = self.written[ROOT / "index.html"]
        for post in self.posts:
            self.assertIn(f'data-url="blog/{post["url"]}"', html)

    def test_shortcuts_are_real_links_so_the_desktop_works_without_js(self):
        html = self.written[ROOT / "index.html"]
        self.assertIn('<a class="xp-icon" href="projects/mdeditor/"', html)
        self.assertIn('<a class="xp-icon" href="blog/cage-for-a-model/"', html)

    def test_home_ships_the_window_template_the_script_clones(self):
        html = self.written[ROOT / "index.html"]
        self.assertIn('<template id="xpWinTpl">', html)
        self.assertIn('data-slot="frame"', html)

    def test_content_pages_sit_inside_an_ie_window(self):
        for rel in ["projects/mdeditor/index.html", "blog/index.html", "404.html"]:
            html = self.written[ROOT / rel]
            self.assertIn('<div class="xp-window is-page"', html)
            self.assertIn('class="xp-menubar"', html)
            self.assertIn('data-slot="url"', html)

    def test_every_page_carries_the_xp_shell(self):
        for path, html in self.written.items():
            self.assertIn('class="xp-taskbar"', html, str(path))
            self.assertIn('id="xpStartMenu"', html, str(path))

    def test_start_menu_lists_every_project(self):
        html = self.written[ROOT / "index.html"]
        for project in self.projects:
            if project.get("kind") != "project":
                continue
            self.assertIn(f'data-url="projects/{project["id"]}/"', html)

    def test_hidden_index_still_carries_the_text_for_crawlers(self):
        html = self.written[ROOT / "index.html"]
        self.assertIn('<section class="sr-only">', html)
        for project in self.projects:
            if project.get("kind") != "project":
                continue
            self.assertIn(project["tagline"]["zh"], html)
            self.assertIn(project["summary"]["en"], html)


class BilingualPostTests(unittest.TestCase):
    """post.en.md 存在时，英文正文要一起进 HTML。"""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory(dir=ROOT / "blog")
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.slug = self.dir.name
        (self.dir / "post.md").write_text("---\ntitle: 中\n---\n\n中文段落。\n", encoding="utf-8")
        (self.dir / "post.en.md").write_text(
            "---\ntitle: EN\n---\n\nEnglish paragraph.\n", encoding="utf-8"
        )

    def test_english_body_is_rendered_next_to_the_chinese_one(self):
        body, _, _ = build.post_body_html({"slug": self.slug})
        self.assertIn('<div class="i18n-zh" lang="zh-CN">', body)
        self.assertIn("中文段落。", body)
        self.assertIn('<div class="i18n-en" lang="en">', body)
        self.assertIn("English paragraph.", body)

    def test_without_an_english_file_only_the_chinese_body_is_rendered(self):
        (self.dir / "post.en.md").unlink()
        body, _, _ = build.post_body_html({"slug": self.slug})
        self.assertNotIn('class="i18n-en"', body)
        self.assertIn("中文段落。", body)


class BilingualTests(unittest.TestCase):
    """双语展开：模板里的 data-i18n 元素换成中英两份。"""

    def test_data_i18n_element_becomes_two_languages(self):
        html = build.expand_i18n(
            '<p class="kicker" data-i18n="home.kicker">作品与文字</p>',
            {"zh": {"home.kicker": "作品与文字"}, "en": {"home.kicker": "Projects & Writing"}},
        )
        self.assertIn('<span class="i18n-zh" lang="zh-CN">作品与文字</span>', html)
        self.assertIn('<span class="i18n-en" lang="en">Projects &amp; Writing</span>', html)

    def test_unknown_key_is_left_alone(self):
        source = '<p data-i18n="no.such.key">原样</p>'
        self.assertEqual(build.expand_i18n(source, {"zh": {}, "en": {}}), source)


if __name__ == "__main__":
    unittest.main()
