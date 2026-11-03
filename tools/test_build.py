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
        project = next(p for p in self.projects if p["id"] == "intent-os")
        self.assertIn("Intent OS", html)
        # 文案以 data/projects.json 为准，测试跟着数据走，不写死具体句子
        self.assertIn(project["tagline"]["zh"], html)
        self.assertIn(project["summary"]["en"], html)
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
        # 文案以 data/i18n.json 为准，测试跟着数据走，不写死具体句子
        strings = load("data/i18n.json")
        self.assertIn(
            f'<span class="i18n-zh" lang="zh-CN">{strings["zh"]["home.title"]}</span>', html
        )
        self.assertIn(
            f'<span class="i18n-en" lang="en">{strings["en"]["home.title"]}</span>', html
        )

    def test_post_body_is_rendered_into_html(self):
        html = self.written[ROOT / "blog" / "cage-for-a-model" / "index.html"]
        # 标题会被改，断言别写死：拿正文源文件渲染一遍，取第一个二级标题
        source = (ROOT / "blog" / "cage-for-a-model" / "post.md").read_text(encoding="utf-8")
        first_h2 = re.search(r"<h2>.*?</h2>", build.markdown.render(source))
        self.assertIsNotNone(first_h2)
        self.assertIn(first_h2.group(0), html)
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
        # 外壳（任务栏、开始菜单、窗口模板）每页都要有，少给一个就留下 {{...}} 在页面上。
        # 文章正文里可以出现 {{...}} 字面量 —— 讲构建系统的文章就会这么写 ——
        # 所以先把正文摘掉再扫，正文里漏替换的情况由另一条测试盯着。
        for path, html in self.written.items():
            shell = re.sub(
                r'<article class="post-body md" id="post-body">.*?</article>',
                "",
                html,
                flags=re.S,
            )
            leftovers = re.findall(r"\{\{[A-Za-z]+\}\}", shell)
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


