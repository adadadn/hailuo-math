# -*- coding: utf-8 -*-
"""修正补丁：answer 转选项文本、id 冲突重命名、chapter 按学科修正"""
import json, io, re

PATCH_DIR = r"D:\考研数学项目\data"
LETTER = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}

def load(name):
    return json.load(io.open(PATCH_DIR + "\\" + name, encoding="utf-8"))

def save(name, data):
    io.open(PATCH_DIR + "\\" + name, "w", encoding="utf-8", newline="").write(
        json.dumps(data, ensure_ascii=False, indent=1))

# 1) math3：NEW 部分 id 381-389 与复用 id 冲突 -> 601-609；复用 chapter 修正
m3 = load("patch_math3.json")
renum = {381: 601, 382: 602, 383: 603, 384: 604, 385: 605, 386: 606, 387: 607, 388: 608, 389: 609}
chapter_fix = {
    "math3-sub-319": "二重积分", "math3-sub-320": "二重积分", "math3-sub-321": "二重积分",
    "math3-sub-322": "二重积分", "math3-sub-323": "二重积分",
    "math3-sub-334": "向量与线性方程组", "math3-sub-335": "向量与线性方程组",
    "math3-sub-336": "向量与线性方程组", "math3-sub-337": "向量与线性方程组",
    "math3-sub-355": "数字特征与极限定理", "math3-sub-356": "数字特征与极限定理",
    "math3-sub-357": "数字特征与极限定理", "math3-sub-358": "数字特征与极限定理",
}
for q in m3:
    m = re.match(r"^math3-sub-(\d+)$", q["id"])
    if m and int(m.group(1)) in renum:
        q["id"] = "math3-sub-%04d" % renum[int(m.group(1))]
    if q["id"] in chapter_fix:
        q["chapter"] = chapter_fix[q["id"]]
    if q["type"] == "choice":
        q["answer"] = q["options"][LETTER.get(q["answer"].upper(), 0)]
save("patch_math3.json", m3)

# 2) calc396：NEW 部分 id 391-399 与复用 id 冲突 -> 501-509；复用 chapter 修正
c = load("patch_c396.json")
renum_c = {391: 501, 392: 502, 393: 503, 394: 504, 395: 505, 396: 506, 397: 507, 398: 508, 399: 509}
chapter_fix_c = {
    "c396-sub-401": "向量与线性方程组", "c396-sub-402": "向量与线性方程组",
    "c396-sub-403": "向量与线性方程组", "c396-sub-404": "向量与线性方程组",
}
for q in c:
    m = re.match(r"^c396-sub-(\d+)$", q["id"])
    if m and int(m.group(1)) in renum_c:
        q["id"] = "c396-sub-%04d" % renum_c[int(m.group(1))]
    if q["id"] in chapter_fix_c:
        q["chapter"] = chapter_fix_c[q["id"]]
    if q["type"] == "choice":
        q["answer"] = q["options"][LETTER.get(q["answer"].upper(), 0)]
save("patch_c396.json", c)

# 3) math1/math2 补丁 answer 转文本（原样保留 id/chapter/sub）
for name in ("patch_math1_a.json", "patch_math1_b.json", "patch_math1_c.json", "patch_math2.json"):
    data = load(name)
    for q in data:
        if q["type"] == "choice":
            q["answer"] = q["options"][LETTER.get(q["answer"].upper(), 0)]
    save(name, data)

print("patches fixed")
