const {
  normalizeAnswer, answersMatch, buildDailyPlan, MISTAKE_RESULTS,
  nextReviewStage, reviewDueAt, dueReviewIds, REVIEW_INTERVALS,
  buildExamPlan, scoreExam, EXAM_MINUTES_PER_QUESTION,
} = (typeof window !== "undefined" ? window.Core : globalThis.Core);

const FALLBACK_PROJECTS = {
  math1: { name: "数学一", code: "MATH I", chapters: ["函数、极限与连续", "一元函数微分学", "一元函数积分学", "多元函数微分学"] },
  math2: { name: "数学二", code: "MATH II", chapters: ["函数、极限与连续", "一元函数积分学", "无穷级数"] },
  math3: { name: "数学三", code: "MATH III", chapters: ["一元函数微分学", "一元函数积分学", "多元函数微分学"] },
  calc396: { name: "396 经济类联考", code: "396", chapters: ["线性代数基础", "概率统计基础", "微积分基础"] },
};
const TYPE_NAMES = { choice: "选择题", fill: "填空题", essay: "解答题" };
const DIFF_OPTS = [["all", "全部难度"], ["basic", "基础（难度≤2）"], ["hard", "拔高（难度≥3）"]];
const REASON_CODES = ["概念不清", "计算错误", "方法错误", "审题错误", "步骤遗漏", "其他"];
const STORAGE = "kaoyan-math-m1";
const today = () => new Date().toISOString().slice(0, 10);
const defaultState = () => ({
  project: "math1", count: 5, attempts: {}, practices: {}, checkins: {}, session: null, presetChapter: "all", presetDifficulty: "all",
  review: {}, exam: null, examResults: [], examSetup: { count: 10, chapter: "all", difficulty: "all" },
  learned: {},
});
const readState = () => {
  let parsed = null;
  try { parsed = JSON.parse(localStorage.getItem(STORAGE) || "null"); } catch { parsed = null; }
  const base = defaultState();
  return { ...base, ...(parsed || {}), examSetup: { ...base.examSetup, ...((parsed || {}).examSetup || {}) } };
};
let state = readState();
let questions = [];
let curriculum = {};
let notes = {};
let view = "home";
let examTimer = null;
let lastExamResult = null;
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
// 章节名 → 讲义 key 映射（多科目章节合并共享讲义）
const NOTE_KEY = {
  "行列式": "行列式与矩阵", "矩阵": "行列式与矩阵",
  "向量": "向量与线性方程组", "线性方程组": "向量与线性方程组",
  "特征值与特征向量": "特征值、特征向量与二次型", "二次型": "特征值、特征向量与二次型", "特征值与二次型": "特征值、特征向量与二次型",
  "随机变量的数字特征": "数字特征与极限定理", "数字特征与统计基础": "数字特征与极限定理", "大数定律与中心极限定理": "数字特征与极限定理",
  "多元函数与微积分应用": "多元函数微分学",
  "重积分": "二重积分",
};
const noteFor = (chapter) => notes[NOTE_KEY[chapter] || chapter] || null;
const TAB_ICONS = {
  home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
  review: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  mistakes: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
};

