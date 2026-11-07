// 补齐课程表里「有小节、没题目」的空档，并修掉一道挂错科目的题。
// 用法：node tools/patch-gaps.mjs [--dry]
// 幂等：题目 id 已存在则跳过，可重复运行。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FILE = fileURLToPath(new URL("../data/questions.json", import.meta.url));
const dry = process.argv.includes("--dry");
const questions = JSON.parse(readFileSync(FILE, "utf8"));
const curriculum = JSON.parse(readFileSync(new URL("../data/curriculum.json", import.meta.url), "utf8"));

const GAPS = [
  // 数学一 · 多元函数的极限与连续
  {
    id: "math1-gap-multilim-001",
    project: "math1",
    type: "choice",
    stem: "二元函数 f(x,y) = xy/(x²+y²) 在点 (0,0) 处的二重极限（　）。",
    answer: "不存在",
    options: ["等于 0", "等于 1/2", "不存在", "等于 1"],
    explanation: "第1步：沿直线 y=x 趋近，f(x,x)=x²/(2x²)=1/2。\n第2步：沿直线 y=0 趋近，f(x,0)=0。\n第3步：两条路径的极限不同，二重极限不存在。\n结论：选「不存在」。",
    source: "海螺补题",
    chapter: "多元函数微分学",
    sub: "多元函数的极限与连续",
    difficulty: 2,
    kind: "mock",
    reviewStatus: "approved",
  },
  {
    id: "math1-gap-multilim-002",
    project: "math1",
    type: "fill",
    stem: "极限 lim((x,y)→(0,0)) x²y/(x²+y²) = ____。",
    answer: "0",
    explanation: "第1步：因为 x²/(x²+y²) ≤ 1，所以 |x²y/(x²+y²)| ≤ |y|。\n第2步：当 (x,y)→(0,0) 时 y→0，由夹逼准则极限为 0。\n结论：极限等于 0。",
    source: "海螺补题",
    chapter: "多元函数微分学",
    sub: "多元函数的极限与连续",
    difficulty: 2,
    kind: "mock",
    reviewStatus: "approved",
  },
  // 数学一 · 复合函数与隐函数求导
  {
    id: "math1-gap-chain-001",
    project: "math1",
    type: "choice",
    stem: "设 z = f(x²+y²) 可微，则 ∂z/∂x =（　）。",
    answer: "2x f'(x²+y²)",
    options: ["f'(x²+y²)", "2x f'(x²+y²)", "2y f'(x²+y²)", "2x f'(2x)"],
    explanation: "第1步：把 u = x²+y² 看作中间变量，z = f(u)。\n第2步：由链式法则 ∂z/∂x = f'(u)·∂u/∂x。\n第3步：∂u/∂x = 2x，故 ∂z/∂x = 2x f'(x²+y²)。\n结论：选「2x f'(x²+y²)」。",
    source: "海螺补题",
    chapter: "多元函数微分学",
    sub: "复合函数与隐函数求导",
    difficulty: 2,
    kind: "mock",
    reviewStatus: "approved",
  },
  {
    id: "math1-gap-implicit-001",
    project: "math1",
    type: "choice",
    stem: "由方程 e^y + xy = 1 确定的隐函数 y=y(x)，其导数 dy/dx =（　）。",
    answer: "-y/(e^y+x)",
    options: ["-y/(e^y+x)", "y/(e^y+x)", "-x/(e^y+y)", "(e^y+y)/x"],
    explanation: "第1步：两边对 x 求导：e^y·y' + y + x·y' = 0。\n第2步：整理得 y'(e^y + x) = -y。\n第3步：y' = -y/(e^y+x)（e^y+x≠0）。\n结论：选「-y/(e^y+x)」。",
    source: "海螺补题",
    chapter: "多元函数微分学",
    sub: "复合函数与隐函数求导",
    difficulty: 3,
    kind: "mock",
    reviewStatus: "approved",
  },
  // 数学一 · 极大线性无关组
  {
    id: "math1-gap-maxindep-001",
    project: "math1",
    type: "choice",
    stem: "向量组 α₁=(1,2,3)，α₂=(2,4,6)，α₃=(0,0,1) 的极大线性无关组所含向量个数为（　）。",
    answer: "2 个",
    options: ["1 个", "2 个", "3 个", "0 个"],
    explanation: "第1步：α₂ = 2α₁，说明 α₁、α₂ 线性相关。\n第2步：α₁ 与 α₃ 不成比例，线性无关。\n第3步：向量组的秩为 2，极大线性无关组含 2 个向量（如 α₁、α₃）。\n结论：选「2 个」。",
    source: "海螺补题",
    chapter: "向量",
    sub: "极大线性无关组",
    difficulty: 2,
    kind: "mock",
    reviewStatus: "approved",
  },
  {
    id: "math1-gap-maxindep-002",
    project: "math1",
    type: "fill",
    stem: "向量组 α₁=(1,2,3)，α₂=(2,4,6) 的秩为 ____。",
    answer: "1",
    explanation: "第1步：α₂ = 2α₁，两个向量成比例。\n第2步：成比例的向量组线性相关，秩等于非零向量的个数。\n第3步：只有一个非零向量方向，秩为 1。\n结论：秩为 1。",
    source: "海螺补题",
    chapter: "向量",
    sub: "极大线性无关组",
    difficulty: 1,
    kind: "mock",
    reviewStatus: "approved",
  },
  // 数学二 · 反常积分
  {
    id: "math2-gap-improper-001",
    project: "math2",
    type: "choice",
    stem: "下列反常积分收敛的是（　）。",
    answer: "∫₁^∞ 1/x² dx",
    options: ["∫₁^∞ 1/x dx", "∫₁^∞ 1/x² dx", "∫₀¹ 1/x dx", "∫₀^∞ dx"],
    explanation: "第1步：p 积分 ∫₁^∞ 1/x^p dx 当 p>1 收敛、p≤1 发散。\n第2步：∫₁^∞ 1/x dx 中 p=1，发散；∫₁^∞ 1/x² dx 中 p=2>1，收敛。\n第3步：∫₀¹ 1/x dx = ln x|₀¹ 发散；∫₀^∞ dx 也发散。\n结论：选「∫₁^∞ 1/x² dx」。",
    source: "海螺补题",
    chapter: "一元函数积分学",
    sub: "反常积分",
    difficulty: 2,
    kind: "mock",
    reviewStatus: "approved",
  },
  // 数学三 · 微分中值定理
  {
    id: "math3-gap-mvt-001",
    project: "math3",
    type: "choice",
    stem: "罗尔定理成立需要满足的条件是（　）。",
    answer: "f 在 [a,b] 连续，在 (a,b) 可导，且 f(a)=f(b)",
    options: [
      "f 在 [a,b] 连续，在 (a,b) 可导，且 f(a)=f(b)",
      "f 在 [a,b] 连续即可",
      "f 在 (a,b) 可导，且 f(a)=f(b)",
      "f 在 [a,b] 可导，且 f(a)≠f(b)",
    ],
    explanation: "第1步：罗尔定理的三个条件缺一不可：闭区间连续、开区间可导、端点函数值相等。\n第2步：三个条件同时满足时，存在 ξ∈(a,b) 使 f'(ξ)=0。\n第3步：只连续或只可导都不足以保证结论成立。\n结论：选第一项。",
    source: "海螺补题",
    chapter: "一元函数微分学",
    sub: "微分中值定理",
    difficulty: 1,
    kind: "mock",
    reviewStatus: "approved",
  },
  {
    id: "math3-gap-mvt-002",
    project: "math3",
    type: "fill",
    stem: "f(x) = x²−4 在 [−2,2] 上满足罗尔定理的条件，则定理中的 ξ = ____。",
    answer: "0",
    explanation: "第1步：f 在 [−2,2] 连续、在 (−2,2) 可导，且 f(−2)=f(2)=0，满足罗尔定理条件。\n第2步：f'(x) = 2x，令 f'(x)=0 得 x=0。\n第3步：0∈(−2,2)，故 ξ=0。\n结论：ξ=0。",
    source: "海螺补题",
    chapter: "一元函数微分学",
    sub: "微分中值定理",
    difficulty: 1,
    kind: "mock",
    reviewStatus: "approved",
  },
];

