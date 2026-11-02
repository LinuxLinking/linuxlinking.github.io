"""极小的 Markdown 渲染器：只做本站文章实际用到的那些语法。

支持：标题、段落、无序/有序列表、围栏代码块、引用、分隔线、粗体、斜体、
行内代码、链接。

不支持：表格、图片、嵌套列表、任务列表、脚注、HTML 块。这些没用到，
真用上了会渲染成普通文本 —— 宁可看得见，也别静悄悄渲染错。

为什么不用浏览器那套 marked：marked 是 ES module，构建期要跑就得让 Python
构建依赖 Node。文章正文是作者手写的固定内容，一份够用的子集就够，还能
省掉 marked 那份 vendor 拷贝。
"""

from __future__ import annotations

import re

FRONT_MATTER_RE = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n?", re.S)
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
FENCE_RE = re.compile(r"^\x60\x60\x60(\w*)\s*$")
LIST_RE = re.compile(r"^([-*]|\d+\.)\s+(.*)$")
QUOTE_RE = re.compile(r"^>\s?(.*)$")
HR_RE = re.compile(r"^(-{3,}|\*{3,}|_{3,})$")

CODE_SPAN_RE = re.compile(r"`([^`]+)`")
LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
ITALIC_RE = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)")

CODE_TOKEN = "\x00%d\x00"


def escape(text: str) -> str:
    """转义 HTML 文本内容。"""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def split_front_matter(text: str) -> tuple[dict[str, str], str]:
    """拆出 front matter（--- 包裹的 key: value 块）与正文。"""
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return {}, text
    meta: dict[str, str] = {}
    for line in match.group(1).split("\n"):
        kv = re.match(r"^([A-Za-z][\w-]*)\s*:\s*(.*)$", line.strip())
        if kv:
            meta[kv.group(1)] = kv.group(2).strip()
    return meta, text[match.end():]


def inline(text: str) -> str:
    """行内语法：行内代码、链接、粗体、斜体。

    行内代码先摘出来占位，免得代码里的星号被当成强调标记。
    """
    codes: list[str] = []

    def stash(match: re.Match[str]) -> str:
        codes.append(match.group(1))
        return CODE_TOKEN % (len(codes) - 1)

    text = CODE_SPAN_RE.sub(stash, text)
    text = escape(text)
    text = LINK_RE.sub(r'<a href="\2">\1</a>', text)
    text = BOLD_RE.sub(r"<strong>\1</strong>", text)
    text = ITALIC_RE.sub(r"<em>\1</em>", text)
    return re.sub(
        r"\x00(\d+)\x00",
        lambda m: "<code>" + escape(codes[int(m.group(1))]) + "</code>",
        text,
    )


def _is_block_start(line: str) -> bool:
    return bool(
        HEADING_RE.match(line)
        or FENCE_RE.match(line)
        or LIST_RE.match(line)
        or QUOTE_RE.match(line)
        or HR_RE.match(line.strip())
    )


def render(markdown: str) -> str:
    """把 Markdown 渲染成 HTML。块级结构一行一个标签。"""
    lines = markdown.replace("\r\n", "\n").split("\n")
    out: list[str] = []
    i = 0

    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue

        fence = FENCE_RE.match(line)
        if fence:
            lang = fence.group(1)
            i += 1
            buf: list[str] = []
            while i < len(lines) and not lines[i].startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            cls = f' class="language-{lang}"' if lang else ""
            out.append(
                "<pre><code%s>%s</code></pre>" % (cls, escape("\n".join(buf)))
            )
            continue

        heading = HEADING_RE.match(line)
        if heading:
            level = len(heading.group(1))
            out.append("<h%d>%s</h%d>" % (level, inline(heading.group(2)), level))
            i += 1
            continue

        if HR_RE.match(line.strip()):
            out.append("<hr>")
            i += 1
            continue

        quote = QUOTE_RE.match(line)
        if quote:
            buf = []
            while i < len(lines):
                q = QUOTE_RE.match(lines[i])
                if not q:
                    break
                buf.append(q.group(1))
                i += 1
            out.append("<blockquote><p>%s</p></blockquote>" % inline(" ".join(buf)))
            continue

        item = LIST_RE.match(line)
        if item:
            ordered = bool(re.match(r"^\d+\.$", item.group(1)))
            items: list[str] = []
            while i < len(lines):
                lm = LIST_RE.match(lines[i])
                if lm:
                    if bool(re.match(r"^\d+\.$", lm.group(1))) != ordered:
                        break
                    items.append(lm.group(2))
                    i += 1
                    continue
                # 缩进的续行并进上一条
                if items and lines[i].strip() and lines[i][:1] in (" ", "\t"):
                    items[-1] += " " + lines[i].strip()
                    i += 1
                    continue
                break
            tag = "ol" if ordered else "ul"
            out.append(
                "<%s>%s</%s>"
                % (tag, "".join("<li>%s</li>" % inline(it) for it in items), tag)
            )
            continue

        buf = []
        while i < len(lines) and lines[i].strip() and not _is_block_start(lines[i]):
            buf.append(lines[i].strip())
            i += 1
        out.append("<p>%s</p>" % inline(" ".join(buf)))

    return "\n".join(out)
