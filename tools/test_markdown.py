#!/usr/bin/env python3
"""markdown.py 的单元测试。

    python -m unittest discover -s tools -p "test_*.py"
"""

import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

import markdown  # noqa: E402


class FrontMatterTests(unittest.TestCase):
    def test_splits_meta_and_body(self):
        meta, body = markdown.split_front_matter("---\ntitle: T\ndate: 2026\n---\n\n正文\n")
        self.assertEqual(meta["title"], "T")
        self.assertEqual(meta["date"], "2026")
        self.assertEqual(body.strip(), "正文")

    def test_no_front_matter_returns_whole_text(self):
        meta, body = markdown.split_front_matter("正文\n")
        self.assertEqual(meta, {})
        self.assertEqual(body, "正文\n")


class RenderTests(unittest.TestCase):
    def test_headings(self):
        self.assertEqual(markdown.render("## 标题\n"), "<h2>标题</h2>")
        self.assertEqual(markdown.render("### 小标题\n"), "<h3>小标题</h3>")

    def test_paragraph(self):
        self.assertEqual(markdown.render("一段话。\n"), "<p>一段话。</p>")

    def test_fenced_code_keeps_language_class(self):
        out = markdown.render("```json\n{\"a\": 1}\n```\n")
        self.assertIn('<code class="language-json">', out)
        self.assertIn("{&quot;a&quot;: 1}", out)

    def test_bold_italic_and_inline_code(self):
        out = markdown.render("**粗** 与 *斜* 与 `code`\n")
        self.assertIn("<strong>粗</strong>", out)
        self.assertIn("<em>斜</em>", out)
        self.assertIn("<code>code</code>", out)

    def test_inline_code_is_not_treated_as_emphasis(self):
        out = markdown.render("`a*b*c`\n")
        self.assertIn("<code>a*b*c</code>", out)
        self.assertNotIn("<em>", out)

    def test_link(self):
        out = markdown.render("看 [仓库](https://github.com/x)\n")
        self.assertIn('<a href="https://github.com/x">仓库</a>', out)

    def test_unordered_and_ordered_lists(self):
        self.assertEqual(markdown.render("- 一\n- 二\n"), "<ul><li>一</li><li>二</li></ul>")
        self.assertEqual(markdown.render("1. 一\n2. 二\n"), "<ol><li>一</li><li>二</li></ol>")

    def test_blockquote(self):
        self.assertEqual(markdown.render("> 引用\n"), "<blockquote><p>引用</p></blockquote>")

    def test_hr(self):
        self.assertEqual(markdown.render("---\n"), "<hr>")

    def test_html_is_escaped(self):
        self.assertIn("&lt;script&gt;", markdown.render("<script>alert(1)</script>\n"))

    def test_list_continuation_line_joins_item(self):
        out = markdown.render("- 第一行\n  接着说\n")
        self.assertIn("<li>第一行 接着说</li>", out)


if __name__ == "__main__":
    unittest.main()