function render() {
  if (examTimer) { clearInterval(examTimer); examTimer = null; }
  const main = view === "home" ? homeView()
    : view === "chapters" ? chaptersView()
    : view === "learn" ? learnView()
    : view === "notes" ? notesView()
    : view === "practice" ? practiceView()
    : view === "review" ? reviewView()
    : view === "mistakes" ? mistakesView()
    : view === "exam-setup" ? examSetupView()
    : view === "exam" ? examView()
    : view === "exam-result" ? examResultView()
    : homeView();
  document.querySelector("#app").innerHTML = `
    <div class="app-shell">
      <header class="topbar"><div class="topbar-inner">
        <a class="brand" href="#" data-view="home"><span class="brand-mark">螺</span><span class="brand-text"><strong>海螺游学</strong><small>自适应每日一练</small></span></a>
        <span class="topbar-day">${today().slice(5).replace("-", "/")}</span>
      </div></header>
      <main class="page">${main}</main>
      <nav class="tabbar" aria-label="底部导航">
        <button class="tab${view === "home" ? " active" : ""}" data-view="home">${TAB_ICONS.home}<span>首页</span></button>
        <button class="tab${view === "learn" || view === "notes" ? " active" : ""}" data-view="learn">${TAB_ICONS.learn}<span>学习</span></button>
        <button class="tab${view === "review" ? " active" : ""}" data-view="review">${TAB_ICONS.review}<span>复习</span></button>
        <button class="tab${view === "mistakes" ? " active" : ""}" data-view="mistakes">${TAB_ICONS.mistakes}<span>错题</span></button>
      </nav>
    </div>`;
  bindEvents();
  // 考试视图每次渲染后都重建计时器（翻页/存答案也会触发 render，不能让它中断倒计时）
  if (view === "exam" && state.exam) startExamTimer();
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
  const due = dueReviewIds(state.review).filter((id) => { const q = questions.find((x) => x.id === id); return q && q.project === state.project; }).length;
  const chapterOptions = PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}" ${state.presetChapter === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("");
  return `<p class="eyebrow">海螺游学 / 今日学习工作台</p>
    <h1>今天，先完成一小组。</h1>
    <p class="lede">每天 1–7 题，自适应组卷：错题优先、14 天内不重复。</p>
    <section class="section panel"><div class="stats home-stats">
      <div class="stat"><span class="muted">累计打卡</span><strong class="num-teal">${ckSet.size}<small>天</small></strong></div>
      <div class="stat"><span class="muted">连续打卡</span><strong class="num-teal">${streakDays(ckSet)}<small>天</small></strong></div>
      <div class="stat"><span class="muted">累计错题</span><strong class="num-red">${mistakes}<small>道</small></strong></div>
      <div class="stat"><span class="muted">已确认做题</span><strong class="num-navy">${doneCount}<small>道</small></strong></div>
    </div></section>
    ${due ? `<section class="section"><div class="notice" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span>有 <strong>${due}</strong> 道题今天到期，按记忆曲线该复习了。</span><button class="secondary" data-view="review" style="flex:none">去复习</button></div></section>` : ""}
    <section class="section panel"><div class="section-head"><h2>生成今日题单</h2><span class="muted">可预习任意章节</span></div>
      <div class="controls"><label>今日题量<div class="count-control"><button class="icon-button" data-count="-1" aria-label="减少题量">−</button><input id="count-input" type="number" min="1" max="7" value="${state.count}" /><button class="icon-button" data-count="1" aria-label="增加题量">+</button></div></label>
      <label>章节范围<select id="chapter-select"><option value="all">全部章节</option>${chapterOptions}</select></label>
      <label>题目难度<select id="difficulty-select">${DIFF_OPTS.map(([v, label]) => `<option value="${v}" ${state.presetDifficulty === v ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>
      <div class="actions"><button class="primary big" data-action="start-practice">${practice ? "继续今日一练" : "开始今日一练"}</button><button class="secondary" data-view="chapters">浏览章节</button></div>
      <p id="home-notice" class="notice" hidden></p>
    </section>
    <section class="section"><div class="section-head"><h2>考试项目</h2><span class="muted">当前：${PROJECTS[state.project].name}</span></div>
      <div class="grid project-grid">${Object.entries(PROJECTS).map(([id, p]) => `<button class="project-card ${id === state.project ? "selected" : ""}" data-project="${id}"><span class="project-code">${p.code}</span><strong>${p.name}</strong><span>${p.chapters.length} 个一级章节 · ${questions.filter((q) => q.project === id).length} 道已导入题</span></button>`).join("")}</div>
    </section>
    <section class="section"><div class="section-head"><h2>今日进度</h2><span class="muted">${checked ? "已打卡" : "未完成"}</span></div>
      <div class="panel">${practice ? `<div class="stats"><div class="stat"><span class="muted">已确认</span><strong>${completed}</strong></div><div class="stat"><span class="muted">题单总数</span><strong>${total}</strong></div><div class="stat"><span class="muted">状态</span><strong>${checked ? "完成" : `${total ? Math.round((completed / total) * 100) : 0}%`}</strong></div></div><div style="margin-top:16px" class="progress"><span style="width:${total ? (completed / total) * 100 : 0}%"></span></div>` : `<div class="empty">今天还没有固定题单，设置题量后开始。</div>`}</div>
    </section>
    <section class="section panel"><div class="section-head"><h2>模拟考试</h2><span class="muted">限时 · 自动判分</span></div>
      <p class="lede">客观题成套组卷，交卷自动判分并记录成绩。10 / 15 / 20 题可选，每题限时 ${EXAM_MINUTES_PER_QUESTION} 分钟；也可按难度组「基础卷 / 拔高卷」。</p>
      <div class="actions"><button class="primary" data-view="exam-setup">进入模拟考试</button></div>
    </section>
    <section class="section"><div class="section-head"><h2>打卡日历</h2><span class="muted">近 30 天 · 绿点为已打卡</span></div>
      <div class="panel">${calendarHtml(ckSet)}</div>
    </section>
    <footer class="footer">实验版数据仅保存在当前浏览器。示例题用于验证流程，正式题库需替换为已授权数据。</footer>`;
}

/* ---------- 章节 ---------- */

function chaptersView() {
  const p = PROJECTS[state.project];
  return `<p class="eyebrow">章节浏览 / ${p.code}</p><h1>${p.name}</h1><p class="lede">按考试范围拆开的完整章节结构。每章都有配套讲义，建议先学习再练习。</p>
    <section class="section"><div class="section-head"><h2>一级章节 <span class="muted">${p.chapters.length}</span></h2><button class="text-button" data-view="home">返回组卷</button></div><div class="chapter-list">${p.chapters.map((c, i) => `<details class="chapter-item"><summary><strong>${String(i + 1).padStart(2, "0")} · ${escapeHtml(c.name)}</strong><span>${questions.filter((q) => q.project === state.project && q.chapter === c.name).length} 道已导入题目</span></summary><div class="knowledge-list">${(c.children || []).map((child) => `<span>${escapeHtml(child)}</span>`).join("")}</div><div class="chapter-actions"><button class="secondary" data-chapter-practice="${escapeHtml(c.name)}">练习本章</button>${noteFor(c.name) ? `<button class="secondary" data-note-chapter="${escapeHtml(c.name)}">查看讲义</button>` : ""}</div></details>`).join("")}</div></section>`;
}

/* ---------- 学习中心 ---------- */

const learnedFor = (chapter) => state.learned?.[NOTE_KEY[chapter] || chapter];
function markLearned(chapter) {
  const key = NOTE_KEY[chapter] || chapter;
  const rec = state.learned?.[key] || { firstSeen: Date.now(), count: 0 };
  state.learned[key] = { ...rec, lastSeen: Date.now(), count: rec.count + 1 };
  save();
}

function learnView() {
  const p = PROJECTS[state.project];
  const learnedCount = p.chapters.filter((c) => learnedFor(c.name)).length;
  // 每章答对题数（按题去重，只看确认过的作答）
  const doneCounts = {};
  const seen = new Set();
  Object.values(state.attempts).forEach((a) => {
    if (!a.confirmed || a.result !== "correct" || seen.has(a.questionId)) return;
    seen.add(a.questionId);
    const q = questions.find((x) => x.id === a.questionId);
    if (q && q.project === state.project) doneCounts[q.chapter] = (doneCounts[q.chapter] || 0) + 1;
  });
  const chapterRows = p.chapters.map((c, i) => {
    const note = noteFor(c.name);
    const learned = learnedFor(c.name);
    const disabled = !note;
    const done = doneCounts[c.name] || 0;
    const qty = questions.filter((q) => q.project === state.project && q.chapter === c.name).length;
    return `<button class="chapter-row ${disabled ? "disabled" : ""} ${learned ? "learned" : ""}" ${disabled ? "" : `data-note-chapter="${escapeHtml(c.name)}"`}><span class="chapter-no">${learned ? "✓" : String(i + 1).padStart(2, "0")}</span><span class="chapter-main"><strong>${escapeHtml(c.name)}</strong><span class="muted">${qty} 道题 · 答对 ${done} · ${note ? (learned ? "已学" : "待学习") : "讲义整理中"}</span></span><span class="chapter-arrow">›</span></button>`;
  }).join("");
  return `<p class="eyebrow">学习中心 / ${p.code}</p><h1>先学会，再练题。</h1><p class="lede">每章有「考点 + 公式 + 方法 + 易错点 + 例题精讲」讲义，先学后练效率更高。</p>
    <section class="section"><div class="section-head"><h2>${p.name}</h2><span class="muted">已学 ${learnedCount}/${p.chapters.length} 章</span></div><div class="chapter-list">${chapterRows}</div></section>`;
}

function notesView() {
  const chapter = state.presetNoteChapter || "";
  const note = noteFor(chapter);
  const p = PROJECTS[state.project];
  if (!note) return `<section class="panel"><h2>讲义未找到</h2><p class="muted">该章节暂时没有讲义，先去题库练习吧。</p><button class="primary" data-view="learn">返回学习中心</button></section>`;
  markLearned(chapter);
  const formulaRows = (note.formulas || []).map((f) => `<tr><td>${escapeHtml(f.name)}</td><td>${escapeHtml(f.body)}</td></tr>`).join("");
  const methodList = (note.methods || []).map((m) => `<li><strong>${escapeHtml(m.name)}</strong><div class="muted">${escapeHtml(m.body)}</div></li>`).join("");
  const exampleList = (note.examples || []).map((ex, i) => `<details class="example-item"><summary><span class="tag navy">例 ${i + 1}</span>${escapeHtml(ex.stem)}</summary><div class="example-body"><p class="muted">标准答案：${escapeHtml(ex.answer)}</p><div class="example-solution">${escapeHtml(ex.solution)}</div></div></details>`).join("");
  return `<p class="eyebrow">学习中心 / ${p.code}</p><div class="section-head"><h1>${escapeHtml(chapter)}</h1><button class="text-button" data-view="learn">返回章节</button></div>
    <section class="section panel"><h3>本章概述</h3><p class="lede" style="margin-bottom:0">${escapeHtml(note.summary)}</p></section>
    <section class="section panel"><h3>核心考点</h3><ul class="check-list">${(note.keyPoints || []).map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul></section>
    ${note.formulas?.length ? `<section class="section panel"><h3>必备公式</h3><div class="formula-table"><table><tbody>${formulaRows}</tbody></table></div></section>` : ""}
    ${note.methods?.length ? `<section class="section panel"><h3>解题方法</h3><ol class="method-list">${methodList}</ol></section>` : ""}
    ${note.pitfalls?.length ? `<section class="section panel"><h3>易错点提醒</h3><ul class="pitfall-list">${note.pitfalls.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul></section>` : ""}
    ${exampleList ? `<section class="section"><div class="section-head"><h2>例题精讲</h2><span class="muted">先自己算，再点开看完整过程</span></div><div class="chapter-list">${exampleList}</div></section>` : ""}
    <div class="actions"><button class="primary" data-chapter-practice="${escapeHtml(chapter)}">练习本章</button><button class="secondary" data-view="learn">返回学习中心</button></div>`;
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
      ? `<button class="primary" data-action="next-question">${isLast ? (practice.kind === "rework" ? (state.reworkReturn === "review" ? "返回复习" : "返回错题") : "完成今日一练") : "下一题"}</button>`
      : draftForm || `<div><p class="muted">${q.type === "essay" ? "请确认本题的最终学习结果" : "请确认系统判断是否符合你的学习情况"}</p><div class="result-buttons">${resultButtons}</div></div>`;
  const pitfall = answered && confirmed && MISTAKE_RESULTS.includes(attempt.result) ? (noteFor(q.chapter)?.pitfalls?.[0] || "") : "";
  return `<p class="eyebrow">${practice.kind === "rework" ? "错题重做" : "今日一练"} / ${state.session.cursor + 1} of ${practice.questionIds.length}</p>
    <div class="section-head"><h1>${PROJECTS[state.project].name}</h1><button class="text-button" data-view="home">退出练习</button></div>
    <section class="panel"><div class="question-meta"><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span><span class="tag orange">${q.kind === "real" ? "真题" : "模拟题"}</span><span class="tag">来源：${escapeHtml(q.source)}</span></div>
      ${reason ? `<p class="reason">选题原因：${escapeHtml(reason)}</p>` : ""}
      <div class="question-stem">${escapeHtml(q.stem)}</div>${questionInput(q, attempt)}
      ${answered ? `<div class="answer-box">${q.type === "essay" && attempt?.submittedAnswer ? `<span class="tag essay-note">${escapeHtml(attempt.submittedAnswer)}</span>` : ""}<div class="answer-line"><span class="muted">标准答案</span><strong>${escapeHtml(q.answer)}</strong></div><h3 class="solution-title">解题过程</h3><span class="explain">${escapeHtml(q.explanation)}</span>${pitfall ? `<div class="pitfall-hint">易错点：${escapeHtml(pitfall)}</div>` : ""}</div>` : ""}
      <div class="actions">${actions}</div>
    </section>`;
}

function questionInput(q, attempt) {
  if (q.type === "choice") return `<div class="options">${q.options.map((option) => `<label class="option"><input type="radio" name="answer" value="${escapeHtml(option)}" ${attempt?.submittedAnswer === option ? "checked" : ""} ${attempt?.submitted ? "disabled" : ""} />${escapeHtml(option)}</label>`).join("")}</div>`;
  if (q.type === "fill") return `<label style="margin-top:18px">你的答案<input id="answer-input" type="text" value="${escapeHtml(attempt?.submittedAnswer || "")}" ${attempt?.submitted ? "disabled" : ""} /></label>`;
  // 解答题不做文字录入：纸面作答后点「做完了，对答案」或「不会，直接看答案」
  return "";
}

/* ---------- 复习（记忆曲线） ---------- */

function reviewView() {
  const now = Date.now();
  const due = dueReviewIds(state.review, now)
    .map((id) => ({ id, q: questions.find((x) => x.id === id) }))
    .filter((x) => x.q && x.q.project === state.project);
  const upcoming = Object.entries(state.review)
    .filter(([, r]) => r && Number.isFinite(r.due) && r.due > now)
    .map(([id, r]) => ({ id, r, q: questions.find((x) => x.id === id) }))
    .filter((x) => x.q && x.q.project === state.project)
    .sort((a, b) => a.r.due - b.r.due)
    .slice(0, 5);
  const dueRows = due.length ? due.map(({ id, q }) => {
    const rec = state.review[id];
    const overdue = Math.ceil((now - rec.due) / 86400000);
    const nextGap = REVIEW_INTERVALS[Math.min(rec.stage, REVIEW_INTERVALS.length - 1)];
    return `<div class="mistake-row"><div class="question-meta"><span class="tag red">待复习</span><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span><span class="tag ${rec.stage >= 3 ? "teal" : "navy"}">阶段 ${rec.stage}/${REVIEW_INTERVALS.length}</span></div>
      <strong>${escapeHtml(q.stem)}</strong>
      <p class="muted">${overdue <= 0 ? "今天到期" : `已超期 ${overdue} 天`} · 答对后按 ${nextGap} 天间隔进入下一阶段</p>
      <div class="actions"><button class="primary" data-review-redo="${id}">现在复习</button></div></div>`;
  }).join("") : `<div class="empty">今日待复习已清空，干得漂亮！做错的题会自动进入记忆曲线排期。</div>`;
  const upcomingRows = upcoming.length ? upcoming.map(({ id, r, q }) => {
    const days = Math.max(1, Math.ceil((r.due - now) / 86400000));
    return `<div class="mistake-row"><div class="question-meta"><span class="tag navy">${days === 1 ? "明天" : `${days} 天后`}</span><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span></div><strong>${escapeHtml(q.stem)}</strong></div>`;
  }).join("") : "";
  return `<p class="eyebrow">复习计划 / 记忆曲线</p><h1>今天该复习什么？</h1><p class="lede">做错的题按 ${REVIEW_INTERVALS.join(" / ")} 天自动排期：答对拉长间隔，答错回到第 1 天。</p>
    <section class="section"><div class="section-head"><h2>今日待复习 <span class="muted">${due.length} 道</span></h2></div><div class="table-like">${dueRows}</div></section>
    ${upcomingRows ? `<section class="section"><div class="section-head"><h2>即将到期</h2><span class="muted">未来 5 道</span></div><div class="table-like">${upcomingRows}</div></section>` : ""}
    <div class="actions"><button class="secondary" data-view="mistakes">查看错题本</button><button class="secondary" data-view="home">回首页练习</button></div>`;
}

/* ---------- 错题 ---------- */

function mistakesView() {
  const rows = Object.values(state.attempts).filter((a) => a.confirmed && MISTAKE_RESULTS.includes(a.result)).map((a) => ({ ...a, q: questions.find((q) => q.id === a.questionId) })).filter((a) => a.q && a.q.project === state.project);
  const cleared = state.lastCleared && state.lastCleared.project === state.project && Date.now() - state.lastCleared.at < 60000
    ? `<div class="success-banner">重做成功，该题已自动移出错题本，并进入记忆曲线排期。</div>` : "";
  return `<p class="eyebrow">复盘 / 错题</p><h1>把做错的题留下。</h1><p class="lede">错误 / 不会 / 部分正确的题自动收录，重做答对即移出。</p>
    ${cleared}
    <section class="section panel"><div class="filter-row"><label>章节<select id="mistake-chapter"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}</select></label><label>结果<select id="mistake-result"><option value="all">全部结果</option><option value="incorrect">错误</option><option value="unknown">不会</option><option value="partial">部分正确</option></select></label></div><div id="mistake-list" class="table-like">${mistakeRows(rows)}</div></section>`;
}
function mistakeRows(rows) {
  if (!rows.length) return `<div class="empty">当前项目还没有错题记录。<span class="empty-sub">做错的题会自动收录到这里。</span><button class="secondary empty-action" data-view="home">去练一题</button></div>`;
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

/* ---------- 模拟考试 ---------- */

function examSetupView() {
  const counts = [10, 15, 20];
  const chapterOptions = `<option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}" ${state.examSetup.chapter === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}`;
  const history = (state.examResults || []).slice(0, 8).map((r) => {
    const pct = Math.round(r.accuracy * 100);
    const cls = pct >= 80 ? "teal" : pct >= 60 ? "orange" : "red";
    return `<div class="mistake-row"><div class="question-meta"><span class="tag ${cls}">${pct}%</span><span class="tag">${escapeHtml(r.projectName || "")}</span><span class="tag">${r.count} 题</span><span class="tag">${escapeHtml(r.chapter === "all" ? "全部章节" : r.chapter)}</span></div><div class="exam-result-line"><span>${r.correct}/${r.total} 正确</span><span class="muted">${String(r.date || "").slice(0, 10)} · ${Math.round(r.durationSeconds / 60)} 分钟</span></div></div>`;
  }).join("");
  return `<p class="eyebrow">模拟考试 / ${PROJECTS[state.project].code}</p><h1>限时成套，检验真水平。</h1><p class="lede">从当前科目客观题库随机组卷，题型交替排列。交卷自动判分，成绩自动归档。</p>
    <section class="section panel"><div class="section-head"><h2>组一套卷</h2><span class="muted">每题限时 ${EXAM_MINUTES_PER_QUESTION} 分钟</span></div>
      <label>题目数量<div class="exam-count-row">${counts.map((n) => `<button class="exam-count ${state.examSetup.count === n ? "active" : ""}" data-exam-count="${n}">${n} 题 · ${n * EXAM_MINUTES_PER_QUESTION} 分钟</button>`).join("")}</div></label>
      <label style="margin-top:14px">难度范围<div class="exam-count-row">${DIFF_OPTS.map(([v, label]) => `<button class="exam-count ${state.examSetup.difficulty === v ? "active" : ""}" data-exam-difficulty="${v}">${label}</button>`).join("")}</div></label>
      <label style="margin-top:14px">章节范围<select id="exam-chapter">${chapterOptions}</select></label>
      <div class="actions"><button class="primary" data-action="start-exam">开始考试</button><button class="secondary" data-view="home">返回首页</button></div>
      <p id="exam-notice" class="notice" hidden></p>
    </section>
    ${history ? `<section class="section"><div class="section-head"><h2>历史成绩</h2><span class="muted">最近 ${Math.min((state.examResults || []).length, 8)} 次</span></div><div class="table-like">${history}</div></section>` : ""}`;
}

