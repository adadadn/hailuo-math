// 海螺游学 · 核心纯逻辑模块
// 设计目标：可在 Node 中直接单测（CJS 导出），浏览器端由 app.js 引用（window.Core 全局）。
// 本模块不含任何 DOM / localStorage / fetch 依赖。兼容经典脚本，不依赖 ES module。

(function (global) {
  "use strict";

  const MISTAKE_RESULTS = ["incorrect", "unknown", "partial"];
  const RECENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 近期去重窗口：14 天
  const OVERDUE_DAYS = 7; // 超过 7 天未练习视为久未复习
  const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30]; // 记忆曲线：复习间隔（天）
  const EXAM_MINUTES_PER_QUESTION = 2; // 模拟考试每题限时（分钟）

  // 复习阶段推进：答错/不会/部分正确 → 回到第 0 阶段（明天复习）；答对 → 阶段 +1
  function nextReviewStage(result, stage = 0) {
    const s = Number.isFinite(stage) && stage > 0 ? stage : 0;
    if (MISTAKE_RESULTS.includes(result)) return 0;
    return Math.min(s + 1, REVIEW_INTERVALS.length - 1);
  }
  function reviewDueAt(stage, now = Date.now()) {
    const s = Math.max(0, Math.min(Math.trunc(stage) || 0, REVIEW_INTERVALS.length - 1));
    return now + REVIEW_INTERVALS[s] * 86400000;
  }
  // 到期待复习的题目 id（按到期时间升序）
  function dueReviewIds(reviews, now = Date.now()) {
    return Object.entries(reviews || {})
      .filter(([, r]) => r && Number.isFinite(r.due) && r.due <= now)
      .map(([id]) => id)
      .sort((a, b) => reviews[a].due - reviews[b].due);
  }

  // 确定性伪随机（seed 相同则结果相同，便于测试与复现）
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // 难度筛选：all 全部 / basic 基础（难度 ≤2）/ hard 拔高（难度 ≥3）
  const DIFFICULTY_FILTERS = {
    all: () => true,
    basic: (q) => (Number(q.difficulty) || 1) <= 2,
    hard: (q) => (Number(q.difficulty) || 1) >= 3,
  };

  /**
   * 模拟考试组卷：只取客观题（选择/填空），题型交替、顺序打散。
   * @returns {{items: Array<object>, notice: string}} items 为题目对象数组
   */
  function buildExamPlan({ questions, project, chapter = "all", count, seed = Date.now(), difficulty = "all" }) {
    const diffOk = DIFFICULTY_FILTERS[difficulty] || DIFFICULTY_FILTERS.all;
    let pool = questions.filter((q) => q.project === project && q.reviewStatus === "approved" && q.type !== "essay" && (chapter === "all" || q.chapter === chapter) && diffOk(q));
    if (pool.length < count) {
      return { items: [], notice: `当前范围只有 ${pool.length} 道客观题，不足以组成 ${count} 道试卷。` };
    }
    const rand = mulberry32(seed);
    const shuffled = pool.slice().sort(() => rand() - 0.5).slice(0, count);
    const buckets = { choice: [], fill: [] };
    for (const q of shuffled) buckets[q.type].push(q);
    const rotated = [];
    let slot = 0;
    while (rotated.length < count && slot < count * 4) {
      const next = buckets[slot % 2 === 0 ? "choice" : "fill"].shift();
      if (next) rotated.push(next);
      slot += 1;
    }
    return { items: rotated };
  }

  /**
   * 模拟考试判分：按试卷题目清单逐题判分（未作答计为错误），填空/选择用答案比对。
   * @param {Array} questions 全量题库
   * @param {Object} answers 已作答映射 { id: 答案 }（可缺失，缺失视为未作答）
   * @param {Array} [questionIds] 试卷题目顺序；缺省时按 answers 的键
   * @returns {{correct: number, total: number, accuracy: number, details: Array}}
   */
  function scoreExam(questions, answers, questionIds) {
    const ids = Array.isArray(questionIds) && questionIds.length ? questionIds : Object.keys(answers || {});
    let correct = 0;
    const details = [];
    for (const id of ids) {
      const q = questions.find((x) => x.id === id);
      if (!q) continue;
      const raw = answers && answers[id] !== undefined ? answers[id] : "";
      const submitted = raw === null ? "" : String(raw);
      const ok = submitted.trim() !== "" && answersMatch(submitted, q.answer);
      if (ok) correct += 1;
      details.push({ id, question: q, submitted, correct: ok });
    }
    const total = details.length;
    return { correct, total, accuracy: total ? correct / total : 0, details };
  }

  // 常用数学符号归一化：统一上下标、全角/半角、减号等写法
  const UNI_MAP = {
    "²": "^2", "³": "^3", "¹": "^1", "⁰": "^0", "⁴": "^4", "⁵": "^5",
    "⁶": "^6", "⁷": "^7", "⁸": "^8", "⁹": "^9", "⁻": "^-", "⁺": "^+", "ˣ": "^x",
    "×": "*", "÷": "/", "−": "-", "－": "-", "＋": "+", "﹢": "+", "π": "pi", "∞": "inf",
  };

  function normalizeAnswer(value) {
    let s = String(value == null ? "" : value).toLowerCase().trim();
    for (const [k, v] of Object.entries(UNI_MAP)) s = s.split(k).join(v);
    // 全角字符转半角
    s = s.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
    s = s.replace(/\s+/g, "");
    s = s.replace(/[{}（）]/g, "");
    // 指数写法归一：Ce^(2x) 与 Ce^2x 视为等价；不影响普通括号表达式如 (e-1)/2
    s = s.replace(/\^\(([^()]*)\)/g, "^$1");
    return s;
  }

  // 安全四则运算求值器：只支持数字与 + - * / ^ ( ) .，不含函数、标识符、eval
  function safeEvaluate(expr) {
    const src = String(expr).replace(/\s+/g, "");
    if (!src) return NaN;
    const tokens = [];
    const re = /\d+\.?\d*|\.\d+|[+\-*/^()]/g;
    let m;
    while ((m = re.exec(src)) !== null) tokens.push(m[0]);
    if (tokens.join("") !== src) return NaN;

    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];
    const parseAtom = () => {
      const t = next();
      if (t === "(") {
        const v = parseExpr();
        if (next() !== ")") return NaN;
        return v;
      }
      if (t === undefined) return NaN;
      const n = Number(t);
      return Number.isFinite(n) ? n : NaN;
    };
    const parseFactor = () => {
      if (peek() === "+" || peek() === "-") {
        const op = next();
        const v = parseFactor();
        return op === "-" ? -v : v;
      }
      const base = parseAtom();
      if (peek() === "^") {
        next();
        const exp = parseFactor();
        return Math.pow(base, exp);
      }
      return base;
    };
    const parseTerm = () => {
      let v = parseFactor();
      while (peek() === "*" || peek() === "/") {
        const op = next();
        const r = parseFactor();
        v = op === "*" ? v * r : v / r;
      }
      return v;
    };
    const parseExpr = () => {
      let v = parseTerm();
      while (peek() === "+" || peek() === "-") {
        const op = next();
        const r = parseTerm();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    };

    try {
      const result = parseExpr();
      if (pos !== tokens.length) return NaN; // 有多余字符，如 "1)("
      return result;
    } catch {
      return NaN;
    }
  }

  // 答案比对：先做字符串归一化，无法匹配时若两侧都是纯数值表达式则做数值等价判断
  function answersMatch(userAnswer, expectedAnswer) {
    const u = normalizeAnswer(userAnswer);
    const e = normalizeAnswer(expectedAnswer);
    if (u === e) return true;
    const isNumeric = (s) => /^[0-9+\-*/().^]+$/.test(s) && /\d/.test(s);
    if (isNumeric(u) && isNumeric(e)) {
      const a = safeEvaluate(u);
      const b = safeEvaluate(e);
      if (Number.isFinite(a) && Number.isFinite(b)) return Math.abs(a - b) < 1e-9;
    }
    return false;
  }

  /**
   * 自适应组卷。
   * @param {{questions: Array, attempts: Object, project: string, chapter?: string, sub?: string, count: number, now?: number}} input
   * @returns {{items: Array<{id: string, reason: string}>, chapter: string, notice: string}}
   *   items 为空时表示当前范围无可组卷题目，调用方应阻止创建题单。
   */
  function buildDailyPlan({ questions, attempts, project, chapter = "all", sub = "all", count, now = Date.now(), difficulty = "all" }) {
    const diffOk = DIFFICULTY_FILTERS[difficulty] || DIFFICULTY_FILTERS.all;
    let pool = questions.filter((q) => q.project === project && q.reviewStatus === "approved" && (chapter === "all" || q.chapter === chapter) && (sub === "all" || q.sub === sub) && diffOk(q));
    let notice = "";

    if (pool.length === 0) {
      // 防呆：所选范围无题时提示用户，不静默回退组卷
      const msg = chapter === "all"
        ? "当前项目还没有满足该难度要求的已审核题目，请更换难度后再试。"
        : "所选章节暂无满足该难度要求的已审核题目，请在章节范围中选择其他章节或「全部章节」，或更换难度后再试。";
      return { items: [], chapter, sub, notice: msg, fallback: true };
    }

    const cutoff = now - RECENT_WINDOW_MS;
    const recentIds = new Set();
    const mistakeIds = new Set();
    for (const [id, a] of Object.entries(attempts || {})) {
      if (!a || !a.confirmed) continue;
      const t = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      if (MISTAKE_RESULTS.includes(a.result)) mistakeIds.add(id);
      if (t >= cutoff) recentIds.add(id);
    }

    const scored = pool.map((q) => {
      const a = attempts ? attempts[q.id] : null;
      let score = 0;
      let reason;
      if (a && mistakeIds.has(q.id)) {
        score += 100;
        reason = "错题优先，需再练";
      } else if (!a) {
        score += 40;
        reason = "新题，尚未练习";
      } else if (recentIds.has(q.id)) {
        score -= 60;
        reason = "近期已练（题库补足）";
      } else {
        score += 20;
        reason = "巩固复习";
      }
      if (a && a.updatedAt) {
        const days = Math.floor((now - new Date(a.updatedAt).getTime()) / 86400000);
        if (days >= OVERDUE_DAYS && !mistakeIds.has(q.id)) {
          score += 30;
          reason = `${days} 天未复习`;
        }
      }
      return { q, score, reason };
    });
    scored.sort((a, b) => b.score - a.score);

    // 类型轮换：题单按 选择→填空→解答 交替，避免同类型扎堆；高分/错题优先体现在“先被取入”
    const TYPE_ORDER = ["choice", "fill", "essay"];
    const chosen = scored.slice(0, count);
    const buckets = { choice: [], fill: [], essay: [] };
    for (const s of chosen) buckets[s.q.type].push(s);
    const rotated = [];
    let slot = 0;
    while (rotated.length < chosen.length && slot < 40) {
      const t = TYPE_ORDER[slot % TYPE_ORDER.length];
      const next = buckets[t].shift();
      if (next) rotated.push(next);
      slot += 1;
    }
    const ordered = rotated.length === chosen.length ? rotated : chosen;

    let items = ordered.map((s) => ({ id: s.q.id, qKind: s.q.kind, reason: s.reason }));

    // 真题配比：若题库含真题且题单 >=3 道，尽量保底放入 1 道真题
    if (count >= 3 && items.length > 0 && !items.some((it) => it.qKind === "real")) {
      const real = pool.find((q) => q.kind === "real" && !items.some((it) => it.id === q.id));
      if (real) {
        const swapIdx = items.findIndex((it) => it.qKind !== "real");
        if (swapIdx >= 0) {
          items[swapIdx] = { id: real.id, qKind: "real", reason: "真题配比" };
        }
      }
    }
    items = items.map(({ id, reason }) => ({ id, reason }));

    if (pool.length < count) {
      notice = (notice ? notice + " " : "") + `当前筛选范围只有 ${pool.length} 道已审核题目，题单已按现有题库生成。`;
    }
    return { items, chapter, notice };
  }

  // 兼容层：Node(CJS) 供单测 / 浏览器(window.Core) 供经典脚本 app.js
  const Core = {
    MISTAKE_RESULTS, RECENT_WINDOW_MS, OVERDUE_DAYS, REVIEW_INTERVALS, EXAM_MINUTES_PER_QUESTION,
    DIFFICULTY_FILTERS, nextReviewStage, reviewDueAt, dueReviewIds,
    buildExamPlan, scoreExam, normalizeAnswer, safeEvaluate, answersMatch, buildDailyPlan,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  if (global) global.Core = Core;
})(typeof window !== "undefined" ? window : globalThis);
