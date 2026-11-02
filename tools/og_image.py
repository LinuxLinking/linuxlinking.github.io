#!/usr/bin/env python3
"""生成社交卡片 assets/og.png（1200×630）。

社交平台不认 SVG，Open Graph 必须是 PNG/JPG。这里不引任何图像库：
自己写 PNG（zlib + struct，标准库够用），画一张跟站点同一套视觉的
Windows XP 桌面 —— 蓝色壁纸上一个 IE 窗口，底下压着任务栏。

    python tools/og_image.py
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "og.png"

WIDTH, HEIGHT = 1200, 630

# 桌面：Bliss 的蓝天
DESKTOP_TOP = (0x6A, 0xA8, 0xE0)
DESKTOP_BOTTOM = (0x2E, 0x6C, 0xB0)

# 窗口：XP 标题栏渐变 + 米色立体面 + 白纸
TITLE_TOP = (0x1B, 0x5E, 0xC8)
TITLE_BOTTOM = (0x08, 0x2E, 0x74)
TASKBAR_TOP = (0x2A, 0x6F, 0xD0)
TASKBAR_BOTTOM = (0x14, 0x4A, 0xA0)
FACE = (0xEC, 0xEC, 0xEC)
PAPER = (0xFF, 0xFF, 0xFF)
BORDER = (0x7F, 0x9D, 0xB9)

# 内容
INK = (0x1A, 0x1A, 0x1A)
DIM = (0x9A, 0x9A, 0x9A)
LINK = (0x00, 0x00, 0xEE)
START = (0x3E, 0x9A, 0x3E)
CLOSE = (0xC7, 0x39, 0x2F)
ACCENTS = [(0x6F, 0x7B, 0xFF), (0xB0, 0x6B, 0xFF), (0x2F, 0x9E, 0x8F)]


def blank_canvas() -> list[bytearray]:
    return [bytearray(bytes(DESKTOP_BOTTOM) * WIDTH) for _ in range(HEIGHT)]


def fill_rect(canvas, x: int, y: int, w: int, h: int, color) -> None:
    """填一个矩形。超出画布的部分直接裁掉。"""
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(WIDTH, x + w), min(HEIGHT, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    row = bytes(color) * (x1 - x0)
    for yy in range(y0, y1):
        canvas[yy][x0 * 3:x1 * 3] = row


def fill_gradient(canvas, x: int, y: int, w: int, h: int, top, bottom) -> None:
    """竖直渐变。桌面、标题栏、任务栏都是上下渐变，所以只有这一个方向。"""
    for i in range(h):
        t = i / max(1, h - 1)
        color = bytes(round(top[c] + (bottom[c] - top[c]) * t) for c in range(3))
        fill_rect(canvas, x, y + i, w, 1, color)


def draw_card() -> list[bytearray]:
    """XP 桌面：壁纸上一个 IE 窗口，底下压着任务栏。"""
    canvas = blank_canvas()
    fill_gradient(canvas, 0, 0, WIDTH, HEIGHT, DESKTOP_TOP, DESKTOP_BOTTOM)

    win_x, win_y, win_w, win_h = 180, 52, 840, 512

    # 窗口外框
    fill_rect(canvas, win_x - 4, win_y - 4, win_w + 8, win_h + 8, (0x08, 0x32, 0x78))

    # 标题栏
    fill_gradient(canvas, win_x, win_y, win_w, 36, TITLE_TOP, TITLE_BOTTOM)
    fill_rect(canvas, win_x + 12, win_y + 9, 18, 18, PAPER)
    fill_rect(canvas, win_x + 40, win_y + 12, 300, 12, PAPER)
    fill_rect(canvas, win_x + win_w - 34, win_y + 7, 22, 22, CLOSE)
    fill_rect(canvas, win_x + win_w - 28, win_y + 13, 10, 10, PAPER)

    # 菜单栏 + 工具栏
    bar_y = win_y + 36
    fill_rect(canvas, win_x, bar_y, win_w, 26, FACE)
    fill_rect(canvas, win_x, bar_y, win_w, 1, (0xC0, 0xC0, 0xC0))
    for i in range(4):
        fill_rect(canvas, win_x + 12 + i * 40, bar_y + 4, 26, 18, (0xD4, 0xD0, 0xC8))
        fill_rect(canvas, win_x + 12 + i * 40, bar_y + 4, 26, 1, (0xFF, 0xFF, 0xFF))
    fill_rect(canvas, win_x + 180, bar_y + 2, win_w - 196, 22, PAPER)
    fill_rect(canvas, win_x + 180, bar_y + 2, win_w - 196, 1, BORDER)

    # 内容区：白纸
    body_y = bar_y + 26
    fill_rect(canvas, win_x, body_y, win_w, win_h - 62, PAPER)
    fill_rect(canvas, win_x, body_y, win_w, 1, BORDER)

    # 纸上的内容：标题、链接、三行作品
    fill_rect(canvas, win_x + 40, body_y + 44, 420, 24, INK)
    fill_rect(canvas, win_x + 40, body_y + 84, 300, 13, LINK)
    for i, accent in enumerate(ACCENTS):
        row_y = body_y + 138 + i * 52
        fill_rect(canvas, win_x + 40, row_y, 20, 20, accent)
        fill_rect(canvas, win_x + 72, row_y + 2, 300, 8, INK)
        fill_rect(canvas, win_x + 72, row_y + 18, 520, 7, DIM)

    # 任务栏
    task_y = HEIGHT - 46
    fill_gradient(canvas, 0, task_y, WIDTH, 46, TASKBAR_TOP, TASKBAR_BOTTOM)
    fill_rect(canvas, 12, task_y + 6, 84, 34, START)
    fill_rect(canvas, 12, task_y + 6, 84, 2, (0x6A, 0xC4, 0x6A))
    fill_rect(canvas, 110, task_y + 12, 210, 22, (0xC8, 0xD8, 0xF0))

    return canvas


def encode_png(canvas) -> bytes:
    """把画布编码成 PNG。每行前面加一个 filter 字节（0 = 不过滤）。"""
    raw = bytearray()
    for row in canvas:
        raw.append(0)
        raw.extend(row)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", WIDTH, HEIGHT, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )


def main() -> int:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(encode_png(draw_card()))
    print(f"og_image: 写出 {OUT.relative_to(ROOT)}（{WIDTH}×{HEIGHT}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