class IeChromeTests(unittest.TestCase):
    """IE 窗口的外壳：文字跟语言走，标题栏按钮齐全。"""

    def setUp(self):
        self.written = dict(build.build_all(build.asset_hashes()))
        self.strings = load("data/i18n.json")

    def test_window_chrome_text_is_bilingual(self):
        html = self.written[ROOT / "index.html"]
        for key in ("menu.file", "menu.help", "win.go", "win.done"):
            self.assertIn(f'data-i18n="{key}"', html)
        for key in ("win.back", "win.home", "win.close", "win.min", "win.max"):
            self.assertIn(f'data-i18n-title="{key}"', html)

    def test_chrome_strings_exist_in_both_languages(self):
        for key in ("menu.file", "win.back", "win.min", "win.done"):
            self.assertIn(key, self.strings["zh"])
            self.assertIn(key, self.strings["en"])

    def test_menu_bar_is_built_with_both_languages(self):
        html = self.written[ROOT / "index.html"]
        self.assertIn('data-i18n="menu.file"><span class="i18n-zh"', html)
        self.assertIn(self.strings["en"]["menu.file"], html)

    def test_window_title_bar_has_all_three_buttons(self):
        html = self.written[ROOT / "index.html"]
        for act in ("min", "max", "close"):
            self.assertIn(f'data-act="{act}"', html)

    def test_home_button_never_loads_the_desktop_inside_the_window(self):
        source = (ROOT / "js" / "xp.js").read_text(encoding="utf-8")
        self.assertNotIn("frame.src = home", source)
        # 站点首页就是桌面：窗口里加载首页会套出一层子桌面。
        # 三条路都得拦住 —— 地址栏 goto、窗口里的「回到首页」链接、iframe 直接 load 到首页。
        self.assertIn("if (isHomeUrl(target))", source)
        self.assertIn("isHomeUrl(link.getAttribute(\"href\"), doc.baseURI)", source)
        self.assertIn("isHomeUrl(frame.contentWindow.location.href)", source)

    def test_a_page_that_scrolls_itself_keeps_the_single_scrollbar(self):
        # soul-for-u 用 100vh，窗口再撑高就会多出一条滚动条
        source = (ROOT / "js" / "xp.js").read_text(encoding="utf-8")
        self.assertIn('frame.style.height = "100%"', source)

    def test_menu_bar_items_open_dropdowns_with_real_commands(self):
        html = self.written[ROOT / "index.html"]
        for cmd in ("open", "print", "props", "close", "selectAll", "zoomIn", "about"):
            self.assertIn(f'data-cmd="{cmd}"', html)

    def test_every_menu_command_has_a_handler(self):
        # 菜单里出现的命令，js 里都得有对应分支，不然点了等于没点
        html = self.written[ROOT / "index.html"]
        source = (ROOT / "js" / "xp.js").read_text(encoding="utf-8")
        for cmd in sorted(set(re.findall(r'data-cmd="([a-zA-Z-]+)"', html))):
            self.assertIn(f'case "{cmd}"', source)

    def test_favorites_menu_lists_every_project(self):
        html = self.written[ROOT / "index.html"]
        for project in load("data/projects.json")["projects"]:
            if project.get("kind") != "project":
                continue
            self.assertIn(f'data-cmd="fav" data-url="projects/{project["id"]}/"', html)

    def test_address_bar_takes_input(self):
        html = self.written[ROOT / "index.html"]
        self.assertNotIn('<input type="text" readonly', html)

    def test_dialog_shells_are_on_every_page(self):
        for path, html in self.written.items():
            for shell in ('id="xpModal"', 'id="xpShutdown"', 'id="xpLogon"'):
                self.assertIn(shell, html, path)

    def test_pages_carry_the_site_root(self):
        # 开始菜单里的地址相对站点根写：页面在 /blog/ 下也要能找到 /projects/...
        self.assertIn('data-root="../"', self.written[ROOT / "blog" / "index.html"])
        self.assertIn('data-root="../../"', self.written[ROOT / "projects" / "mdeditor" / "index.html"])

    def test_logoff_and_shutdown_ask_instead_of_only_toasting(self):
        html = self.written[ROOT / "index.html"]
        self.assertIn('data-sm="logoff"', html)
        self.assertIn('data-sm="shutdown"', html)
        self.assertNotIn("data-toast=", html)

    def test_the_wallpaper_is_a_real_image(self):
        wallpaper = ROOT / "assets" / "wallpaper.jpg"
        self.assertTrue(wallpaper.exists())
        self.assertGreater(wallpaper.stat().st_size, 10000)
        css = (ROOT / "css" / "xp.css").read_text(encoding="utf-8")
        self.assertIn('url("../assets/wallpaper.jpg")', css)


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

    def test_a_placeholder_in_the_body_is_not_substituted(self):
        """正文里写 {{iconGrid}} 这种字面量，不能被换成真的图标网格。"""
        (self.dir / "post.md").write_text(
            "---\ntitle: 中\n---\n\n模板里写 {{iconGrid}} 这种占位符。\n",
            encoding="utf-8",
        )
        body, _, _ = build.post_body_html({"slug": self.slug})
        page = build.render("<article>{{postBody}}</article>", {"postBody": body})
        self.assertIn("{{iconGrid}}", page)
        self.assertNotIn("xp-icons", page)


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


