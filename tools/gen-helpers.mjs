// 题库生成器公共工具（无副作用，供各科生成器与主脚本共用）

// 数值/表达式转简洁字符串（去多余尾零）
export const num = (x) => {
  if (typeof x !== "number" || !Number.isFinite(x)) return String(x);
  return Object.is(x, -0) ? "0" : String(+x.toFixed(8)).replace(/\.0+$/, "");
};
export const frac = (p, q) => (q === 1 ? num(p) : `${num(p)}/${num(q)}`);
export const pow = (b, e) => num(Math.pow(b, e));

// 选择支构造：答案 + 干扰项，按序号轮换答案位置，去重
export function buildOptions(answer, distractors, i) {
  const uniq = [];
  const seen = new Set();
  for (const o of [String(answer), ...distractors.map(String)]) {
    if (!seen.has(o)) { seen.add(o); uniq.push(o); }
  }
  const pos = i % uniq.length;
  return [...uniq.slice(pos), ...uniq.slice(0, pos)];
}

const TIPS = {
  correct: "本题思路清晰、结果正确，说明该考点掌握良好。",
  method: "建议重点回顾该类问题的求解方法，并在错题本中按方法归类整理。",
  calc: "建议放慢计算节奏，注意符号与代数变形，完成后用代入法或特殊值复核。",
};

// 详细解析组装：steps 为步骤数组，最后一句给学习建议
export function explain(steps, answerLine, tip = "correct") {
  const head = steps.map((s, idx) => `第${idx + 1}步：${s}`).join("\n");
  return `${head}\n${answerLine}\n${(TIPS[tip] || TIPS.correct)}`;
}