// 1) 修掉矩阵题被拆成多行碎片、答案对不上选项的三道题
const FIX_MALFORMED = {
  "math1-sub-107": {
    answer: "[B⁻¹ 0; 0 C⁻¹]",
    options: ["[B⁻¹ 0; 0 C⁻¹]", "[0 B⁻¹; C⁻¹ 0]", "[B 0; 0 C]", "[C⁻¹ 0; 0 B⁻¹]"],
    explanation: "第1步：分块对角矩阵可逆当且仅当各对角块可逆。\n第2步：其逆仍为分块对角，对角块分别取逆。\n结论：A⁻¹=[B⁻¹ 0; 0 C⁻¹]。",
  },
  "math1-sub-109": {
    answer: "[A1⁻¹ 0 0; 0 A2⁻¹ 0; 0 0 A3⁻¹]",
    options: [
      "[A1⁻¹ 0 0; 0 A2⁻¹ 0; 0 0 A3⁻¹]",
      "[A3⁻¹ 0 0; 0 A2⁻¹ 0; 0 0 A1⁻¹]",
      "[A1 0 0; 0 A2 0; 0 0 A3]",
      "不存在",
    ],
    explanation: "第1步：分块对角矩阵的逆仍为分块对角。\n第2步：各对角块分别取逆，位置不变。\n结论：A⁻¹=[A1⁻¹ 0 0; 0 A2⁻¹ 0; 0 0 A3⁻¹]。",
  },
  "math1-sub-134": {
    answer: "[1 1; 1 2]",
    options: ["[1 1; 1 2]", "[1 2; 2 1]", "[2 1; 1 1]", "[1 1; 2 2]"],
    explanation: "第1步：二次型矩阵必须对称，故 a(12)=a(21)=交叉项系数的一半=1。\n第2步：对角线元素取平方项系数：a(11)=1，a(22)=2。\n结论：A=[1 1; 1 2]。",
  },
};
let malformedFixed = 0;
for (const [id, fix] of Object.entries(FIX_MALFORMED)) {
  const question = questions.find((q) => q.id === id);
  if (!question) continue;
  Object.assign(question, fix);
  malformedFixed += 1;
}