class CopyConsistencyTests(unittest.TestCase):
    """文案不能漂：双语都要有，描述别太长，标题三处一致。"""

    def setUp(self):
        self.projects = load("data/projects.json")["projects"]
        self.posts = load("data/posts.json")["posts"]
        self.strings = load("data/i18n.json")

    def test_project_copy_exists_in_both_languages(self):
        for project in self.projects:
            pid = project["id"]
            for field in ("tagline", "summary"):
                for lang in ("zh", "en"):
                    self.assertTrue(
                        (project.get(field) or {}).get(lang),
                        f"{pid} 缺少 {field}.{lang}",
                    )
            zh = (project.get("highlights") or {}).get("zh") or []
            en = (project.get("highlights") or {}).get("en") or []
            self.assertEqual(len(zh), len(en), f"{pid} 的中英亮点条数不一致")

    def test_search_descriptions_stay_inside_one_snippet(self):
        for project in self.projects:
            desc = project.get("desc") or {}
            if not desc:
                continue
            self.assertLessEqual(len(desc["en"]), 200, f"{project['id']} 英文描述太长")
            self.assertLessEqual(len(desc["zh"]), 160, f"{project['id']} 中文描述太长")
        self.assertLessEqual(len(self.strings["en"]["meta.desc.home"]), 200)
        self.assertLessEqual(len(self.strings["zh"]["meta.desc.home"]), 160)

    def test_post_title_is_the_same_in_the_index_and_the_front_matter(self):
        for post in self.posts:
            for name in ("post.md", "post.en.md"):
                meta, _ = build.markdown.split_front_matter(
                    (ROOT / "blog" / post["slug"] / name).read_text(encoding="utf-8")
                )
                self.assertEqual(
                    meta.get("title"),
                    post["title"]["zh" if name == "post.md" else "en"],
                    f"{post['slug']} 的 {name} 标题和 posts.json 不一致",
                )

    def test_map_node_glyphs_follow_the_language(self):
        blog = next(p for p in self.projects if p["id"] == "blog")
        # 图纸节点的标签和字形都要跟着语言走：中文界面里不该写着 Writing
        self.assertEqual(blog["label"]["zh"], "文字")
        self.assertEqual(blog["monogram"]["zh"], "文")
        self.assertEqual(blog["monogram"]["en"], "W")
        for post in self.posts:
            monogram = post.get("monogram") or {}
            self.assertTrue(monogram.get("zh"), f"{post['slug']} 缺中文字形")
            self.assertTrue(monogram.get("en"), f"{post['slug']} 缺英文字形")
        source = (ROOT / "js" / "xp.js").read_text(encoding="utf-8")
        self.assertIn("monogram: node.monogram?.[lang]", source)

    def test_map_section_labels_refresh_with_the_language(self):
        xp = (ROOT / "js" / "xp.js").read_text(encoding="utf-8")
        self.assertIn("mapView.setLabels", xp)
        source = (ROOT / "js" / "map.js").read_text(encoding="utf-8")
        self.assertIn("setLabels", source)
        self.assertIn("label.dataset.key = row.key", source)

    def test_the_essay_count_in_the_copy_matches_the_number_of_posts(self):
        """文章加减了，文案里写死的篇数要跟着改。"""
        words = {
            4: ("四", "four"),
            5: ("五", "five"),
            6: ("六", "six"),
            7: ("七", "seven"),
            8: ("八", "eight"),
        }
        count = len(self.posts)
        self.assertIn(count, words, "文章数变了，先在 words 里补一个数词")
        zh, en = words[count]

        blog = next(p for p in self.projects if p["id"] == "blog")
        for text in (
            self.strings["zh"]["home.lede"],
            self.strings["zh"]["meta.desc.home"],
            blog["tagline"]["zh"],
        ):
            self.assertIn(f"{zh}篇", text, "中文文案里的篇数跟文章数对不上")
        for text in (
            self.strings["en"]["home.lede"],
            self.strings["en"]["meta.desc.home"],
            blog["tagline"]["en"],
        ):
            self.assertIn(f"{en} essays", text.lower(), "英文文案里的篇数跟文章数对不上")

        # 博客列表页的描述和首页页面片段里各写死了一遍
        source = (ROOT / "tools" / "build.py").read_text(encoding="utf-8")
        self.assertIn(f"{zh}篇", source)
        self.assertIn(f"{en} essays", source.lower())
        page = (ROOT / "pages" / "index.html").read_text(encoding="utf-8")
        self.assertIn(f"{zh}篇", page)


if __name__ == "__main__":
    unittest.main()
