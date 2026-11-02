"""Windows XP 风格的 16x16 像素图标。

每个图标是若干矩形拼出来的，写成 (x, y, w, h, color) 的列表。
构建期直接内联成 SVG（shape-rendering:crispEdges），所以没有 JS 也有图标，
而且放大到 48px 仍然是硬边像素。

颜色是 XP 时代那套：饱和的蓝、黄、绿、灰。
"""

from __future__ import annotations

# 常用色板
BLUE = "#2a5fb0"
BLUE_L = "#7fb3f5"
BLUE_D = "#103f7c"
YELLOW = "#f5c33c"
YELLOW_L = "#ffd964"
WHITE = "#ffffff"
GRAY = "#8a8675"
GRAY_L = "#d6d2c2"
GREEN = "#4a9e3f"
GREEN_L = "#7fd45c"
ORANGE = "#e8862a"
RED = "#d0452b"
INK = "#1a1a18"

# 一个"应用窗口"图标的外框，标题栏用项目自己的强调色
APP_FRAME = [
    (1, 2, 14, 12, "#f4f2e8"),
    (1, 2, 14, 12, None),
]


def app(accent: str, glyph: list) -> list:
    """应用窗口图标：蓝色标题栏换成项目色，中间放自己的小图形。"""
    return [
        (1, 2, 14, 12, GRAY_L),
        (2, 3, 12, 10, WHITE),
        (1, 2, 14, 3, accent),
        (2, 5, 12, 1, "#c9c5b4"),
    ] + glyph


ICONS: dict[str, list] = {
    # 浏览器：蓝 e + 金色轨道
    "ie": [
        (4, 4, 8, 8, "#2a7fd4"),
        (4, 7, 8, 2, WHITE),
        (9, 4, 3, 8, WHITE),
        (5, 10, 6, 2, "#2a7fd4"),
    ],
    # 文件夹
    "folder": [
        (1, 3, 7, 3, YELLOW),
        (1, 5, 14, 8, YELLOW),
        (1, 6, 14, 7, YELLOW_L),
    ],
    # 文档：白纸 + 折角 + 文字线
    "doc": [
        (3, 1, 10, 14, WHITE),
        (3, 1, 10, 1, GRAY),
        (3, 14, 10, 1, GRAY),
        (3, 1, 1, 14, GRAY),
        (12, 1, 1, 4, GRAY),
        (10, 1, 3, 1, GRAY),
        (10, 1, 1, 3, GRAY),
        (10, 4, 3, 1, "#c8d4e4"),
        (5, 6, 6, 1, "#7b8aa0"),
        (5, 8, 6, 1, "#7b8aa0"),
        (5, 10, 4, 1, "#7b8aa0"),
    ],
    # 显示器
    "monitor": [
        (1, 2, 14, 10, "#2f5a94"),
        (2, 3, 12, 8, BLUE_L),
        (2, 3, 12, 1, "#cfe4ff"),
        (6, 12, 4, 1, GRAY),
        (4, 13, 8, 2, GRAY_L),
    ],
    # 月亮（写给一个人的那个页面）
    "moon": [
        (3, 3, 9, 9, "#ffe9b0"),
        (7, 3, 7, 9, "#2a5fb0"),
        (12, 2, 2, 2, "#fff6d8"),
        (2, 11, 2, 2, "#fff6d8"),
    ],
    # 地球
    "globe": [
        (2, 2, 12, 12, "#2a7fd4"),
        (3, 3, 10, 10, BLUE_L),
        (5, 4, 3, 3, GREEN_L),
        (9, 8, 4, 4, GREEN_L),
        (6, 9, 2, 2, GREEN),
    ],
    # 我的电脑
    "computer": [
        (1, 1, 14, 10, GRAY_L),
        (2, 2, 12, 8, "#4a6fa5"),
        (3, 3, 10, 6, BLUE_L),
        (2, 11, 12, 3, GRAY_L),
        (3, 12, 8, 1, "#3a5f8a"),
    ],
    # 图纸：深蓝底 + 浅蓝网格
    "blueprint": [
        (1, 1, 14, 14, "#123a7a"),
        (1, 1, 14, 1, "#2f6bc0"),
        (1, 14, 14, 1, "#0d2a5c"),
        (1, 1, 1, 14, "#2f6bc0"),
        (14, 1, 1, 14, "#0d2a5c"),
        (4, 4, 8, 8, "#1c4f9e"),
        (4, 4, 8, 1, "#6fa8e8"),
        (4, 8, 8, 1, "#6fa8e8"),
        (8, 4, 1, 8, "#6fa8e8"),
        (4, 4, 1, 8, "#6fa8e8"),
    ],
    # 托盘里的小喇叭
    "speaker": [
        (2, 6, 2, 4, "#e8e6da"),
        (4, 4, 3, 8, GRAY_L),
        (7, 6, 2, 4, GRAY_L),
        (10, 5, 1, 6, WHITE),
        (12, 7, 2, 2, WHITE),
    ],
}

