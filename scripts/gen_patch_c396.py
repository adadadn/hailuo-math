# -*- coding: utf-8 -*-
"""calc396 补题：复用 math1 + 新增中值定理等"""
import json, io

def load(p):
    return json.load(io.open(p, encoding="utf-8"))

p1a, p1b, p1c, p2, p3 = (load(r"D:\考研数学项目\data\patch_math1_a.json"), load(r"D:\考研数学项目\data\patch_math1_b.json"),
                          load(r"D:\考研数学项目\data\patch_math1_c.json"), load(r"D:\考研数学项目\data\patch_math2.json"),
                          load(r"D:\考研数学项目\data\patch_math3.json"))
pool = {q["id"]: q for p in (p1a, p1b, p1c, p2, p3) for q in p}

REUSE = {
 # 396 章"一元函数积分学" 子节"积分应用"
 "math1-sub-031":"积分应用","math1-sub-032":"积分应用","math1-sub-033":"积分应用",
 "math1-sub-034":"积分应用","math1-sub-035":"积分应用","math1-sub-036":"积分应用",
 # 396"随机事件与概率" 子节"条件概率"
 "math1-sub-145":"条件概率","math1-sub-146":"条件概率","math1-sub-147":"条件概率","math1-sub-148":"条件概率",
 # 396"向量与线性方程组" 子节"解的结构"
 "math1-sub-121":"解的结构","math1-sub-122":"解的结构","math1-sub-123":"解的结构","math1-sub-124":"解的结构",
 # 396"随机变量及其分布" 离散型/连续型
 "math1-sub-149":"离散型随机变量","math1-sub-150":"离散型随机变量","math1-sub-151":"离散型随机变量",
 "math1-sub-152":"离散型随机变量",
 "math1-sub-153":"连续型随机变量","math1-sub-154":"连续型随机变量","math1-sub-155":"连续型随机变量",
 "math1-sub-156":"连续型随机变量",
}
out = []
i = 400
for src, sub in REUSE.items():
    i += 1
    q = dict(pool[src])
    q["id"] = "c396-sub-%03d" % i
    q["project"] = "calc396"
    q["sub"] = sub
    # chapter 按 396 课程名修正：解的结构 -> 向量与线性方程组
    if sub == "解的结构":
        q["chapter"] = "向量与线性方程组"
    out.append(q)

NEW = [
# 中值定理 (+5)
("c396-sub-801","choice","罗尔定理的三个条件是？","C","f 连续、可导、f(a)=f(b);f 连续、可导;f 连续、可导、f(a)=f(b);f 可导、f(a)=f(b)","第1步：罗尔定理：f 在 [a,b] 连续，在 (a,b) 可导，且 f(a)=f(b)。\n第2步：则存在 ξ 使 f'(ξ)=0。\n结论：选 C。",1,"一元函数微分学","中值定理"),
("c396-sub-802","choice","f(x)=x²-2x 在 [0,2] 上，罗尔定理中的 ξ=？","B","0;1;2;1/2","第1步：f(0)=0，f(2)=0，满足罗尔条件。\n第2步：f'(x)=2x-2=0 得 x=1。\n结论：ξ=1，选 B。",1,"一元函数微分学","中值定理"),
("c396-sub-803","choice","拉格朗日中值定理的结论是？","D","f'(ξ)=0;f(b)-f(a)=f'(a)(b-a);f(b)=f(a);f(b)-f(a)=f'(ξ)(b-a)","第1步：拉格朗日中值定理：存在 ξ 使 f(b)-f(a)=f'(ξ)(b-a)。\n结论：选 D。",1,"一元函数微分学","中值定理"),
("c396-sub-804","choice","f(x)=x³ 在 [0,1] 上，拉格朗日中值定理中的 ξ=？","A","√3/3;1/3;1/2;√3","第1步：f(1)-f(0)=1=3ξ²·1。\n第2步：ξ²=1/3，ξ=√3/3（取正）。\n结论：选 A。",2,"一元函数微分学","中值定理"),
("c396-sub-805","choice","柯西中值定理中涉及的两个函数需满足？","B","仅连续;在 [a,b] 连续、(a,b) 可导且 g'(x)≠0;仅可导;可导且 f(a)=f(b)","第1步：柯西中值定理：f、g 连续可导且 g'(x)≠0。\n第2步：则存在 ξ 使 [f(b)-f(a)]/[g(b)-g(a)]=f'(ξ)/g'(ξ)。\n结论：选 B。",2,"一元函数微分学","中值定理"),
# 协方差与相关系数 (+3)
("c396-sub-806","choice","Cov(X,Y)=E(XY)-E(X)E(Y)，若 X、Y 独立则 Cov(X,Y)=？","A","0;E(XY);1;D(X)","第1步：独立时 E(XY)=E(X)E(Y)。\n第2步：故协方差为 0。\n结论：选 A。",1,"数字特征与统计基础","协方差与相关系数"),
("c396-sub-807","choice","相关系数 ρ=1 说明？","C","X、Y 无关;X、Y 独立;X、Y 正线性相关;X=Y","第1步：|ρ|=1 表示完全线性相关。\n第2步：ρ=1 为正线性相关。\n结论：选 C。",1,"数字特征与统计基础","协方差与相关系数"),
("c396-sub-808","choice","D(X+Y) 与协方差的关系为？","B","D(X)+D(Y);D(X)+D(Y)+2Cov(X,Y);D(X)D(Y);D(X)-D(Y)","第1步：D(X+Y)=D(X)+D(Y)+2Cov(X,Y)。\n第2步：独立时协方差为 0 退化为 D(X)+D(Y)。\n结论：选 B。",2,"数字特征与统计基础","协方差与相关系数"),
# 条件概率 (+1)
("c396-sub-809","choice","P(A)=0.4，P(B)=0.5，P(A|B)=0.5，则 P(A∪B)=？","C","0.9;0.2;0.65;0.7","第1步：P(AB)=P(B)P(A|B)=0.5×0.5=0.25。\n第2步：P(A∪B)=0.4+0.5-0.25=0.65。\n结论：P(A∪B)=0.65，选 C。",3,"随机事件与概率","条件概率"),
]
for id_, t, stem, ans, opts, exp, diff, ch, sub in NEW:
    q = {"id": id_, "project": "calc396", "type": t, "stem": stem, "answer": ans,
         "explanation": exp, "source": "海螺补题", "chapter": ch,
         "difficulty": diff, "kind": "mock", "reviewStatus": "approved", "sub": sub}
    if t == "choice":
        q["options"] = opts.split(";")
    out.append(q)
io.open(r"D:\考研数学项目\data\patch_c396.json", "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=1))
print("calc396", len(out))
