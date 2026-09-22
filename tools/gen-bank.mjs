// 考研数学 M1 题库生成器主脚本
// 用法：node tools/gen-bank.mjs
// 保留 data/questions.json 中已有题目，并按章节生成大量变体新题（答案由公式计算，解析分步详细）。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildOptions } from "./gen-helpers.mjs";
import m1 from "./gen-m1.mjs";
import m2 from "./gen-m2.mjs";
import m3 from "./gen-m3.mjs";
import m396 from "./gen-396.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const curriculum = JSON.parse(readFileSync(join(root, "data", "curriculum.json"), "utf8"));
const existing = JSON.parse(readFileSync(join(root, "data", "questions.json"), "utf8"));

/* ---------- 校验章节名 ---------- */
const CH = new Set();
for (const [pid, proj] of Object.entries(curriculum)) {
  for (const c of proj.chapters) CH.add(`${pid}|${c.name}`);
}

/* ---------- 主流程 ---------- */
const configs = { math1: m1, math2: m2, math3: m3, calc396: m396 };
const generated = [];
for (const [pid, entries] of Object.entries(configs)) {
  let seq = 0;
  for (const entry of entries) {
    if (!CH.has(`${pid}|${entry.chapter}`)) throw new Error(`章节不存在于 curriculum: ${pid} / ${entry.chapter}`);
    for (let i = 0; i < entry.variants; i += 1) {
      seq += 1;
      const q = entry.make(i);
      const base = {
        id: `${pid}-gen${seq}`,
        project: pid,
        type: entry.type,
        stem: q.stem,
        answer: q.answer,
        explanation: q.explanation,
        source: q.source || "M1 精讲题库",
        chapter: entry.chapter,
        difficulty: entry.difficulty,
        kind: "mock",
        reviewStatus: "approved",
      };
      if (entry.type === "choice") base.options = buildOptions(q.answer, q.distractors, i);
      generated.push(base);
    }
  }
}

const all = [...existing, ...generated];

/* ---------- 校验 ---------- */
const ids = new Set();
let bad = 0;
for (const q of all) {
  if (ids.has(q.id)) { bad += 1; console.log("重复 id:", q.id); }
  ids.add(q.id);
  const need = ["id", "project", "type", "stem", "answer", "explanation", "chapter", "difficulty", "kind", "reviewStatus"];
  for (const k of need) if (q[k] === undefined || q[k] === null || q[k] === "") { bad += 1; console.log("缺字段:", q.id, k); }
  if (q.type === "choice" && (!Array.isArray(q.options) || !q.options.includes(q.answer) || new Set(q.options).size !== q.options.length)) {
    bad += 1; console.log("选择题选项异常:", q.id);
  }
}
const counts = {};
const chapterCover = {};
for (const q of all) {
  counts[q.project] = (counts[q.project] || 0) + 1;
  chapterCover[q.project] = new Set([...(chapterCover[q.project] || []), q.chapter]);
}
console.log("生成新题:", generated.length, "总题数:", all.length);
for (const p of Object.keys(counts)) {
  console.log(`  ${p}: ${counts[p]} 道，覆盖章节 ${chapterCover[p].size}`);
  if (counts[p] < 300) { bad += 1; console.log(`  !! ${p} 不足 300 道`); }
}
for (const [pid, proj] of Object.entries(curriculum)) {
  for (const c of proj.chapters) {
    if (!chapterCover[pid] || !chapterCover[pid].has(c.name)) {
      bad += 1; console.log("章节无题:", pid, c.name);
    }
  }
}
if (bad > 0) { console.log(`校验失败，bad=${bad}`); process.exit(1); }

writeFileSync(join(root, "data", "questions.json"), JSON.stringify(all, null, 2), "utf8");
console.log("已写入 data/questions.json ✔");
