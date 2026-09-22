const PROJECTS = {
  math1: { name: "数学一", code: "MATH I", chapters: ["极限与连续", "一元函数微分学", "一元函数积分学", "多元函数微分学"] },
  math2: { name: "数学二", code: "MATH II", chapters: ["极限与连续", "一元函数积分学", "无穷级数"] },
  math3: { name: "数学三", code: "MATH III", chapters: ["一元函数微分学", "一元函数积分学", "多元函数微分学"] },
  calc396: { name: "396 经济类联考", code: "396", chapters: ["线性代数基础", "概率统计基础", "微积分基础"] },
};
const TYPE_NAMES = { choice: "选择题", fill: "填空题", essay: "解答题" };
const STORAGE = "kaoyan-math-m1";
const today = () => new Date().toISOString().slice(0, 10);
const readState = () => JSON.parse(localStorage.getItem(STORAGE) || "null") || { project: "math1", count: 5, attempts: {}, practices: {}, checkins: {} };
let state = readState();
let questions = [];
let view = "home";
let practiceCursor = 0;

const save = () => localStorage.setItem(STORAGE, JSON.stringify(state));
const projectQuestions = () => questions.filter((q) => q.project === state.project && q.reviewStatus === "approved");
const practiceKey = () => `${today()}-${state.project}`;
const currentPractice = () => state.practices[practiceKey()];
const attemptFor = (id) => state.attempts[id];
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));

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

function homeView() {
  const practice = currentPractice();
  const completed = practice ? practice.questionIds.filter((id) => attemptFor(id)?.confirmed).length : 0;
  const total = practice?.questionIds.length || 0;
  const checked = state.checkins[practiceKey()];
  return `<p class="eyebrow">M1 / 今日学习工作台</p>
    <h1>今天，先完成一小组。</h1>
    <p class="lede">选择考试项目和章节，设置 1–7 题的练习量。题单生成后固定保存，完成每题确认后自动记录打卡。</p>
    <section class="section"><div class="section-head"><h2>考试项目</h2><span class="muted">当前：${PROJECTS[state.project].name}</span></div>
      <div class="grid project-grid">${Object.entries(PROJECTS).map(([id, p]) => `<button class="project-card ${id === state.project ? "selected" : ""}" data-project="${id}"><span class="project-code">${p.code}</span><strong>${p.name}</strong><span>${p.chapters.length} 个章节</span></button>`).join("")}</div>
    </section>
    <section class="section panel"><div class="section-head"><h2>生成今日题单</h2><span class="muted">允许预习任意章节</span></div>
      <div class="controls"><label>今日题量<div class="count-control"><button class="icon-button" data-count="-1" aria-label="减少题量">−</button><input id="count-input" type="number" min="1" max="7" value="${state.count}" /><button class="icon-button" data-count="1" aria-label="增加题量">+</button></div></label>
      <label>章节范围<select id="chapter-select"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select></label></div>
      <div class="actions"><button class="primary" data-action="start-practice">${practice ? "继续今日一练" : "开始今日一练"}</button><button class="secondary" data-view="chapters">浏览章节</button></div>
      <p id="home-notice" class="notice" hidden></p>
    </section>
    <section class="section"><div class="section-head"><h2>今日进度</h2><span class="muted">${checked ? "已打卡" : "未完成"}</span></div>
      <div class="panel">${practice ? `<div class="stats"><div class="stat"><span class="muted">已确认</span><strong>${completed}</strong></div><div class="stat"><span class="muted">题单总数</span><strong>${total}</strong></div><div class="stat"><span class="muted">状态</span><strong>${checked ? "完成" : `${total ? Math.round((completed / total) * 100) : 0}%`}</strong></div></div><div style="margin-top:16px" class="progress"><span style="width:${total ? (completed / total) * 100 : 0}%"></span></div>` : `<div class="empty">今天还没有固定题单，设置题量后开始。</div>`}</div>
    </section>
    <footer class="footer">实验版数据仅保存在当前浏览器。示例题用于验证流程，正式题库需替换为已授权数据。</footer>`;
}

