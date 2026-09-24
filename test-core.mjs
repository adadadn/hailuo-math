// 考研数学 M1 核心逻辑单测（Node 运行，无需浏览器）
import { readFileSync } from "node:fs";
import Core from "./core.js";
const { normalizeAnswer, safeEvaluate, answersMatch, buildDailyPlan, MISTAKE_RESULTS, nextReviewStage, reviewDueAt, dueReviewIds, buildExamPlan, scoreExam, EXAM_MINUTES_PER_QUESTION } = Core;

let failures = 0;
const check = (name, cond, detail = "") => {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}${detail ? "  -> " + detail : ""}`);
  }
};

const questions = JSON.parse(readFileSync(new URL("./data/questions.json", import.meta.url), "utf8"));

console.log("== 题库数据完整性 ==");
const ids = new Set();
let bad = 0;
for (const q of questions) {
  if (ids.has(q.id)) { bad += 1; console.log("  duplicate id:", q.id); }
  ids.add(q.id);
  if (!q.id || !q.stem || !q.answer || !q.explanation || !q.chapter || !q.source || !q.difficulty || !q.kind || q.reviewStatus !== "approved" || !["choice", "fill", "essay"].includes(q.type)) {
    bad += 1;
    console.log("  missing/incorrect field:", q.id);
  }
  if (q.type === "choice" && (!Array.isArray(q.options) || !q.options.includes(q.answer))) {
    bad += 1;
    console.log("  choice answer not in options:", q.id);
  }
}
check("无重复/缺字段/选择题答案在选项中", bad === 0, `bad=${bad}`);
const counts = {};
for (const q of questions) counts[q.project] = (counts[q.project] || 0) + 1;
check("四项目每题 25+ 道", counts.math1 >= 25 && counts.math2 >= 25 && counts.math3 >= 25 && counts.calc396 >= 25, JSON.stringify(counts));
const covered = {};
for (const q of questions) covered[q.project] = new Set([...(covered[q.project] || []), q.chapter]);
for (const p of Object.keys(covered)) console.log(`  ${p} 覆盖章节数: ${covered[p].size}`);

console.log("== 答案归一化与数值比对 ==");
check("1/2 与 0.5 数值等价", answersMatch("1/2", "0.5"));
check("e^x+C 与 eˣ+C 归一化一致", answersMatch("e^x+C", "eˣ+C"));
check("y=Ce^(2x) 与 y=ce^2x 一致", answersMatch("y=Ce^(2x)", "y=ce^2x"));
check("x^2/2+C 与 x²/2+c 一致", answersMatch("x^2/2+C", "x²/2+c"));
check("2 与 2.0 数值等价", answersMatch("2", "2.0"));
check("(e-1)/2 与 0.859 不等（e 非数值）", !answersMatch("(e-1)/2", "0.859"));
check("错误答案不相符", !answersMatch("3", "1/2"));
check("safeEvaluate: 1/2=0.5", safeEvaluate("1/2") === 0.5);
check("safeEvaluate: 2^3=8", safeEvaluate("2^3") === 8);
check("safeEvaluate: (1+2)*3=9", safeEvaluate("(1+2)*3") === 9);
check("safeEvaluate 拒绝注入", Number.isNaN(safeEvaluate("2+alert(1)")));
check("safeEvaluate 拒绝空串", Number.isNaN(safeEvaluate("")));
check("safeEvaluate 拒绝多余括号", Number.isNaN(safeEvaluate("1)(")));

console.log("== 自适应组卷 ==");
const now = Date.now();
const day = 86400000;
const mkAttempt = (id, result, daysAgo) => ({ [id]: { questionId: id, result, confirmed: true, updatedAt: new Date(now - daysAgo * day).toISOString() } });

// 1. 全空历史：按题量取题，且带选题原因
{
  const plan = buildDailyPlan({ questions, attempts: {}, project: "math1", chapter: "all", count: 5, now });
  check("空历史：生成 5 道题", plan.items.length === 5, `len=${plan.items.length}`);
  check("空历史：每题都有原因", plan.items.every((it) => it.reason && it.reason.length > 0));
  check("空历史：原因含“新题”", plan.items[0].reason.includes("新题"));
  check("空历史：无不足提示", plan.notice === "", plan.notice);
}
// 2. 章节无题防呆（不静默回退，提示用户）
{
  const plan = buildDailyPlan({ questions, attempts: {}, project: "math1", chapter: "重积分", count: 3, now });
  check("章节有题：按章节内题量生成", plan.items.length === 3 && plan.chapter === "重积分", `len=${plan.items.length} chapter=${plan.chapter}`);
  const plan2 = buildDailyPlan({ questions, attempts: {}, project: "math1", chapter: "不存在的章节", count: 3, now });
  check("章节无题：items 为空且标记 fallback", plan2.items.length === 0 && plan2.fallback === true);
  check("章节无题：提示更换章节", plan2.notice.includes("其他章节"));
}
// 3. 错题优先
{
  const qs = questions.filter((q) => q.project === "math1");
  const wrongId = qs[0].id;
  const plan = buildDailyPlan({ questions, attempts: mkAttempt(wrongId, "incorrect", 2), project: "math1", chapter: "all", count: 5, now });
  check("错题优先：错题进入题单", plan.items.some((it) => it.id === wrongId));
  check("错题优先：排在最前", plan.items[0].id === wrongId);
  check("错题优先：原因标注", plan.items[0].reason.includes("错题"));
}
// 4. 14 天去重
{
  const qs = questions.filter((q) => q.project === "math1");
  const recentId = qs[1].id;
  const plan = buildDailyPlan({ questions, attempts: mkAttempt(recentId, "correct", 1), project: "math1", chapter: "all", count: 5, now });
  check("去重：近期做对的题不进题单（题库充足时）", !plan.items.some((it) => it.id === recentId), JSON.stringify(plan.items.map((i) => i.id)));
}
// 5. 题库不足时补足并提示
{
  const plan = buildDailyPlan({ questions, attempts: {}, project: "math1", chapter: "大数定律与中心极限定理", count: 40, now });
  check("题库不足：按现有题量生成", plan.items.length >= 10 && plan.items.length < 40, `len=${plan.items.length}`);
  check("题库不足：有提示", plan.notice.includes("只有"));
}
// 6. 空项目题库
{
  const empty = buildDailyPlan({ questions: [], attempts: {}, project: "math1", chapter: "all", count: 5, now });
  check("空题库：items 为空且带提示", empty.items.length === 0 && empty.notice.length > 0 && empty.fallback === true);
}
// 7. 题型轮换（合成题库验证算法，不依赖真实数据顺序）
{
  const mk = (id, type) => ({ id, project: "math1", chapter: "X", type, kind: "mock", reviewStatus: "approved", stem: id, answer: "1", explanation: "", source: "t", options: type === "choice" ? ["1", "2"] : undefined });
  const synthetic = [mk("e1", "essay"), mk("f1", "fill"), mk("c1", "choice"), mk("c2", "choice"), mk("e2", "essay"), mk("f2", "fill"), mk("c3", "choice"), mk("f3", "fill")];
  const t3 = buildDailyPlan({ questions: synthetic, attempts: {}, project: "math1", count: 3, now }).items.map((it) => synthetic.find((q) => q.id === it.id).type);
  check("轮换：3 题按 选择→填空→解答", t3.join(",") === "choice,fill,essay", t3.join(","));
  const t6 = buildDailyPlan({ questions: synthetic, attempts: {}, project: "math1", count: 6, now }).items.map((it) => synthetic.find((q) => q.id === it.id).type);
  check("轮换：6 题无相邻同类且三型齐全", t6.every((t, i) => i === 0 || t6[i - 1] !== t) && t6.includes("essay") && t6.includes("choice") && t6.includes("fill"), t6.join(","));
}
// 8. 错因集合
{
  check("MISTAKE_RESULTS 含三态", ["incorrect", "unknown", "partial"].every((r) => MISTAKE_RESULTS.includes(r)));
}

console.log("== 复习调度（记忆曲线） ==");
{
  const t = new Date("2026-09-22T00:00:00Z").getTime();
  check("答对：阶段 0→1", nextReviewStage("correct", 0) === 1);
  check("答对：阶段 1→2", nextReviewStage("correct", 1) === 2);
  check("答对：阶段 2→3", nextReviewStage("correct", 2) === 3);
  check("答对：阶段 4→5（30 天档）", nextReviewStage("correct", 4) === 5);
  check("答对：阶段 5 封顶", nextReviewStage("correct", 5) === 5);
  check("答错/不会/部分：重置回第 0 阶段", nextReviewStage("incorrect", 4) === 0 && nextReviewStage("unknown", 3) === 0 && nextReviewStage("partial", 2) === 0);
  check("间隔：阶段 0/1/2 对应 1/2/4 天", (reviewDueAt(0, t) - t) / 86400000 === 1 && (reviewDueAt(1, t) - t) / 86400000 === 2 && (reviewDueAt(2, t) - t) / 86400000 === 4);
  check("间隔：阶段 5 对应 30 天", (reviewDueAt(5, t) - t) / 86400000 === 30);
  const reviews = {
    a: { stage: 1, due: t - 1000 },   // 已到期
    b: { stage: 2, due: t + 86400000 }, // 明天到期
    c: { stage: 0 },                  // 异常记录（无 due）
  };
  const due = dueReviewIds(reviews, t);
  check("到期判断：只含已到期", due.includes("a") && !due.includes("b") && !due.includes("c"), due.join(","));
}

console.log("== 模拟考试组卷与判分 ==");
{
  const mk = (id, type, chapter) => ({ id, project: "math1", chapter, type, kind: "mock", reviewStatus: "approved", stem: id, answer: "1", explanation: "解析" + id, source: "t", options: type === "choice" ? ["1", "2"] : undefined });
  const pool = [mk("c1", "choice", "函数、极限与连续"), mk("c2", "choice", "函数、极限与连续"), mk("f1", "fill", "一元函数微分学"), mk("f2", "fill", "一元函数微分学"), mk("e1", "essay", "一元函数积分学")];
  const plan = buildExamPlan({ questions: pool, project: "math1", chapter: "all", count: 4, seed: 42 });
  check("考试组卷：只组客观题", plan.items.length === 4 && plan.items.every((q) => q.type !== "essay"), `len=${plan.items.length}`);
  check("考试组卷：题型交替（choice 在偶数位）", plan.items.every((q, i) => (i % 2 === 0) === (q.type === "choice")), plan.items.map((q) => q.type).join(","));
  const same = buildExamPlan({ questions: pool, project: "math1", chapter: "all", count: 4, seed: 42 });
  check("考试组卷：同 seed 结果确定", JSON.stringify(plan.items.map((q) => q.id)) === JSON.stringify(same.items.map((q) => q.id)));
  const chapterPlan = buildExamPlan({ questions: pool, project: "math1", chapter: "一元函数微分学", count: 2, seed: 1 });
  check("考试组卷：按章节过滤", chapterPlan.items.every((q) => q.chapter === "一元函数微分学") && chapterPlan.items.length === 2);
  const short = buildExamPlan({ questions: pool, project: "math1", chapter: "一元函数微分学", count: 4, seed: 1 });
  check("考试组卷：客观题不足时返回空并提示", short.items.length === 0 && short.notice.includes("只有"));
  const answers = { c1: "1", c2: "9", f1: "1" }; // c2 答错，f2 未作答
  const scored = scoreExam(pool, answers, ["c1", "c2", "f1", "f2"]);
  check("判分：正确数 2", scored.correct === 2, `correct=${scored.correct}`);
  check("判分：总数含未作答且正确率 0.5", scored.total === 4 && scored.accuracy === 0.5, JSON.stringify([scored.total, scored.accuracy]));
  check("判分：details 逐题且未作答计入", scored.details.length === 4 && scored.details.find((d) => d.question.id === "c2").correct === false && scored.details.find((d) => d.question.id === "f2").submitted === "");
  check("EXAM_MINUTES_PER_QUESTION = 2", EXAM_MINUTES_PER_QUESTION === 2);
}

console.log("== 难度筛选（基础/拔高） ==");
{
  const hardPlan = buildExamPlan({ questions, project: "math1", chapter: "all", count: 10, seed: 42, difficulty: "hard" });
  check("拔高考试卷：10 道且全部难度≥3", hardPlan.items.length === 10 && hardPlan.items.every((q) => (Number(q.difficulty) || 1) >= 3), `len=${hardPlan.items.length}`);
  const basicDaily = buildDailyPlan({ questions, attempts: {}, project: "math3", count: 5, difficulty: "basic" });
  check("基础每日练：5 道且全部难度≤2", basicDaily.items.length === 5 && basicDaily.items.every((q) => (Number(q.difficulty) || 1) <= 2), `len=${basicDaily.items.length}`);
  const noPool = buildDailyPlan({ questions, attempts: {}, project: "math2", chapter: "无穷级数", count: 3, difficulty: "hard" });
  check("拔高无题：防呆提示且不组卷", noPool.fallback === true && noPool.items.length === 0 && noPool.notice.includes("难度"));
  const mk = (id, d) => ({ id, project: "math1", chapter: "X", type: "fill", difficulty: d, kind: "mock", reviewStatus: "approved", stem: id, answer: "1", explanation: "", source: "t" });
  const mix = [mk("a", 1), mk("b", 2), mk("c", 3), mk("d", 4)];
  const hardOnly = buildDailyPlan({ questions: mix, attempts: {}, project: "math1", count: 3, difficulty: "hard" }).items.map((it) => it.id);
  check("混合池拔高：只取难度≥3", hardOnly.join(",") === "c,d", hardOnly.join(","));
}

console.log(failures === 0 ? "\n全部通过 ✔" : `\n${failures} 项失败 ✘`);
process.exit(failures === 0 ? 0 : 1);