function examView() {
  const ex = state.exam;
  if (!ex) return `<section class="panel"><h2>没有进行中的考试</h2><button class="primary" data-view="exam-setup">去组卷</button></section>`;
  const q = questions.find((x) => x.id === ex.questionIds[ex.cursor]);
  if (!q) { submitExam(false); return ""; }
  const answered = ex.answers[q.id];
  const remaining = Math.max(0, ex.deadline - Date.now());
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const answeredCount = Object.keys(ex.answers).filter((k) => String(ex.answers[k]).trim() !== "").length;
  const pageNumbers = ex.questionIds.map((id, i) => `<button class="exam-page ${i === ex.cursor ? "current" : ""} ${ex.answers[id] ? "done" : ""}" data-exam-page="${i}">${i + 1}</button>`).join("");
  const input = q.type === "choice"
    ? `<div class="options">${q.options.map((o) => `<label class="option"><input type="radio" name="exam-answer" value="${escapeHtml(o)}" ${answered === o ? "checked" : ""} />${escapeHtml(o)}</label>`).join("")}</div>`
    : `<label style="margin-top:18px">你的答案<input id="exam-answer-input" type="text" value="${escapeHtml(answered || "")}" /></label>`;
  return `<p class="eyebrow">模拟考试 / 限时作答</p>
    <div class="exam-topbar"><span class="tag navy">${ex.cursor + 1} / ${ex.questionIds.length}</span><span class="exam-timer ${remaining < 60000 ? "danger" : ""}" id="exam-timer">${mm}:${ss}</span><span class="muted">已答 ${answeredCount}/${ex.questionIds.length}</span></div>
    <div class="exam-pages">${pageNumbers}</div>
    <section class="panel"><div class="question-meta"><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span></div>
      <div class="question-stem">${escapeHtml(q.stem)}</div>${input}
      <div class="actions"><button class="secondary" data-action="exam-prev" ${ex.cursor === 0 ? "disabled" : ""}>上一题</button><button class="secondary" data-action="exam-next" ${ex.cursor === ex.questionIds.length - 1 ? "disabled" : ""}>下一题</button></div>
      <div class="actions"><button class="primary" data-action="submit-exam">交卷（${answeredCount}/${ex.questionIds.length} 已答）</button></div>
    </section>`;
}