function chaptersView() {
  const p = PROJECTS[state.project];
  return `<p class="eyebrow">章节浏览 / ${p.code}</p><h1>${p.name}</h1><p class="lede">所有章节都可直接加入今日练习，也可以先浏览知识点结构。</p>
    <section class="section"><div class="section-head"><h2>一级章节</h2><button class="text-button" data-view="home">返回组卷</button></div><div class="chapter-list">${p.chapters.map((c, i) => `<div class="chapter-item"><strong>${String(i + 1).padStart(2, "0")} · ${c}</strong><span>${questions.filter((q) => q.project === state.project && q.chapter === c).length} 道示例题 · 可预习</span></div>`).join("")}</div></section>`;
}

function practiceView() {
  const practice = currentPractice();
  if (!practice) return `<section class="panel"><h2>还没有今日题单</h2><p class="muted">先回到首页设置题量。</p><button class="primary" data-view="home">返回首页</button></section>`;
  const id = practice.questionIds[practiceCursor];
  const q = questions.find((item) => item.id === id);
  const attempt = attemptFor(id);
  const answered = Boolean(attempt?.submitted);
  const confirmed = Boolean(attempt?.confirmed);
  return `<p class="eyebrow">今日一练 / ${practiceCursor + 1} of ${practice.questionIds.length}</p>
    <div class="section-head"><h1>${PROJECTS[state.project].name}</h1><button class="text-button" data-view="home">退出练习</button></div>
    <section class="panel"><div class="question-meta"><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${q.chapter}</span><span class="tag orange">${q.kind === "real" ? "真题" : "模拟题"}</span></div>
      <div class="question-stem">${escapeHtml(q.stem)}</div>${questionInput(q, attempt)}
      ${answered ? `<div class="answer-box"><strong>标准答案：${escapeHtml(q.answer)}</strong><br /><span>${escapeHtml(q.explanation)}</span></div>` : ""}
      <div class="actions">${!answered ? `<button class="primary" data-action="submit-answer" data-question="${q.id}">提交答案</button>` : confirmed ? `<button class="secondary" data-action="next-question">${practiceCursor === practice.questionIds.length - 1 ? "完成今日一练" : "下一题"}</button>` : `<div><p class="muted">${q.type === "essay" ? "请确认本题的最终学习结果" : "请确认系统判断是否符合你的学习情况"}</p><div class="result-buttons">${["correct", "incorrect", "unknown", "partial"].map((r) => `<button data-result="${r}" data-question="${q.id}">${resultName(r)}</button>`).join("")}</div></div>`}</div>
    </section>`;
}

function questionInput(q, attempt) {
  if (q.type === "choice") return `<div class="options">${q.options.map((option) => `<label class="option"><input type="radio" name="answer" value="${escapeHtml(option)}" ${attempt?.submittedAnswer === option ? "checked" : ""} ${attempt?.submitted ? "disabled" : ""} />${escapeHtml(option)}</label>`).join("")}</div>`;
  if (q.type === "fill") return `<label style="margin-top:18px">你的答案<input id="answer-input" type="text" value="${escapeHtml(attempt?.submittedAnswer || "")}" ${attempt?.submitted ? "disabled" : ""} /></label>`;
  return `<label style="margin-top:18px">你的作答记录<textarea id="answer-input" rows="5" style="width:100%;border:1px solid var(--line);border-radius:6px;padding:11px 12px;resize:vertical" ${attempt?.submitted ? "disabled" : ""}>${escapeHtml(attempt?.submittedAnswer || "")}</textarea></label>`;
}

