// 题库清洗：去重、修正错误答案、消除选择题重复选项。
// 用法：node tools/fix-bank.mjs          （写回 data/questions.json）
//       node tools/fix-bank.mjs --dry    （只报告，不写回）
//
// 清洗规则（可复现、可审阅）：
// 1. DROP_IDS：人工确认「答案错误 / 与保留题完全重复」的题，直接删除；
// 2. 同项目内按归一化题干去重（空白、全半角括号、减号写法差异视为同一题），保留首题；
// 3. 选择题选项按出现顺序去重，保证标准答案仍在选项中。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FILE = fileURLToPath(new URL("../data/questions.json", import.meta.url));
const dry = process.argv.includes("--dry");

// 已知错题：同一题干两套答案，其中一个是错的。保留正确项，删除错误项。
const DROP_IDS = new Set([
  "math1-gen139",   // 级数 Σ2^n/n! 应为收敛，此题标发散
  "math1-gen138",   // 级数 Σ3^n 应为发散，此题标收敛
  "math1-gen211",   // diag(1,0,0) 的秩为 1
  "math2-gen203",   // 同上
  "math2-gen207",   // 同上
  "math2-exp-146",  // 与 math2-gen285 重复（正定充要条件）
  "math3-gen229",   // diag(1,0,0) 的秩为 1
  "math3-gen233",   // 同上
  "calc396-gen177", // 同上
  "calc396-gen181", // 同上
]);

const normStem = (stem) =>
  String(stem)
    .replace(/[\u2212\u2013\u2014]/g, "-") // − – — → -
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/\s+/g, "")
    .trim();

const questions = JSON.parse(readFileSync(FILE, "utf8"));
const before = questions.length;
const dropped = [];
const kept = [];
const seen = new Map();
let optionsFixed = 0;
let notationFixed = 0;
let letterFixes = 0;

// 答案写法统一：去掉多余的系数 1，避免同一道题在不同科目里出现「π / 1π」「Ce^(x) / Ce^(1x)」
const tidyNotation = (value) => String(value)
  .replace(/(^|[^0-9.])1π/g, "$1π")
  .replace(/\^\(1x\)/g, "^(x)")
  .replace(/\^\(-1x\)/g, "^(-x)");

for (const q of questions) {
  if (DROP_IDS.has(q.id)) {
    dropped.push({ id: q.id, why: "已知错题/重复" });
    continue;
  }
  const key = `${q.project}|${normStem(q.stem)}`;
  if (seen.has(key)) {
    dropped.push({ id: q.id, why: `与 ${seen.get(key)} 题干重复` });
    continue;
  }
  seen.set(key, q.id);

  const tidyAnswer = tidyNotation(q.answer);
  if (tidyAnswer !== q.answer) { q.answer = tidyAnswer; notationFixed += 1; }
  if (Array.isArray(q.options)) {
    const tidyOptions = q.options.map(tidyNotation);
    if (tidyOptions.some((opt, i) => opt !== q.options[i])) { q.options = tidyOptions; notationFixed += 1; }
  }

  if (q.type === "choice" && Array.isArray(q.options)) {
    const answerIndex = q.options.indexOf(String(q.answer).trim());
    if (answerIndex >= 0) {
      const rightLetter = "ABCDEF"[answerIndex];
      let letterFixed = 0;
      q.explanation = String(q.explanation).replace(/选\s*([A-F])/g, (match, letter) => {
        if (letter === rightLetter) return match;
        letterFixed += 1;
        return `选 ${rightLetter}`;
      });
      if (letterFixed) { letterFixes += letterFixed; }
    }
  }

  if (q.type === "choice" && Array.isArray(q.options)) {
    const uniq = [];
    const seenOpt = new Set();
    for (const opt of q.options) {
      const text = String(opt).trim();
      if (seenOpt.has(text)) continue;
      seenOpt.add(text);
      uniq.push(text);
    }
    if (uniq.length !== q.options.length) {
      if (!uniq.includes(String(q.answer).trim())) {
        // 理论上不会发生；发生则保留原选项，交由测试暴露
        console.warn(`[skip options] ${q.id} 去重后会丢答案，保持原样`);
      } else {
        q.options = uniq;
        optionsFixed += 1;
      }
    }
    if (uniq.length < 2) console.warn(`[thin options] ${q.id} 去重后仅剩 ${uniq.length} 个选项`);
  }
  kept.push(q);
}

const byProject = kept.reduce((m, q) => ((m[q.project] = (m[q.project] || 0) + 1), m), {});
console.log(`题库：${before} → ${kept.length}（删除 ${dropped.length} 道，修复重复选项 ${optionsFixed} 道，统一答案写法 ${notationFixed} 处，修正解析选项字母 ${letterFixes} 处）`);
console.log("各科目题量：", byProject);
if (dropped.length) {
  console.log("\n删除明细：");
  for (const d of dropped) console.log(`  ${d.id}  ${d.why}`);
}

if (!dry) {
  writeFileSync(FILE, `${JSON.stringify(kept, null, 1)}\n`, "utf8");
  console.log(`\n已写回 ${FILE}`);
}