function examResultView() {
  const r = lastExamResult;
  if (!r) return `<section class="panel"><h2>还没有成绩</h2><button class="primary" data-view="exam-setup">去考试</button></section>`;
  const pct = Math.round(r.accuracy * 100);
  const cls = pct >= 80 ? "teal" : pct >= 60 ? "orange" : "red";
  const rows = r.details.filter((d) => d.question).map((d) => `<div class="mistake-row"><div class="question-meta"><span class="tag ${d.correct ? "teal" : "red"}">${d.correct ? "正确" : "错误"}</span><span class="tag teal">${TYPE_NAMES[d.question.type]}</span><span class="tag">${escapeHtml(d.question.chapter)}</span></div>
    <strong>${escapeHtml(d.question.stem)}</strong>
    <p class="muted">你的答案：${escapeHtml(d.submitted === undefined || d.submitted === null || d.submitted === "" ? "（未作答）" : d.submitted)}</p>
    ${d.correct ? "" : `<p class="muted">标准答案：${escapeHtml(d.question.answer)}</p><div class="example-solution">${escapeHtml(d.question.explanation)}</div>`}
    </div>`).join("");
  return `<p class="eyebrow">模拟考试 / 成绩单</p>
    <section class="panel score-panel"><div class="score-number ${cls}">${pct}<small>%</small></div><p class="muted">${r.correct} / ${r.total} 正确 · ${r.auto ? "时间到自动交卷" : `用时 ${Math.round(r.durationSeconds / 60)} 分钟`}</p><div class="progress" style="margin-top:14px"><span style="width:${pct}%"></span></div></section>
    ${r.details.length ? `<section class="section"><div class="section-head"><h2>逐题解析</h2><span class="muted">只看错题过程</span></div><div class="table-like">${rows}</div></section>` : ""}
    <div class="actions"><button class="primary" data-action="exam-again">再考一套</button><button class="secondary" data-view="home">返回首页</button></div>`;
}

