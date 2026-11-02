#!/usr/bin/env python3
"""build.py 数据校验规则的单元测试。

    python -m unittest discover -s tools -p "test_*.py"

只用标准库。build.py 里 validate() 失败时抛 SystemExit，
所以断言用 assertRaises(SystemExit)。
"""

import copy
import json
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


if __name__ == "__main__":
    unittest.main()
