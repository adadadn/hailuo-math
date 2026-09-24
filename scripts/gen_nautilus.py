# -*- coding: utf-8 -*-
"""生成实心鹦鹉螺剪影 SVG 路径，写入 app.js 与 icon.svg"""
import math

CX, CY = 12.0, 12.0
R0, R1 = 1.1, 8.6          # 内端半径 / 外端半径
T0, T1 = 0.0, 4.5 * math.pi  # 旋转 2.25 圈
K = math.log(R1 / R0) / (T1 - T0)

def pt(theta, r):
    return (CX + r * math.cos(theta), CY + r * math.sin(theta))

def polyline(t_start, t_end, n):
    pts = []
    for i in range(n + 1):
        t = t_start + (t_end - t_start) * i / n
        r = R0 * math.exp(K * t)
        x, y = pt(t, r)
        pts.append("L%.2f %.2f" % (x, y))
    return " ".join(pts)

N = 140
outer = "M%.2f %.2f " % pt(T0, R0) + polyline(T0, T1, N) + " L%.2f %.2f Z" % pt(T0, R0)
seg1 = "M%.2f %.2f " % pt(0.55 * math.pi, R0 * math.exp(K * 0.55 * math.pi)) + polyline(0.55 * math.pi, 4.25 * math.pi, 60)
seg2 = "M%.2f %.2f " % pt(1.35 * math.pi, R0 * math.exp(K * 1.35 * math.pi)) + polyline(1.35 * math.pi, 3.6 * math.pi, 40)

svg24 = ('<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<path d="%s" fill="currentColor" stroke="none"/>'
         '<path d="%s" fill="none" stroke="var(--teal)" stroke-width="1.25"/>'
         '<path d="%s" fill="none" stroke="var(--teal)" stroke-width="1.05"/>'
         '<circle cx="12" cy="12" r="0.95" fill="var(--teal)" stroke="none"/>'
         '</svg>') % (outer, seg1, seg2)

svg128 = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">'
          '<rect width="128" height="128" rx="26" fill="#11557a"/>'
          '<g transform="translate(16 16) scale(4)">'
          '<path d="%s" fill="#ffffff" stroke="none"/>'
          '<path d="%s" fill="none" stroke="#11557a" stroke-width="1.25"/>'
          '<path d="%s" fill="none" stroke="#11557a" stroke-width="1.05"/>'
          '<circle cx="12" cy="12" r="0.95" fill="#11557a"/>'
          '</g></svg>') % (outer, seg1, seg2)

print("OUTER_LEN", len(outer))

import io
p = r"D:\考研数学项目\app.js"
s = io.open(p, encoding="utf-8").read()
import re
old = re.search(r'<span class="brand-mark"><svg viewBox="0 0 24 24".*?</svg></span>', s)
if not old:
    raise SystemExit("app.js brand svg not found")
new = '<span class="brand-mark">' + svg24 + '</span>'
s = s.replace(old.group(0), new)
io.open(p, "w", encoding="utf-8", newline="").write(s)

io.open(r"D:\考研数学项目\icon.svg", "w", encoding="utf-8", newline="").write(svg128)
print("written")
