"""生成 PWA / iOS 所需的 PNG 图标（SVG 图标在 iOS 主屏幕与部分 Android 启动器中不被支持）。
用法：python tools/gen-icons.py
输出：icons/icon-192.png、icons/icon-512.png、icons/icon-maskable-512.png、icons/apple-touch-icon-180.png
"""
import math
import os

from PIL import Image, ImageDraw

NAVY = (17, 85, 122)
TEAL = (13, 127, 168)
WHITE = (255, 255, 255)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "icons")
BG_SCALE = 0.22  # 圆角半径


def spiral_points(cx, cy, size, turns=1.85, start=0.075, end=0.345):
    """对数螺线：由外向内收，得到海螺剪影的主线条。"""
    pts = []
    steps = 720
    theta_max = turns * 2 * math.pi
    for i in range(steps):
        t = theta_max * i / (steps - 1)
        # 指数衰减，靠近螺心更紧，符合海螺的生长比例
        r = size * (start + (end - start) * (t / theta_max))
        pts.append((cx + r * math.cos(t - math.pi / 2), cy + r * math.sin(t - math.pi / 2)))
    return pts


def draw_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(size * BG_SCALE)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=NAVY + (255,))

    # 安全区：maskable 图标内容缩到 80%，避免被启动器裁切
    shrink = 0.80 if maskable else 1.0
    cx = cy = size / 2
    line_w = max(3, int(size * 0.062 * shrink))
    pts = spiral_points(cx, cy, size * shrink, turns=1.85, start=0.075, end=0.345)

    # 用圆点逐段盖章：比 polyline 的 joint 更平滑，也不会有毛刺
    half = line_w / 2
    for x, y in pts:
        d.ellipse([x - half, y - half, x + half, y + half], fill=WHITE + (255,))

    # 螺心：一个小实心点，让图形在极小尺寸下也能被识别
    dot = max(2, int(size * 0.052 * shrink))
    d.ellipse([cx - dot, cy - dot, cx + dot, cy + dot], fill=TEAL + (255,))
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    targets = [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable-512.png", 512, True),
        ("apple-touch-icon-180.png", 180, False),
    ]
    for name, size, maskable in targets:
        icon = draw_icon(size, maskable=maskable)
        path = os.path.join(OUT, name)
        icon.save(path, "PNG", optimize=True)
        print(f"{path}  {size}x{size}  {os.path.getsize(path)} bytes")


if __name__ == "__main__":
    main()