function mistakesView() {
  const rows = Object.values(state.attempts).filter((a) => a.confirmed && ["incorrect", "unknown", "partial"].includes(a.result)).map((a) => ({ ...a, q: questions.find((q) => q.id === a.questionId) })).filter((a) => a.q && a.q.project === state.project);
  return `<p class="eyebrow">复盘 / 错题</p><h1>把做错的题留下。</h1><p class="lede">错误、不会和部分正确的题会自动进入这里，按章节和错误原因筛选。</p>
    <section class="section panel"><div class="filter-row"><label>章节<select id="mistake-chapter"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("")}</select></label><label>结果<select id="mistake-result"><option value="all">全部结果</option><option value="incorrect">错误</option><option value="unknown">不会</option><option value="partial">部分正确</option></select></label></div><div id="mistake-list" class="table-like">${mistakeRows(rows)}</div></section>`;
}
function mistakeRows(rows) { return rows.length ? rows.map((a) => `<div class="mistake-row" data-chapter="${escapeHtml(a.q.chapter)}" data-result="${a.result}"><div class="question-meta"><span class="tag orange">${resultName(a.result)}</span><span class="tag">${a.q.chapter}</span></div><strong>${escapeHtml(a.q.stem)}</strong><p class="muted">标准答案：${escapeHtml(a.q.answer)}</p></div>`).join("") : `<div class="empty">当前项目还没有错题记录。</div>`; }
function resultName(result) { return ({ correct: "正确", incorrect: "错误", unknown: "不会", partial: "部分正确" })[result] || result; }

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", (event) => { event.preventDefault(); view = el.dataset.view; render(); }));
  document.querySelectorAll("[data-project]").forEach((el) => el.addEventListener("click", () => { state.project = el.dataset.project; save(); render(); }));
  document.querySelectorAll("[data-count]").forEach((el) => el.addEventListener("click", () => { state.count = Math.max(1, Math.min(7, state.count + Number(el.dataset.count))); save(); render(); }));
  document.querySelector("#count-input")?.addEventListener("change", (event) => { state.count = Math.max(1, Math.min(7, Number(event.target.value) || 1)); save(); render(); });
  document.querySelector("[data-action='start-practice']")?.addEventListener("click", startPractice);
  document.querySelector("[data-action='submit-answer']")?.addEventListener("click", submitAnswer);
  document.querySelector("[data-action='next-question']")?.addEventListener("click", () => { const p = currentPractice(); if (practiceCursor < p.questionIds.length - 1) { practiceCursor += 1; render(); } else { view = "home"; render(); } });
  document.querySelectorAll("[data-result]").forEach((el) => el.addEventListener("click", () => confirmResult(el.dataset.question, el.dataset.result)));
  ["mistake-chapter", "mistake-result"].forEach((id) => document.querySelector(`#${id}`)?.addEventListener("change", filterMistakes));
}

function startPractice() {
  const key = practiceKey();
  if (!state.practices[key]) {
    const chapter = document.querySelector("#chapter-select")?.value || "all";
    let pool = projectQuestions().filter((q) => chapter === "all" || q.chapter === chapter);
    const recent = new Set(Object.values(state.practices).filter((p) => p.project === state.project).flatMap((p) => p.questionIds));
    const fresh = pool.filter((q) => !recent.has(q.id));
    pool = [...fresh, ...pool.filter((q) => recent.has(q.id))];
    const selected = pool.slice(0, state.count);
    state.practices[key] = { practiceDate: today(), project: state.project, requestedCount: state.count, chapter, questionIds: selected.map((q) => q.id), status: "in_progress", createdAt: new Date().toISOString() };
    save();
    if (selected.length < state.count) { const notice = document.querySelector("#home-notice"); if (notice) { notice.hidden = false; notice.textContent = `当前筛选范围只有 ${selected.length} 道已审核题目，题单已按现有题库生成。`; } }
  }
  practiceCursor = 0;
  view = "practice";
  render();
}

function submittedValue() { const selected = document.querySelector("input[name='answer']:checked"); return selected?.value || document.querySelector("#answer-input")?.value.trim() || ""; }
function submitAnswer() { const id = document.querySelector("[data-action='submit-answer']").dataset.question; const q = questions.find((item) => item.id === id); const answer = submittedValue(); if (!answer) return; const normalized = answer.replace(/\s/g, "").toLowerCase(); const expected = q.answer.replace(/\s/g, "").toLowerCase(); const result = q.type === "essay" ? "pending_confirmation" : normalized === expected ? "correct" : "incorrect"; state.attempts[id] = { questionId: id, practiceKey: practiceKey(), submitted: true, submittedAnswer: answer, result, confirmed: false, durationSeconds: 0, updatedAt: new Date().toISOString() }; save(); render(); }
function confirmResult(id, result) { state.attempts[id] = { ...state.attempts[id], result, confirmed: true, confirmedAt: new Date().toISOString() }; const p = currentPractice(); if (p.questionIds.every((questionId) => state.attempts[questionId]?.confirmed)) { p.status = "completed"; state.checkins[practiceKey()] = { project: state.project, practiceKey: practiceKey(), completedAt: new Date().toISOString() }; } save(); render(); }
function filterMistakes() { const chapter = document.querySelector("#mistake-chapter").value; const result = document.querySelector("#mistake-result").value; document.querySelectorAll(".mistake-row").forEach((row) => { row.hidden = (chapter !== "all" && row.dataset.chapter !== chapter) || (result !== "all" && row.dataset.result !== result); }); }

fetch("/data/questions.json").then((response) => response.json()).then((data) => { questions = data; render(); if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js"); });
