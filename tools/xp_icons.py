"""Windows XP 风格的 16x16 像素图标。

每个图标是若干矩形拼出来的，写成 (x, y, w, h, color) 的列表。
构建期直接内联成 SVG（shape-rendering:crispEdges），所以没有 JS 也有图标，
而且放大到 48px 仍然是硬边像素。

颜色是 XP 时代那套：饱和的蓝、黄、绿、灰。
项目图标用各自的主题色当主色，整块 16x16 画满，不套窗口外框 ——
缩到 48px 时框里的小图案根本认不出来。
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


def diag(x: int, y: int, n: int, size: int, color: str, step: int = 1, dy: int = 1) -> list:
    """一串方块拼出的斜线（像素画里没有真正的斜线）。"""
    return [(x + i * step, y + i * dy, size, size, color) for i in range(n)]


ICONS: dict[str, list] = {
    # 浏览器：蓝色 e + 金色轨道
    "ie": [
        (5, 4, 6, 2, "#2a7fd4"),
        (4, 6, 2, 5, "#2a7fd4"),
        (6, 9, 6, 2, "#2a7fd4"),
        (10, 8, 2, 3, "#2a7fd4"),
        (6, 12, 6, 2, "#2a7fd4"),
        *diag(2, 7, 5, 1, YELLOW, 2, 1),
        (12, 12, 2, 1, YELLOW),
    ],
    # 文件夹
    "folder": [
        (1, 3, 7, 2, "#c9972f"),
        (1, 4, 14, 10, "#e8b53a"),
        (1, 5, 14, 9, YELLOW_L),
        (1, 4, 14, 1, "#c9972f"),
        (1, 13, 14, 1, "#a87d22"),
    ],
    # 文档：白纸 + 折角 + 文字线
    "doc": [
        (2, 1, 11, 14, "#b9b6ac"),
        (1, 0, 11, 14, WHITE),
        (1, 0, 11, 1, "#eceae2"),
        (9, 0, 3, 3, "#d8d5cb"),
        (5, 5, 6, 1, "#8a97a8"),
        (5, 7, 6, 1, "#8a97a8"),
        (5, 9, 4, 1, "#8a97a8"),
        (5, 11, 6, 1, "#8a97a8"),
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
    # 对话框用的三个：信息 / 警告 / 错误
    "info": [
        (1, 2, 14, 9, "#c9c6bc"),
        (1, 2, 14, 8, WHITE),
        (4, 10, 2, 2, WHITE),
        (6, 11, 2, 1, WHITE),
        (7, 4, 2, 2, "#2a7fd4"),
        (7, 7, 2, 3, "#2a7fd4"),
    ],
    "warn": [
        (7, 2, 2, 1, YELLOW),
        (6, 3, 4, 2, YELLOW),
        (5, 5, 6, 2, YELLOW),
        (4, 7, 8, 2, YELLOW),
        (3, 9, 10, 2, YELLOW),
        (2, 11, 12, 2, YELLOW),
        (7, 5, 2, 5, "#5a4a10"),
        (7, 11, 2, 2, "#5a4a10"),
    ],
    "error": [
        (5, 0, 6, 1, RED),
        (3, 1, 10, 1, RED),
        (2, 2, 12, 2, RED),
        (1, 4, 14, 8, RED),
        (2, 12, 12, 2, RED),
        (3, 14, 10, 1, RED),
        (5, 15, 6, 1, RED),
        *diag(5, 5, 6, 2, WHITE, 1, 1),
        *diag(9, 5, 6, 2, WHITE, -1, 1),
    ],
}


def project_icons(accent: str) -> dict[str, list]:
    """项目图标：整块 16x16，主色是项目自己的主题色。"""
    return {
        # MD：一张纸 + 一支斜着的铅笔
        "mdeditor": [
            (2, 1, 11, 14, "#b9b6ac"),
            (1, 0, 11, 14, WHITE),
            (1, 0, 11, 1, "#eceae2"),
            (9, 0, 3, 3, "#d8d5cb"),
            (3, 4, 7, 1, "#8a97a8"),
            (3, 6, 7, 1, "#8a97a8"),
            (3, 8, 5, 1, "#8a97a8"),
            *diag(9, 3, 5, 2, ORANGE, -1, 2),
            (5, 11, 2, 2, "#f7c9a0"),
            (4, 13, 2, 1, INK),
        ],
        # IO：三个节点连成的计划图
        "intent-os": [
            (6, 2, 5, 4, accent),
            (1, 10, 5, 4, accent),
            (10, 10, 5, 4, accent),
            (6, 5, 1, 3, "#4a4a46"),
            (3, 8, 1, 3, "#4a4a46"),
            (11, 8, 1, 3, "#4a4a46"),
            (8, 6, 3, 1, "#4a4a46"),
            (7, 3, 3, 2, "#ffffff"),
            (2, 11, 3, 2, "#ffffff"),
            (11, 11, 3, 2, "#ffffff"),
        ],
        # OH：终端窗口 + 提示符
        "ollama-harness": [
            (0, 2, 16, 11, "#4a4a44"),
            (1, 3, 14, 9, "#0d120d"),
            (1, 3, 14, 2, "#39423a"),
            (3, 6, 2, 2, GREEN_L),
            (6, 9, 5, 1, GREEN_L),
            (3, 11, 7, 1, "#55685a"),
        ],
        # ML：挂锁
        "lockdown": [
            (5, 1, 6, 1, "#c3beae"),
            (4, 2, 1, 3, "#c3beae"),
            (11, 2, 1, 3, "#c3beae"),
            (2, 5, 12, 9, RED),
            (2, 5, 12, 1, "#e8705a"),
            (7, 8, 2, 2, "#5c1a10"),
            (7, 10, 2, 3, "#5c1a10"),
        ],
        # OC：取景框框住一行字
        "ocr-mcp": [
            (4, 1, 8, 14, WHITE),
            (4, 1, 8, 1, "#e4f6fb"),
            (2, 3, 1, 4, "#38d3f5"),
            (2, 3, 4, 1, "#38d3f5"),
            (13, 3, 1, 4, "#38d3f5"),
            (9, 3, 4, 1, "#38d3f5"),
            (2, 10, 1, 4, "#38d3f5"),
            (2, 13, 4, 1, "#38d3f5"),
            (13, 10, 1, 4, "#38d3f5"),
            (9, 13, 4, 1, "#38d3f5"),
            (6, 5, 4, 1, "#2f6d7a"),
            (6, 7, 4, 1, "#2f6d7a"),
            (6, 9, 3, 1, "#2f6d7a"),
        ],
        # JV：咖啡杯（Java）+ 一圈切换箭头
        "jenv": [
            (3, 5, 9, 8, "#efe9db"),
            (3, 5, 9, 1, "#b9b0a0"),
            (4, 6, 7, 1, "#6b4423"),
            (12, 6, 2, 1, "#b9b0a0"),
            (13, 7, 1, 3, "#b9b0a0"),
            (12, 10, 2, 1, "#b9b0a0"),
            (2, 13, 11, 1, "#cfc8b6"),
            (5, 2, 1, 2, "#cdd6de"),
            (8, 1, 1, 3, "#cdd6de"),
            (11, 2, 1, 2, "#cdd6de"),
            (12, 14, 3, 1, accent),
            (11, 13, 1, 2, accent),
        ],
        # 本站：浏览器窗口里的地球
        "site": [
            (0, 2, 16, 12, "#2f5a94"),
            (0, 2, 16, 3, "#2a7fd4"),
            (1, 5, 14, 9, "#cfe4ff"),
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
    shapes = project_icons(accent).get(name) or ICONS.get(name) or ICONS["doc"]

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
