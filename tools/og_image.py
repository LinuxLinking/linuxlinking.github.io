#!/usr/bin/env python3
"""生成社交卡片 assets/og.png（1200×630）。

社交平台不认 SVG，Open Graph 必须是 PNG/JPG。这里不引任何图像库：
自己写 PNG（zlib + struct，标准库够用），画一张跟站点同一套视觉的暗底海报。

    python tools/og_image.py
"""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "og.png"

WIDTH, HEIGHT = 1200, 630
BG = (0x14, 0x12, 0x0F)
INK = (0xF2, 0xEC, 0xE0)
ACCENT = (0xF2, 0x60, 0x3F)
LINE = (0x3A, 0x34, 0x2B)


def blank_canvas() -> list[bytearray]:
    return [bytearray(bytes(BG) * WIDTH) for _ in range(HEIGHT)]


def fill_rect(canvas, x: int, y: int, w: int, h: int, color) -> None:
    """填一个矩形。超出画布的部分直接裁掉。"""
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(WIDTH, x + w), min(HEIGHT, y + h)
    if x1 <= x0 or y1 <= y0:
        return
    row = bytes(color) * (x1 - x0)
    for yy in range(y0, y1):
        canvas[yy][x0 * 3:x1 * 3] = row


def fill_line(canvas, x0: int, y0: int, x1: int, y1: int, thickness: int, color) -> None:
    """粗线段：Bresenham 取点，每个点铺一个厚度方块。"""
    steps = max(abs(x1 - x0), abs(y1 - y0))
    if steps == 0:
        return
    for i in range(steps + 1):
        x = round(x0 + (x1 - x0) * i / steps)
        y = round(y0 + (y1 - y0) * i / steps)
        fill_rect(canvas, x, y - thickness // 2, thickness, thickness, color)


def draw_poster() -> list[bytearray]:
    """暗底 + 朱红 Z 标 + 几道文字线 + 上下两条横规。"""
    canvas = blank_canvas()

    # 顶规
    fill_rect(canvas, 90, 96, 1020, 2, INK)

    # 朱红方块，里面反白一个 Z
    box_x, box_y, box, pad = 90, 165, 300, 62
    fill_rect(canvas, box_x, box_y, box, box, ACCENT)
    fill_rect(canvas, box_x + pad, box_y + pad, box - pad * 2, 30, BG)
    fill_rect(canvas, box_x + pad, box_y + box - pad - 30, box - pad * 2, 30, BG)
    fill_line(
        canvas,
        box_x + box - pad,
        box_y + pad + 15,
        box_x + pad,
        box_y + box - pad - 15,
        30,
        BG,
    )

    # 右侧的文字块：一道实线领起，下面三道细线
    fill_rect(canvas, 450, 186, 640, 20, INK)
    fill_rect(canvas, 450, 248, 530, 8, LINE)
    fill_rect(canvas, 450, 292, 590, 8, LINE)
    fill_rect(canvas, 450, 336, 430, 8, LINE)

    # 底规
    fill_rect(canvas, 90, 520, 1020, 6, ACCENT)

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
    OUT.write_bytes(encode_png(draw_poster()))
    print(f"og_image: 写出 {OUT.relative_to(ROOT)}（{WIDTH}×{HEIGHT}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
