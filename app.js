import { normalizeAnswer, answersMatch, buildDailyPlan, MISTAKE_RESULTS } from "./core.js";

const FALLBACK_PROJECTS = {
  math1: { name: "数学一", code: "MATH I", chapters: ["函数、极限与连续", "一元函数微分学", "一元函数积分学", "多元函数微分学"] },
  math2: { name: "数学二", code: "MATH II", chapters: ["函数、极限与连续", "一元函数积分学", "无穷级数"] },
  math3: { name: "数学三", code: "MATH III", chapters: ["一元函数微分学", "一元函数积分学", "多元函数微分学"] },
  calc396: { name: "396 经济类联考", code: "396", chapters: ["线性代数基础", "概率统计基础", "微积分基础"] },
};
const TYPE_NAMES = { choice: "选择题", fill: "填空题", essay: "解答题" };
const REASON_CODES = ["概念不清", "计算错误", "方法错误", "审题错误", "步骤遗漏", "其他"];
const STORAGE = "kaoyan-math-m1";
const today = () => new Date().toISOString().slice(0, 10);
const defaultState = () => ({ project: "math1", count: 5, attempts: {}, practices: {}, checkins: {}, session: null, presetChapter: "all" });
const readState = () => {
  let parsed = null;
  try { parsed = JSON.parse(localStorage.getItem(STORAGE) || "null"); } catch { parsed = null; }
  return { ...defaultState(), ...(parsed || {}) };
};
let state = readState();
let questions = [];
let curriculum = {};
let view = "home";
const questionShownAt = {}; // 记录每题开始作答时间（内存态）
let confirmDraft = null; // 待确认错因 { id, result }

const save = () => localStorage.setItem(STORAGE, JSON.stringify(state));
const projectQuestions = () => questions.filter((q) => q.project === state.project && q.reviewStatus === "approved");
const dailyKey = () => `${today()}-${state.project}`;
const dailyPractice = () => state.practices[dailyKey()];
const sessionPractice = () => (state.session && state.practices[state.session.key]) || null;
const attemptFor = (id) => state.attempts[id];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const resultName = (result) => ({ correct: "正确", incorrect: "错误", unknown: "不会", partial: "部分正确", pending_confirmation: "待确认" })[result] || result;

