#!/usr/bin/env python3
"""build.py 数据校验规则的单元测试。

    python -m unittest discover -s tools -p "test_*.py"

只用标准库。build.py 里 validate() 失败时抛 SystemExit，
所以断言用 assertRaises(SystemExit)。
"""

import copy
import json
import sys
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


if __name__ == "__main__":
    unittest.main()