# 项目图标：窗口外框 + 自己的小图形
PROJECT_GLYPHS: dict[str, list] = {
    # MD：一张纸 + 一支笔
    "mdeditor": [
        (5, 6, 6, 8, WHITE),
        (5, 6, 6, 1, GRAY),
        (6, 8, 4, 1, "#9aa7b8"),
        (6, 10, 4, 1, "#9aa7b8"),
        (8, 6, 2, 7, ORANGE),
        (9, 5, 2, 2, "#f7c9a0"),
    ],
    # IO：三个节点连成一条链
    "intent-os": [
        (4, 11, 3, 3, "#ffffff"),
        (6, 6, 3, 3, "#ffffff"),
        (10, 9, 3, 3, "#ffffff"),
        (6, 8, 1, 3, "#ffffff"),
        (9, 10, 1, 2, "#ffffff"),
    ],
    # OH：终端窗口 + 提示符
    "ollama-harness": [
        (4, 6, 8, 7, "#20241c"),
        (5, 8, 2, 1, GREEN_L),
        (5, 10, 4, 1, GREEN_L),
        (9, 10, 1, 1, GREEN_L),
    ],
    # ML：笼子
    "lockdown": [
        (4, 6, 8, 8, "#5a2230"),
        (5, 7, 1, 6, "#c8c0b4"),
        (7, 7, 1, 6, "#c8c0b4"),
        (9, 7, 1, 6, "#c8c0b4"),
        (11, 7, 1, 6, "#c8c0b4"),
        (4, 6, 8, 1, "#c8c0b4"),
    ],
    # OC：取景框 + 一行字
    "ocr-mcp": [
        (4, 6, 8, 8, "#123a4a"),
        (4, 6, 3, 1, "#5fe0f5"),
        (4, 13, 3, 1, "#5fe0f5"),
        (9, 6, 3, 1, "#5fe0f5"),
        (9, 13, 3, 1, "#5fe0f5"),
        (4, 6, 1, 3, "#5fe0f5"),
        (11, 6, 1, 3, "#5fe0f5"),
        (6, 9, 4, 1, "#bff3fb"),
    ],
    # JV：JDK 盒子 + 切换箭头
    "jenv": [
        (4, 7, 8, 7, "#c98a2e"),
        (4, 7, 8, 1, "#f0b95c"),
        (7, 9, 2, 3, "#3a2a12"),
        (5, 10, 6, 1, "#3a2a12"),
    ],
    # 本站：地球
    "site": [
        (4, 6, 8, 8, "#2a7fd4"),
        (5, 7, 6, 6, BLUE_L),
        (6, 8, 2, 2, GREEN_L),
        (8, 11, 3, 2, GREEN_L),
    ],
}


def _r(x: int, y: int, w: int, h: int, fill: str) -> str:
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}"/>'


def svg(name: str, accent: str = BLUE, size: int = 48) -> str:
    """把图标画成 SVG 字符串。

    viewBox 固定 16x16，shape-rendering:crispEdges 让边缘保持硬像素。
    """
    if name in PROJECT_GLYPHS:
        shapes = app(accent, PROJECT_GLYPHS[name])
    elif name in ICONS:
        shapes = ICONS[name]
    else:
        shapes = ICONS["doc"]

    body = "".join(_r(x, y, w, h, f) for x, y, w, h, f in shapes if f)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="{size}" '
        f'height="{size}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">'
        f"{body}</svg>"
    )


def icon_url(name: str, accent: str = BLUE, size: int = 48) -> str:
    """给 <img src> 用的 data URI（任务栏、窗口标题栏用得上）。"""
    from urllib.parse import quote

    return "data:image/svg+xml," + quote(svg(name, accent, size))
