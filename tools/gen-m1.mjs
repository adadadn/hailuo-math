// 数学一 · 章节生成配方（20 章，每章 4-6 个考点生成器 × 4 变体）
import { num, frac, explain } from "./gen-helpers.mjs";

const f = (n) => frac(n[0], n[1]);

export default [
  /* ============ 函数、极限与连续 ============ */
  { chapter: "函数、极限与连续", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const k = i + 2;
    return { stem: `极限 lim(x→0) sin(${k}x) / x 等于（　）。`, answer: num(k), distractors: [0, 1, f([1, k])],
      explanation: explain([
        "考查重要极限：lim(u→0) sin u/u = 1。",
        `把分母配成 ${k}x：sin(${k}x)/x = ${k}·sin(${k}x)/(${k}x)。`,
        `因此原极限 = ${k}·1 = ${k}。`,
      ], `结论：lim(x→0) sin(${k}x)/x = ${k}。`, "correct") };
  } },
  { chapter: "函数、极限与连续", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const k = i + 2;
    return { stem: `极限 lim(x→0) (e^(${k}x) − 1) / x = ____。`, answer: num(k),
      explanation: explain([
        "考查等价无穷小：e^u − 1 ~ u（u→0）。",
        `令 u=${k}x，当 x→0 时 u→0，e^(${k}x) − 1 ~ ${k}x。`,
        `原极限 = lim ${k}x/x = ${k}。`,
      ], `结论：极限值为 ${k}。`, "correct") };
  } },
  { chapter: "函数、极限与连续", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const a = i % 2 === 0 ? 1 : 2, b = i % 2 === 0 ? i / 2 + 2 : (i - 1) / 2 + 2;
    return { stem: `极限 lim(x→∞) (1 + ${a}/x)^(${b}x) 等于（　）。`, answer: `e^${a * b}`, distractors: [`e^${b}`, `e^${a}`, "1"],
      explanation: explain([
        "考查第二个重要极限：lim(1 + 1/t)^t = e。",
        `令 t=x/${a}，则原式 = [lim(1+1/t)^t]^(${a}b)。`,
        `内层极限为 e，故整体为 e^(${a}b)。`,
      ], `结论：原极限 = e^${a * b}。`, "method") };
  } },
  { chapter: "函数、极限与连续", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const k = i + 2, removable = i % 2 === 0;
    return removable
      ? { stem: `函数 f(x) = sin(${k}x)/x 在 x=0 处无定义，则 x=0 是 f(x) 的（　）。`, answer: "可去间断点", distractors: ["跳跃间断点", "无穷间断点", "振荡间断点"],
          explanation: explain([
            "间断点类型由“左右极限是否存在、是否相等、是否等于函数值”判断。",
            `lim(x→0) sin(${k}x)/x = ${k}，左右极限存在且相等，但函数在该点无定义。`,
            "极限存在而函数无定义（或定义值不等于极限）的间断点称为可去间断点。",
          ], `结论：x=0 是可去间断点。`, "method") }
      : { stem: `函数 f(x) = 1/(x − ${k}) 在 x=${k} 处（　）。`, answer: "有无穷间断点", distractors: ["有可去间断点", "有跳跃间断点", "连续"],
          explanation: explain([
            "考察间断点分类：左右极限至少一个为无穷大时称为无穷间断点。",
            `lim(x→${k}±) 1/(x−${k}) = ±∞，极限不存在且趋于无穷。`,
            "因此该点为无穷间断点，属于第二类间断点。",
          ], `结论：x=${k} 是无穷间断点。`, "method") };
  } },
  { chapter: "函数、极限与连续", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const k = i + 2;
    return { stem: `设 f(x) = { sin(${k}x)/x, x≠0；A, x=0 }。若 f(x) 在 x=0 处连续，则 A = ____。`, answer: num(k),
      explanation: explain([
        "连续的定义：lim f(x) = f(0)。",
        `lim(x→0) sin(${k}x)/x = ${k}，而 f(0)=A。`,
        `令 A=${k} 即可使极限等于函数值。`,
      ], `结论：A = ${k}。`, "calc") };
  } },
  { chapter: "函数、极限与连续", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const eq = i % 2 === 0;
    return eq
      ? { stem: "当 x→0 时，1 − cos x 与 x² 的关系是（　）。", answer: "同阶但不等价", distractors: ["等价无穷小", "高阶无穷小", "低阶无穷小"],
          explanation: explain([
            "用泰勒展开或半角公式：1 − cos x = 2sin²(x/2)。",
            "2sin²(x/2) ~ 2·(x/2)² = x²/2，与 x² 的比值为 1/2（非零常数）。",
            "非零常数比值说明二者同阶；比值不为 1，故不等价。",
          ], "结论：1 − cos x 与 x² 同阶但不等价。", "method") }
      : { stem: "当 x→0 时，sin x 与 x 的关系是（　）。", answer: "等价无穷小", distractors: ["高阶无穷小", "低阶无穷小", "同阶但不等价"],
          explanation: explain([
            "由重要极限 lim sin x/x = 1 可知两者比值的极限为 1。",
            "比值极限为 1 的两个无穷小互为等价无穷小。",
          ], "结论：sin x ~ x（等价无穷小）。", "correct") };
  } },

  /* ============ 一元函数微分学 ============ */
  { chapter: "一元函数微分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 3, 1], [3, 2, 4], [4, 3, 0], [1, 4, 2]], [a, n, b] = T[i];
    const v = a * n + b;
    return { stem: `设 f(x) = ${a}x^${n} + ${b}x，则 f'(1) = ____。`, answer: num(v),
      explanation: explain([
        "逐项求导：幂函数 (x^n)' = n x^(n−1)。",
        `f'(x) = ${a * n}x^${n - 1} + ${b}。`,
        `代入 x=1：f'(1) = ${a * n} + ${b} = ${v}。`,
      ], `结论：f'(1) = ${v}。`, "calc") };
  } },
  { chapter: "一元函数微分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 1], [3, 2], [1, 4], [4, 1]], [k, m] = T[i];
    return { stem: `设 f(x) = ln(${k}x + ${m})，则 f'(0) = ____。`, answer: f([k, m]),
      explanation: explain([
        "复合函数求导：外层 ln 的导数为 1/u，内层导数为 k。",
        `f'(x) = ${k}/(${k}x + ${m})。`,
        `代入 x=0：f'(0) = ${k}/${m}。`,
      ], `结论：f'(0) = ${k}/${m}。`, "calc") };
  } },
  { chapter: "一元函数微分学", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const k = i + 2;
    return { stem: `设 f(x) = e^(${k}x)，则 f'(0) 等于（　）。`, answer: num(k), distractors: [num(k + 1), 0, 1],
      explanation: explain([
        "指数函数求导：(e^(kx))' = k·e^(kx)。",
        `代入 x=0：f'(0) = k·e^0 = k。`,
      ], `结论：f'(0) = ${k}。`, "correct") };
  } },
  { chapter: "一元函数微分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const n = i + 2;
    return { stem: `曲线 y = x^${n} 在点 (1, 1) 处的切线斜率为 ____。`, answer: num(n),
      explanation: explain([
        "切线斜率等于导数在该点的值。",
        `y' = ${n}x^${n - 1}。`,
        `代入 x=1：k = ${n}·1 = ${n}。`,
      ], `结论：切线斜率为 ${n}。`, "calc") };
  } },
  { chapter: "一元函数微分学", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const r = i + 1;
    return { stem: `由方程 x² + y² = ${r * r} 确定的隐函数 y=y(x)，其导数 dy/dx = ____。`, answer: "−x/y",
      explanation: explain([
        "隐函数求导：方程两边对 x 求导。",
        `2x + 2y·y' = 0。`,
        `解得 y' = −x/y。`,
      ], "结论：dy/dx = −x/y。", "method") };
  } },
  { chapter: "一元函数微分学", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const k = i + 1;
    return { stem: `函数 f(x) = x³ − ${3 * k}x 的极值点个数是（　）。`, answer: "2 个", distractors: ["0 个", "1 个", "3 个"],
      explanation: explain([
        "极值点只可能出现在驻点（导数为 0 的点）。",
        `f'(x) = 3x² − ${3 * k} = 3(x² − ${k})，得 x = ±√${k} 两个驻点。`,
        `f''(x)=6x，在两个驻点处 f'' 异号，因此都是极值点。`,
      ], `结论：极值点共 2 个。`, "method") };
  } },

  /* ============ 一元函数积分学 ============ */
  { chapter: "一元函数积分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const n = i + 2;
    return { stem: `∫ x^${n} dx = ____（C 为任意常数）。`, answer: `x^${n + 1}/${n + 1}+C`,
      explanation: explain([
        "幂函数积分公式：∫ x^p dx = x^(p+1)/(p+1) + C（p≠−1）。",
        `取 p=${n}：∫ x^${n} dx = x^${n + 1}/${n + 1} + C。`,
      ], `结论：原函数为 x^${n + 1}/${n + 1} + C。`, "calc") };
  } },
  { chapter: "一元函数积分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const k = i + 2;
    return { stem: `∫ e^(${k}x) dx = ____（C 为任意常数）。`, answer: `e^(${k}x)/${k}+C`,
      explanation: explain([
        "指数函数积分：∫ e^(kx) dx = e^(kx)/k + C。",
        `这里 k=${k}，直接代入公式。`,
      ], `结论：∫ e^(${k}x) dx = e^(${k}x)/${k} + C。`, "calc") };
  } },
  { chapter: "一元函数积分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const n = i + 1;
    return { stem: `定积分 ∫₀¹ x^${n} dx = ____。`, answer: f([1, n + 1]),
      explanation: explain([
        "先求原函数：∫ x^n dx = x^(n+1)/(n+1)。",
        `代入上下限：[x^${n + 1}/${n + 1}]₀¹ = 1/${n + 1} − 0。`,
      ], `结论：定积分 = 1/${n + 1}。`, "calc") };
  } },
  { chapter: "一元函数积分学", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const k = i + 2;
    return { stem: `∫ sin(${k}x) dx 等于（　）（C 为任意常数）。`, answer: `−cos(${k}x)/${k}+C`, distractors: [`cos(${k}x)/${k}+C`, `−cos(${k}x)+C`, `sin(${k}x)/${k}+C`],
      explanation: explain([
        "正弦积分公式：∫ sin(kx) dx = −cos(kx)/k + C。",
        `验证：对 −cos(${k}x)/${k} 求导得 sin(${k}x)，与原式一致。`,
      ], `结论：∫ sin(${k}x) dx = −cos(${k}x)/${k} + C。`, "calc") };
  } },
  { chapter: "一元函数积分学", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const k = i + 1, c = f([k, 2]);
    return { stem: `∫ ${k}x·e^(x²) dx = ____（C 为任意常数）。`, answer: k === 2 ? "e^(x²)+C" : `${c}e^(x²)+C`,
      explanation: explain([
        "用换元法：令 u = x²，则 du = 2x dx。",
        `∫ ${k}x·e^(x²) dx = ∫ e^u · (${k}/2) du = (${k}/2)e^u + C。`,
        "代回 u = x² 即得结果。",
      ], `结论：原积分 = ${k === 2 ? "e^(x²)" : `${c}e^(x²)`} + C。`, "method") };
  } },
  { chapter: "一元函数积分学", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const n = i + 1;
    return { stem: `(d/dx) ∫₀ˣ t^${n} dt = （　）。`, answer: `x^${n}`, distractors: [`${n}x^${n - 1}`, `x^${n + 1}/${n + 1}`, "0"],
      explanation: explain([
        "变上限积分求导定理：d/dx ∫₀ˣ g(t) dt = g(x)。",
        `被积函数 g(t) = t^${n}，直接把 t 换成 x。`,
      ], `结论：导数 = x^${n}。`, "correct") };
  } },

  /* ============ 向量代数与空间解析几何 ============ */
  { chapter: "向量代数与空间解析几何", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[[1, 2, 2], "3"], [[2, 3, 6], "7"], [[1, 1, 1], "√3"], [[1, 1, 0], "√2"]], [v, ans] = T[i];
    return { stem: `向量 a = (${v.join(", ")}) 的模 |a| = ____。`, answer: ans,
      explanation: explain([
        "向量模长公式：|a| = √(x² + y² + z²)。",
        `|a| = √(${v.map((x) => `${x}²`).join(" + ")}) = √(${v.reduce((s, x) => s + x * x, 0)})。`,
        `化简得 |a| = ${ans}。`,
      ], `结论：|a| = ${ans}。`, "calc") };
  } },
  { chapter: "向量代数与空间解析几何", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[[1, 1, 1], 6], [[2, 1, 0], 4], [[0, 1, 2], 8], [[2, 0, 1], 5]], [b, v] = T[i];
    return { stem: `已知 a = (1, 2, 3)，b = (${b.join(", ")})，则 a·b = ____。`, answer: num(v),
      explanation: explain([
        "数量积按坐标分量相乘后相加：a·b = x1x2 + y1y2 + z1z2。",
        `a·b = 1·${b[0]} + 2·${b[1]} + 3·${b[2]} = ${b[0]} + ${2 * b[1]} + ${3 * b[2]}。`,
      ], `结论：a·b = ${v}。`, "calc") };
  } },
  { chapter: "向量代数与空间解析几何", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[1, 2, 2, 6, 2], [2, 2, 1, 9, 3], [3, 0, 4, 5, 1], [1, 0, 0, 4, 4]], [a, b, c, d, ans] = T[i];
    return { stem: `点 (0, 0, 0) 到平面 ${a}x + ${b}y + ${c}z + ${d} = 0 的距离为（　）。`, answer: num(ans), distractors: [num(ans + 1), num(ans + 2), "0"],
      explanation: explain([
        "点到平面距离公式：d = |ax₀+by₀+cz₀+d| / √(a²+b²+c²)。",
        `代入原点：d = |${d}| / √(${a * a + b * b + c * c}) = ${d}/${Math.sqrt(a * a + b * b + c * c)}。`,
        `分母 √(${a * a + b * b + c * c}) = ${Math.sqrt(a * a + b * b + c * c)}，故 d = ${ans}。`,
      ], `结论：距离为 ${ans}。`, "calc") };
  } },
  { chapter: "向量代数与空间解析几何", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, -1, 0], [3, 0, -1], [1, 1, -1], [0, 1, -2]], b = T[i];
    return { stem: `已知 a = (1, 2, 3)，b = (${b.join(", ")})，则 a 与 b 的关系是（　）。`, answer: "垂直", distractors: ["平行", "夹角 45°", "无法判断"],
      explanation: explain([
        "两向量垂直当且仅当数量积为 0。",
        `a·b = 1·${b[0]} + 2·${b[1]} + 3·${b[2]} = ${b[0] + 2 * b[1] + 3 * b[2]} = 0。`,
        "数量积为 0，因此两向量垂直。",
      ], `结论：a ⊥ b。`, "method") };
  } },
  { chapter: "向量代数与空间解析几何", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[[1, 2, 2], [2, 1, 2], 8, 9], [[1, 1, 0], [1, -1, 0], 0, 2], [[2, 0, 1], [1, 1, 0], 2, 6], [[1, 0, 0], [0, 1, 0], 0, 2]], [a, b, dot, na, nb] = T[i];
    const cosv = dot === 0 ? "0" : `${dot}/${Math.sqrt(na)}·${Math.sqrt(nb)}`;
    return { stem: `向量 a = (${a.join(", ")}) 与 b = (${b.join(", ")}) 夹角 θ 的余弦 cos θ = ____。`, answer: cosv,
      explanation: explain([
        "夹角余弦公式：cos θ = a·b / (|a|·|b|)。",
        `a·b = ${a[0]}·${b[0]} + ${a[1]}·${b[1]} + ${a[2]}·${b[2]} = ${dot}。`,
        dot === 0
          ? "|a|、|b| 均非零，因此 cos θ = 0，说明两向量垂直。"
          : `代入公式：cos θ = ${dot} / (√${na}·√${nb})。`,
      ], dot === 0 ? "结论：cos θ = 0（两向量垂直）。" : `结论：cos θ = ${cosv}。`, "calc") };
  } },

  /* ============ 多元函数微分学 ============ */
  { chapter: "多元函数微分学", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 3], [3, 2], [4, 1], [1, 3]], [a, b] = T[i];
    return { stem: `设 z = x^${a}·y^${b}，则 ∂z/∂x 在点 (1, 1) 处的值为 ____。`, answer: num(a),
      explanation: explain([
        "对 x 求偏导时把 y 视为常数。",
        `∂z/∂x = ${a}x^${a - 1}·y^${b}。`,
        `代入 (1, 1)：${a}·1·1 = ${a}。`,
      ], `结论：∂z/∂x(1,1) = ${a}。`, "calc") };
  } },
  { chapter: "多元函数微分学", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[1, 1], [2, 1], [1, 2], [3, 1]], [a, b] = T[i];
    const fx = 2 * a + b, fy = a + 2 * b;
    return { stem: `设 z = ${a}x²y + ${b}xy²，则 z 在点 (1, 1) 处的全微分为 dz = ____。`, answer: `${fx}dx+${fy}dy`,
      explanation: explain([
        "全微分公式：dz = (∂z/∂x)dx + (∂z/∂y)dy。",
        `∂z/∂x = ${2 * a}xy + ${b}y²，在 (1,1) 处为 ${2 * a} + ${b} = ${fx}。`,
        `∂z/∂y = ${a}x² + ${2 * b}xy，在 (1,1) 处为 ${a} + ${2 * b} = ${fy}。`,
      ], `结论：dz = ${fx}dx + ${fy}dy。`, "calc") };
  } },
  { chapter: "多元函数微分学", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const T = [[1, 1], [2, 3], [1, 2], [3, 1]], [a, b] = T[i];
    return { stem: `设 f(x, y) = ${a}x² + ${b}y²，则 f 在点 (1, 2) 处的梯度为（　）。`, answer: `(${2 * a}, ${4 * b})`, distractors: [`(${a}, ${b})`, `(${2 * a}, ${2 * b})`, `(${a * b}, ${a + b})`],
      explanation: explain([
        "梯度定义：grad f = (∂f/∂x, ∂f/∂y)。",
        `∂f/∂x = ${2 * a}x，∂f/∂y = ${2 * b}y。`,
        `代入 (1, 2)：(${2 * a}, ${4 * b})。`,
      ], `结论：grad f(1,2) = (${2 * a}, ${4 * b})。`, "calc") };
  } },
  { chapter: "多元函数微分学", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[1, 1, "极小值"], [1, 2, "极小值"], [2, 1, "极小值"], [1, -1, "鞍点"]], [a, b, ans] = T[i];
    return { stem: `设 f(x, y) = ${a}x² + ${b}y²，则原点 (0, 0) 是 f 的（　）。`, answer: ans, distractors: ["极大值", "极小值", "无法判断"],
      explanation: ans === "极小值"
        ? explain([
            `f(x,y) = ${a}x² + ${b}y² ≥ 0，且等号仅在原点取得。`,
            "在原点附近函数值均不小于 0，且 f(0,0)=0。",
          ], "结论：原点为极小值点。", "correct")
        : explain([
            "沿 x 轴方向 f(x,0) = x² ≥ 0，沿 y 轴方向 f(0,y) = −y² ≤ 0。",
            "不同方向上函数值符号相反，原点不是极值点。",
          ], "结论：原点为鞍点（非极值点）。", "method") };
  } },
  { chapter: "多元函数微分学", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const r = i + 1;
    return { stem: `由方程 x² + y² = ${r * r} 确定的隐函数 y = y(x)，其导数 dy/dx = ____。`, answer: "−x/y",
      explanation: explain([
        "对方程两边关于 x 求导（把 y 视为 x 的函数）。",
        `2x + 2y·y' = 0。`,
        "解得 y' = −x/y。",
      ], "结论：dy/dx = −x/y。", "method") };
  } },

  /* ============ 重积分 ============ */
  { chapter: "重积分", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[1, 1, 2], [2, 1, 3], [3, 2, 2], [1, 2, 3]], [c, a, b] = T[i];
    return { stem: `二重积分 ∬_D ${c} dσ，其中 D: 0≤x≤${a}, 0≤y≤${b}，其值为 ____。`, answer: num(c * a * b),
      explanation: explain([
        "被积函数为常数 c 时，二重积分 = c × 区域面积。",
        `区域 D 是长为 ${a}、宽为 ${b} 的矩形，面积 = ${a * b}。`,
        `积分值 = ${c} × ${a * b} = ${c * a * b}。`,
      ], `结论：积分值为 ${c * a * b}。`, "calc") };
  } },
  { chapter: "重积分", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[1, "π"], [2, "4π"], [3, "9π"], [0.5, "π/4"]], [r, ans] = T[i];
    return { stem: `二重积分 ∬_D 1 dσ，其中 D 为圆域 x² + y² ≤ ${r * r}，其值为 ____。`, answer: ans,
      explanation: explain([
        "被积函数为 1 时，二重积分等于区域面积。",
        `圆域半径 R = ${r}，面积 = πR² = π·${r * r}。`,
      ], `结论：积分值 = ${ans}。`, "calc") };
  } },
  { chapter: "重积分", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const a = i + 1;
    return { stem: `交换积分次序：∫₀^${a} dx ∫₀ˣ f(x,y) dy = （　）。`, answer: `∫₀^${a} dy ∫_y^${a} f(x,y) dx`, distractors: [`∫₀^${a} dy ∫₀^y f(x,y) dx`, `∫₀^${a} dx ∫₀^${a} f(x,y) dy`, "无法交换"],
      explanation: explain([
        "原积分区域由 0≤y≤x、0≤x≤a 确定，即 0≤y≤a 且 y≤x≤a。",
        `改写为先对 x 后对 y 积分：∫₀^${a} dy ∫_y^${a} f(x,y) dx。`,
      ], `结论：交换后为 ∫₀^${a} dy ∫_y^${a} f(x,y) dx。`, "method") };
  } },
  { chapter: "重积分", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[2, 1], [1, 2], [3, 2], [2, 3]], [a, b] = T[i];
    return { stem: `二重积分 ∬_D x dσ，其中 D: 0≤x≤${a}, 0≤y≤${b}，其值为 ____。`, answer: f([a * a * b, 2]),
      explanation: explain([
        "先对 y 积分：∫₀^b dy = b，被积函数与 y 无关。",
        `原积分 = ∫₀^${a} b·x dx = b·[x²/2]₀^${a} = b·${a * a}/2。`,
      ], `结论：积分值 = ${a * a * b}/2。`, "calc") };
  } },
  { chapter: "重积分", type: "choice", difficulty: 3, variants: 4, make: (i) => {
    const T = [[1, "π/2", ["π", "2π", "π/4"]], [2, "8π", ["2π", "4π", "16π"]], [3, "81π/2", ["9π", "27π", "π"]], [0.5, "π/32", ["π/2", "π/4", "π/8"]]], [r, ans, ds] = T[i];
    return { stem: `用极坐标计算 ∬_D (x² + y²) dσ，其中 D: x² + y² ≤ ${r * r}，其值为（　）。`, answer: ans, distractors: ds,
      explanation: explain([
        "极坐标下 x²+y² = r²，面积元 dσ = r dr dθ。",
        `原积分 = ∫₀^{2π} dθ ∫₀^${r} r²·r dr = 2π·[r⁴/4]₀^${r}。`,
        `= 2π·${r * r * r * r}/4 = ${ans}。`,
      ], `结论：积分值 = ${ans}。`, "method") };
  } },

  /* ============ 无穷级数 ============ */
  { chapter: "无穷级数", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, "收敛"], [3, "收敛"], [0.5, "发散"], [1, "发散"]], [p, ans] = T[i];
    return { stem: `p 级数 Σ(n=1→∞) 1/n^${p} 的敛散性是（　）。`, answer: ans, distractors: ["收敛", "发散", "条件收敛", "无法判断"],
      explanation: p > 1
        ? explain([`p 级数在 p>1 时收敛，这里 p=${p}>1。`, "由 p 级数判别法直接判断。"], `结论：该级数${ans}。`, "correct")
        : explain([`p 级数在 p≤1 时发散（p=1 时为调和级数）。`, `这里 p=${p}≤1。`], `结论：该级数${ans}。`, "method") };
  } },
  { chapter: "无穷级数", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[2, "收敛"], [3, "收敛"], [2, "发散"], [3, "发散"]], [a, ans] = T[i];
    return i % 2 === 0
      ? { stem: `级数 Σ(n=0→∞) ${a}^n/n! 的敛散性是（　）。`, answer: ans, distractors: ["发散", "条件收敛", "无法判断"],
          explanation: explain([
            "用比值判别法：lim |u_{n+1}/u_n| = lim a/(n+1) = 0 < 1。",
            "比值极限为 0，级数绝对收敛。",
          ], `结论：级数${ans}。`, "correct") }
      : { stem: `级数 Σ(n=0→∞) ${a}^n 的敛散性是（　）。`, answer: ans, distractors: ["收敛", "条件收敛", "无法判断"],
          explanation: explain([
            "这是公比 r=a 的几何级数。",
            `|r| = ${a} ≥ 1，几何级数发散。`,
          ], `结论：级数${ans}。`, "method") };
  } },
  { chapter: "无穷级数", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const p = i % 2 === 0 ? 1 : 2, ans = p === 1 ? "条件收敛" : "绝对收敛";
    return { stem: `交错级数 Σ(n=1→∞) (−1)^n / n^${p} 的敛散性是（　）。`, answer: ans, distractors: ["条件收敛", "绝对收敛", "发散", "无法判断"],
      explanation: p === 1
        ? explain([
            "取绝对值后为调和级数 Σ1/n，发散。",
            "原级数为交错级数，通项递减趋于 0，由莱布尼茨判别法收敛。",
            "收敛但绝对值级数发散，故条件收敛。",
          ], "结论：该级数条件收敛。", "method")
        : explain([
            `取绝对值后为 p 级数 Σ1/n^${p}，p=${p}>1，收敛。`,
            "绝对值级数收敛，故原级数绝对收敛。",
          ], "结论：该级数绝对收敛。", "correct") };
  } },
  { chapter: "无穷级数", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const a = i + 1;
    return { stem: `幂级数 Σ(n=1→∞) x^n / n^${a} 的收敛半径 R = ____。`, answer: "1",
      explanation: explain([
        "用比值法求收敛半径：R = lim |a_n/a_{n+1}|。",
        `a_n = 1/n^${a}，故 R = lim (n+1)^${a}/n^${a} = 1。`,
        "该幂级数系数随幂次因子变化，但收敛半径仍为 1。",
      ], "结论：R = 1。", "method") };
  } },
  { chapter: "无穷级数", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const T = [[0.5, "收敛"], [1 / 3, "收敛"], [2, "发散"], [-2, "发散"]], [r, ans] = T[i];
    return { stem: `几何级数 Σ(n=0→∞) ${r}^n 的敛散性是（　）。`, answer: ans, distractors: ["收敛", "发散", "条件收敛", "无法判断"],
      explanation: Math.abs(r) < 1
        ? explain([`几何级数当 |r|<1 时收敛，这里 |r|=${Math.abs(r)}<1。`, "且收敛和为 1/(1−r)。"], `结论：级数${ans}。`, "correct")
        : explain([`几何级数当 |r|≥1 时发散，这里 |r|=${Math.abs(r)}≥1。`], `结论：级数${ans}。`, "method") };
  } },

  /* ============ 微分方程 ============ */
  { chapter: "微分方程", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, "Ce^(2x)"], [3, "Ce^(3x)"], [1, "Ce^(x)"], [-1, "Ce^(-x)"]], [k, ans] = T[i];
    return { stem: `微分方程 y' = ${k}y 的通解为 y = ____。`, answer: ans,
      explanation: explain([
        "分离变量：dy/y = k dx。",
        `两边积分得 ln|y| = ${k}x + C₁，即 y = C·e^(${k}x)。`,
      ], `结论：y = ${ans}。`, "method") };
  } },
  { chapter: "微分方程", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, "Ce^(-2x)"], [3, "Ce^(-3x)"], [1, "Ce^(-x)"], [4, "Ce^(-4x)"]], [p, ans] = T[i];
    return { stem: `微分方程 y' + ${p}y = 0 的通解为 y = ____。`, answer: ans,
      explanation: explain([
        "一阶齐次线性方程 y' + p y = 0 的通解公式：y = Ce^(−∫p dx)。",
        `∫p dx = ${p}x，故 y = C·e^(−${p}x)。`,
      ], `结论：y = ${ans}。`, "method") };
  } },
  { chapter: "微分方程", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const a = i + 1;
    return { stem: `微分方程 y'' − ${a * a}y = 0 的通解是（　）。`, answer: `y=C1e^(${a}x)+C2e^(-${a}x)`, distractors: [`y=C1cos(${a}x)+C2sin(${a}x)`, `y=(C1+C2x)e^(${a}x)`, "y=C1e^(ax)"],
      explanation: explain([
        "特征方程 r² − a² = 0，解得两个不相等实根 r = ±a。",
        `通解为 y = C1e^(${a}x) + C2e^(-${a}x)。`,
      ], `结论：y = C1e^(${a}x) + C2e^(-${a}x)。`, "method") };
  } },
  { chapter: "微分方程", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const w = i + 1;
    return { stem: `微分方程 y'' + ${w * w}y = 0 的通解是（　）。`, answer: `y=C1cos(${w}x)+C2sin(${w}x)`, distractors: [`y=C1e^(${w}x)+C2e^(-${w}x)`, `y=C1e^(${w}x)`, `y=C1cos(${w}x)+C2`],
      explanation: explain([
        "特征方程 r² + ω² = 0，共轭复根 r = ±iω。",
        `通解为 y = C1cos(ωx) + C2sin(ωx)，这里 ω=${w}。`,
      ], `结论：y = C1cos(${w}x) + C2sin(${w}x)。`, "method") };
  } },
  { chapter: "微分方程", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[1, "Ce^(x²/2)"], [2, "Ce^(x²)"], [3, "Ce^(3x²/2)"], [4, "Ce^(2x²)"]], [k, ans] = T[i];
    return { stem: `微分方程 y' = ${k}x·y 的通解为 y = ____。`, answer: ans,
      explanation: explain([
        "分离变量：dy/y = kx dx。",
        `两边积分得 ln|y| = ${k}x²/2 + C₁。`,
      ], `结论：y = ${ans}。`, "method") };
  } },

  /* ============ 行列式 ============ */
  { chapter: "行列式", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[1, 2, 3, 4], [2, 1, 1, 3], [3, 1, 2, 2], [1, 4, 2, 3]], [a, b, c, d] = T[i];
    return { stem: `行列式 |${a} ${b}; ${c} ${d}| = ____。`, answer: num(a * d - b * c),
      explanation: explain([
        "二阶行列式按对角线展开：ad − bc。",
        `${a}×${d} − ${b}×${c} = ${a * d} − ${b * c}。`,
      ], `结论：行列式 = ${a * d - b * c}。`, "calc") };
  } },
  { chapter: "行列式", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 3, 4], [1, 2, 3], [3, 3, 3], [2, 2, 5]], [p, q, r] = T[i];
    return { stem: `对角行列式 diag(${p}, ${q}, ${r}) 的值 = ____。`, answer: num(p * q * r),
      explanation: explain([
        "对角行列式等于主对角线元素的乘积。",
        `${p} × ${q} × ${r} = ${p * q * r}。`,
      ], `结论：行列式 = ${p * q * r}。`, "calc") };
  } },
  { chapter: "行列式", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[2, 2, "4|A|"], [3, 2, "8|A|"], [2, 3, "9|A|"], [3, 3, "27|A|"]], [n, k, ans] = T[i];
    return { stem: `设 A 为 ${n} 阶方阵，|A| 为其行列式，则 |${k}A| = （　）。`, answer: ans, distractors: [`${k}|A|`, `|A|`, `${n * k}|A|`],
      explanation: explain([
        "行列式性质：每行提出公因子 k，n 阶方阵共提出 n 次。",
        `|kA| = k^n |A| = ${k}^${n} |A|。`,
      ], `结论：|${k}A| = ${ans}。`, "method") };
  } },
  { chapter: "行列式", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const k = i + 2;
    return i % 2 === 0
      ? { stem: `行列式中若有两行完全相同，则该行列式的值为（　）。`, answer: "0", distractors: ["1", "2", "无法确定"],
          explanation: explain([
            "交换两行行列式变号，但两行相同交换后行列式不变。",
            "故 D = −D，推得 D = 0。",
          ], "结论：行列式值为 0。", "correct") }
      : { stem: `行列式中若有两行成比例（比例系数为 ${k}），则该行列式的值为（　）。`, answer: "0", distractors: [num(k), "1", "无法确定"],
          explanation: explain([
            "把成比例的一行提出公因子后，两行完全相同。",
            "两行相同的行列式为 0，故原行列式也为 0。",
          ], `结论：行列式值为 0（两行成比例）。`, "method") };
  } },
  { chapter: "行列式", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 3], [1, 4], [3, 5], [4, 2]], [a, b] = T[i];
    return { stem: `上三角行列式 |${a} 1; 0 ${b}| = ____。`, answer: num(a * b),
      explanation: explain([
        "上三角（或下三角）行列式等于主对角线元素的乘积。",
        `${a} × ${b} = ${a * b}。`,
      ], `结论：行列式 = ${a * b}。`, "calc") };
  } },

  /* ============ 矩阵 ============ */
  { chapter: "矩阵", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 3, 4, 5], [1, 2, 3, 4], [3, 3, 2, 2], [2, 4, 1, 5]], [a, b, c, d] = T[i];
    return { stem: `对角矩阵 diag(${a}, ${b}) 与 diag(${c}, ${d}) 相乘，所得矩阵第 (1,1) 元素为 ____。`, answer: num(a * c),
      explanation: explain([
        "对角矩阵相乘仍为对角矩阵，且对应元素相乘。",
        `第 (1,1) 元素 = ${a} × ${c} = ${a * c}。`,
      ], `结论：第 (1,1) 元素 = ${a * c}。`, "calc") };
  } },
  { chapter: "矩阵", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[2, 4], [3, 1], [4, 2], [2, 2]], [a, b] = T[i];
    return { stem: `对角矩阵 diag(${a}, ${b}) 的逆矩阵为 ____。`, answer: `[[1/${a},0],[0,1/${b}]]`,
      explanation: explain([
        "对角矩阵的逆仍为对角矩阵，元素取倒数。",
        `diag(${a}, ${b})⁻¹ = diag(1/${a}, 1/${b})。`,
      ], `结论：逆矩阵为 diag(1/${a}, 1/${b})。`, "method") };
  } },
  { chapter: "矩阵", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "n 阶方阵 A 可逆的充要条件是（　）。", answer: "det(A) ≠ 0", distractors: ["det(A) = 0", "A 中某行为零行", "r(A) < n"],
      explanation: explain([
        "可逆矩阵的等价刻画：行列式非零、满秩、无零特征值等。",
        "det(A) ≠ 0 是 A 可逆的充要条件。",
      ], "结论：A 可逆 ⟺ det(A) ≠ 0。", "correct") };
  } },
  { chapter: "矩阵", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "设 A、B 为可相乘的矩阵，则 (AB)ᵀ = （　）。", answer: "BᵀAᵀ", distractors: ["AᵀBᵀ", "AB", "Aᵀ + Bᵀ"],
      explanation: explain([
        "矩阵转置的性质：乘积的转置等于反向乘积的转置。",
        "(AB)ᵀ = BᵀAᵀ，顺序要颠倒。",
      ], "结论：(AB)ᵀ = BᵀAᵀ。", "method") };
  } },
  { chapter: "矩阵", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[[2, 0, 0], [0, 3, 0], [0, 0, 0], 2], [[1, 0, 0], [0, 0, 0], [0, 0, 0], 1], [[1, 0, 0], [0, 1, 0], [0, 0, 1], 3], [[1, 1], [1, 1], null, 1]], [a, b, c, ans] = T[i];
    return { stem: c === null ? `矩阵 [[1,1],[1,1]] 的秩为 ____。` : `对角矩阵 diag(${a[0]}, ${a[1]}, ${a[2]}) 的秩为 ____。`, answer: num(ans),
      explanation: c === null
        ? explain(["矩阵的秩等于其最高阶非零子式的阶数。", "两行相同，所有二阶子式均为 0，而一阶非零子式存在。"], "结论：秩 = 1。", "method")
        : explain([
            "对角矩阵的秩等于非零对角元的个数。",
            `非零对角元为 ${[a, b, c].filter((x) => x !== 0).join("、")}，共 ${ans} 个。`,
          ], `结论：秩 = ${ans}。`, "calc") };
  } },

  /* ============ 向量 ============ */
  { chapter: "向量", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return i % 2 === 0
      ? { stem: "向量组 α₁=(1,0,0)，α₂=(0,0,0) 的线性相关性是（　）。", answer: "线性相关", distractors: ["线性无关", "无法判断", "一定线性无关"],
          explanation: explain([
            "含有零向量的向量组必线性相关。",
            "因为取系数 0,1 可得 0·α₁ + 1·α₂ = 0（系数不全为零）。",
          ], "结论：该向量组线性相关。", "correct") }
      : { stem: "向量组 α₁=(1,2)，α₂=(2,4) 的线性相关性是（　）。", answer: "线性相关", distractors: ["线性无关", "无法判断", "不确定"],
          explanation: explain([
            "α₂ = 2α₁，两向量成比例。",
            "存在非零系数组合 2α₁ − α₂ = 0，故线性相关。",
          ], "结论：该向量组线性相关。", "correct") };
  } },
  { chapter: "向量", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "三维标准向量组 e₁=(1,0,0)，e₂=(0,1,0)，e₃=(0,0,1) 是线性____的（填“相关”或“无关”）。", answer: "无关",
      explanation: explain([
        "设 k₁e₁+k₂e₂+k₃e₃ = 0，即 (k₁,k₂,k₃) = (0,0,0)。",
        "系数只能全为零，故向量组线性无关。",
      ], "结论：该向量组线性无关。", "correct") };
  } },
  { chapter: "向量", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "关于向量组的秩与极大线性无关组，下列说法正确的是（　）。", answer: "向量组的秩等于其极大线性无关组所含向量个数", distractors: ["向量组的秩等于向量个数", "极大线性无关组唯一", "含零向量的向量组可以线性无关"],
      explanation: explain([
        "极大线性无关组所含向量个数称为向量组的秩，与选取无关。",
        "秩是向量组的固有属性，任何极大无关组所含向量个数相同。",
      ], "结论：秩 = 极大线性无关组的向量个数。", "correct") };
  } },
  { chapter: "向量", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[[[1, 0, 0], [0, 1, 0], [1, 1, 0]], 2], [[[1, 0], [0, 1]], 2], [[[1, 2], [2, 4]], 1], [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], 3]], [vs, ans] = T[i];
    return { stem: `向量组 ${vs.map((v) => `(${v.join(",")})`).join("，")} 的秩为 ____。`, answer: num(ans),
      explanation: explain([
        "秩 = 极大线性无关组所含向量个数。",
        "第一组 α₃=α₁+α₂，极大无关组含 2 个向量；第三组 α₂=2α₁，只有 1 个线性无关向量。",
      ], `结论：秩 = ${ans}。`, "method") };
  } },
  { chapter: "向量", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "向量组 α₁,…,αₘ（m≥2）线性无关的充要条件是（　）。", answer: "任一向量都不能由其余向量线性表出", distractors: ["任一向量都可以由其余向量线性表出", "存在一个向量可由其余向量线性表出", "向量个数等于维数"],
      explanation: explain([
        "线性相关 ⟺ 至少有一个向量可由其余向量线性表出。",
        "因此线性无关 ⟺ 任一向量都不能由其余向量线性表出。",
      ], "结论：两者互为充要条件。", "method") };
  } },

  /* ============ 线性方程组 ============ */
  { chapter: "线性方程组", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "齐次线性方程组 Ax=0（A 为 m×n 矩阵）有非零解的充要条件是（　）。", answer: "r(A) < n", distractors: ["r(A) = n", "r(A) = m", "m < n"],
      explanation: explain([
        "Ax=0 只有零解 ⟺ r(A) = n（未知数个数）。",
        "因此有非零解 ⟺ r(A) < n。",
      ], "结论：有非零解 ⟺ r(A) < n。", "method") };
  } },
  { chapter: "线性方程组", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "设 A 为 n 阶可逆方阵，则非齐次线性方程组 Ax = b 的解的情况是（　）。", answer: "有唯一解", distractors: ["无解", "有无穷多解", "不确定"],
      explanation: explain([
        "A 可逆时 x = A⁻¹b 存在且唯一。",
        "或由克拉默法则：系数行列式非零，方程组有唯一解。",
      ], "结论：Ax=b 有唯一解。", "correct") };
  } },
  { chapter: "线性方程组", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "非齐次线性方程组 Ax=b 的通解，等于对应齐次方程组 Ax=0 的通解加上 Ax=b 的一个____。", answer: "特解",
      explanation: explain([
        "线性方程组解的结构定理：非齐次通解 = 齐次通解 + 非齐次特解。",
        "验证：A(η+ξ) = Aη + Aξ = 0 + b = b。",
      ], "结论：需要加上一个特解。", "correct") };
  } },
  { chapter: "线性方程组", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "设 A 为 m×n 矩阵，r(A)=r，则齐次方程组 Ax=0 的基础解系含有向量个数为（　）。", answer: "n − r", distractors: ["r", "n", "m − r"],
      explanation: explain([
        "未知数共 n 个，约束条件为 r 个（有效方程数）。",
        "自由未知量个数 = n − r，即基础解系所含向量个数。",
      ], "结论：基础解系含 n − r 个向量。", "method") };
  } },
  { chapter: "线性方程组", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "n 元齐次线性方程组 Ax=0 只有零解的充要条件是 r(A) = ____。", answer: "n",
      explanation: explain([
        "Ax=0 只有零解 ⟺ 列向量线性无关 ⟺ r(A) = n。",
        "此时基础解系含 n − n = 0 个向量，即只有零解。",
      ], "结论：r(A) = n。", "correct") };
  } },

  /* ============ 特征值与特征向量 ============ */
  { chapter: "特征值与特征向量", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[[2, 3], "2,3"], [[1, 2, 3], "1,2,3"], [[4, 1], "4,1"], [[3, 3, 1], "3,3,1"]], [d, ans] = T[i];
    return { stem: `对角矩阵 diag(${d.join(", ")}) 的特征值为 ____（从小到大用逗号分隔）。`, answer: ans,
      explanation: explain([
        "对角矩阵的特征值就是主对角线上的元素。",
        `主对角线元素为 ${d.join("、")}。`,
      ], `结论：特征值为 ${d.join("、")}。`, "correct") };
  } },
  { chapter: "特征值与特征向量", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[[1, 2], 2], [[1, 2, 3], 6], [[2, 2], 4], [[1, -2], -2]], [eig, ans] = T[i];
    return { stem: `矩阵 A 的特征值为 ${eig.join("、")}，则 det(A) = ____。`, answer: num(ans),
      explanation: explain([
        "行列式等于全部特征值的乘积。",
        `${eig.join(" × ")} = ${ans}。`,
      ], `结论：det(A) = ${ans}。`, "calc") };
  } },
  { chapter: "特征值与特征向量", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "若矩阵 A 与 B 相似，则 A 与 B 的特征值（　）。", answer: "相同", distractors: ["不同", "互为相反数", "互为倒数"],
      explanation: explain([
        "相似矩阵有相同的特征多项式，因此特征值相同。",
        "进一步地，迹、行列式、秩也都相同。",
      ], "结论：A 与 B 的特征值相同。", "correct") };
  } },
  { chapter: "特征值与特征向量", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "关于实对称矩阵，下列说法正确的是（　）。", answer: "必可正交对角化", distractors: ["特征值不一定为实数", "必不可对角化", "特征向量必相互正交"],
      explanation: explain([
        "实对称矩阵的特征值都是实数，且存在正交矩阵 Q 使 QᵀAQ 为对角阵。",
        "“可正交对角化”包含“可对角化”，是实对称矩阵的重要性质。",
      ], "结论：实对称矩阵必可正交对角化。", "method") };
  } },
  { chapter: "特征值与特征向量", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "若 n 阶方阵 A 有 n 个互不相同的特征值，则 A（　）。", answer: "必可对角化", distractors: ["必不可对角化", "不一定可对角化", "必为对称矩阵"],
      explanation: explain([
        "不同特征值对应的特征向量线性无关。",
        "n 个线性无关的特征向量构成一组基，故 A 可对角化。",
      ], "结论：A 必可对角化。", "correct") };
  } },

  /* ============ 二次型 ============ */
  { chapter: "二次型", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[1, 1, "正定"], [1, -1, "不定"], [-1, -1, "负定"], [1, 0, "半正定"]], [a, b, ans] = T[i];
    return { stem: `二次型 f(x,y) = ${a}x² + ${b}y² 是（　）。`, answer: ans, distractors: ["正定", "负定", "半正定", "不定"],
      explanation: ans === "正定"
        ? explain([`对任意 (x,y)≠(0,0)，f = ${a}x² + ${b}y² > 0。`, "恒为正，故正定。"], "结论：二次型正定。", "correct")
        : ans === "负定"
          ? explain([`对任意 (x,y)≠(0,0)，f = ${a}x² + ${b}y² < 0。`, "恒为负，故负定。"], "结论：二次型负定。", "correct")
          : ans === "半正定"
            ? explain(["f = x² ≥ 0，且存在非零向量 (0,1) 使 f=0。", "恒非负且可取零，故半正定（不正定）。"], "结论：二次型半正定。", "method")
            : explain(["沿 x 轴 f(x,0)=x²>0，沿 y 轴 f(0,y)=−y²<0。", "符号不恒定，故不定。"], "结论：二次型不定。", "method") };
  } },
  { chapter: "二次型", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[1, 1, 1], [2, 0, 3], [1, 2, 1], [3, 1, 2]], [a, b, c] = T[i];
    return { stem: `二次型 f = ${a}x² + ${2 * b}xy + ${c}y² 对应的矩阵为（　）。`, answer: `[[${a},${b}],[${b},${c}]]`, distractors: [`[[${a},${2 * b}],[${2 * b},${c}]]`, `[[${a},0],[0,${c}]]`, `[[${a},${b}],[0,${c}]]`],
      explanation: explain([
        "二次型 f = ax² + 2bxy + cy² 对应矩阵 [[a,b],[b,c]]。",
        "交叉项 xy 的系数一半放在矩阵的 (1,2) 与 (2,1) 位置。",
      ], `结论：矩阵为 [[${a},${b}],[${b},${c}]]。`, "method") };
  } },
  { chapter: "二次型", type: "choice", difficulty: 3, variants: 4, make: (i) => {
    const T = [[1, 1], [2, 3], [1, 4], [3, 2]], [a, c] = T[i];
    return { stem: `二次型 f = ${a}x² + ${c}y² 正定的充要条件是（　）。`, answer: `a>0 且 ac>0`, distractors: [`a>0 且 c<0`, `a+c>0`, `ac<0`],
      explanation: explain([
        "二次型正定 ⟺ 其矩阵的顺序主子式全大于 0。",
        `矩阵 diag(${a}, ${c}) 的顺序主子式为 ${a} 与 ${a}${c}。`,
        `要求 ${a}>0 且 ${a}${c}>0（即 ${c}>0）。`,
      ], `结论：充要条件为 a>0 且 c>0。`, "method") };
  } },
  { chapter: "二次型", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "二次型 f = x² − y² 的规范形为 ____。", answer: "z1²−z2²",
      explanation: explain([
        "规范形由特征值符号决定：正惯性指数对应正平方项，负惯性指数对应负平方项。",
        "f = x² − y² 特征值为 1 与 −1，正负惯性指数各为 1。",
      ], "结论：规范形为 z1² − z2²。", "method") };
  } },

  /* ============ 随机事件与概率 ============ */
  { chapter: "随机事件与概率", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[0.5, 0.4, 0.2], [0.6, 0.3, 0.1], [0.4, 0.5, 0.3], [0.5, 0.5, 0.1]], [pa, pb, pab] = T[i];
    const ans = +(pa + pb - pab).toFixed(4);
    return { stem: `设 P(A)=${pa}，P(B)=${pb}，P(AB)=${pab}，则 P(A∪B) = ____。`, answer: num(ans),
      explanation: explain([
        "加法公式：P(A∪B) = P(A) + P(B) − P(AB)。",
        `${pa} + ${pb} − ${pab} = ${num(ans)}。`,
      ], `结论：P(A∪B) = ${num(ans)}。`, "calc") };
  } },
  { chapter: "随机事件与概率", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[7, 6, 36, "1/6"], [11, 2, 36, "1/18"], [5, 4, 36, "1/9"], [6, 5, 36, "5/36"]], [s, m, n, ans] = T[i];
    return { stem: `同时掷两枚均匀骰子，点数之和为 ${s} 的概率为 ____。`, answer: ans,
      explanation: explain([
        "样本空间含 6×6 = 36 个等可能结果。",
        `点数和为 ${s} 的结果数为 ${m}（枚举可得）。`,
        `概率 = ${m}/36。`,
      ], `结论：概率 = ${ans}。`, "calc") };
  } },
  { chapter: "随机事件与概率", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "若事件 A 与 B 相互独立，则 P(AB) = （　）。", answer: "P(A)P(B)", distractors: ["P(A) + P(B)", "P(A) − P(B)", "P(A|B)P(A)"],
      explanation: explain([
        "独立性的定义：P(AB) = P(A)P(B)。",
        "等价地有 P(A|B) = P(A)（当 P(B)>0）。",
      ], "结论：P(AB) = P(A)P(B)。", "correct") };
  } },
  { chapter: "随机事件与概率", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[0.2, 0.4], [0.1, 0.25], [0.3, 0.5], [0.2, 0.8]], [pab, pb] = T[i];
    return { stem: `设 P(AB)=${pab}，P(B)=${pb}，则 P(A|B) = ____。`, answer: num(pab / pb),
      explanation: explain([
        "条件概率公式：P(A|B) = P(AB) / P(B)。",
        `${pab} / ${pb} = ${num(pab / pb)}。`,
      ], `结论：P(A|B) = ${num(pab / pb)}。`, "calc") };
  } },
  { chapter: "随机事件与概率", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "若事件 A 与 B 互斥，且 P(A)>0、P(B)>0，则 A 与 B（　）。", answer: "一定不独立", distractors: ["一定独立", "可能独立", "互为对立事件"],
      explanation: explain([
        "互斥得 AB = ∅，P(AB) = 0。",
        "而 P(A)P(B) > 0，二者不相等，故不独立。",
      ], "结论：互斥且概率为正的事件一定不独立。", "method") };
  } },

  /* ============ 随机变量及其分布 ============ */
  { chapter: "随机变量及其分布", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[10, 0.2], [8, 0.5], [12, 0.25], [6, 0.3]], [n, p] = T[i];
    return { stem: `设 X ~ B(${n}, ${p})（二项分布），则 E(X) = ____。`, answer: num(n * p),
      explanation: explain([
        "二项分布 B(n,p) 的数学期望为 np。",
        `${n} × ${p} = ${num(n * p)}。`,
      ], `结论：E(X) = ${num(n * p)}。`, "calc") };
  } },
  { chapter: "随机变量及其分布", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[0, 2], [2, 6], [1, 5], [3, 9]], [a, b] = T[i];
    return { stem: `设 X ~ U(${a}, ${b})（均匀分布），则 E(X) = ____。`, answer: num((a + b) / 2),
      explanation: explain([
        "均匀分布 U(a,b) 的期望为区间中点 (a+b)/2。",
        `(${a} + ${b})/2 = ${num((a + b) / 2)}。`,
      ], `结论：E(X) = ${num((a + b) / 2)}。`, "calc") };
  } },
  { chapter: "随机变量及其分布", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const lam = i + 2;
    return { stem: `设 X ~ P(${lam})（泊松分布），则 E(X) = ____。`, answer: num(lam),
      explanation: explain([
        "泊松分布 P(λ) 的期望与方差均为 λ。",
        `这里 λ = ${lam}。`,
      ], `结论：E(X) = ${lam}。`, "correct") };
  } },
  { chapter: "随机变量及其分布", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "设 X ~ N(μ, σ²)，则 P(X ≤ μ) = （　）。", answer: "1/2", distractors: ["0", "1", "μ"],
      explanation: explain([
        "正态分布密度关于 x=μ 对称。",
        "中位数等于均值，故 P(X≤μ) = 1/2。",
      ], "结论：P(X ≤ μ) = 1/2。", "correct") };
  } },
  { chapter: "随机变量及其分布", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const lam = i + 1;
    return { stem: `设 X 服从参数为 ${lam} 的指数分布 Exp(${lam})，则 E(X) = ____。`, answer: f([1, lam]),
      explanation: explain([
        "指数分布 Exp(λ) 的期望为 1/λ，方差为 1/λ²。",
        `这里 λ = ${lam}，E(X) = 1/${lam}。`,
      ], `结论：E(X) = 1/${lam}。`, "calc") };
  } },

  /* ============ 多维随机变量 ============ */
  { chapter: "多维随机变量", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "若二维随机变量 (X,Y) 中 X 与 Y 相互独立，则联合密度 f(x,y) 与边缘密度 f_X(x)、f_Y(y) 的关系是（　）。", answer: "f(x,y) = f_X(x)·f_Y(y)", distractors: ["f(x,y) = f_X(x) + f_Y(y)", "f(x,y) = f_X(x) − f_Y(y)", "f(x,y) = f_X(x)/f_Y(y)"],
      explanation: explain([
        "独立性的等价刻画：联合密度等于边缘密度之积。",
        "对离散型同样成立：P(X=x,Y=y) = P(X=x)P(Y=y)。",
      ], "结论：f(x,y) = f_X(x)f_Y(y)。", "correct") };
  } },
  { chapter: "多维随机变量", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [[0, 1, 0, 1, "N(0,2)"], [1, 1, 2, 1, "N(3,2)"], [0, 4, 0, 1, "N(0,5)"], [2, 1, 1, 4, "N(3,5)"]], [m1, s1, m2, s2, ans] = T[i];
    return { stem: `设 X ~ N(${m1}, ${s1})，Y ~ N(${m2}, ${s2}) 且相互独立，则 X+Y 服从（　）。`, answer: ans, distractors: [`N(${m1 + m2}, ${s1 + s2 + 1})`, `N(${m1 * m2}, ${s1 + s2})`, `N(${m1 + m2}, ${Math.max(s1, s2)})`],
      explanation: explain([
        "独立正态变量之和仍服从正态分布。",
        `均值相加：μ = ${m1} + ${m2} = ${m1 + m2}。`,
        `方差相加：σ² = ${s1} + ${s2} = ${s1 + s2}。`,
      ], `结论：X+Y ~ ${ans}。`, "method") };
  } },
  { chapter: "多维随机变量", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[2, 3], [3, 2], [4, 1], [1, 5]], [a, b] = T[i];
    return { stem: `协方差性质：Cov(${a}X, ${b}Y) = ____·Cov(X, Y)。`, answer: num(a * b),
      explanation: explain([
        "协方差的双线性性质：Cov(aX, bY) = ab·Cov(X,Y)。",
        `${a} × ${b} = ${a * b}。`,
      ], `结论：Cov(${a}X, ${b}Y) = ${a * b}Cov(X,Y)。`, "correct") };
  } },
  { chapter: "多维随机变量", type: "choice", difficulty: 3, variants: 4, make: (i) => {
    return { stem: "若随机变量 X 与 Y 的相关系数 ρ(X,Y) = 0，则（　）。", answer: "X 与 Y 不相关（但不一定独立）", distractors: ["X 与 Y 一定独立", "X 与 Y 一定不独立", "X 与 Y 一定相等"],
      explanation: explain([
        "相关系数为 0 称为不相关，只说明二者没有线性关系。",
        "独立 ⟹ 不相关，但反之不成立（可能存在非线性关系）。",
      ], "结论：ρ=0 表示不相关，但不一定独立。", "method") };
  } },
  { chapter: "多维随机变量", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[[0.2, 0.1, 0.3], 0.3], [[0.3, 0.1, 0.2], 0.4], [[0.1, 0.4, 0.2], 0.5], [[0.25, 0.25, 0.1], 0.5]], [row, p1] = T[i];
    return { stem: `二维离散型随机变量 (X,Y) 的联合分布中，P(X=1, Y=j)（j=1,2,3）分别为 ${row.join("、")}，则 P(X=1) = ____。`, answer: num(p1),
      explanation: explain([
        "边缘概率 = 联合概率在该行上的求和。",
        `${row.join(" + ")} = ${num(p1)}。`,
      ], `结论：P(X=1) = ${num(p1)}。`, "calc") };
  } },

  /* ============ 随机变量的数字特征 ============ */
  { chapter: "随机变量的数字特征", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [[2, 3, 5], [3, -1, 2], [4, 2, 1], [-2, 5, 3]], [a, b, mu] = T[i];
    return { stem: `设 E(X) = ${mu}，则 E(${a}X + ${b}) = ____。`, answer: num(a * mu + b),
      explanation: explain([
        "期望的线性性质：E(aX + b) = aE(X) + b。",
        `${a} × ${mu} + ${b} = ${num(a * mu + b)}。`,
      ], `结论：E(${a}X + ${b}) = ${num(a * mu + b)}。`, "calc") };
  } },
  { chapter: "随机变量的数字特征", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[2, 4], [3, 1], [5, 2], [3, 3]], [a, d] = T[i];
    return { stem: `设 D(X) = ${d}，则 D(${a}X + 1) = ____。`, answer: num(a * a * d),
      explanation: explain([
        "方差性质：D(aX + b) = a²D(X)，常数项不影响方差。",
        `${a}² × ${d} = ${a * a} × ${d} = ${num(a * a * d)}。`,
      ], `结论：D(${a}X + 1) = ${num(a * a * d)}。`, "calc") };
  } },
  { chapter: "随机变量的数字特征", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "下列关于方差的计算公式正确的是（　）。", answer: "D(X) = E(X²) − [E(X)]²", distractors: ["D(X) = E(X²) + [E(X)]²", "D(X) = [E(X)]² − E(X²)", "D(X) = E(X)"],
      explanation: explain([
        "方差定义：D(X) = E[(X−E(X))²]。",
        "展开化简得 D(X) = E(X²) − [E(X)]²，是常用计算公式。",
      ], "结论：D(X) = E(X²) − [E(X)]²。", "correct") };
  } },
  { chapter: "随机变量的数字特征", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "两个随机变量的相关系数 ρ 的取值范围是 ____。", answer: "[-1,1]",
      explanation: explain([
        "相关系数描述线性相关程度，由柯西不等式可知 |ρ| ≤ 1。",
        "ρ=±1 对应完全线性相关，ρ=0 对应不相关。",
      ], "结论：−1 ≤ ρ ≤ 1。", "correct") };
  } },

  /* ============ 大数定律与中心极限定理 ============ */
  { chapter: "大数定律与中心极限定理", type: "choice", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "大数定律表明：在重复试验中，事件发生的频率依概率收敛于（　）。", answer: "该事件的概率", distractors: ["1", "0", "事件的频率"],
      explanation: explain([
        "伯努利大数定律：试验次数充分大时频率以概率 1 接近概率。",
        "这是用频率估计概率的理论依据。",
      ], "结论：频率收敛于概率。", "correct") };
  } },
  { chapter: "大数定律与中心极限定理", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    const T = [[4, 3], [9, 4], [4, 5], [9, 5]], [d, e] = T[i];
    return { stem: `设 D(X) = ${d}，由切比雪夫不等式，P(|X − E(X)| ≥ ${e}) ≤ ____。`, answer: f([d, e * e]),
      explanation: explain([
        "切比雪夫不等式：P(|X−E(X)| ≥ ε) ≤ D(X)/ε²。",
        `P ≥ ${e} ≤ ${d}/${e * e} = ${f([d, e * e])}。`,
      ], `结论：概率不超过 ${f([d, e * e])}。`, "calc") };
  } },
  { chapter: "大数定律与中心极限定理", type: "fill", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "设 X₁,…,Xₙ 独立同分布，E(Xᵢ)=μ，D(Xᵢ)=σ²，则当 n 充分大时，(ΣXᵢ − nμ)/(√n·σ) 近似服从 ____。", answer: "N(0,1)",
      explanation: explain([
        "独立同分布中心极限定理：标准化后的和式依分布收敛于标准正态。",
        `(ΣXᵢ − nμ)/(√n·σ) → N(0,1)。`,
      ], "结论：近似服从标准正态分布 N(0,1)。", "correct") };
  } },

  /* ============ 数理统计 ============ */
  { chapter: "数理统计", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "设 X₁,…,Xₙ 为来自总体 X 的样本，S² 为样本方差，则 E(S²) = σ²，说明 S² 是 σ² 的（　）估计。", answer: "无偏", distractors: ["有偏", "一致", "有效"],
      explanation: explain([
        "无偏性定义：估计量的期望等于被估参数。",
        "E(S²) = σ²，因此样本方差是总体方差的无偏估计。",
      ], "结论：S² 是 σ² 的无偏估计。", "correct") };
  } },
  { chapter: "数理统计", type: "fill", difficulty: 1, variants: 4, make: (i) => {
    return { stem: "设 X̄ 为来自均值为 μ 的总体的样本均值，则 E(X̄) = ____。", answer: "μ",
      explanation: explain([
        "样本均值期望等于总体均值：E(X̄) = E[(X₁+…+Xₙ)/n] = (nμ)/n = μ。",
        "因此样本均值是总体均值的无偏估计。",
      ], "结论：E(X̄) = μ。", "correct") };
  } },
  { chapter: "数理统计", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "设 X₁,…,Xₙ 来自正态总体 N(μ, σ²)，则 (n−1)S²/σ² 服从（　）。", answer: "χ²(n−1)", distractors: ["χ²(n)", "t(n−1)", "N(0,1)"],
      explanation: explain([
        "抽样分布定理：样本方差与总体方差之比构成卡方统计量。",
        "(n−1)S²/σ² ~ χ²(n−1)，自由度为 n−1。",
      ], "结论：(n−1)S²/σ² ~ χ²(n−1)。", "method") };
  } },
  { chapter: "数理统计", type: "choice", difficulty: 2, variants: 4, make: (i) => {
    return { stem: "在其他条件不变时，增大置信水平 1−α，置信区间的长度（　）。", answer: "变长", distractors: ["变短", "不变", "无法确定"],
      explanation: explain([
        "置信水平越高，需要覆盖的分布区域越大。",
        "临界值增大，区间长度随之变长。",
      ], "结论：置信区间变长。", "correct") };
  } },
];
