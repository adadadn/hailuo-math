# -*- coding: utf-8 -*-
"""海螺游学 app.js 自检修复：时区/文案/清理/联动/错因筛选"""
import io

P = r"D:\考研数学项目\app.js"
src = io.open(P, encoding="utf-8").read()
orig = src
def rep(old, new, must=True):
    global src
    if old not in src:
        if must:
            raise SystemExit("NOT FOUND: " + old[:60])
        return
    src = src.replace(old, new, 1)

# 1) 时区修复：本地日期 helper
rep(
"""const STORAGE = "kaoyan-math-m1";
const today = () => new Date().toISOString().slice(0, 10);""",
"""const STORAGE = "kaoyan-math-m1";
// 统一用本地时区日期（toISOString 是 UTC，凌晨 0–8 点会记到前一天）
const pad2 = (n) => String(n).padStart(2, "0");
const localDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => localDate(new Date());
const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? String(iso || "").slice(0, 10) : localDate(d); };"""
)

# 2) 日历格子用本地日期
rep(
"""    const d = new Date(Date.now() - i * 86400000);
    const ds = d.toISOString().slice(0, 10);""",
"""    const d = new Date(Date.now() - i * 86400000);
    const ds = localDate(d);"""
)

# 3) 连续打卡游标用本地日期
rep(
"""  while (dateSet.has(cursor.toISOString().slice(0, 10))) {""",
"""  while (dateSet.has(localDate(cursor))) {"""
)

# 4) 考试成绩历史日期显示（examSetupView）
rep(
"""<span class="muted">${String(r.date || "").slice(0, 10)} · ${Math.round(r.durationSeconds / 60)} 分钟</span>""",
"""<span class="muted">${fmtDate(r.date)} · ${Math.round(r.durationSeconds / 60)} 分钟</span>"""
)

# 5) footer 过时文案（上线版）
rep(
"""    <footer class="footer">实验版数据仅保存在当前浏览器。示例题用于验证流程，正式题库需替换为已授权数据。</footer>""",
"""    <footer class="footer">进度数据保存在当前浏览器（本地存储），分享链接给朋友后各自进度互不影响。</footer>"""
)

# 6) 启动清理 60 天前已完成的 practices（防止 localStorage 无限增长）
rep(
"""let state = readState();
let questions = [];""",
"""let state = readState();
// 清理 60 天前已完成的题单，防止本地存储无限增长（保留错题/成绩/复习记录）
(function prunePractices() {
  const cutoff = Date.now() - 60 * 86400000;
  let changed = false;
  Object.keys(state.practices || {}).forEach((key) => {
    const p = state.practices[key];
    if (p && p.status === "completed" && new Date(p.createdAt).getTime() < cutoff) {
      delete state.practices[key];
      changed = true;
    }
  });
  if (changed) save();
})();
let questions = [];"""
)

# 7) 章节下拉变更后联动刷新小节范围提示
rep(
"""  document.querySelector("#chapter-select")?.addEventListener("change", (event) => { state.presetChapter = event.target.value; save(); });""",
"""  document.querySelector("#chapter-select")?.addEventListener("change", (event) => { state.presetChapter = event.target.value; save(); render(); });"""
)

# 8) 学习页"已学 X/Y"分母只算有讲义的章节
rep(
"""  const learnedCount = p.chapters.filter((c) => learnedFor(c.name)).length;""",
"""  const learnableChapters = p.chapters.filter((c) => noteFor(c.name));
  const learnedCount = learnableChapters.filter((c) => learnedFor(c.name)).length;"""
)
rep(
"""<section class="section"><div class="section-head"><h2>${p.name}</h2><span class="muted">已学 ${learnedCount}/${p.chapters.length} 章</span></div>""",
"""<section class="section"><div class="section-head"><h2>${p.name}</h2><span class="muted">已学 ${learnedCount}/${learnableChapters.length} 章</span></div>"""
)

# 9) 错题本：新增错因筛选下拉 + 行数据 + 过滤逻辑
rep(
"""    <section class="section panel"><div class="filter-row"><label>章节<select id="mistake-chapter"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>结果<select id="mistake-result"><option value="all">全部结果</option><option value="incorrect">错误</option><option value="unknown">不会</option><option value="partial">部分正确</option></select></label></div><div id="mistake-list" class="table-like">${mistakeRows(rows)}</div></section>""",
"""    <section class="section panel"><div class="filter-row"><label>章节<select id="mistake-chapter"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>结果<select id="mistake-result"><option value="all">全部结果</option><option value="incorrect">错误</option><option value="unknown">不会</option><option value="partial">部分正确</option></select></label><label>错因<select id="mistake-reason"><option value="all">全部错因</option>${REASON_CODES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></label></div><div id="mistake-list" class="table-like">${mistakeRows(rows)}</div></section>"""
)
rep(
"""    return `<div class="mistake-row" data-chapter="${escapeHtml(a.q.chapter)}" data-result="${a.result}">""",
"""    return `<div class="mistake-row" data-chapter="${escapeHtml(a.q.chapter)}" data-result="${a.result}" data-reason="${escapeHtml(a.reasonCode || "")}">"""
)
rep(
"""  ["mistake-chapter", "mistake-result"].forEach((id) => document.querySelector(`#${id}`)?.addEventListener("change", filterMistakes));""",
"""  ["mistake-chapter", "mistake-result", "mistake-reason"].forEach((id) => document.querySelector(`#${id}`)?.addEventListener("change", filterMistakes));"""
)
rep(
"""function filterMistakes() {
  const chapter = document.querySelector("#mistake-chapter").value;
  const result = document.querySelector("#mistake-result").value;
  document.querySelectorAll(".mistake-row").forEach((row) => {
    row.hidden = (chapter !== "all" && row.dataset.chapter !== chapter) || (result !== "all" && row.dataset.result !== result);
  });
}""",
"""function filterMistakes() {
  const chapter = document.querySelector("#mistake-chapter").value;
  const result = document.querySelector("#mistake-result").value;
  const reason = document.querySelector("#mistake-reason").value;
  document.querySelectorAll(".mistake-row").forEach((row) => {
    row.hidden = (chapter !== "all" && row.dataset.chapter !== chapter) || (result !== "all" && row.dataset.result !== result) || (reason !== "all" && row.dataset.reason !== reason);
  });
}"""
)

io.open(P, "w", encoding="utf-8", newline="").write(src)
print("app.js patched, changed:", "YES" if src != orig else "NO")