// 2) 挂错科目：数学二不考无穷级数，把这道 p 级数解答题移到数学一
const misplaced = questions.find((q) => q.id === "sx2-series-001");
let moved = 0;
if (misplaced && misplaced.project === "math2") {
  misplaced.project = "math1";
  misplaced.chapter = "无穷级数";
  misplaced.sub = "正项级数判别法";
  moved = 1;
}

// 3) 广义积分这道题本来就考反常积分，归到对应小节
const generalized = questions.find((q) => q.id === "math2-exp-034");
let reassigned = 0;
if (generalized && generalized.sub !== "反常积分") {
  generalized.sub = "反常积分";
  reassigned = 1;
}

// 4) 追加空档题
const ids = new Set(questions.map((q) => q.id));
const added = [];
for (const gap of GAPS) {
  if (ids.has(gap.id)) continue;
  const project = curriculum[gap.project];
  const chapter = project && project.chapters.find((c) => c.name === gap.chapter);
  if (!chapter || !(chapter.children || []).includes(gap.sub)) {
    throw new Error(`课程表里没有 ${gap.project}/${gap.chapter}/${gap.sub}`);
  }
  questions.push(gap);
  ids.add(gap.id);
  added.push(gap.id);
}

console.log(`修复矩阵碎片题 ${malformedFixed} 道`);
console.log(`移动科目 1 道：${moved ? "sx2-series-001 → math1/无穷级数" : "无需移动"}`);
console.log(`调整小节 1 道：${reassigned ? "math2-exp-034 → 反常积分" : "无需调整"}`);
console.log(`新增空档题 ${added.length} 道：${added.join(", ") || "无"}`);
console.log(`题库合计：${questions.length} 道`);

if (!dry) {
  writeFileSync(FILE, `${JSON.stringify(questions, null, 1)}\n`, "utf8");
  console.log(`已写回 ${FILE}`);
}