function render() {
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <header class="topbar"><div class="topbar-inner">
        <a class="brand" href="#" data-view="home"><span class="brand-mark">数</span><span><strong>考研数学 M1</strong><small>自适应每日一练</small></span></a>
        <nav class="nav" aria-label="主导航">
          <button class="${view === "home" ? "active" : ""}" data-view="home">首页</button>
          <button class="${view === "chapters" ? "active" : ""}" data-view="chapters">章节</button>
          <button class="${view === "mistakes" ? "active" : ""}" data-view="mistakes">错题</button>
        </nav>
      </div></header>
      <main class="page">${view === "home" ? homeView() : view === "chapters" ? chaptersView() : view === "practice" ? practiceView() : mistakesView()}</main>
    </div>`;
  bindEvents();
}

/* ---------- 首页 ---------- */

function projectAttempts() {
  return Object.values(state.attempts).filter((a) => {
    const q = questions.find((item) => item.id === a.questionId);
    return q && q.project === state.project;
  });
}
function checkinDateSet() {
  return new Set(Object.values(state.checkins).filter((c) => c.project === state.project).map((c) => String(c.practiceKey || "").slice(0, 10)).filter(Boolean));
}
function streakDays(dateSet) {
  let streak = 0;
  const cursor = dateSet.has(today()) ? new Date() : new Date(Date.now() - 86400000);
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
function calendarHtml(dateSet) {
  const cells = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86400000);
    const ds = d.toISOString().slice(0, 10);
    const cls = ["cal-cell", dateSet.has(ds) ? "checked" : "", ds === today() ? "today" : ""].filter(Boolean).join(" ");
    cells.push(`<span class="${cls}" title="${ds}">${d.getDate()}</span>`);
  }
  return `<div class="calendar">${cells.join("")}</div>`;
}

function homeView() {
  const practice = dailyPractice();
  const completed = practice ? practice.questionIds.filter((id) => attemptFor(id)?.confirmed).length : 0;
  const total = practice?.questionIds.length || 0;
  const checked = Boolean(state.checkins[dailyKey()]);
  const attempts = projectAttempts();
  const mistakes = attempts.filter((a) => a.confirmed && MISTAKE_RESULTS.includes(a.result)).length;
  const doneCount = attempts.filter((a) => a.confirmed).length;
  const ckSet = checkinDateSet();
  const chapterOptions = PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}" ${state.presetChapter === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("");
  return `<p class="eyebrow">M1 / 今日学习工作台</p>
    <h1>今天，先完成一小组。</h1>
    <p class="lede">选择考试项目和章节，设置 1–7 题的练习量。题单由自适应规则生成：错题优先、14 天内不重复，并标注每题选题原因。</p>
    <section class="section panel"><div class="stats home-stats">
      <div class="stat"><span class="muted">累计打卡</span><strong>${ckSet.size} 天</strong></div>
      <div class="stat"><span class="muted">连续打卡</span><strong>${streakDays(ckSet)} 天</strong></div>
      <div class="stat"><span class="muted">累计错题</span><strong>${mistakes} 道</strong></div>
      <div class="stat"><span class="muted">已确认做题</span><strong>${doneCount} 道</strong></div>
    </div></section>
    <section class="section"><div class="section-head"><h2>考试项目</h2><span class="muted">当前：${PROJECTS[state.project].name}</span></div>
      <div class="grid project-grid">${Object.entries(PROJECTS).map(([id, p]) => `<button class="project-card ${id === state.project ? "selected" : ""}" data-project="${id}"><span class="project-code">${p.code}</span><strong>${p.name}</strong><span>${p.chapters.length} 个一级章节 · ${questions.filter((q) => q.project === id).length} 道已导入题</span></button>`).join("")}</div>
    </section>
    <section class="section panel"><div class="section-head"><h2>生成今日题单</h2><span class="muted">允许预习任意章节</span></div>
      <div class="controls"><label>今日题量<div class="count-control"><button class="icon-button" data-count="-1" aria-label="减少题量">−</button><input id="count-input" type="number" min="1" max="7" value="${state.count}" /><button class="icon-button" data-count="1" aria-label="增加题量">+</button></div></label>
      <label>章节范围<select id="chapter-select"><option value="all">全部章节</option>${chapterOptions}</select></label></div>
      <div class="actions"><button class="primary" data-action="start-practice">${practice ? "继续今日一练" : "开始今日一练"}</button><button class="secondary" data-view="chapters">浏览章节</button></div>
      <p id="home-notice" class="notice" hidden></p>
    </section>
    <section class="section"><div class="section-head"><h2>今日进度</h2><span class="muted">${checked ? "已打卡" : "未完成"}</span></div>
      <div class="panel">${practice ? `<div class="stats"><div class="stat"><span class="muted">已确认</span><strong>${completed}</strong></div><div class="stat"><span class="muted">题单总数</span><strong>${total}</strong></div><div class="stat"><span class="muted">状态</span><strong>${checked ? "完成" : `${total ? Math.round((completed / total) * 100) : 0}%`}</strong></div></div><div style="margin-top:16px" class="progress"><span style="width:${total ? (completed / total) * 100 : 0}%"></span></div>` : `<div class="empty">今天还没有固定题单，设置题量后开始。</div>`}</div>
    </section>
    <section class="section"><div class="section-head"><h2>打卡日历</h2><span class="muted">近 30 天 · 绿点为已打卡</span></div>
      <div class="panel">${calendarHtml(ckSet)}</div>
    </section>
    <footer class="footer">实验版数据仅保存在当前浏览器。示例题用于验证流程，正式题库需替换为已授权数据。</footer>`;
}

/* ---------- 章节 ---------- */

function chaptersView() {
  const p = PROJECTS[state.project];
  return `<p class="eyebrow">章节浏览 / ${p.code}</p><h1>${p.name}</h1><p class="lede">按考试范围拆开的完整章节结构。二级知识点用于后续题目标签和复习筛选，所有章节都允许预习。</p>
    <section class="section"><div class="section-head"><h2>一级章节 <span class="muted">${p.chapters.length}</span></h2><button class="text-button" data-view="home">返回组卷</button></div><div class="chapter-list">${p.chapters.map((c, i) => `<details class="chapter-item"><summary><strong>${String(i + 1).padStart(2, "0")} · ${escapeHtml(c.name)}</strong><span>${questions.filter((q) => q.project === state.project && q.chapter === c.name).length} 道已导入题目</span></summary><div class="knowledge-list">${(c.children || []).map((child) => `<span>${escapeHtml(child)}</span>`).join("")}</div><div class="chapter-actions"><button class="secondary" data-chapter-practice="${escapeHtml(c.name)}">练习本章</button></div></details>`).join("")}</div></section>`;
}

/* ---------- 练习 ---------- */

function practiceView() {
  const practice = sessionPractice();
  if (!practice) return `<section class="panel"><h2>还没有进行中的练习</h2><p class="muted">先回到首页开始今日一练。</p><button class="primary" data-view="home">返回首页</button></section>`;
  const id = practice.questionIds[state.session.cursor];
  const q = questions.find((item) => item.id === id);
  if (!q) return `<section class="panel"><h2>题目不存在</h2><p class="muted">题库可能已更新，请返回首页重新组卷。</p><button class="primary" data-view="home">返回首页</button></section>`;
  // 错题重做：忽略本次重做之前的旧作答记录，新提交后正常显示作答态
  let attempt = attemptFor(id);
  if (practice.kind === "rework" && attempt && attempt.practiceKey !== state.session.key) attempt = null;
  const answered = Boolean(attempt?.submitted);
  const confirmed = Boolean(attempt?.confirmed);
  if (!answered) questionShownAt[id] = Date.now();
  const reason = practice.reasons ? practice.reasons[id] : null;
  const last = practice.questionIds.length - 1;
  const isLast = state.session.cursor === last;
  const resultButtons = ["correct", "incorrect", "unknown", "partial"].map((r) => `<button data-result="${r}" data-question="${q.id}">${resultName(r)}</button>`).join("");
  const draftForm = confirmDraft && confirmDraft.id === q.id ? `<div class="panel mistake-form"><p class="muted">标记为「${resultName(confirmDraft.result)}」——补一个错因，便于后续按原因复习（可选）。</p>
    <label>错因分类<select id="reason-code"><option value="">未选择</option>${REASON_CODES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></label>
    <label>复盘备注<textarea id="reason-note" rows="2" placeholder="可选：简单记一下卡在哪一步"></textarea></label>
    <div class="actions"><button class="primary" data-action="confirm-mistake">确认</button><button class="text-button" data-action="cancel-mistake">取消</button></div></div>` : "";
  const actions = !answered
    ? (q.type === "essay"
        ? `<div class="essay-entry"><p class="muted">先在纸上完成作答，再选择你的状态：</p><div class="actions"><button class="primary" data-action="essay-done" data-question="${q.id}">做完了，对答案</button><button class="secondary" data-action="essay-giveup" data-question="${q.id}">不会，直接看答案</button></div></div>`
        : `<button class="primary" data-action="submit-answer" data-question="${q.id}">提交答案</button>`)
    : confirmed
      ? `<button class="primary" data-action="next-question">${isLast ? (practice.kind === "rework" ? "返回错题" : "完成今日一练") : "下一题"}</button>`
      : draftForm || `<div><p class="muted">${q.type === "essay" ? "请确认本题的最终学习结果" : "请确认系统判断是否符合你的学习情况"}</p><div class="result-buttons">${resultButtons}</div></div>`;
  return `<p class="eyebrow">${practice.kind === "rework" ? "错题重做" : "今日一练"} / ${state.session.cursor + 1} of ${practice.questionIds.length}</p>
    <div class="section-head"><h1>${PROJECTS[state.project].name}</h1><button class="text-button" data-view="home">退出练习</button></div>
    <section class="panel"><div class="question-meta"><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span><span class="tag orange">${q.kind === "real" ? "真题" : "模拟题"}</span><span class="tag">来源：${escapeHtml(q.source)}</span></div>
      ${reason ? `<p class="reason">选题原因：${escapeHtml(reason)}</p>` : ""}
      <div class="question-stem">${escapeHtml(q.stem)}</div>${questionInput(q, attempt)}
      ${answered ? `<div class="answer-box">${q.type === "essay" && attempt?.submittedAnswer ? `<span class="tag essay-note">${escapeHtml(attempt.submittedAnswer)}</span>` : ""}<strong>标准答案：${escapeHtml(q.answer)}</strong><br /><span>${escapeHtml(q.explanation)}</span></div>` : ""}
      <div class="actions">${actions}</div>
    </section>`;
}

function questionInput(q, attempt) {
  if (q.type === "choice") return `<div class="options">${q.options.map((option) => `<label class="option"><input type="radio" name="answer" value="${escapeHtml(option)}" ${attempt?.submittedAnswer === option ? "checked" : ""} ${attempt?.submitted ? "disabled" : ""} />${escapeHtml(option)}</label>`).join("")}</div>`;
  if (q.type === "fill") return `<label style="margin-top:18px">你的答案<input id="answer-input" type="text" value="${escapeHtml(attempt?.submittedAnswer || "")}" ${attempt?.submitted ? "disabled" : ""} /></label>`;
  // 解答题不做文字录入：纸面作答后点「做完了，对答案」或「不会，直接看答案」
  return "";
}

/* ---------- 错题 ---------- */

function mistakesView() {
  const rows = Object.values(state.attempts).filter((a) => a.confirmed && MISTAKE_RESULTS.includes(a.result)).map((a) => ({ ...a, q: questions.find((q) => q.id === a.questionId) })).filter((a) => a.q && a.q.project === state.project);
  return `<p class="eyebrow">复盘 / 错题</p><h1>把做错的题留下。</h1><p class="lede">错误、不会和部分正确的题会自动进入这里，按章节和错误原因筛选，可点击「重做此题」回到练习。</p>
    <section class="section panel"><div class="filter-row"><label>章节<select id="mistake-chapter"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>结果<select id="mistake-result"><option value="all">全部结果</option><option value="incorrect">错误</option><option value="unknown">不会</option><option value="partial">部分正确</option></select></label></div><div id="mistake-list" class="table-like">${mistakeRows(rows)}</div></section>`;
}
function mistakeRows(rows) {
  if (!rows.length) return `<div class="empty">当前项目还没有错题记录。</div>`;
  return rows.map((a) => {
    const reasonTag = a.reasonCode ? `<span class="tag orange">${escapeHtml(a.reasonCode)}</span>` : "";
    const resultTagClass = a.result === "incorrect" ? "red" : a.result === "partial" ? "orange" : "navy";
    const note = a.note ? `<p class="muted mistake-note">复盘：${escapeHtml(a.note)}</p>` : "";
    return `<div class="mistake-row" data-chapter="${escapeHtml(a.q.chapter)}" data-result="${a.result}"><div class="question-meta"><span class="tag ${resultTagClass}">${resultName(a.result)}</span>${reasonTag}<span class="tag">${escapeHtml(a.q.chapter)}</span><span class="tag">来源：${escapeHtml(a.q.source)}</span></div>
      <strong>${escapeHtml(a.q.stem)}</strong>${note}
      <p class="muted">标准答案：${escapeHtml(a.q.answer)}</p>
      <div class="actions"><button class="secondary" data-redo="${a.questionId}">重做此题</button></div></div>`;
  }).join("");
}

/* ---------- 事件绑定 ---------- */

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", (event) => { event.preventDefault(); view = el.dataset.view; render(); }));
  document.querySelectorAll("[data-project]").forEach((el) => el.addEventListener("click", () => { state.project = el.dataset.project; state.presetChapter = "all"; save(); render(); }));
  document.querySelectorAll("[data-count]").forEach((el) => el.addEventListener("click", () => { state.count = Math.max(1, Math.min(7, state.count + Number(el.dataset.count))); save(); render(); }));
  document.querySelector("#count-input")?.addEventListener("change", (event) => { state.count = Math.max(1, Math.min(7, Number(event.target.value) || 1)); save(); render(); });
  document.querySelector("#chapter-select")?.addEventListener("change", (event) => { state.presetChapter = event.target.value; save(); });
  document.querySelectorAll("[data-chapter-practice]").forEach((el) => el.addEventListener("click", () => { state.presetChapter = el.dataset.chapterPractice; save(); view = "home"; render(); }));
  document.querySelector("[data-action='start-practice']")?.addEventListener("click", startPractice);
  document.querySelector("[data-action='submit-answer']")?.addEventListener("click", submitAnswer);
  document.querySelectorAll("[data-action='essay-done'], [data-action='essay-giveup']").forEach((el) => el.addEventListener("click", () => submitEssay(el.dataset.question, el.dataset.action === "essay-done" ? "done" : "giveup")));
  document.querySelector("[data-action='next-question']")?.addEventListener("click", nextQuestion);
  document.querySelectorAll("[data-question][data-result]").forEach((el) => el.addEventListener("click", () => chooseResult(el.dataset.question, el.dataset.result)));
  document.querySelector("[data-action='confirm-mistake']")?.addEventListener("click", confirmMistake);
  document.querySelector("[data-action='cancel-mistake']")?.addEventListener("click", () => { confirmDraft = null; render(); });
  document.querySelectorAll("[data-redo]").forEach((el) => el.addEventListener("click", () => startRework(el.dataset.redo)));
  ["mistake-chapter", "mistake-result"].forEach((id) => document.querySelector(`#${id}`)?.addEventListener("change", filterMistakes));
}

/* ---------- 组卷 ---------- */

function startPractice() {
  const key = dailyKey();
  if (!state.practices[key]) {
    const plan = buildDailyPlan({ questions, attempts: state.attempts, project: state.project, chapter: state.presetChapter || "all", count: state.count, now: Date.now() });
    if (plan.items.length === 0) {
      // 防呆：无可组卷题目时留在首页并展示原因，不进入白屏练习页
      const notice = document.querySelector("#home-notice");
      if (notice) { notice.hidden = false; notice.textContent = plan.notice || "当前范围没有可组卷的题目，请更换章节或项目。"; }
      return;
    }
    state.practices[key] = {
      practiceDate: today(), project: state.project, requestedCount: state.count, chapter: plan.chapter,
      questionIds: plan.items.map((it) => it.id),
      reasons: Object.fromEntries(plan.items.map((it) => [it.id, it.reason])),
      status: "in_progress", createdAt: new Date().toISOString(), kind: "daily",
    };
    save();
    if (plan.notice) { const notice = document.querySelector("#home-notice"); if (notice) { notice.hidden = false; notice.textContent = plan.notice; } }
  }
  state.session = { key, cursor: resumeCursor(state.practices[key]), kind: "daily" };
  save();
  view = "practice";
  render();
}
function resumeCursor(practice) {
  const idx = practice.questionIds.findIndex((id) => !state.attempts[id]?.submitted);
  return idx === -1 ? 0 : idx;
}

/* ---------- 作答与确认 ---------- */

function submittedValue() {
  const selected = document.querySelector("input[name='answer']:checked");
  return selected?.value || document.querySelector("#answer-input")?.value.trim() || "";
}
function submitAnswer() {
  const id = document.querySelector("[data-action='submit-answer']").dataset.question;
  const q = questions.find((item) => item.id === id);
  const answer = submittedValue();
  if (!answer) return;
  const start = questionShownAt[id] || Date.now();
  const durationSeconds = Math.max(0, Math.round((Date.now() - start) / 1000));
  const result = q.type === "essay" ? "pending_confirmation" : answersMatch(answer, q.answer) ? "correct" : "incorrect";
  state.attempts[id] = { questionId: id, practiceKey: state.session ? state.session.key : dailyKey(), submitted: true, submittedAnswer: answer, result, confirmed: false, durationSeconds, updatedAt: new Date().toISOString() };
  delete questionShownAt[id];
  save();
  render();
}
function submitEssay(id, mode) {
  const start = questionShownAt[id] || Date.now();
  const durationSeconds = Math.max(0, Math.round((Date.now() - start) / 1000));
  state.attempts[id] = { questionId: id, practiceKey: state.session ? state.session.key : dailyKey(), submitted: true, submittedAnswer: mode === "done" ? "（纸面作答）" : "（直接看答案）", result: "pending_confirmation", confirmed: false, durationSeconds, updatedAt: new Date().toISOString() };
  delete questionShownAt[id];
  save();
  render();
}
function chooseResult(id, result) {
  if (MISTAKE_RESULTS.includes(result)) { confirmDraft = { id, result }; render(); return; }
  confirmResult(id, result, "", "");
}
function confirmMistake() {
  if (!confirmDraft) return;
  const code = document.querySelector("#reason-code")?.value || "";
  const note = document.querySelector("#reason-note")?.value.trim() || "";
  confirmResult(confirmDraft.id, confirmDraft.result, code, note);
  confirmDraft = null;
}
function confirmResult(id, result, reasonCode, note) {
  state.attempts[id] = { ...state.attempts[id], result, confirmed: true, reasonCode: reasonCode || undefined, note: note || undefined, confirmedAt: new Date().toISOString() };
  const p = sessionPractice();
  if (p && p.kind === "daily" && p.questionIds.every((questionId) => state.attempts[questionId]?.confirmed)) {
    p.status = "completed";
    state.checkins[dailyKey()] = { project: state.project, practiceKey: dailyKey(), completedAt: new Date().toISOString() };
  }
  save();
  render();
}
function nextQuestion() {
  const p = sessionPractice();
  if (!p) { view = "home"; save(); render(); return; }
  if (state.session.cursor < p.questionIds.length - 1) {
    state.session.cursor += 1;
    save();
    render();
  } else if (p.kind === "rework") {
    state.session = null;
    save();
    view = "mistakes";
    render();
  } else {
    state.session = null;
    save();
    view = "home";
    render();
  }
}
function startRework(id) {
  const key = `rework-${Date.now()}`;
  state.practices[key] = { kind: "rework", project: state.project, questionIds: [id], status: "in_progress", createdAt: new Date().toISOString() };
  state.session = { key, cursor: 0, kind: "rework" };
  save();
  view = "practice";
  render();
}

/* ---------- 筛选与初始化 ---------- */

function filterMistakes() {
  const chapter = document.querySelector("#mistake-chapter").value;
  const result = document.querySelector("#mistake-result").value;
  document.querySelectorAll(".mistake-row").forEach((row) => {
    row.hidden = (chapter !== "all" && row.dataset.chapter !== chapter) || (result !== "all" && row.dataset.result !== result);
  });
}
function setCurriculum(data) {
  curriculum = data;
  PROJECTS = Object.fromEntries(Object.entries(data).map(([id, project]) => [id, project]));
}
let PROJECTS = FALLBACK_PROJECTS;

Promise.all([
  fetch("/data/questions.json").then((response) => response.json()),
  fetch("/data/curriculum.json").then((response) => response.json()),
]).then(([data, structure]) => {
  questions = data;
  setCurriculum(structure);
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
});