/* ---------- 事件绑定 ---------- */

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach((el) => el.addEventListener("click", (event) => { event.preventDefault(); view = el.dataset.view; render(); }));
  document.querySelectorAll("[data-project]").forEach((el) => el.addEventListener("click", () => { state.project = el.dataset.project; state.presetChapter = "all"; save(); render(); }));
  document.querySelectorAll("[data-count]").forEach((el) => el.addEventListener("click", () => { state.count = Math.max(1, Math.min(7, state.count + Number(el.dataset.count))); save(); render(); }));
  document.querySelector("#count-input")?.addEventListener("change", (event) => { state.count = Math.max(1, Math.min(7, Number(event.target.value) || 1)); save(); render(); });
  document.querySelector("#chapter-select")?.addEventListener("change", (event) => { state.presetChapter = event.target.value; save(); });
  document.querySelector("#difficulty-select")?.addEventListener("change", (event) => { state.presetDifficulty = event.target.value; save(); });
  document.querySelectorAll("[data-chapter-practice]").forEach((el) => el.addEventListener("click", () => { state.presetChapter = el.dataset.chapterPractice; save(); view = "home"; render(); }));
  document.querySelectorAll("[data-note-chapter]").forEach((el) => el.addEventListener("click", () => { state.presetNoteChapter = el.dataset.noteChapter; view = "notes"; render(); }));
  document.querySelector("[data-action='start-practice']")?.addEventListener("click", startPractice);
  document.querySelector("[data-action='submit-answer']")?.addEventListener("click", submitAnswer);
  document.querySelectorAll("[data-action='essay-done'], [data-action='essay-giveup']").forEach((el) => el.addEventListener("click", () => submitEssay(el.dataset.question, el.dataset.action === "essay-done" ? "done" : "giveup")));
  document.querySelector("[data-action='next-question']")?.addEventListener("click", nextQuestion);
  document.querySelectorAll("[data-question][data-result]").forEach((el) => el.addEventListener("click", () => chooseResult(el.dataset.question, el.dataset.result)));
  document.querySelector("[data-action='confirm-mistake']")?.addEventListener("click", confirmMistake);
  document.querySelector("[data-action='cancel-mistake']")?.addEventListener("click", () => { confirmDraft = null; render(); });
  document.querySelectorAll("[data-redo]").forEach((el) => el.addEventListener("click", () => startRework(el.dataset.redo, "mistakes")));
  document.querySelectorAll("[data-review-redo]").forEach((el) => el.addEventListener("click", () => startRework(el.dataset.reviewRedo, "review")));
  ["mistake-chapter", "mistake-result"].forEach((id) => document.querySelector(`#${id}`)?.addEventListener("change", filterMistakes));
  // 模拟考试
  document.querySelectorAll("[data-exam-count]").forEach((el) => el.addEventListener("click", () => { state.examSetup.count = Number(el.dataset.examCount); save(); render(); }));
  document.querySelectorAll("[data-exam-difficulty]").forEach((el) => el.addEventListener("click", () => { state.examSetup.difficulty = el.dataset.examDifficulty; save(); render(); }));
  document.querySelector("#exam-chapter")?.addEventListener("change", (event) => { state.examSetup.chapter = event.target.value; save(); });
  document.querySelector("[data-action='start-exam']")?.addEventListener("click", startExam);
  document.querySelectorAll("input[name='exam-answer']").forEach((el) => el.addEventListener("change", () => saveExamAnswer(el.value)));
  document.querySelector("#exam-answer-input")?.addEventListener("change", (event) => saveExamAnswer(event.target.value.trim()));
  document.querySelector("[data-action='exam-prev']")?.addEventListener("click", () => { if (state.exam && state.exam.cursor > 0) { state.exam.cursor -= 1; save(); render(); } });
  document.querySelector("[data-action='exam-next']")?.addEventListener("click", () => { if (state.exam && state.exam.cursor < state.exam.questionIds.length - 1) { state.exam.cursor += 1; save(); render(); } });
  document.querySelectorAll("[data-exam-page]").forEach((el) => el.addEventListener("click", () => { if (state.exam) { state.exam.cursor = Number(el.dataset.examPage); save(); render(); } }));
  document.querySelector("[data-action='submit-exam']")?.addEventListener("click", () => submitExam(false));
  document.querySelector("[data-action='exam-again']")?.addEventListener("click", () => { view = "exam-setup"; render(); });
}

