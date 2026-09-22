// 题库生成器公共配方（数学二/数学三/396 复用）
// 每个工厂接收章节名 ch，返回配方数组；配方 variants=8 的用算术/表驱动生成 8 道变体题。
import { num, frac, explain } from "./gen-helpers.mjs";

const f = (n) => frac(n[0], n[1]);

/* ================= 高等数学 ================= */

export const limits = (ch) => [
  { chapter: ch, type: "choice", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 2;
    return { stem: `极限 lim(x→0) sin(${k}x)/x 等于（　）。`, answer: num(k), distractors: [0, 1, num(k + 1)],
      explanation: explain([
        "考查重要极限：lim(u→0) sin u/u = 1。",
        `把分母配成 ${k}x：sin(${k}x)/x = ${k}·sin(${k}x)/(${k}x)。`,
        `因此原极限 = ${k}·1 = ${k}。`,
      ], `结论：lim(x→0) sin(${k}x)/x = ${k}。`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 2;
    return { stem: `极限 lim(x→0) (e^(${k}x) − 1)/x = ____。`, answer: num(k),
      explanation: explain([
        "考查等价无穷小：e^u − 1 ~ u（u→0）。",
        `令 u=${k}x，当 x→0 时 u→0，e^(${k}x) − 1 ~ ${k}x。`,
        `原极限 = lim ${k}x/x = ${k}。`,
      ], `结论：极限值为 ${k}。`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const k = i + 2;
    return { stem: `设 f(x) = { sin(${k}x)/x, x≠0；A, x=0 }。若 f(x) 在 x=0 处连续，则 A = ____。`, answer: num(k),
      explanation: explain([
        "连续的定义：lim(x→0) f(x) = f(0)。",
        `lim(x→0) sin(${k}x)/x = ${k}，而 f(0) = A。`,
        `令 A = ${k}，即可使极限等于函数值。`,
      ], `结论：A = ${k}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "当 x→0 时，1 − cos x 与 x² 的关系是（　）。", answer: "同阶但不等价", distractors: ["等价无穷小", "高阶无穷小", "低阶无穷小"],
          explanation: explain([
            "用半角公式：1 − cos x = 2sin²(x/2)。",
            "2sin²(x/2) ~ 2·(x/2)² = x²/2，与 x² 的比值为 1/2。",
            "比值是非零常数说明二者同阶；比值不为 1，故不等价。",
          ], "结论：1 − cos x 与 x² 同阶但不等价。", "method") }
      : { stem: "当 x→0 时，sin x 与 x 的关系是（　）。", answer: "等价无穷小", distractors: ["高阶无穷小", "低阶无穷小", "同阶但不等价"],
          explanation: explain([
            "由重要极限 lim sin x/x = 1 可知二者比值的极限为 1。",
            "比值极限为 1 的两个无穷小互为等价无穷小。",
          ], "结论：sin x ~ x（等价无穷小）。", "correct") };
  } },
];

export const deriv = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `设 f(x) = ${k}x² + 3x，则 f'(1) = ____。`, answer: num(2 * k + 3),
      explanation: explain([
        "逐项求导：幂函数 (x²)' = 2x。",
        `f'(x) = ${2 * k}x + 3。`,
        `代入 x=1：f'(1) = ${2 * k} + 3 = ${2 * k + 3}。`,
      ], `结论：f'(1) = ${2 * k + 3}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `设 f(x) = ln(${k}x + 1)，则 f'(0) = ____。`, answer: num(k),
      explanation: explain([
        "复合函数求导：外层 ln 的导数为 1/u，内层导数为 k。",
        `f'(x) = ${k}/(${k}x + 1)。`,
        `代入 x=0：f'(0) = ${k}/1 = ${k}。`,
      ], `结论：f'(0) = ${k}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 2;
    return { stem: `设 f(x) = e^(${k}x)，则 f'(0) 等于（　）。`, answer: num(k), distractors: [num(k + 1), 0, 1],
      explanation: explain([
        "指数函数求导：(e^(kx))' = k·e^(kx)。",
        `代入 x=0：f'(0) = k·e^0 = k = ${k}。`,
      ], `结论：f'(0) = ${k}。`, "correct") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "函数 f(x) = x³ − 3x 的极值点个数是（　）。", answer: "2 个", distractors: ["0 个", "1 个", "3 个"],
          explanation: explain([
            "极值点只可能出现在驻点（导数为 0 的点）。",
            "f'(x) = 3x² − 3 = 3(x² − 1)，得 x = ±1 两个驻点。",
            "f''(x) = 6x，在两个驻点处 f'' 异号，因此都是极值点。",
          ], "结论：极值点共 2 个。", "method") }
      : { stem: "函数 f(x) = x³ 的极值点个数是（　）。", answer: "0 个", distractors: ["1 个", "2 个", "3 个"],
          explanation: explain([
            "f'(x) = 3x² = 0 得唯一驻点 x = 0。",
            "f''(x) = 6x，在 x=0 处 f''(0) = 0，需另行判断。",
            "f'(x) = 3x² ≥ 0 恒成立，函数单调递增，x=0 不是极值点。",
          ], "结论：极值点共 0 个。", "method") };
  } },
];

export const integral = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `∫ x^${k} dx = ____（C 为任意常数）。`, answer: `x^${k + 1}/${k + 1}+C`,
      explanation: explain([
        "幂函数积分公式：∫ x^p dx = x^(p+1)/(p+1) + C（p≠−1）。",
        `取 p=${k}：∫ x^${k} dx = x^${k + 1}/${k + 1} + C。`,
      ], `结论：原函数为 x^${k + 1}/${k + 1} + C。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `∫ e^(${k}x) dx = ____（C 为任意常数）。`, answer: `e^(${k}x)/${k}+C`,
      explanation: explain([
        "指数函数积分：∫ e^(kx) dx = e^(kx)/k + C。",
        `这里 k=${k}，直接代入公式。`,
      ], `结论：∫ e^(${k}x) dx = e^(${k}x)/${k} + C。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `定积分 ∫₀¹ x^${k} dx = ____。`, answer: f([1, k + 1]),
      explanation: explain([
        "先求原函数：∫ x^k dx = x^(k+1)/(k+1)。",
        `代入上下限：[x^${k + 1}/${k + 1}]₀¹ = 1/${k + 1} − 0。`,
      ], `结论：定积分 = 1/${k + 1}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "(d/dx) ∫₀ˣ t³ dt = （　）。", answer: "x³", distractors: ["3x²", "x⁴/4", "0"],
          explanation: explain([
            "变上限积分求导定理：d/dx ∫₀ˣ g(t) dt = g(x)。",
            "被积函数 g(t) = t³，直接把 t 换成 x。",
          ], "结论：导数 = x³。", "correct") }
      : { stem: "∫ sin x dx 等于（　）（C 为任意常数）。", answer: "−cos x+C", distractors: ["cos x+C", "−sin x+C", "sin x+C"],
          explanation: explain([
            "正弦积分公式：∫ sin x dx = −cos x + C。",
            "验证：对 −cos x 求导得 sin x，与原式一致。",
          ], "结论：∫ sin x dx = −cos x + C。", "correct") };
  } },
];

export const multi = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `设 z = x^${k}·y²，则 ∂z/∂x 在点 (1, 1) 处的值为 ____。`, answer: num(k),
      explanation: explain([
        "对 x 求偏导时把 y 视为常数。",
        `∂z/∂x = ${k}x^${k - 1}·y²。`,
        `代入 (1, 1)：${k}·1·1 = ${k}。`,
      ], `结论：∂z/∂x(1,1) = ${k}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `设 z = ${k}x² + y³，则 ∂z/∂x 在点 (1, 2) 处的值为 ____。`, answer: num(2 * k),
      explanation: explain([
        "对 x 求偏导时把 y 视为常数。",
        `∂z/∂x = ${2 * k}x。`,
        `代入 (1, 2)：${2 * k}·1 = ${2 * k}。`,
      ], `结论：∂z/∂x(1,2) = ${2 * k}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `设 f(x, y) = ${k}x² + y²，则 f 在点 (1, 1) 处的梯度为（　）。`, answer: `(${2 * k}, 2)`, distractors: [`(${k}, 2)`, `(${2 * k}, 1)`, `(${2 * k}, ${2 * k})`],
      explanation: explain([
        "梯度定义：grad f = (∂f/∂x, ∂f/∂y)。",
        `∂f/∂x = ${2 * k}x，∂f/∂y = 2y。`,
        `代入 (1, 1)：(${2 * k}, 2)。`,
      ], `结论：grad f(1,1) = (${2 * k}, 2)。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "设 f(x, y) = x² + y²，则原点 (0, 0) 是 f 的（　）。", answer: "极小值点", distractors: ["极大值点", "鞍点", "不是驻点"],
          explanation: explain([
            "f(x, y) = x² + y² ≥ 0，等号仅在原点取得。",
            "原点附近函数值均不小于 f(0,0)=0，故为极小值点。",
          ], "结论：原点为极小值点。", "correct") }
      : { stem: "设 f(x, y) = x² − y²，则原点 (0, 0) 是 f 的（　）。", answer: "鞍点", distractors: ["极大值点", "极小值点", "最大值点"],
          explanation: explain([
            "沿 x 轴 f(x,0) = x² ≥ 0，沿 y 轴 f(0,y) = −y² ≤ 0。",
            "不同方向上函数值符号相反，原点不是极值点而是鞍点。",
          ], "结论：原点为鞍点（非极值点）。", "method") };
  } },
];

export const doubleInt = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `二重积分 ∬_D ${k} dσ，其中 D: 0≤x≤1, 0≤y≤2，其值为 ____。`, answer: num(2 * k),
      explanation: explain([
        "被积函数为常数 k 时，二重积分 = k × 区域面积。",
        `区域 D 是长为 1、宽为 2 的矩形，面积 = 2。`,
        `积分值 = ${k} × 2 = ${2 * k}。`,
      ], `结论：积分值为 ${2 * k}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const r = i + 1;
    return { stem: `二重积分 ∬_D 1 dσ，其中 D 为圆域 x² + y² ≤ ${r * r}，其值为 ____。`, answer: `${r * r}π`,
      explanation: explain([
        "被积函数为 1 时，二重积分等于区域面积。",
        `圆域半径 R = ${r}，面积 = πR² = π·${r * r}。`,
      ], `结论：积分值 = ${r * r}π。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "交换积分次序：∫₀¹ dx ∫₀ˣ f(x,y) dy = （　）。", answer: "∫₀¹ dy ∫_y¹ f(x,y) dx", distractors: ["∫₀¹ dy ∫₀^y f(x,y) dx", "∫₀¹ dx ∫₀¹ f(x,y) dy", "无法交换"],
          explanation: explain([
            "原积分区域由 0≤y≤x、0≤x≤1 确定，即 0≤y≤1 且 y≤x≤1。",
            "改写为先对 x 后对 y 积分：∫₀¹ dy ∫_y¹ f(x,y) dx。",
          ], "结论：交换后为 ∫₀¹ dy ∫_y¹ f(x,y) dx。", "method") }
      : { stem: "极坐标下，二重积分的面积元素 dσ 等于（　）。", answer: "r dr dθ", distractors: ["dr dθ", "r² dr dθ", "dr dθ/2"],
          explanation: explain([
            "极坐标变换 x = r cos θ, y = r sin θ 的雅可比行列式为 r。",
            "因此面积元素 dσ = r dr dθ。",
          ], "结论：dσ = r dr dθ。", "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const a = i + 1;
    return { stem: `二重积分 ∬_D x dσ，其中 D: 0≤x≤${a}, 0≤y≤2，其值为 ____。`, answer: num(a * a),
      explanation: explain([
        "先对 y 积分：∫₀² dy = 2，被积函数与 y 无关。",
        `原积分 = ∫₀^${a} 2x dx = 2·[x²/2]₀^${a} = ${a * a}。`,
      ], `结论：积分值 = ${a * a}。`, "calc") };
  } },
];

export const series = (ch) => [
  { chapter: ch, type: "choice", difficulty: 1, variants: 8, make: (i) => {
    const ps = [0.5, 0.9, 1, 1.2, 1.5, 2, 0.7, 3], p = ps[i];
    const ans = p > 1 ? "收敛" : "发散";
    return { stem: `p 级数 Σ(n=1→∞) 1/n^${p} 的敛散性是（　）。`, answer: ans, distractors: ["收敛", "发散", "条件收敛", "无法判断"],
      explanation: p > 1
        ? explain([`p 级数在 p>1 时收敛，这里 p=${p}>1。`, "由 p 级数判别法直接判断。"], `结论：该级数收敛。`, "correct")
        : explain([
            `p 级数在 p≤1 时发散（p=1 时为调和级数）。`,
            `这里 p=${p}≤1。`,
          ], `结论：该级数发散。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 1, variants: 8, make: (i) => {
    const rs = [0.3, 0.5, 0.8, -0.5, 1, 1.5, -2, 2], r = rs[i];
    const ans = Math.abs(r) < 1 ? "收敛" : "发散";
    return { stem: `几何级数 Σ(n=0→∞) ${r}^n 的敛散性是（　）。`, answer: ans, distractors: ["收敛", "发散", "条件收敛", "无法判断"],
      explanation: Math.abs(r) < 1
        ? explain([`几何级数当 |r|<1 时收敛，这里 |r|=${Math.abs(r)}<1。`, "且收敛和为 1/(1−r)。"], `结论：级数收敛。`, "correct")
        : explain([`几何级数当 |r|≥1 时发散，这里 |r|=${Math.abs(r)}≥1。`], `结论：级数发散。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 8, make: (i) => {
    const ps = [1, 2, 1, 2, 1, 2, 1, 2], p = ps[i];
    const ans = p === 1 ? "条件收敛" : "绝对收敛";
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
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "级数 Σ(n=1→∞) 1/n² 的敛散性是（　）。", answer: "收敛", distractors: ["发散", "条件收敛", "无法判断"],
          explanation: explain([
            "这是 p 级数，p = 2 > 1。",
            "由 p 级数判别法，级数收敛。",
          ], "结论：该级数收敛。", "correct") }
      : { stem: "级数 Σ(n=1→∞) (−1)^n/n 的敛散性是（　）。", answer: "条件收敛", distractors: ["绝对收敛", "发散", "无法判断"],
          explanation: explain([
            "绝对值级数 Σ1/n 为调和级数，发散。",
            "原交错级数满足莱布尼茨条件（1/n 单调递减趋于 0），收敛。",
            "收敛而绝对值级数发散，故条件收敛。",
          ], "结论：该级数条件收敛。", "method") };
  } },
];

export const ode = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `微分方程 y' = ${k}y 的通解为 y = ____。`, answer: `Ce^(${k}x)`,
      explanation: explain([
        "分离变量：dy/y = k dx。",
        `两边积分得 ln|y| = ${k}x + C₁，即 y = C·e^(${k}x)。`,
      ], `结论：y = Ce^(${k}x)。`, "method") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `微分方程 y' + ${k}y = 0 的通解为 y = ____。`, answer: `Ce^(-${k}x)`,
      explanation: explain([
        "一阶齐次线性方程 y' + p y = 0 的通解公式：y = Ce^(−∫p dx)。",
        `∫p dx = ${k}x，故 y = C·e^(−${k}x)。`,
      ], `结论：y = Ce^(−${k}x)。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `微分方程 y'' − ${k * k}y = 0 的通解是（　）。`, answer: `y=C1e^(${k}x)+C2e^(-${k}x)`, distractors: [`y=C1cos(${k}x)+C2sin(${k}x)`, `y=(C1+C2x)e^(${k}x)`, `y=C1e^(${k}x)`],
      explanation: explain([
        "特征方程 r² − k² = 0，解得两个不相等实根 r = ±k。",
        `通解为 y = C1e^(${k}x) + C2e^(-${k}x)。`,
      ], `结论：y = C1e^(${k}x) + C2e^(-${k}x)。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "微分方程 y'' + y = 0 的通解是（　）。", answer: "y=C1cos(x)+C2sin(x)", distractors: ["y=C1e^(x)+C2e^(-x)", "y=C1e^(x)", "y=C1cos(x)+C2"],
          explanation: explain([
            "特征方程 r² + 1 = 0，共轭复根 r = ±i。",
            "通解为 y = C1cos(x) + C2sin(x)。",
          ], "结论：y = C1cos(x) + C2sin(x)。", "method") }
      : { stem: "微分方程 y' = 2xy 的通解是（　）。", answer: "y=Ce^(x²)", distractors: ["y=Ce^(2x)", "y=Cx²", "y=Ce^(x²/2)"],
          explanation: explain([
            "分离变量：dy/y = 2x dx。",
            "两边积分得 ln|y| = x² + C₁，即 y = C·e^(x²)。",
          ], "结论：y = Ce^(x²)。", "method") };
  } },
];

/* ================= 线性代数 ================= */

export const laDet = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [
      [[2, 1], [1, 3], 5], [[1, 2], [3, 4], -2], [[3, 1], [1, 2], 5], [[2, 2], [1, 3], 4],
      [[1, 0], [0, 1], 1], [[4, 1], [2, 3], 10], [[2, 3], [1, 4], 5], [[3, 2], [1, 2], 4],
    ], [a, b, det] = T[i];
    return { stem: `行列式 |${a[0]} ${a[1]}; ${b[0]} ${b[1]}| = ____。`, answer: num(det),
      explanation: explain([
        "二阶行列式按对角线展开：ad − bc。",
        `${a[0]}×${b[1]} − ${a[1]}×${b[0]} = ${a[0] * b[1]} − ${a[1] * b[0]}。`,
      ], `结论：行列式 = ${det}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [[2, 3], [1, 4], [3, 5], [4, 2], [2, 2], [1, 6], [3, 3], [5, 2]], [p, q] = T[i];
    return { stem: `对角行列式 diag(${p}, ${q}) 的值 = ____。`, answer: num(p * q),
      explanation: explain([
        "对角行列式等于主对角线元素的乘积。",
        `${p} × ${q} = ${p * q}。`,
      ], `结论：行列式 = ${p * q}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 8, make: (i) => {
    const T = [[2, 2], [3, 2], [2, 3], [3, 3], [2, 4], [3, 4], [2, 5], [3, 5]], [n, k] = T[i];
    const ans = `${Math.pow(k, n)}|A|`;
    return { stem: `设 A 为 ${n} 阶方阵，|A| 为其行列式，则 |${k}A| = （　）。`, answer: ans, distractors: [`${k}|A|`, "|A|", `${n * k}|A|`],
      explanation: explain([
        "行列式性质：每行提出公因子 k，n 阶方阵共提出 n 次。",
        `|kA| = k^n |A| = ${k}^${n} |A| = ${ans}。`,
      ], `结论：|${k}A| = ${ans}。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 1, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "行列式中若有两行完全相同，则该行列式的值为（　）。", answer: "0", distractors: ["1", "2", "无法确定"],
          explanation: explain([
            "交换两行行列式变号，但两行相同交换后行列式不变。",
            "故 D = −D，推得 D = 0。",
          ], "结论：行列式值为 0。", "correct") }
      : { stem: "行列式中若有一行全为零，则该行列式的值为（　）。", answer: "0", distractors: ["1", "−1", "无法确定"],
          explanation: explain([
            "行列式按这一行展开，每一项都含 0 因子。",
            "因此展开结果为 0。",
          ], "结论：行列式值为 0。", "correct") };
  } },
];

export const laMat = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [[2, 3, 4, 5], [1, 2, 3, 4], [3, 3, 2, 2], [2, 4, 1, 5], [4, 1, 2, 3], [5, 2, 1, 4], [3, 2, 4, 1], [2, 2, 3, 3]], [a, b, c, d] = T[i];
    return { stem: `对角矩阵 diag(${a}, ${b}) 与 diag(${c}, ${d}) 相乘，所得矩阵第 (1,1) 元素为 ____。`, answer: num(a * c),
      explanation: explain([
        "对角矩阵相乘仍为对角矩阵，且对应元素相乘。",
        `第 (1,1) 元素 = ${a} × ${c} = ${a * c}。`,
      ], `结论：第 (1,1) 元素 = ${a * c}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [[2, 4], [3, 1], [4, 2], [2, 2], [3, 4], [5, 2], [6, 3], [4, 4]], [a, b] = T[i];
    return { stem: `对角矩阵 diag(${a}, ${b}) 的逆矩阵为 ____。`, answer: `[[1/${a},0],[0,1/${b}]]`,
      explanation: explain([
        "对角矩阵的逆仍为对角矩阵，元素取倒数。",
        `diag(${a}, ${b})⁻¹ = diag(1/${a}, 1/${b})。`,
      ], `结论：逆矩阵为 diag(1/${a}, 1/${b})。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "n 阶方阵 A 可逆的充要条件是（　）。", answer: "det(A) ≠ 0", distractors: ["det(A) = 0", "A 中某行为零行", "r(A) < n"],
          explanation: explain([
            "可逆矩阵的等价刻画：行列式非零、满秩、无零特征值等。",
            "det(A) ≠ 0 是 A 可逆的充要条件。",
          ], "结论：A 可逆 ⟺ det(A) ≠ 0。", "correct") }
      : { stem: "设 A、B 为可相乘的矩阵，则 (AB)ᵀ = （　）。", answer: "BᵀAᵀ", distractors: ["AᵀBᵀ", "AB", "Aᵀ + Bᵀ"],
          explanation: explain([
            "矩阵转置的性质：乘积的转置等于反向乘积的转置。",
            "(AB)ᵀ = BᵀAᵀ，顺序要颠倒。",
          ], "结论：(AB)ᵀ = BᵀAᵀ。", "method") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [
      [[2, 0, 0], [0, 3, 0], [0, 0, 0], 2], [[1, 0, 0], [0, 0, 0], [0, 0, 0], 1],
      [[1, 0, 0], [0, 1, 0], [0, 0, 1], 3], [[1, 1], [1, 1], null, 1],
      [[1, 0], [0, 2], null, 2], [[0, 0], [0, 0], null, 0],
      [[1, 0, 0], [0, 1, 0], [0, 0, 0], 2], [[1, 0], [0, 0], null, 1],
    ], [a, b, c, ans] = T[i];
    const mat = c === null ? `[[${a[0]},${a[1]}],[${b[0]},${b[1]}]]` : `diag(${a[0]}, ${a[1]}, ${a[2]})`;
    return { stem: `矩阵 ${mat} 的秩为 ____。`, answer: num(ans),
      explanation: c === null
        ? explain([
            "矩阵的秩等于其最高阶非零子式的阶数。",
            a[0] === 0 && a[1] === 0 && b[0] === 0 && b[1] === 0
              ? "该矩阵全为零矩阵，不存在非零子式，秩为 0。"
              : "逐个子式考察：存在一阶非零子式，且最高非零子式阶数为 ans。",
          ], `结论：秩 = ${ans}。`, "method")
        : explain([
            "对角矩阵的秩等于非零对角元的个数。",
            `非零对角元为 ${[a, b, c].filter((x) => x !== 0).join("、")}，共 ${ans} 个。`,
          ], `结论：秩 = ${ans}。`, "calc") };
  } },
];

export const laVec = (ch) => [
  { chapter: ch, type: "choice", difficulty: 1, variants: 8, make: (i) => {
    const T = [
      [[1, 0], [0, 0], "线性相关"], [[1, 2], [2, 4], "线性相关"], [[1, 0], [0, 1], "线性无关"], [[1, 1], [1, -1], "线性无关"],
      [[1, 0, 0], [0, 0, 0], "线性相关"], [[1, 2, 3], [2, 4, 6], "线性相关"], [[1, 0], [1, 0], "线性相关"], [[1, 1], [2, 2], "线性相关"],
    ], [v1, v2, ans] = T[i];
    const fmt = (v) => `(${v.join(",")})`;
    return { stem: `向量组 α₁ = ${fmt(v1)}，α₂ = ${fmt(v2)} 是（　）。`, answer: ans, distractors: ["线性相关", "线性无关", "无法判断"],
      explanation: ans === "线性无关"
        ? explain([
            "线性无关判断：若 k₁α₁ + k₂α₂ = 0，则 k₁ = k₂ = 0。",
            `两向量不成比例，只能全零系数组合为零向量。`,
          ], "结论：该向量组线性无关。", "correct")
        : v1.some((x) => x === 0) && v2.every((x) => x === 0)
          ? explain([
              "含有零向量的向量组必线性相关。",
              "取零向量对应系数为 1，其余为 0，得到非零系数组合为零向量。",
            ], "结论：该向量组线性相关。", "correct")
          : explain([
              `观察 α₂ = ${v2[0] / v1[0]}α₁，两向量成比例。`,
              "存在非零系数组合使线性组合为零向量，故线性相关。",
            ], "结论：该向量组线性相关。", "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [
      [[[1, 0], [0, 1]], 2], [[[1, 2], [2, 4]], 1], [[[1, 0, 0], [0, 1, 0], [1, 1, 0]], 2],
      [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], 3], [[[1, 0], [1, 0]], 1], [[[1, 0, 0], [0, 0, 0], [0, 0, 0]], 1],
      [[[1, 1], [1, 1], [1, 1]], 1], [[[1, 0], [0, 1], [1, 1]], 2],
    ], [vs, ans] = T[i];
    const fmt = (v) => `(${v.join(",")})`;
    return { stem: `向量组 ${vs.map(fmt).join("，")} 的秩为 ____。`, answer: num(ans),
      explanation: explain([
        "秩 = 极大线性无关组所含向量个数。",
        "找出极大无关组：成比例的向量只计一个，能由其他向量表出的不计入。",
      ], `结论：秩 = ${ans}。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "向量组 α₁,…,αₘ（m≥2）线性无关的充要条件是（　）。", answer: "任一向量都不能由其余向量线性表出", distractors: ["任一向量都可以由其余向量线性表出", "存在一个向量可由其余向量线性表出", "向量个数等于维数"],
          explanation: explain([
            "线性相关 ⟺ 至少有一个向量可由其余向量线性表出。",
            "因此线性无关 ⟺ 任一向量都不能由其余向量线性表出。",
          ], "结论：两者互为充要条件。", "method") }
      : { stem: "关于向量组的秩与极大线性无关组，下列说法正确的是（　）。", answer: "向量组的秩等于其极大线性无关组所含向量个数", distractors: ["向量组的秩等于向量个数", "极大线性无关组唯一", "含零向量的向量组可以线性无关"],
          explanation: explain([
            "极大线性无关组所含向量个数称为向量组的秩，与选取无关。",
            "秩是向量组的固有属性，任何极大无关组所含向量个数相同。",
          ], "结论：秩 = 极大线性无关组的向量个数。", "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [
      [[1, 2], [2, 4], "相关"], [[1, 0], [0, 1], "无关"], [[1, 1], [1, -1], "无关"], [[2, 4], [4, 8], "相关"],
      [[1, 3], [2, 6], "相关"], [[1, 1], [2, 2], "相关"], [[1, 0, 0], [0, 1, 0], "无关"], [[1, 2, 3], [2, 4, 6], "相关"],
    ], [v1, v2, ans] = T[i];
    const fmt = (v) => `(${v.join(",")})`;
    return { stem: `向量组 α₁ = ${fmt(v1)}，α₂ = ${fmt(v2)} 是线性____的（填“相关”或“无关”）。`, answer: ans,
      explanation: ans === "无关"
        ? explain([
            "两向量线性无关 ⟺ 不成比例。",
            `α₁ 与 α₂ 各分量不成同一比例，故线性无关。`,
          ], "结论：该向量组线性无关。", "correct")
        : explain([
            "两向量线性相关 ⟺ 成比例。",
            `存在常数 k 使 α₂ = kα₁，故线性相关。`,
          ], "结论：该向量组线性相关。", "correct") };
  } },
];

export const laSys = (ch) => [
  { chapter: ch, type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [
      { stem: "齐次线性方程组 Ax=0（A 为 m×n 矩阵）有非零解的充要条件是（　）。", answer: "r(A) < n", distractors: ["r(A) = n", "r(A) = m", "m < n"],
        exp: ["Ax=0 只有零解 ⟺ r(A) = n（未知数个数）。", "因此有非零解 ⟺ r(A) < n。"], concl: "有非零解 ⟺ r(A) < n。" },
      { stem: "设 A 为 n 阶可逆方阵，则非齐次线性方程组 Ax = b 的解的情况是（　）。", answer: "有唯一解", distractors: ["无解", "有无穷多解", "不确定"],
        exp: ["A 可逆时 x = A⁻¹b 存在且唯一。", "或由克拉默法则：系数行列式非零，方程组有唯一解。"], concl: "Ax=b 有唯一解。" },
      { stem: "设 A 为 m×n 矩阵，r(A)=r，则齐次方程组 Ax=0 的基础解系含有向量个数为（　）。", answer: "n − r", distractors: ["r", "n", "m − r"],
        exp: ["未知数共 n 个，约束条件为 r 个（有效方程数）。", "自由未知量个数 = n − r，即基础解系所含向量个数。"], concl: "基础解系含 n − r 个向量。" },
      { stem: "n 元齐次线性方程组 Ax=0 只有零解的充要条件是（　）。", answer: "r(A) = n", distractors: ["r(A) < n", "r(A) = 0", "m < n"],
        exp: ["Ax=0 只有零解 ⟺ 列向量线性无关 ⟺ r(A) = n。", "此时自由未知量个数 n − n = 0，即只有零解。"], concl: "r(A) = n。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "method") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "非齐次线性方程组 Ax=b 的通解，等于对应齐次方程组 Ax=0 的通解加上 Ax=b 的一个____。", answer: "特解",
          explanation: explain([
            "线性方程组解的结构定理：非齐次通解 = 齐次通解 + 非齐次特解。",
            "验证：A(η+ξ) = Aη + Aξ = 0 + b = b。",
          ], "结论：需要加上一个特解。", "correct") }
      : { stem: "n 元齐次线性方程组 Ax=0 只有零解的充要条件是 r(A) = ____。", answer: "n",
          explanation: explain([
            "Ax=0 只有零解 ⟺ 列向量线性无关 ⟺ r(A) = n。",
            "此时基础解系含 n − n = 0 个向量，即只有零解。",
          ], "结论：r(A) = n。", "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const k = i + 1;
    return { stem: `线性方程组 { x + y = ${k}; x − y = 0 }，则 x = ____。`, answer: f([k, 2]),
      explanation: explain([
        "由第二式 x − y = 0 得 x = y。",
        `代入第一式：x + y = 2x = ${k}。`,
        `解得 x = ${k}/2。`,
      ], `结论：x = ${k}/2。`, "calc") };
  } },
];

export const laEig = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [[[2, 3], "2,3"], [[1, 2, 3], "1,2,3"], [[4, 1], "4,1"], [[3, 3, 1], "3,3,1"], [[5, 2], "2,5"], [[1, 1, 1], "1,1,1"], [[2, 4], "2,4"], [[3, 1, 2], "1,2,3"]], [d, ans] = T[i];
    return { stem: `对角矩阵 diag(${d.join(", ")}) 的特征值为 ____（从小到大用逗号分隔）。`, answer: ans,
      explanation: explain([
        "对角矩阵的特征值就是主对角线上的元素。",
        `主对角线元素为 ${d.join("、")}。`,
      ], `结论：特征值为 ${ans}。`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [[[1, 2], 2], [[1, 2, 3], 6], [[2, 2], 4], [[1, -2], -2], [[1, 1, 1], 1], [[2, 3], 6], [[1, 4], 4], [[3, -1], -3]], [eig, ans] = T[i];
    return { stem: `矩阵 A 的特征值为 ${eig.join("、")}，则 det(A) = ____。`, answer: num(ans),
      explanation: explain([
        "行列式等于全部特征值的乘积。",
        `${eig.join(" × ")} = ${ans}。`,
      ], `结论：det(A) = ${ans}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [
      { stem: "若矩阵 A 与 B 相似，则 A 与 B 的特征值（　）。", answer: "相同", distractors: ["不同", "互为相反数", "互为倒数"],
        exp: ["相似矩阵有相同的特征多项式，因此特征值相同。", "进一步地，迹、行列式、秩也都相同。"], concl: "A 与 B 的特征值相同。" },
      { stem: "关于实对称矩阵，下列说法正确的是（　）。", answer: "必可正交对角化", distractors: ["特征值不一定为实数", "必不可对角化", "特征向量必相互正交"],
        exp: ["实对称矩阵的特征值都是实数，且存在正交矩阵 Q 使 QᵀAQ 为对角阵。", "“可正交对角化”包含“可对角化”，是实对称矩阵的重要性质。"], concl: "实对称矩阵必可正交对角化。" },
      { stem: "若 n 阶方阵 A 有 n 个互不相同的特征值，则 A（　）。", answer: "必可对角化", distractors: ["必不可对角化", "不一定可对角化", "必为对称矩阵"],
        exp: ["不同特征值对应的特征向量线性无关。", "n 个线性无关的特征向量构成一组基，故 A 可对角化。"], concl: "A 必可对角化。" },
      { stem: "矩阵 A 的不同特征值对应的特征向量（　）。", answer: "线性无关", distractors: ["线性相关", "一定正交", "成比例"],
        exp: ["不同特征值对应的特征向量必线性无关。", "若线性相关可推出矛盾（特征值相等）。"], concl: "不同特征值的特征向量线性无关。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "method") };
  } },
];

export const laQuad = (ch) => [
  { chapter: ch, type: "choice", difficulty: 2, variants: 8, make: (i) => {
    const T = [
      [1, 1, "正定"], [1, -1, "不定"], [-1, -1, "负定"], [1, 0, "半正定"],
      [2, 3, "正定"], [-2, -3, "负定"], [1, -2, "不定"], [0, 1, "半正定"],
    ], [a, b, ans] = T[i];
    return { stem: `二次型 f(x,y) = ${a}x² + ${b}y² 是（　）。`, answer: ans, distractors: ["正定", "负定", "半正定", "不定"],
      explanation: ans === "正定"
        ? explain([`对任意 (x,y)≠(0,0)，f = ${a}x² + ${b}y² > 0。`, "恒为正，故正定。"], "结论：二次型正定。", "correct")
        : ans === "负定"
          ? explain([`对任意 (x,y)≠(0,0)，f = ${a}x² + ${b}y² < 0。`, "恒为负，故负定。"], "结论：二次型负定。", "correct")
          : ans === "半正定"
            ? explain([`f = ${b}y² ≥ 0，且存在非零向量使 f=0。`, "恒非负且可取零，故半正定（不正定）。"], "结论：二次型半正定。", "method")
            : explain([`沿 x 轴 f(x,0)=${a}x²，沿 y 轴 f(0,y)=${b}y²，符号相反。`, "符号不恒定，故不定。"], "结论：二次型不定。", "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 8, make: (i) => {
    const T = [[1, 1, 1], [2, 0, 3], [1, 2, 1], [3, 1, 2], [2, 1, 1], [1, 1, 2], [3, 2, 1], [2, 2, 2]], [a, b, c] = T[i];
    return { stem: `二次型 f = ${a}x² + ${2 * b}xy + ${c}y² 对应的矩阵为（　）。`, answer: `[[${a},${b}],[${b},${c}]]`, distractors: [`[[${a},${2 * b}],[${2 * b},${c}]]`, `[[${a},0],[0,${c}]]`, `[[${a},${b}],[0,${c}]]`],
      explanation: explain([
        "二次型 f = ax² + 2bxy + cy² 对应矩阵 [[a,b],[b,c]]。",
        "交叉项 xy 的系数一半放在矩阵的 (1,2) 与 (2,1) 位置。",
      ], `结论：矩阵为 [[${a},${b}],[${b},${c}]]。`, "method") };
  } },
  { chapter: ch, type: "choice", difficulty: 3, variants: 2, make: (i) => {
    return i === 0
      ? { stem: "实对称矩阵 A 正定的充要条件是（　）。", answer: "A 的顺序主子式全大于 0", distractors: ["A 的主对角线元素全大于 0", "det(A) > 0", "A 的特征值全不为 0"],
          explanation: explain([
            "正定性的判别：顺序主子式全大于 0 是充要条件。",
            "“主对角线元素全大于 0”只是必要条件，不是充分条件。",
          ], "结论：充要条件为顺序主子式全大于 0。", "method") }
      : { stem: "二次型的规范形由下列哪一项唯一确定（　）。", answer: "正、负惯性指数", distractors: ["二次型的次数", "变量的个数", "矩阵的阶数"],
          explanation: explain([
            "惯性定理：规范形由正、负惯性指数唯一确定。",
            "即二次型经可逆线性变换可化为规范形，其形式只取决于正负平方项个数。",
          ], "结论：由正、负惯性指数唯一确定。", "correct") };
  } },
];

/* ================= 概率统计 ================= */

export const probEvt = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [
      [0.5, 0.4, 0.2], [0.6, 0.3, 0.1], [0.4, 0.5, 0.3], [0.5, 0.5, 0.1],
      [0.3, 0.4, 0.1], [0.7, 0.2, 0.1], [0.4, 0.4, 0.2], [0.6, 0.5, 0.3],
    ], [pa, pb, pab] = T[i];
    const ans = +(pa + pb - pab).toFixed(4);
    return { stem: `设 P(A)=${pa}，P(B)=${pb}，P(AB)=${pab}，则 P(A∪B) = ____。`, answer: num(ans),
      explanation: explain([
        "加法公式：P(A∪B) = P(A) + P(B) − P(AB)。",
        `${pa} + ${pb} − ${pab} = ${num(ans)}。`,
      ], `结论：P(A∪B) = ${num(ans)}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [
      [0.2, 0.4], [0.1, 0.25], [0.3, 0.5], [0.2, 0.8],
      [0.3, 0.6], [0.1, 0.5], [0.4, 0.8], [0.2, 0.5],
    ], [pab, pb] = T[i];
    return { stem: `设 P(AB)=${pab}，P(B)=${pb}，则 P(A|B) = ____。`, answer: num(pab / pb),
      explanation: explain([
        "条件概率公式：P(A|B) = P(AB) / P(B)。",
        `${pab} / ${pb} = ${num(pab / pb)}。`,
      ], `结论：P(A|B) = ${num(pab / pb)}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [
      { stem: "若事件 A 与 B 相互独立，则 P(AB) = （　）。", answer: "P(A)P(B)", distractors: ["P(A) + P(B)", "P(A) − P(B)", "P(A|B)P(A)"],
        exp: ["独立性的定义：P(AB) = P(A)P(B)。", "等价地有 P(A|B) = P(A)（当 P(B)>0）。"], concl: "P(AB) = P(A)P(B)。" },
      { stem: "若事件 A 与 B 互斥，且 P(A)>0、P(B)>0，则 A 与 B（　）。", answer: "一定不独立", distractors: ["一定独立", "可能独立", "互为对立事件"],
        exp: ["互斥得 AB = ∅，P(AB) = 0。", "而 P(A)P(B) > 0，二者不相等，故不独立。"], concl: "互斥且概率为正的事件一定不独立。" },
      { stem: "设 A 为任一事件，则 P(Ā) = （　）。", answer: "1 − P(A)", distractors: ["P(A)", "P(A) − 1", "0"],
        exp: ["对立事件满足 A ∪ Ā = Ω 且 A ∩ Ā = ∅。", "由加法公式：P(A) + P(Ā) = 1。"], concl: "P(Ā) = 1 − P(A)。" },
      { stem: "若 A 与 B 互斥，则 P(A∪B) = （　）。", answer: "P(A) + P(B)", distractors: ["P(A)P(B)", "P(A) − P(B)", "P(A)/P(B)"],
        exp: ["互斥时 AB = ∅，P(AB) = 0。", "加法公式退化为 P(A∪B) = P(A) + P(B)。"], concl: "P(A∪B) = P(A) + P(B)。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [
      [2, 1, "1/36"], [3, 2, "1/18"], [4, 3, "1/12"], [5, 4, "1/9"],
      [6, 5, "5/36"], [7, 6, "1/6"], [8, 5, "5/36"], [9, 4, "1/9"],
    ], [s, m, ans] = T[i];
    return { stem: `同时掷两枚均匀骰子，点数之和为 ${s} 的概率为 ____。`, answer: ans,
      explanation: explain([
        "样本空间含 6×6 = 36 个等可能结果。",
        `点数和为 ${s} 的结果数为 ${m}（枚举可得）。`,
        `概率 = ${m}/36 = ${ans}。`,
      ], `结论：概率 = ${ans}。`, "calc") };
  } },
];

export const probDist = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [
      [10, 0.2], [8, 0.5], [12, 0.25], [6, 0.3],
      [5, 0.4], [10, 0.3], [4, 0.5], [8, 0.25],
    ], [n, p] = T[i];
    return { stem: `设 X ~ B(${n}, ${p})（二项分布），则 E(X) = ____。`, answer: num(n * p),
      explanation: explain([
        "二项分布 B(n,p) 的数学期望为 np。",
        `${n} × ${p} = ${num(n * p)}。`,
      ], `结论：E(X) = ${num(n * p)}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [[0, 2], [2, 6], [1, 5], [3, 9], [0, 4], [1, 3], [2, 8], [4, 6]], [a, b] = T[i];
    return { stem: `设 X ~ U(${a}, ${b})（均匀分布），则 E(X) = ____。`, answer: num((a + b) / 2),
      explanation: explain([
        "均匀分布 U(a,b) 的期望为区间中点 (a+b)/2。",
        `(${a} + ${b})/2 = ${num((a + b) / 2)}。`,
      ], `结论：E(X) = ${num((a + b) / 2)}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [
      { stem: "设 X ~ N(μ, σ²)，则 P(X ≤ μ) = （　）。", answer: "1/2", distractors: ["0", "1", "μ"],
        exp: ["正态分布密度关于 x=μ 对称。", "中位数等于均值，故 P(X≤μ) = 1/2。"], concl: "P(X ≤ μ) = 1/2。" },
      { stem: "设 X ~ P(λ)（泊松分布），则 E(X) = （　）。", answer: "λ", distractors: ["λ²", "√λ", "1/λ"],
        exp: ["泊松分布的期望等于参数 λ。", "事实上泊松分布的期望与方差均为 λ。"], concl: "E(X) = λ。" },
      { stem: "设 X 服从参数为 λ 的指数分布 Exp(λ)，则 E(X) = （　）。", answer: "1/λ", distractors: ["λ", "λ²", "√λ"],
        exp: ["指数分布 Exp(λ) 的期望为 1/λ，方差为 1/λ²。", "参数 λ 越大，平均等待时间越短。"], concl: "E(X) = 1/λ。" },
      { stem: "设 X ~ N(μ, σ²)，则标准化变量 (X−μ)/σ 服从（　）。", answer: "N(0,1)", distractors: ["N(μ,σ²)", "N(0,σ²)", "N(1,0)"],
        exp: ["正态分布标准化：减去均值再除以标准差。", "(X−μ)/σ ~ N(0,1) 是查表计算概率的基础。"], concl: "(X−μ)/σ ~ N(0,1)。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "correct") };
  } },
];

export const probJoint = (ch) => [
  { chapter: ch, type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [
      { stem: "若二维随机变量 (X,Y) 中 X 与 Y 相互独立，则联合密度 f(x,y) 与边缘密度 f_X(x)、f_Y(y) 的关系是（　）。", answer: "f(x,y) = f_X(x)·f_Y(y)", distractors: ["f(x,y) = f_X(x) + f_Y(y)", "f(x,y) = f_X(x) − f_Y(y)", "f(x,y) = f_X(x)/f_Y(y)"],
        exp: ["独立性的等价刻画：联合密度等于边缘密度之积。", "对离散型同样成立：P(X=x,Y=y) = P(X=x)P(Y=y)。"], concl: "f(x,y) = f_X(x)f_Y(y)。" },
      { stem: "设 X、Y 相互独立，则 E(XY) = （　）。", answer: "E(X)E(Y)", distractors: ["E(X) + E(Y)", "E(X) − E(Y)", "D(X)D(Y)"],
        exp: ["独立随机变量乘积的期望等于期望的乘积。", "一般地 E(XY) = E(X)E(Y) 当且仅当 X、Y 不相关，独立必不相关。"], concl: "E(XY) = E(X)E(Y)。" },
      { stem: "若随机变量 X 与 Y 的相关系数 ρ(X,Y) = 0，则（　）。", answer: "X 与 Y 不相关（但不一定独立）", distractors: ["X 与 Y 一定独立", "X 与 Y 一定不独立", "X 与 Y 一定相等"],
        exp: ["相关系数为 0 称为不相关，只说明二者没有线性关系。", "独立 ⟹ 不相关，但反之不成立（可能存在非线性关系）。"], concl: "ρ=0 表示不相关，但不一定独立。" },
      { stem: "对任意随机变量 X、Y，恒有 E(X+Y) = （　）。", answer: "E(X) + E(Y)", distractors: ["E(X)E(Y)", "E(X) − E(Y)", "E(X)/E(Y)"],
        exp: ["期望的线性性质对任意随机变量成立，无需独立。", "E(X+Y) = E(X) + E(Y) 恒成立。"], concl: "E(X+Y) = E(X) + E(Y)。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [[2, 3], [3, 2], [4, 1], [1, 5], [2, 2], [3, 4], [5, 1], [2, 1]], [a, b] = T[i];
    return { stem: `协方差性质：Cov(${a}X, ${b}Y) = ____·Cov(X, Y)。`, answer: num(a * b),
      explanation: explain([
        "协方差的双线性性质：Cov(aX, bY) = ab·Cov(X,Y)。",
        `${a} × ${b} = ${a * b}。`,
      ], `结论：Cov(${a}X, ${b}Y) = ${a * b}Cov(X,Y)。`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [
      [[0.2, 0.1, 0.3], 0.3], [[0.3, 0.1, 0.2], 0.4], [[0.1, 0.4, 0.2], 0.5], [[0.25, 0.25, 0.1], 0.5],
      [[0.1, 0.2, 0.2], 0.5], [[0.2, 0.3, 0.1], 0.6], [[0.1, 0.1, 0.1], 0.3], [[0.4, 0.2, 0.1], 0.7],
    ], [row, p1] = T[i];
    return { stem: `二维离散型随机变量 (X,Y) 的联合分布中，P(X=1, Y=j)（j=1,2,3）分别为 ${row.join("、")}，则 P(X=1) = ____。`, answer: num(p1),
      explanation: explain([
        "边缘概率 = 联合概率在该行上的求和。",
        `${row.join(" + ")} = ${num(p1)}。`,
      ], `结论：P(X=1) = ${num(p1)}。`, "calc") };
  } },
];

export const probMom = (ch) => [
  { chapter: ch, type: "fill", difficulty: 1, variants: 8, make: (i) => {
    const T = [
      [2, 3, 5], [3, -1, 2], [4, 2, 1], [-2, 5, 3],
      [1, 4, 6], [3, 1, -2], [2, -3, 4], [5, 2, 1],
    ], [a, b, mu] = T[i];
    return { stem: `设 E(X) = ${mu}，则 E(${a}X + ${b}) = ____。`, answer: num(a * mu + b),
      explanation: explain([
        "期望的线性性质：E(aX + b) = aE(X) + b。",
        `${a} × ${mu} + ${b} = ${num(a * mu + b)}。`,
      ], `结论：E(${a}X + ${b}) = ${num(a * mu + b)}。`, "calc") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [[2, 4], [3, 1], [5, 2], [3, 3], [2, 1], [4, 2], [3, 2], [2, 5]], [a, d] = T[i];
    return { stem: `设 D(X) = ${d}，则 D(${a}X + 1) = ____。`, answer: num(a * a * d),
      explanation: explain([
        "方差性质：D(aX + b) = a²D(X)，常数项不影响方差。",
        `${a}² × ${d} = ${a * a} × ${d} = ${num(a * a * d)}。`,
      ], `结论：D(${a}X + 1) = ${num(a * a * d)}。`, "calc") };
  } },
  { chapter: ch, type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const T = [
      { stem: "下列关于方差的计算公式正确的是（　）。", answer: "D(X) = E(X²) − [E(X)]²", distractors: ["D(X) = E(X²) + [E(X)]²", "D(X) = [E(X)]² − E(X²)", "D(X) = E(X)"],
        exp: ["方差定义：D(X) = E[(X−E(X))²]。", "展开化简得 D(X) = E(X²) − [E(X)]²，是常用计算公式。"], concl: "D(X) = E(X²) − [E(X)]²。" },
      { stem: "两个随机变量的相关系数 ρ 的取值范围是（　）。", answer: "−1 ≤ ρ ≤ 1", distractors: ["0 ≤ ρ ≤ 1", "ρ ≥ 0", "ρ ≤ 1"],
        exp: ["相关系数描述线性相关程度，由柯西不等式可知 |ρ| ≤ 1。", "ρ=±1 对应完全线性相关，ρ=0 对应不相关。"], concl: "−1 ≤ ρ ≤ 1。" },
      { stem: "若 X 与 Y 相互独立，则（　）。", answer: "Cov(X,Y) = 0", distractors: ["Cov(X,Y) = 1", "Cov(X,Y) = D(X)", "Cov(X,Y) = D(Y)"],
        exp: ["独立 ⟹ 不相关 ⟹ 协方差为 0。", "但 Cov(X,Y)=0 推不出独立。"], concl: "Cov(X,Y) = 0。" },
      { stem: "设 X ~ B(n, p)，则 D(X) = （　）。", answer: "np(1−p)", distractors: ["np", "n(1−p)", "p(1−p)"],
        exp: ["二项分布的方差公式为 np(1−p)。", "期望为 np，二者配套记忆。"], concl: "D(X) = np(1−p)。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "correct") };
  } },
];

export const probLLN = (ch) => [
  { chapter: ch, type: "choice", difficulty: 1, variants: 4, make: (i) => {
    const T = [
      { stem: "大数定律表明：在重复试验中，事件发生的频率依概率收敛于（　）。", answer: "该事件的概率", distractors: ["1", "0", "事件的频率"],
        exp: ["伯努利大数定律：试验次数充分大时频率以概率 1 接近概率。", "这是用频率估计概率的理论依据。"], concl: "频率收敛于概率。" },
      { stem: "切比雪夫不等式：对任意随机变量 X 和 ε>0，有 P(|X−E(X)| ≥ ε) ≤ （　）。", answer: "D(X)/ε²", distractors: ["D(X)/ε", "ε²/D(X)", "D(X)"],
        exp: ["切比雪夫不等式给出偏离均值的概率上界。", "该不等式不需要知道 X 的分布，只需要期望和方差。"], concl: "P(|X−E(X)| ≥ ε) ≤ D(X)/ε²。" },
      { stem: "设 X₁,…,Xₙ 独立同分布，E(Xᵢ)=μ，D(Xᵢ)=σ²，则当 n 充分大时，ΣXᵢ 近似服从（　）。", answer: "N(nμ, nσ²)", distractors: ["N(μ, σ²)", "N(0,1)", "N(nμ, σ²)"],
        exp: ["独立同分布中心极限定理：和式近似正态。", "均值相加得 nμ，方差相加得 nσ²。"], concl: "ΣXᵢ 近似服从 N(nμ, nσ²)。" },
      { stem: "中心极限定理说明（　）。", answer: "大量独立同分布随机变量之和近似服从正态分布", distractors: ["任何随机变量都服从正态分布", "样本均值永远等于总体均值", "方差总是有限的"],
        exp: ["中心极限定理是正态分布广泛存在的原因。", "只要 n 足够大，标准化后的和式近似标准正态。"], concl: "和式近似正态。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 2, variants: 8, make: (i) => {
    const T = [[4, 3], [9, 4], [4, 5], [9, 5], [16, 3], [4, 7], [9, 7], [16, 5]], [d, e] = T[i];
    return { stem: `设 D(X) = ${d}，由切比雪夫不等式，P(|X − E(X)| ≥ ${e}) ≤ ____。`, answer: f([d, e * e]),
      explanation: explain([
        "切比雪夫不等式：P(|X−E(X)| ≥ ε) ≤ D(X)/ε²。",
        `P ≥ ${e} ≤ ${d}/${e * e} = ${f([d, e * e])}。`,
      ], `结论：概率不超过 ${f([d, e * e])}。`, "calc") };
  } },
];

export const stat = (ch) => [
  { chapter: ch, type: "choice", difficulty: 2, variants: 4, make: (i) => {
    const T = [
      { stem: "设 X₁,…,Xₙ 为来自总体 X 的样本，S² 为样本方差，则 E(S²) = σ²，说明 S² 是 σ² 的（　）估计。", answer: "无偏", distractors: ["有偏", "一致", "有效"],
        exp: ["无偏性定义：估计量的期望等于被估参数。", "E(S²) = σ²，因此样本方差是总体方差的无偏估计。"], concl: "S² 是 σ² 的无偏估计。" },
      { stem: "设 X₁,…,Xₙ 为来自均值为 μ 的总体的样本，则样本均值 X̄ 满足 E(X̄) = （　）。", answer: "μ", distractors: ["μ/n", "nμ", "0"],
        exp: ["E(X̄) = E[(X₁+…+Xₙ)/n] = (nμ)/n = μ。", "因此样本均值是总体均值的无偏估计。"], concl: "E(X̄) = μ。" },
      { stem: "设 X₁,…,Xₙ 来自正态总体 N(μ, σ²)，则 (n−1)S²/σ² 服从（　）。", answer: "χ²(n−1)", distractors: ["χ²(n)", "t(n−1)", "N(0,1)"],
        exp: ["抽样分布定理：样本方差与总体方差之比构成卡方统计量。", "(n−1)S²/σ² ~ χ²(n−1)，自由度为 n−1。"], concl: "(n−1)S²/σ² ~ χ²(n−1)。" },
      { stem: "在其他条件不变时，增大置信水平 1−α，置信区间的长度（　）。", answer: "变长", distractors: ["变短", "不变", "无法确定"],
        exp: ["置信水平越高，需要覆盖的分布区域越大。", "临界值增大，区间长度随之变长。"], concl: "置信区间变长。" },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer, distractors: q.distractors,
      explanation: explain(q.exp, `结论：${q.concl}`, "correct") };
  } },
  { chapter: ch, type: "fill", difficulty: 1, variants: 4, make: (i) => {
    const T = [
      { stem: "设 X̄ 为来自均值为 μ 的总体的样本均值，则 E(X̄) = ____。", answer: "μ",
        exp: ["样本均值期望等于总体均值：E(X̄) = (nμ)/n = μ。"] },
      { stem: "设 X₁,…,Xₙ 来自总体 N(μ, σ²)，则样本均值 X̄ 的标准差为 ____。", answer: "σ/√n",
        exp: ["D(X̄) = σ²/n，因此标准差为 σ/√n。", "样本容量越大，均值越稳定。"] },
      { stem: "设样本方差 S² = Σ(Xᵢ − X̄)² / ____，其分母为（填数字）。", answer: "n−1",
        exp: ["样本方差采用自由度 n−1 作分母。", "这样得到的 S² 才是总体方差的无偏估计。"] },
      { stem: "设 X₁,…,Xₙ 来自总体 N(μ, σ²)，则 D(X̄) = ____。", answer: "σ²/n",
        exp: ["独立同分布样本均值的方差等于总体方差除以样本量。", "D(X̄) = σ²/n。" ] },
    ], q = T[i];
    return { stem: q.stem, answer: q.answer,
      explanation: explain(q.exp, `结论：${q.answer}。`, "correct") };
  } },
];
