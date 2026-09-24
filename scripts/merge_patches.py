# -*- coding: utf-8 -*-
"""合并补丁题进 questions.json 并统计"""
import json, io, collections

path = r"D:\考研数学项目\data\questions.json"
qs = json.load(io.open(path, encoding="utf-8"))
existing = {q["id"] for q in qs}

patches = ["patch_math1_a.json", "patch_math1_b.json", "patch_math1_c.json",
           "patch_math2.json", "patch_math3.json", "patch_c396.json"]
LETTER = {"A": 0, "B": 1, "C": 2, "D": 3}
added = 0
dup = 0
for name in patches:
    for q in json.load(io.open(r"D:\考研数学项目\data\\" + name, encoding="utf-8")):
        if q["type"] == "choice" and q["answer"] in LETTER:
            q["answer"] = q["options"][LETTER[q["answer"]]]
        if q["id"] in existing:
            dup += 1
            continue
        existing.add(q["id"])
        qs.append(q)
        added += 1

io.open(path, "w", encoding="utf-8", newline="").write(json.dumps(qs, ensure_ascii=False, indent=1))
print("added", added, "dup", dup, "total", len(qs))

# 重跑小节统计
C = json.load(io.open(r"D:\考研数学项目\data\curriculum.json", encoding="utf-8"))
subs = collections.defaultdict(lambda: collections.Counter())
for q in qs:
    subs[q.get("chapter", "?")][q.get("sub", "?")] += 1
missing_any = 0
for subject, meta in C.items():
    for ch in meta["chapters"]:
        for s in ch.get("children", []):
            n = subs[ch["name"]].get(s, 0)
            if n == 0:
                print("STILL MISSING:", subject, ch["name"], s)
                missing_any += 1
print("still missing total:", missing_any)
