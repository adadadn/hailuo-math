# -*- coding: utf-8 -*-
"""math3 补题：复用 math1/math2 + 新增边际分析/协方差等"""
import json, io

def load(p):
    return json.load(io.open(p, encoding="utf-8"))

p1a, p1b, p1c, p2 = load(r"D:\考研数学项目\data\patch_math1_a.json"), load(r"D:\考研数学项目\data\patch_math1_b.json"), load(r"D:\考研数学项目\data\patch_math1_c.json"), load(r"D:\考研数学项目\data\patch_math2.json")
pool = {q["id"]: q for p in (p1a, p1b, p1c, p2) for q in p}

# math1/math2 id -> (math3 新id, 新sub)
REUSE = {
 "math1-sub-001":"函数的概念与性质","math1-sub-002":"函数的概念与性质","math1-sub-003":"函数的概念与性质",
 "math1-sub-004":"函数的概念与性质","math1-sub-005":"函数的概念与性质","math1-sub-006":"函数的概念与性质",
 "math1-sub-013":"导数的应用","math1-sub-014":"导数的应用","math1-sub-015":"导数的应用",
 "math1-sub-016":"导数的应用","math1-sub-017":"导数的应用","math1-sub-018":"导数的应用",
 "math1-sub-031":"积分的应用","math1-sub-032":"积分的应用","math1-sub-033":"积分的应用",
 "math1-sub-034":"积分的应用","math1-sub-035":"积分的应用","math1-sub-036":"积分的应用",
 "math1-sub-047":"直角坐标与极坐标计算","math1-sub-048":"直角坐标与极坐标计算","math1-sub-049":"直角坐标与极坐标计算",
 "math1-sub-050":"直角坐标与极坐标计算","math1-sub-051":"直角坐标与极坐标计算",
 "math1-sub-062":"正项级数","math1-sub-063":"正项级数","math1-sub-064":"正项级数",
 "math1-sub-065":"正项级数","math1-sub-066":"正项级数",
 "math1-sub-072":"傅里叶级数","math1-sub-073":"傅里叶级数","math1-sub-074":"傅里叶级数",
 "math1-sub-075":"傅里叶级数","math1-sub-076":"傅里叶级数",
 "math1-sub-121":"解的结构","math1-sub-122":"解的结构","math1-sub-123":"解的结构","math1-sub-124":"解的结构",
 "math1-sub-140":"全概率公式","math1-sub-141":"全概率公式","math1-sub-142":"全概率公式",
 "math1-sub-143":"全概率公式","math1-sub-144":"全概率公式",
 "math1-sub-145":"条件概率与独立性","math1-sub-146":"条件概率与独立性","math1-sub-147":"条件概率与独立性",
 "math1-sub-148":"条件概率与独立性",
 "math1-sub-149":"离散型随机变量","math1-sub-150":"离散型随机变量","math1-sub-151":"离散型随机变量",
 "math1-sub-152":"离散型随机变量",
 "math1-sub-153":"连续型随机变量","math1-sub-154":"连续型随机变量","math1-sub-155":"连续型随机变量",
 "math1-sub-156":"连续型随机变量",
 "math1-sub-157":"大数定律与中心极限定理","math1-sub-158":"大数定律与中心极限定理",
 "math1-sub-160":"大数定律与中心极限定理","math1-sub-161":"大数定律与中心极限定理",
 "math1-sub-162":"参数估计与假设检验","math1-sub-163":"参数估计与假设检验","math1-sub-164":"参数估计与假设检验",
 "math1-sub-165":"参数估计与假设检验","math1-sub-166":"参数估计与假设检验",
 "math2-sub-251":"换元与分部积分","math2-sub-252":"换元与分部积分","math2-sub-253":"换元与分部积分",
 "math2-sub-254":"反常积分","math2-sub-255":"反常积分","math2-sub-256":"反常积分","math2-sub-257":"反常积分",
 "math2-sub-280":"高阶线性微分方程","math2-sub-281":"高阶线性微分方程","math2-sub-282":"高阶线性微分方程",
 "math2-sub-283":"高阶线性微分方程","math2-sub-284":"高阶线性微分方程",
 "math2-sub-285":"常系数线性方程","math2-sub-286":"常系数线性方程","math2-sub-287":"常系数线性方程",
 "math2-sub-288":"常系数线性方程","math2-sub-289":"常系数线性方程",
}
out = []
i = 300
for src, sub in REUSE.items():
    i += 1
    q = dict(pool[src])
    q["id"] = "math3-sub-%03d" % i
    q["project"] = "math3"
    q["sub"] = sub
    # chapter 按 math3 课程名修正
    chfix = {319: "二重积分", 320: "二重积分", 321: "二重积分", 322: "二重积分", 323: "二重积分",
             334: "向量与线性方程组", 335: "向量与线性方程组", 336: "向量与线性方程组", 337: "向量与线性方程组",
             355: "数字特征与极限定理", 356: "数字特征与极限定理", 357: "数字特征与极限定理", 358: "数字特征与极限定理"}
    if i in chfix:
        q["chapter"] = chfix[i]
    out.append(q)