/* ---------- 组卷 ---------- */

function startPractice() {
  const key = dailyKey();
  if (!state.practices[key]) {
    const plan = buildDailyPlan({ questions, attempts: state.attempts, project: state.project, chapter: state.presetChapter || "all", count: state.count, now: Date.now(), difficulty: state.presetDifficulty || "all" });
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
  const prevAttempt = state.attempts[id] || {};
  state.attempts[id] = { ...state.attempts[id], result, confirmed: true, reasonCode: reasonCode || undefined, note: note || undefined, confirmedAt: new Date().toISOString() };
  // 重做答对且本题确认前就在错题本：记录「已移出错题本」，供错题本页显示反馈（复习页巩固题不误报）
  if (result === "correct" && state.session?.kind === "rework" && MISTAKE_RESULTS.includes(prevAttempt.result)) {
    state.lastCleared = { at: Date.now(), questionId: id, project: state.project };
  }
  // 记忆曲线：每次确认结果都推进/重置复习阶段
  const prev = state.review[id] || { stage: 0, due: 0 };
  const stage = nextReviewStage(result, prev.stage);
  state.review[id] = { stage, due: reviewDueAt(stage), updatedAt: new Date().toISOString() };
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
    const back = state.reworkReturn || "mistakes";
    state.session = null;
    state.reworkReturn = null;
    save();
    view = back;
    render();
  } else {
    state.session = null;
    save();
    view = "home";
    render();
  }
}
function startRework(id, from) {
  const key = `rework-${Date.now()}`;
  state.practices[key] = { kind: "rework", project: state.project, questionIds: [id], status: "in_progress", createdAt: new Date().toISOString() };
  state.session = { key, cursor: 0, kind: "rework" };
  state.reworkReturn = from;
  save();
  view = "practice";
  render();
}

