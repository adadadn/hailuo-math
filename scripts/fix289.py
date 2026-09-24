# -*- coding: utf-8 -*-
import json, io
p = r"D:\考研数学项目\data\patch_math2.json"
q = json.load(io.open(p, encoding="utf-8"))
for x in q:
    if x["id"] == "math2-sub-289":
        x["answer"] = "C"
        x["options"] = ["e^(2x)", "e^x", "2e^x-e^(2x)", "e^x+2e^(2x)"]
        x["explanation"] = "第1步：特征方程 r²-3r+2=0，根 r=1，2，通解 y=C1e^x+C2e^(2x)。\n第2步：y(0)=C1+C2=1，y'(0)=C1+2C2=0，解得 C1=2，C2=-1。\n结论：y=2e^x-e^(2x)，选 C。"
io.open(p, "w", encoding="utf-8", newline="").write(json.dumps(q, ensure_ascii=False, indent=1))
print("fixed", x["answer"])