NEW = [
# 经济学中的边际分析 (+4)
("math3-sub-801","choice","设总成本函数 C(q)=q²+10q+100，则边际成本函数为？","B","2q+100;2q+10;q²+10;2q+10","第1步：边际成本 = 总成本对产量求导 C'(q)。\n第2步：C'(q)=2q+10。\n结论：选 B。",2,"一元函数微分学","经济学中的边际分析"),
("math3-sub-802","choice","需求函数 q=100-2p，则边际收益 MR 为？","D","100-4q;50-q;100-2q;50-q","第1步：收益 R=pq，由 q=100-2p 得 p=50-q/2。\n第2步：R=q(50-q/2)=50q-q²/2，MR=R'=50-q。\n结论：选 D。",3,"一元函数微分学","经济学中的边际分析"),
("math3-sub-803","choice","边际成本 MC=10（常数），则多生产一单位产品的成本增加为？","A","10;100;1;0","第1步：边际成本即产量增加 1 单位时成本的增量。\n第2步：MC=10 表示增加约 10。\n结论：选 A。",1,"一元函数微分学","经济学中的边际分析"),
("math3-sub-804","choice","利润函数 L(q)=100q-q²-300，则使利润最大的产量为？","C","100;300;50;25","第1步：L'(q)=100-2q=0 得 q=50。\n第2步：L''(q)=-2<0 为极大值。\n结论：q=50，选 C。",2,"一元函数微分学","经济学中的边际分析"),
# 协方差与相关系数 (+4)
("math3-sub-805","choice","Cov(X,Y) 的定义是？","B","E(XY)-E(X);E(XY)-E(X)E(Y);E(X)E(Y);D(XY)","第1步：协方差 Cov(X,Y)=E[(X-EX)(Y-EY)]。\n第2步：展开得 E(XY)-E(X)E(Y)。\n结论：选 B。",1,"数字特征与极限定理","协方差与相关系数"),
("math3-sub-806","choice","若 X、Y 独立，则 Cov(X,Y)=？","A","0;1;D(X);E(XY)","第1步：独立时 E(XY)=E(X)E(Y)。\n第2步：Cov(X,Y)=E(XY)-E(X)E(Y)=0。\n结论：选 A。",1,"数字特征与极限定理","协方差与相关系数"),
("math3-sub-807","choice","相关系数 ρ(X,Y) 的取值范围是？","C","[0,1];(-∞,∞);[-1,1];(0,1)","第1步：相关系数由协方差与标准差定义。\n第2步：|ρ|≤1 恒成立。\n结论：选 C。",1,"数字特征与极限定理","协方差与相关系数"),
("math3-sub-808","choice","ρ(X,Y)=1 表示？","D","X、Y 不相关;X、Y 相互独立;X、Y 方差相等;X 与 Y 正线性相关","第1步：|ρ|=1 时存在线性关系。\n第2步：ρ=1 为正线性相关。\n结论：选 D。",1,"数字特征与极限定理","协方差与相关系数"),
# 大数定律与中心极限定理 (+1)
("math3-sub-809","choice","D(X)=4，则 P(|X-EX|≥2) 的上界（切比雪夫）为？","B","1/2;1;4;1/4","第1步：切比雪夫不等式 P(|X-EX|≥ε)≤D(X)/ε²。\n第2步：=4/4=1。\n结论：上界为 1（平凡界），选 B。",2,"数字特征与极限定理","大数定律与中心极限定理"),
]
for id_, t, stem, ans, opts, exp, diff, ch, sub in NEW:
    q = {"id": id_, "project": "math3", "type": t, "stem": stem, "answer": ans,
         "explanation": exp, "source": "海螺补题", "chapter": ch,
         "difficulty": diff, "kind": "mock", "reviewStatus": "approved", "sub": sub}
    if t == "choice":
        q["options"] = opts.split(";")
    out.append(q)
io.open(r"D:\考研数学项目\data\patch_math3.json", "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False, indent=1))
print("math3", len(out))
