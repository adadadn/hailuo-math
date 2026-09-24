# -*- coding: utf-8 -*-
"""统计每个学科每章每小节的题量，找出 0 题/低题量小节"""
import json, io, collections

Q = json.load(io.open(r"D:\考研数学项目\data\questions.json", encoding="utf-8"))
C = json.load(io.open(r"D:\考研数学项目\data\curriculum.json", encoding="utf-8"))

subs = collections.defaultdict(lambda: collections.Counter())
by_chapter = collections.Counter()
total = 0
for q in Q:
    c = q.get("chapter", "?")
    s = q.get("sub", "?")
    subs[c][s] += 1
    by_chapter[c] += 1
    total += 1

print("TOTAL", total)
all_missing = []
for subject, meta in C.items():
    print("\n===== ", subject, meta.get("name"), " =====")
    for ch in meta["chapters"]:
        name = ch["name"]
        cnt = by_chapter.get(name, 0)
        children = ch.get("children")
        if children:
            missing = []
            low = []
            for s in children:
                n = subs[name].get(s, 0)
                if n == 0:
                    missing.append(s)
                elif n <= 2:
                    low.append((s, n))
            if missing or low:
                print(f"[{name}] 现有{cnt}")
                if missing:
                    print("  MISSING(0题):", ", ".join(missing))
                    all_missing.append((subject, name, missing))
                if low:
                    print("  LOW:", ", ".join(f"{s}({n})" for s, n in low))
        else:
            if cnt == 0:
                print(f"[{name}] 无children 0题")

print("\n\n=== ALL MISSING ===")
for subject, name, missing in all_missing:
    print(subject, "|", name, "|", ", ".join(missing))