/* ---------- 模拟考试流程 ---------- */

function startExamTimer() {
  if (examTimer) { clearInterval(examTimer); examTimer = null; }
  examTimer = setInterval(() => {
    const timer = document.querySelector("#exam-timer");
    if (!state.exam) { clearInterval(examTimer); examTimer = null; return; }
    const remaining = state.exam.deadline - Date.now();
    if (timer) {
      const mm = String(Math.max(0, Math.floor(remaining / 60000))).padStart(2, "0");
      const ss = String(Math.max(0, Math.floor((remaining % 60000) / 1000))).padStart(2, "0");
      timer.textContent = `${mm}:${ss}`;
      timer.classList.toggle("danger", remaining < 60000);
    }
    if (remaining <= 0) submitExam(true);
  }, 1000);
}
function startExam() {
  const count = state.examSetup.count;
  const plan = buildExamPlan({ questions, project: state.project, chapter: state.examSetup.chapter || "all", count, seed: Date.now(), difficulty: state.examSetup.difficulty || "all" });
  if (!plan.items.length) {
    view = "exam-setup";
    render();
    const notice = document.querySelector("#exam-notice") || document.querySelector("#home-notice");
    if (notice) { notice.hidden = false; notice.textContent = plan.notice || "当前范围客观题不足，请更换章节、难度或减少题数。"; }
    return;
  }
  state.exam = {
    questionIds: plan.items.map((q) => q.id),
    chapter: state.examSetup.chapter || "all",
    difficulty: state.examSetup.difficulty || "all",
    count, answers: {}, cursor: 0,
    startedAt: Date.now(),
    deadline: Date.now() + count * EXAM_MINUTES_PER_QUESTION * 60000,
  };
  save();
  view = "exam";
  render();
}
function saveExamAnswer(value) {
  if (!state.exam) return;
  state.exam.answers[state.exam.questionIds[state.exam.cursor]] = value;
  save();
}
function submitExam(auto) {
  if (!state.exam) return;
  clearInterval(examTimer); examTimer = null;
  const result = scoreExam(questions, state.exam.answers, state.exam.questionIds);
  const durationSeconds = Math.round((Date.now() - state.exam.startedAt) / 1000);
  const rec = {
    date: new Date().toISOString(), project: state.project, projectName: PROJECTS[state.project].name,
    chapter: state.exam.chapter, count: state.exam.count,
    correct: result.correct, total: result.total, accuracy: result.accuracy,
    durationSeconds, auto: Boolean(auto),
  };
  state.examResults = [rec, ...(state.examResults || [])].slice(0, 50);
  lastExamResult = { ...rec, details: result.details };
  state.exam = null;
  save();
  view = "exam-result";
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
  fetch("data/questions.json").then((response) => response.json()),
  fetch("data/curriculum.json").then((response) => response.json()),
  fetch("data/notes.json").then((response) => response.json()),
]).then(([data, structure, noteData]) => {
  questions = data;
  notes = noteData || {};
  setCurriculum(structure);
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});
