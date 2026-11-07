// 题库质量门禁：结构、答案、重复、覆盖、组卷去重。
// 任何一条失败都说明内容会直接暴露给用户，必须先修再发布。
import { readFileSync } from "node:fs";
import Core from "./core.js";

const { buildDailyPlan, buildExamPlan, stemKey, answersMatch } = Core;
const questions = JSON.parse(readFileSync(new URL("./data/questions.json", import.meta.url), "utf8"));
const curriculum = JSON.parse(readFileSync(new URL("./data/curriculum.json", import.meta.url), "utf8"));

let failures = 0;
const check = (name, cond, detail = "") => {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name}${detail ? `  -> ${detail}` : ""}`); }
};

console.log("== 题库结构 ==");
const ids = new Set();
const problems = [];
for (const q of questions) {
  const where = q && q.id ? q.id : "(no id)";
  if (ids.has(q.id)) problems.push(`${where}: 重复 id`);
  ids.add(q.id);
  for (const field of ["id", "project", "type", "stem", "answer", "explanation", "source", "chapter"]) {
    if (typeof q[field] !== "string" || !q[field].trim()) problems.push(`${where}: 缺字段 ${field}`);
  }
  if (!Number.isFinite(Number(q.difficulty)) || Number(q.difficulty) < 1) problems.push(`${where}: 难度异常`);
  if (!["choice", "fill", "essay"].includes(q.type)) problems.push(`${where}: 题型异常`);
  if (q.reviewStatus !== "approved") problems.push(`${where}: 未审核入正式题库`);
  if (String(q.explanation).trim().length < 20) problems.push(`${where}: 解析过短`);
}
check("必填字段、题型、难度、审核状态齐全", problems.length === 0, problems.slice(0, 5).join(" | "));

console.log("== 选择题选项 ==");
const optionProblems = [];
for (const q of questions) {
  if (q.type !== "choice") continue;
  const opts = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : [];
  if (opts.length < 2) optionProblems.push(`${q.id}: 选项不足`);
  if (new Set(opts).size !== opts.length) optionProblems.push(`${q.id}: 选项重复`);
  if (!opts.includes(String(q.answer).trim())) optionProblems.push(`${q.id}: 答案不在选项中`);
  // 矩阵选项被拆成 "[B⁻¹ 0" 这类碎片时，方括号只出现一半；区间写法 "(-∞,-2]" 不算
  const looksFragment = (o) => (o.includes("[") && !o.includes("]")) || (o.includes("]") && !o.includes("[") && !o.trim().startsWith("("));
  if (opts.some(looksFragment)) optionProblems.push(`${q.id}: 选项疑似矩阵碎片`);
  // 解析里写「选 B」时必须和实际答案位置一致，否则用户会被带偏
  const answerLetter = "ABCDEF"[opts.indexOf(String(q.answer).trim())];
  const referenced = [...String(q.explanation).matchAll(/选\s*([A-F])/g)].map((m) => m[1]);
  if (answerLetter && referenced.some((letter) => letter !== answerLetter)) optionProblems.push(`${q.id}: 解析选项字母与答案不符`);
}
check("每道选择题选项唯一且含标准答案", optionProblems.length === 0, optionProblems.slice(0, 5).join(" | "));

console.log("== 同题去重 ==");
const byStem = new Map();
for (const q of questions) {
  const key = `${q.project}|${stemKey(q.stem)}`;
  if (byStem.has(key)) byStem.get(key).push(q);
  else byStem.set(key, [q]);
}
const dupGroups = [...byStem.values()].filter((group) => group.length > 1);
check("同一科目内没有题干重复", dupGroups.length === 0, dupGroups.slice(0, 3).map((g) => g.map((q) => q.id).join(",")).join(" | "));

const crossProject = new Map();
for (const q of questions) {
  const key = stemKey(q.stem);
  if (crossProject.has(key)) crossProject.get(key).push(q);
  else crossProject.set(key, [q]);
}
// 跨科目共用的题干允许存在（如 396 与数学三共享知识点），但答案应等价（1/2 与 0.5 视为同一答案）
const crossConflicts = [...crossProject.values()]
  .filter((group) => group.length > 1 && group.some((q) => !answersMatch(q.answer, group[0].answer)));
check("跨科目重复题答案等价", crossConflicts.length === 0, crossConflicts.slice(0, 3).map((g) => g.map((q) => `${q.id}=${q.answer}`).join(" vs ")).join(" | "));

console.log("== 章节覆盖 ==");
const coverageProblems = [];
for (const [projectId, project] of Object.entries(curriculum)) {
  const bank = questions.filter((q) => q.project === projectId);
  if (bank.length < 400) coverageProblems.push(`${projectId}: 题量偏少 ${bank.length}`);
  const chapters = new Map((project.chapters || []).map((c) => [c.name, c]));
  for (const chapter of project.chapters || []) {
    const inChapter = bank.filter((q) => q.chapter === chapter.name);
    if (inChapter.length < 5) coverageProblems.push(`${projectId}/${chapter.name}: 仅 ${inChapter.length} 题`);
    for (const sub of chapter.children || []) {
      const inSub = inChapter.filter((q) => q.sub === sub);
      if (inSub.length === 0) coverageProblems.push(`${projectId}/${chapter.name}/${sub}: 无题`);
    }
  }
  for (const q of bank) {
    const chapter = chapters.get(q.chapter);
    if (!chapter) { coverageProblems.push(`${q.id}: 章节不在课程表 ${q.chapter}`); continue; }
    if (q.sub && !(chapter.children || []).includes(q.sub)) coverageProblems.push(`${q.id}: 小节不在课程表 ${q.sub}`);
  }
}
check("课程表内每章/每小节都有题，且题目归属合法", coverageProblems.length === 0, coverageProblems.slice(0, 5).join(" | "));

console.log("== 组卷不重复 ==");
{
  const plan = buildDailyPlan({ questions, attempts: {}, project: "math1", count: 7 });
  const stems = plan.items.map((it) => stemKey(questions.find((q) => q.id === it.id).stem));
  check("每日一练 7 题题干互不相同", plan.items.length === 7 && new Set(stems).size === stems.length);
  const exam = buildExamPlan({ questions, project: "math2", count: 20, seed: 20261107 });
  const examStems = exam.items.map((q) => stemKey(q.stem));
  check("模拟考 20 题题干互不相同", exam.items.length === 20 && new Set(examStems).size === examStems.length);
  const essay = exam.items.filter((q) => q.type === "essay");
  check("模拟考不含解答题", essay.length === 0);
}

const total = questions.length;
console.log(`\n题库合计 ${total} 道：${Object.keys(curriculum).map((id) => `${id} ${questions.filter((q) => q.project === id).length}`).join(" / ")}`);
console.log(failures === 0 ? "全部通过 ✔" : `${failures} 项失败 ✘`);
process.exit(failures === 0 ? 0 : 1);
