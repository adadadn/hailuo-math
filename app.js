/* 海螺游学 · 考研数学自适应练习
 * 结构：纯逻辑在 core.js；本文件负责状态、路由、视图与交互。
 * 视图函数均为「纯函数 → HTML 字符串」，因此可以在 Node 中直接渲染做冒烟测试（见 test-views.mjs）。
 */
const Core = typeof window !== "undefined" ? window.Core : globalThis.Core;
const {
  answersMatch, buildDailyPlan, MISTAKE_RESULTS,
  nextReviewStage, reviewDueAt, dueReviewIds, REVIEW_INTERVALS,
  buildExamPlan, scoreExam, EXAM_MINUTES_PER_QUESTION,
} = Core;

const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
const STORAGE = "kaoyan-math-m1";
const STORAGE_VERSION = 2;
const TYPE_NAMES = { choice: "选择题", fill: "填空题", essay: "解答题" };
const DIFF_OPTS = [["all", "全部难度"], ["basic", "基础（难度≤2）"], ["hard", "拔高（难度≥3）"]];
const REASON_CODES = ["概念不清", "计算错误", "方法错误", "审题错误", "步骤遗漏", "其他"];
const VIEWS = ["home", "chapters", "learn", "notes", "practice", "review", "mistakes", "exam-setup", "exam", "exam-result", "daily-done", "settings", "search", "detail"];

const FALLBACK_PROJECTS = {
  math1: { name: "数学一", code: "MATH I", chapters: [] },
  math2: { name: "数学二", code: "MATH II", chapters: [] },
  math3: { name: "数学三", code: "MATH III", chapters: [] },
  calc396: { name: "396 经济类联考", code: "396", chapters: [] },
};

/* ---------- 工具 ---------- */

// 统一用本地时区日期（toISOString 是 UTC，凌晨 0–8 点会记到前一天）
const pad2 = (n) => String(n).padStart(2, "0");
const localDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const today = () => localDate(new Date());
const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? String(iso || "").slice(0, 10) : localDate(d); };
const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const resultName = (result) => ({ correct: "正确", incorrect: "错误", unknown: "不会", partial: "部分正确", pending_confirmation: "待确认" })[result] || result;
const fmtDuration = (seconds) => {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (total < 60) return `${total} 秒`;
  const m = Math.floor(total / 60);
  return m < 60 ? `${m} 分钟` : `${Math.floor(m / 60)} 小时 ${m % 60} 分`;
};
const truncate = (text, len = 72) => {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  return s.length > len ? `${s.slice(0, len)}…` : s;
};

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

/* ---------- 状态 ---------- */

const defaultSettings = () => ({ examDate: "", theme: "auto", fontScale: "normal", onboarded: false });
const defaultState = () => ({
  version: STORAGE_VERSION,
  project: "math1",
  count: 5,
  attempts: {},
  practices: {},
  checkins: {},
  session: null,
  presetChapter: "all",
  presetDifficulty: "all",
  presetSub: "all",
  presetNoteChapter: null,
  presetNoteSub: null,
  review: {},
  exam: null,
  examResults: [],
  examSetup: { count: 10, chapter: "all", difficulty: "all" },
  learned: {},
  subLearned: {},
  lastCleared: null,
  reworkReturn: null,
  settings: defaultSettings(),
});

const store = {
  read() { try { return localStorage.getItem(STORAGE); } catch { return null; } },
  write(value) { try { localStorage.setItem(STORAGE, value); } catch { /* 隐私模式/配额满时静默降级 */ } },
  clear() { try { localStorage.removeItem(STORAGE); } catch { /* ignore */ } },
};

function readState() {
  let parsed = null;
  try { parsed = JSON.parse(store.read() || "null"); } catch { parsed = null; }
  const base = defaultState();
  if (!parsed || typeof parsed !== "object") return base;
  const merged = { ...base, ...parsed, examSetup: { ...base.examSetup, ...(parsed.examSetup || {}) }, settings: { ...base.settings, ...(parsed.settings || {}) } };
  // 老用户升级：已有学习记录就不必再看首课引导
  const returning = Boolean(parsed.attempts && Object.keys(parsed.attempts).length) || Boolean(parsed.checkins && Object.keys(parsed.checkins).length);
  if (returning && !(parsed.settings && typeof parsed.settings.onboarded === "boolean")) merged.settings.onboarded = true;
  return merged;
}

let state = readState();
let questions = [];
let curriculum = {};
let notes = {};
let view = "home";
let examTimer = null;
let lastExamResult = null;
let searchQuery = "";
let detailId = null;
let confirmDraft = null;
let installPrompt = null;
let markedNoteKey = null;
let PROJECTS = FALLBACK_PROJECTS;

// 索引：避免在渲染循环里反复 Array.find / filter（2391 题的 O(n²) 会很卡）
let qIndex = new Map();
let bankByProject = new Map();
let countByScope = new Map();
let searchText = new Map();
let chapterSearch = new Map();
let masteryCache = new Map();
let masteryProject = null;

const save = () => store.write(JSON.stringify(state));
const questionShownAt = {}; // 每题开始作答时间（内存态）

function rebuildIndexes() {
  qIndex = new Map();
  bankByProject = new Map();
  countByScope = new Map();
  searchText = new Map();
  chapterSearch = new Map();
  for (const q of questions) {
    qIndex.set(q.id, q);
    // 解析里也会出现「洛必达」「夹逼」这类关键词，一并进检索
    const text = `${q.stem} ${q.answer} ${q.explanation || ""} ${q.chapter} ${q.sub || ""} ${q.source || ""}`.toLowerCase();
    searchText.set(q.id, text);
    if (q.reviewStatus !== "approved") continue;
    if (!bankByProject.has(q.project)) bankByProject.set(q.project, []);
    bankByProject.get(q.project).push(q);
    const scope = (chapter, sub) => `${q.project}|${chapter}|${sub || ""}`;
    countByScope.set(scope(q.chapter, ""), (countByScope.get(scope(q.chapter, "")) || 0) + 1);
    if (q.sub) countByScope.set(scope(q.chapter, q.sub), (countByScope.get(scope(q.chapter, q.sub)) || 0) + 1);
  }
  // 章节 / 小节 / 讲义一起建索引，保证搜「泰勒展开」也能找到对应讲义
  for (const [projectId, project] of Object.entries(PROJECTS)) {
    for (const chapter of project.chapters || []) {
      const note = noteFor(chapter.name);
      const text = `${chapter.name} ${(chapter.children || []).join(" ")} ${note ? JSON.stringify(note) : ""}`.toLowerCase();
      chapterSearch.set(`${projectId}|${chapter.name}`, text);
    }
  }
}

const findQ = (id) => qIndex.get(id) || null;
const projectTotal = (project) => (bankByProject.get(project) || []).length;
const chapterCount = (project, chapter) => countByScope.get(`${project}|${chapter}|`) || 0;
const subCount = (project, chapter, sub) => countByScope.get(`${project}|${chapter}|${sub}`) || 0;

// 清理 60 天前已完成的题单，防止本地存储无限增长（保留错题/成绩/复习记录）
function prunePractices() {
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
}

const projectQuestions = () => bankByProject.get(state.project) || [];
const dailyKey = () => `${today()}-${state.project}`;
const dailyPractice = () => state.practices[dailyKey()];
const sessionPractice = () => (state.session && state.practices[state.session.key]) || null;
const attemptFor = (id) => state.attempts[id];
const learnedFor = (chapter) => state.learned?.[NOTE_KEY[chapter] || chapter];

/* ---------- 主题 / 字号 ---------- */

function resolvedTheme() {
  const pref = state.settings?.theme || "auto";
  if (pref === "dark" || pref === "light") return pref;
  if (!isBrowser || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyChrome() {
  if (!isBrowser) return;
  const dark = resolvedTheme() === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.dataset.font = state.settings?.fontScale === "large" ? "large" : "normal";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#0b1420" : "#11557a";
}

/* ---------- 路由（浏览器返回键 / 滚动位置） ---------- */

const scrollMemory = new Map();

function openView(next, { replace = false } = {}) {
  const target = VIEWS.includes(next) ? next : "home";
  if (target === view) { render(); return; }
  if (isBrowser) scrollMemory.set(view, window.scrollY || 0);
  view = target;
  render();
  if (isBrowser) {
    if (replace) history.replaceState({ view }, "");
    else history.pushState({ view }, "");
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function refresh({ top = false } = {}) {
  render();
  if (top && isBrowser) window.scrollTo({ top: 0, behavior: "auto" });
}

function goBack(fallback = "home") {
  if (isBrowser && history.length > 1) history.back();
  else openView(fallback);
}

function onPopState(event) {
  const next = event.state && VIEWS.includes(event.state.view) ? event.state.view : "home";
  view = next;
  render();
  if (isBrowser) {
    const y = scrollMemory.get(next) || 0;
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }));
  }
}

/* ---------- 提示条 ---------- */

function toast(message, { actionLabel, onAction, timeout = 3200 } = {}) {
  if (!isBrowser) return;
  const root = document.querySelector("#toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span>${escapeHtml(message)}</span>`;
  if (actionLabel) {
    const btn = document.createElement("button");
    btn.className = "toast-action";
    btn.type = "button";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => { if (onAction) onAction(); el.remove(); });
    el.appendChild(btn);
  }
  root.appendChild(el);
  if (!actionLabel) setTimeout(() => el.remove(), timeout);
}

/* ---------- 图标 ---------- */

const ICON = {
  home: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
  learn: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
  review: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  mistakes: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
  me: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5S20 17 20 21"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  pen: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l10-10a2.8 2.8 0 1 0-4-4L4 16z"/><path d="M13.5 6.5 17.5 10.5"/></svg>',
};

/* ---------- 渲染 ---------- */

function render() {
  if (examTimer) { clearInterval(examTimer); examTimer = null; }
  const app = isBrowser ? document.querySelector("#app") : null;
  if (!app) return;
  let main = "";
  try {
    main = renderView();
  } catch (error) {
    console.error("[render]", error);
    main = errorView(error);
  }
  app.innerHTML = `
    <div class="app-shell">
      ${topbarHtml()}
      <main class="page" id="page">${main}</main>
      ${tabbarHtml()}
      <div class="toast-root" id="toast-root" aria-live="polite"></div>
      ${onboardingHtml()}
    </div>`;
  applyChrome();
  if (view === "exam" && state.exam) startExamTimer();
  if (view === "practice") queueAnswerFocus();
  if (view === "search") queueSearchFocus();
}

function renderView() {
  const routes = {
    home: homeView,
    chapters: chaptersView,
    learn: learnView,
    notes: notesView,
    practice: practiceView,
    review: reviewView,
    mistakes: mistakesView,
    "exam-setup": examSetupView,
    exam: examView,
    "exam-result": examResultView,
    "daily-done": dailyDoneView,
    settings: settingsView,
    search: searchView,
    detail: detailView,
  };
  return (routes[view] || homeView)();
}

function topbarHtml() {
  return `<header class="topbar"><div class="topbar-inner">
    <a class="brand" href="#" data-view="home" aria-label="回到首页">
      <span class="brand-mark"><img src="icon.svg" alt="" width="20" height="20" /></span>
      <span class="brand-text"><strong>海螺游学</strong><small>考研数学 · 自适应练习</small></span>
    </a>
    <div class="topbar-actions">
      <button class="icon-ghost" type="button" data-view="search" aria-label="搜索题目">${ICON.search}</button>
      <span class="topbar-day">${today().slice(5).replace("-", "/")}</span>
    </div>
  </div></header>`;
}

function tabbarHtml() {
  const tabs = [
    ["home", "首页", ICON.home],
    ["learn", "学习", ICON.learn],
    ["review", "复习", ICON.review],
    ["mistakes", "错题", ICON.mistakes],
    ["settings", "我的", ICON.me],
  ];
  const active = (id) => (id === view || (id === "learn" && (view === "notes" || view === "chapters" || view === "search" || view === "detail")) ? " active" : "");
  return `<nav class="tabbar" aria-label="主导航">${tabs.map(([id, label, icon]) => `<button class="tab${active(id)}" type="button" data-view="${id}" aria-current="${view === id ? "page" : "false"}">${icon}<span>${label}</span></button>`).join("")}</nav>`;
}

function onboardingHtml() {
  if (state.settings.onboarded) return "";
  const date = state.settings.examDate || defaultExamDate();
  return `<div class="sheet-backdrop">
    <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="ob-title">
      <p class="eyebrow">首次设置 · 10 秒</p>
      <h2 id="ob-title">先设定今天的目标</h2>
      <p class="lede">之后随时可以在「我的」里修改。</p>
      <div class="field"><span class="field-label">备考科目</span>
        <div class="chips">${Object.entries(PROJECTS).map(([id, p]) => `<button type="button" class="chip${id === state.project ? " active" : ""}" data-project="${id}">${escapeHtml(p.name)}</button>`).join("")}</div>
      </div>
      <div class="field"><span class="field-label">每日题量</span>
        <div class="stepper"><button type="button" class="icon-button" data-count="-1" aria-label="减少题量">−</button><strong>${state.count} 题</strong><button type="button" class="icon-button" data-count="1" aria-label="增加题量">+</button></div>
      </div>
      <label class="field" for="ob-date"><span class="field-label">初试日期</span>
        <input id="ob-date" type="date" value="${escapeHtml(date)}" />
      </label>
      <button class="primary big" type="button" data-action="finish-onboarding">开始今天的练习</button>
      <button class="text-button" type="button" data-action="skip-onboarding">先随便看看</button>
    </section>
  </div>`;
}

function errorView(error) {
  return `<section class="panel">
    <h2>这一页出了点问题</h2>
    <p class="muted">${escapeHtml(error && error.message ? error.message : "未知错误")}。学习记录仍在本地，可先返回首页。</p>
    <div class="actions"><button class="primary" type="button" data-view="home">返回首页</button><button class="secondary" type="button" data-action="export-data">导出备份</button></div>
  </section>`;
}

/* ---------- 统计 ---------- */

function statsForProject() {
  let done = 0;
  let correct = 0;
  let mistakes = 0;
  for (const a of Object.values(state.attempts)) {
    if (!a || !a.confirmed) continue;
    const q = qIndex.get(a.questionId);
    if (!q || q.project !== state.project) continue;
    done += 1;
    if (a.result === "correct") correct += 1;
    else if (MISTAKE_RESULTS.includes(a.result)) mistakes += 1;
  }
  return { done, correct, mistakes };
}

function checkinDateSet() {
  const set = new Set();
  for (const c of Object.values(state.checkins)) {
    if (c.project !== state.project) continue;
    const date = String(c.practiceKey || "").slice(0, 10);
    if (date) set.add(date);
  }
  return set;
}

function streakDays(dateSet) {
  let streak = 0;
  const cursor = dateSet.has(today()) ? new Date() : new Date(Date.now() - 86400000);
  while (dateSet.has(localDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function dueCount() {
  return dueReviewIds(state.review)
    .filter((id) => { const q = qIndex.get(id); return q && q.project === state.project; })
    .length;
}

function defaultExamDate() {
  const now = new Date();
  const year = now.getMonth() === 11 && now.getDate() > 20 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-12-19`;
}

function daysToExam() {
  const raw = state.settings?.examDate;
  if (!raw) return null;
  const target = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((target.getTime() - start.getTime()) / 86400000));
}

function chapterMasteryMap() {
  if (masteryProject === state.project && masteryCache.size) return masteryCache;
  const map = new Map();
  for (const a of Object.values(state.attempts)) {
    if (!a || !a.confirmed) continue;
    const q = qIndex.get(a.questionId);
    if (!q || q.project !== state.project) continue;
    const rec = map.get(q.chapter) || { total: 0, correct: 0 };
    rec.total += 1;
    if (a.result === "correct") rec.correct += 1;
    map.set(q.chapter, rec);
  }
  masteryCache = map;
  masteryProject = state.project;
  return map;
}

function invalidateMastery() {
  masteryCache = new Map();
  masteryProject = null;
}

/* ---------- 首页 ---------- */

function calendarHtml(dateSet) {
  const WEEK = ["一", "二", "三", "四", "五", "六", "日"];
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const offset = (todayDate.getDay() + 6) % 7; // 周一 = 0
  const start = new Date(todayDate);
  start.setDate(start.getDate() - offset - 28); // 本周 + 之前 4 周，共 35 天
  const cells = [];
  for (let i = 0; i < 35; i += 1) {
    const d = new Date(start.getTime() + i * 86400000);
    const ds = localDate(d);
    const future = d.getTime() > todayDate.getTime();
    const cls = ["cal-cell", dateSet.has(ds) ? "checked" : "", ds === today() ? "today" : "", future ? "future" : ""].filter(Boolean).join(" ");
    cells.push(`<span class="${cls}" title="${ds}" aria-label="${ds}${dateSet.has(ds) ? " 已打卡" : ""}">${future ? "" : d.getDate()}</span>`);
  }
  return `<div class="calendar-head">${WEEK.map((w) => `<span>${w}</span>`).join("")}</div><div class="calendar">${cells.join("")}</div>`;
}

function homeView() {
  const project = PROJECTS[state.project] || Object.values(PROJECTS)[0] || FALLBACK_PROJECTS.math1;
  const practice = dailyPractice();
  const ids = practice ? practice.questionIds : [];
  const done = ids.filter((id) => attemptFor(id)?.confirmed).length;
  const total = ids.length;
  const checked = Boolean(state.checkins[dailyKey()]);
  const stats = statsForProject();
  const ck = checkinDateSet();
  const streak = streakDays(ck);
  const due = dueCount();
  const days = daysToExam();
  const learnable = (project.chapters || []).filter((c) => noteFor(c.name));
  const learned = learnable.filter((c) => learnedFor(c.name)).length;
  const examTimes = (state.examResults || []).filter((r) => r.project === state.project).length;
  const statusText = !total ? "未开始" : checked ? "已完成" : `进行中 ${done}/${total}`;
  const statusClass = !total ? "is-idle" : checked ? "is-done" : "is-progress";
  const cta = !practice || !total ? { label: "生成今日一练", action: "start-practice" } : checked ? { label: "查看今日小结", action: "open-summary" } : { label: "继续今日一练", action: "start-practice" };
  const chapterLabel = state.presetChapter === "all" ? "全部章节" : state.presetChapter;
  const diffLabel = (DIFF_OPTS.find(([v]) => v === (state.presetDifficulty || "all")) || DIFF_OPTS[0])[1];
  const estimate = Math.max(3, Math.round((state.count * EXAM_MINUTES_PER_QUESTION * 1.2)));

  return `<section class="hero">
    <div class="hero-head">
      <span class="hero-label">${days === null ? "考研倒计时" : "距离初试"}</span>
      <button class="hero-link" type="button" data-view="settings" aria-label="设置考试日期">${state.settings.examDate ? `初试 ${escapeHtml(state.settings.examDate)}` : "设置考试日期"}</button>
    </div>
    <div class="hero-main"><strong class="hero-days">${days === null ? "—" : days}</strong><span class="hero-unit">天</span></div>
    <p class="hero-sub">${days === null ? "设好初试日期，每天都会看到还剩多少天。" : `${escapeHtml(project.name)} · 连续打卡 ${streak} 天`}</p>
    <div class="hero-metrics">
      <div><strong>${streak}</strong><span>连续</span></div>
      <div><strong>${ck.size}</strong><span>累计打卡</span></div>
      <div><strong>${stats.done}</strong><span>已确认做题</span></div>
    </div>
  </section>

  <section class="panel today-card">
    <div class="today-head">
      <div><h2>今日一练</h2><p class="muted">${state.count} 题 · 约 ${estimate} 分钟 · ${escapeHtml(project.name)}</p></div>
      <span class="status-pill ${statusClass}">${statusText}</span>
    </div>
    ${total ? `<div class="progress"><span style="width:${Math.round((done / total) * 100)}%"></span></div>` : ""}
    <button class="primary big" type="button" data-action="${cta.action}">${cta.label}</button>
    <details class="disclosure">
      <summary>调整范围：${escapeHtml(chapterLabel)} · ${escapeHtml(diffLabel)}</summary>
      <div class="controls">
        <label>今日题量
          <div class="count-control"><button class="icon-button" type="button" data-count="-1" aria-label="减少题量">−</button><input id="count-input" type="number" min="1" max="7" inputmode="numeric" value="${state.count}" /><button class="icon-button" type="button" data-count="1" aria-label="增加题量">+</button></div>
        </label>
        <label>章节范围
          <select id="chapter-select">
            <option value="all">全部章节</option>
            ${(project.chapters || []).map((c) => `<option value="${escapeHtml(c.name)}" ${state.presetChapter === c.name ? "selected" : ""}>${escapeHtml(c.name)}（${chapterCount(state.project, c.name)}）</option>`).join("")}
          </select>
        </label>
        <label>题目难度
          <select id="difficulty-select">${DIFF_OPTS.map(([v, label]) => `<option value="${v}" ${state.presetDifficulty === v ? "selected" : ""}>${label}</option>`).join("")}</select>
        </label>
      </div>
      ${state.presetSub && state.presetSub !== "all" ? `<p class="range-hint">当前范围：${escapeHtml(state.presetChapter)} / ${escapeHtml(state.presetSub)}（${subCount(state.project, state.presetChapter, state.presetSub)} 道题）<button class="text-button" type="button" data-action="clear-sub">清除小节</button></p>` : ""}
      <p id="home-notice" class="notice" hidden></p>
    </details>
  </section>

  <section class="quick-grid">
    <button class="quick" type="button" data-view="learn"><span class="quick-icon">${ICON.learn}</span><strong>学习中心</strong><span>${learned}/${learnable.length} 章已学</span></button>
    <button class="quick" type="button" data-view="review"><span class="quick-icon">${ICON.review}</span><strong>记忆曲线</strong><span>${due} 道待复习</span></button>
    <button class="quick" type="button" data-view="mistakes"><span class="quick-icon">${ICON.pen}</span><strong>错题本</strong><span>${stats.mistakes} 道待巩固</span></button>
    <button class="quick" type="button" data-view="exam-setup"><span class="quick-icon">${ICON.clock}</span><strong>模拟考试</strong><span>${examTimes} 次成绩</span></button>
  </section>

  <section class="section">
    <div class="section-head"><h2>备考科目</h2><span class="muted">${escapeHtml(project.name)}</span></div>
    <div class="chips">${Object.entries(PROJECTS).map(([id, item]) => `<button type="button" class="chip${id === state.project ? " active" : ""}" data-project="${id}">${escapeHtml(item.name)}<em>${projectTotal(id)}</em></button>`).join("")}</div>
  </section>

  <section class="section panel">
    <div class="section-head"><h2>打卡日历</h2><span class="muted">最近 5 周</span></div>
    ${calendarHtml(ck)}
    <p class="muted calendar-hint">完成当天一练即自动打卡。</p>
  </section>

  ${due ? `<section class="section"><button class="notice-action" type="button" data-view="review"><span><strong>${due}</strong> 道题今天到期，按记忆曲线该复习了。</span><span class="arrow">去复习 →</span></button></section>` : ""}

  <footer class="footer">进度只保存在本机浏览器；换设备前可在「我的」里导出备份。</footer>`;
}

/* ---------- 章节 ---------- */

function chaptersView() {
  const p = PROJECTS[state.project];
  const mastery = chapterMasteryMap();
  return `<p class="eyebrow">章节浏览 / ${p.code}</p><h1>${escapeHtml(p.name)}</h1>
    <p class="lede">按考试范围拆开的完整章节结构，每章都有配套讲义，建议先学后练。</p>
    <section class="section"><div class="section-head"><h2>一级章节 <span class="muted">${p.chapters.length}</span></h2><button class="text-button" type="button" data-action="back">返回</button></div>
      <div class="chapter-list">${p.chapters.map((c, i) => {
        const rec = mastery.get(c.name) || { total: 0, correct: 0 };
        const rate = rec.total ? Math.round((rec.correct / rec.total) * 100) : 0;
        return `<details class="chapter-item"><summary><strong>${String(i + 1).padStart(2, "0")} · ${escapeHtml(c.name)}</strong><span>${chapterCount(state.project, c.name)} 道题</span></summary>
          <div class="chapter-progress"><span>${rec.total ? `已练 ${rec.total} 题 · 答对 ${rec.correct} 题（${rate}%）` : "本章尚未练习"}</span><div class="progress slim"><span style="width:${rate}%"></span></div></div>
          <div class="knowledge-list">${(c.children || []).map((child) => `<span>${escapeHtml(child)}<em>${subCount(state.project, c.name, child)}题</em></span>`).join("")}</div>
          <div class="chapter-actions"><button class="secondary" type="button" data-chapter-practice="${escapeHtml(c.name)}">练习本章</button>${noteFor(c.name) ? `<button class="secondary" type="button" data-note-chapter="${escapeHtml(c.name)}">查看讲义</button>` : ""}</div>
        </details>`;
      }).join("")}</div>
    </section>`;
}

/* ---------- 学习中心 ---------- */

function markLearned(chapter) {
  const key = NOTE_KEY[chapter] || chapter;
  const rec = state.learned?.[key] || { firstSeen: Date.now(), count: 0 };
  state.learned[key] = { ...rec, lastSeen: Date.now(), count: rec.count + 1 };
  save();
}

const markSubLearned = (chapter, sub) => {
  const key = NOTE_KEY[chapter] || chapter;
  state.subLearned[key] = { ...(state.subLearned[key] || {}), [sub]: true };
  save();
};

function learnView() {
  const p = PROJECTS[state.project];
  const learnable = p.chapters.filter((c) => noteFor(c.name));
  const learnedCount = learnable.filter((c) => learnedFor(c.name)).length;
  const mastery = chapterMasteryMap();
  const chapterRows = p.chapters.map((c, i) => {
    const note = noteFor(c.name);
    const learned = learnedFor(c.name);
    const rec = mastery.get(c.name) || { total: 0, correct: 0 };
    const rate = rec.total ? Math.round((rec.correct / rec.total) * 100) : 0;
    const subs = c.children || [];
    const subKey = NOTE_KEY[c.name] || c.name;
    const subChips = subs.map((s) => {
      const n = subCount(state.project, c.name, s);
      return `<button type="button" class="sub-chip${state.subLearned?.[subKey]?.[s] ? " done" : ""}" data-note-chapter="${escapeHtml(c.name)}" data-note-sub="${escapeHtml(s)}" title="${n} 道题">${state.subLearned?.[subKey]?.[s] ? "✓ " : ""}${escapeHtml(s)}<span class="sub-count">${n}</span></button>`;
    }).join("");
    return `<div class="chapter-card">
      <button class="chapter-row${note ? "" : " disabled"}${learned ? " learned" : ""}" type="button" ${note ? `data-note-chapter="${escapeHtml(c.name)}"` : ""}>
        <span class="chapter-no">${learned ? "✓" : String(i + 1).padStart(2, "0")}</span>
        <span class="chapter-main"><strong>${escapeHtml(c.name)}</strong><span class="muted">${chapterCount(state.project, c.name)} 道题 · ${rec.total ? `已练 ${rec.total} 题 · 正确率 ${rate}%` : "未练习"} · ${note ? (learned ? "已学" : "待学习") : "讲义整理中"}</span></span>
        <span class="chapter-arrow">›</span>
      </button>
      ${subs.length ? `<div class="sub-list">${subChips}</div>` : ""}
    </div>`;
  }).join("");
  return `<p class="eyebrow">学习中心 / ${p.code}</p>
    <h1>先学会，再练题。</h1>
    <p class="lede">每章有「考点 + 公式 + 方法 + 易错点 + 例题精讲」讲义，可先看讲义再进练习。</p>
    <button class="searchbar" type="button" data-view="search">${ICON.search}<span>搜索题目、答案或知识点</span></button>
    <section class="section"><div class="section-head"><h2>${escapeHtml(p.name)}</h2><span class="muted">已学 ${learnedCount}/${learnable.length} 章</span></div>
      <div class="chapter-list">${chapterRows}</div>
    </section>`;
}

function notesView() {
  const chapter = state.presetNoteChapter || "";
  const sub = state.presetNoteSub || "";
  const note = noteFor(chapter);
  const p = PROJECTS[state.project];
  if (!note) {
    return `<section class="panel"><h2>讲义未找到</h2><p class="muted">该章节暂时没有讲义，先去题库练习吧。</p><button class="primary" type="button" data-view="learn">返回学习中心</button></section>`;
  }
  // 只在切到新讲义时记录一次「已学」，避免每次重绘（切主题、点小节）重复计数
  const noteKey = `${chapter}|${sub}`;
  if (markedNoteKey !== noteKey) {
    markLearned(chapter);
    if (sub) markSubLearned(chapter, sub);
    markedNoteKey = noteKey;
  }
  const subs = (p.chapters.find((c) => c.name === chapter)?.children) || [];
  const subNav = subs.length
    ? `<div class="sub-nav"><span class="sub-nav-label">小节</span>${subs.map((s) => `<button type="button" class="sub-chip${s === sub ? " active" : ""}" data-note-chapter="${escapeHtml(chapter)}" data-note-sub="${escapeHtml(s)}">${s === sub ? "▸ " : ""}${escapeHtml(s)}</button>`).join("")}</div>`
    : "";
  const formulaRows = (note.formulas || []).map((f) => `<tr><td>${escapeHtml(f.name)}</td><td>${escapeHtml(f.body)}</td></tr>`).join("");
  const methodList = (note.methods || []).map((m) => `<li><strong>${escapeHtml(m.name)}</strong><div class="muted">${escapeHtml(m.body)}</div></li>`).join("");
  const exampleList = (note.examples || []).map((ex, i) => `<details class="example-item"><summary><span class="tag navy">例 ${i + 1}</span>${escapeHtml(ex.stem)}</summary><div class="example-body"><p class="muted">标准答案：${escapeHtml(ex.answer)}</p><div class="example-solution">${escapeHtml(ex.solution)}</div></div></details>`).join("");
  return `<p class="eyebrow">学习中心 / ${p.code}</p>
    <div class="section-head"><h1>${escapeHtml(chapter)}</h1><button class="text-button" type="button" data-view="learn">返回章节</button></div>
    ${subNav}
    <section class="section panel"><h2>本章概述</h2><p class="lede mb-0">${escapeHtml(note.summary)}</p></section>
    <section class="section panel"><h2>核心考点</h2><ul class="check-list">${(note.keyPoints || []).map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul></section>
    ${note.formulas?.length ? `<section class="section panel"><h2>必备公式</h2><div class="formula-table"><table><tbody>${formulaRows}</tbody></table></div></section>` : ""}
    ${note.methods?.length ? `<section class="section panel"><h2>解题方法</h2><ol class="method-list">${methodList}</ol></section>` : ""}
    ${note.pitfalls?.length ? `<section class="section panel"><h2>易错点提醒</h2><ul class="pitfall-list">${note.pitfalls.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul></section>` : ""}
    ${exampleList ? `<section class="section"><div class="section-head"><h2>例题精讲</h2><span class="muted">先自己算，再点开</span></div><div class="chapter-list">${exampleList}</div></section>` : ""}
    <div class="actions">${sub ? `<button class="primary" type="button" data-sub-practice="${escapeHtml(chapter)}" data-sub-name="${escapeHtml(sub)}">练习本小节</button>` : `<button class="primary" type="button" data-chapter-practice="${escapeHtml(chapter)}">练习本章</button>`}<button class="secondary" type="button" data-view="learn">返回学习中心</button></div>`;
}

/* ---------- 练习 ---------- */

function practiceView() {
  const practice = sessionPractice();
  if (!practice) {
    return `<section class="panel"><h2>还没有进行中的练习</h2><p class="muted">先回首页生成今日一练。</p><button class="primary" type="button" data-view="home">返回首页</button></section>`;
  }
  const id = practice.questionIds[state.session.cursor];
  const q = findQ(id);
  if (!q) {
    return `<section class="panel"><h2>题目不存在</h2><p class="muted">题库可能已更新，请返回首页重新组卷。</p><button class="primary" type="button" data-view="home">返回首页</button></section>`;
  }
  // 错题重做：忽略本次重做之前的旧作答记录，新提交后正常显示作答态
  let attempt = attemptFor(id);
  if (practice.kind === "rework" && attempt && attempt.practiceKey !== state.session.key) attempt = null;
  const answered = Boolean(attempt?.submitted);
  const confirmed = Boolean(attempt?.confirmed);
  if (!answered) questionShownAt[id] = Date.now();
  const reason = practice.reasons ? practice.reasons[id] : null;
  const last = practice.questionIds.length - 1;
  const isLast = state.session.cursor === last;
  const title = practice.kind === "rework" ? "错题重做" : "今日一练";
  const verdict = !answered ? "" : attempt.result === "correct"
    ? `<div class="verdict ok" role="status">答对了。看一下解析，确认思路也没跑偏。</div>`
    : attempt.result === "pending_confirmation"
      ? `<div class="verdict" role="status">对照标准答案，给出这道题的真实结果。</div>`
      : `<div class="verdict no" role="status">这次没答对。看完解析，把错因记下来。</div>`;
  const resultButtons = ["correct", "incorrect", "unknown", "partial"].map((r) => `<button type="button" data-result="${r}" data-question="${q.id}">${resultName(r)}</button>`).join("");
  const draftForm = confirmDraft && confirmDraft.id === q.id
    ? `<div class="panel mistake-form"><p class="muted">标记为「${resultName(confirmDraft.result)}」——补一个错因，便于后续按原因复习（可选）。</p>
      <label>错因分类<select id="reason-code"><option value="">未选择</option>${REASON_CODES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></label>
      <label>复盘备注<textarea id="reason-note" rows="2" placeholder="可选：简单记一下卡在哪一步"></textarea></label>
      <div class="actions"><button class="primary" type="button" data-action="confirm-mistake">确认</button><button class="text-button" type="button" data-action="cancel-mistake">取消</button></div></div>`
    : "";
  const primaryAction = !answered
    ? q.type === "essay"
      ? `<div class="essay-entry"><p class="muted">先在纸上完成作答，再选择你的状态：</p><div class="actions"><button class="primary" type="button" data-action="essay-done" data-question="${q.id}">做完了，对答案</button><button class="secondary" type="button" data-action="essay-giveup" data-question="${q.id}">不会，直接看答案</button></div></div>`
      : `<div class="answer-actions"><button class="primary" type="button" data-action="submit-answer" data-question="${q.id}">提交答案</button><button class="text-button" type="button" data-action="essay-giveup" data-question="${q.id}">不会，直接看答案</button></div>`
    : confirmed
      ? `<button class="primary" type="button" data-action="next-question">${isLast ? (practice.kind === "rework" ? "完成重做" : "完成今日一练") : "下一题"}</button>`
      : draftForm || `<div><p class="muted">${q.type === "essay" ? "请确认本题的最终学习结果" : "系统判断如上，请确认是否符合你的实际作答"}</p><div class="result-buttons">${resultButtons}</div></div>`;
  const pitfall = answered && confirmed && MISTAKE_RESULTS.includes(attempt.result) ? (noteFor(q.chapter)?.pitfalls?.[0] || "") : "";
  return `<div class="practice-top">
    <span class="eyebrow">${title} · 第 ${state.session.cursor + 1} / ${practice.questionIds.length} 题</span>
    <button class="text-button" type="button" data-action="exit-practice">退出</button>
  </div>
  <div class="progress slim"><span style="width:${Math.round(((state.session.cursor + 1) / practice.questionIds.length) * 100)}%"></span></div>
  <section class="panel question-panel">
    <div class="question-meta">
      <span class="tag teal">${TYPE_NAMES[q.type]}</span>
      <span class="tag">${escapeHtml(q.chapter)}</span>
      <span class="tag orange">${q.kind === "real" ? "真题" : "模拟题"}</span>
      <span class="tag">难度 ${Number(q.difficulty) || 1}</span>
    </div>
    ${reason ? `<p class="reason">选题原因：${escapeHtml(reason)}</p>` : ""}
    <div class="question-stem">${escapeHtml(q.stem)}</div>
    ${questionInput(q, attempt)}
    ${answered ? `<div class="answer-box">
      ${q.type === "essay" && attempt?.submittedAnswer ? `<span class="tag essay-note">${escapeHtml(attempt.submittedAnswer)}</span>` : ""}
      <div class="answer-line"><span class="muted">标准答案</span><strong>${escapeHtml(q.answer)}</strong></div>
      <h3 class="solution-title">解题过程</h3>
      <span class="explain">${escapeHtml(q.explanation)}</span>
      ${pitfall ? `<div class="pitfall-hint">易错点：${escapeHtml(pitfall)}</div>` : ""}
      ${q.source ? `<p class="question-source muted">来源：${escapeHtml(q.source)}</p>` : ""}
    </div>` : ""}
    ${verdict}
    <div class="actions">${primaryAction}</div>
    <div class="practice-nav">
      <button class="text-button" type="button" data-action="prev-question" ${state.session.cursor === 0 ? "disabled" : ""}>← 上一题</button>
      <span class="muted small">进度已自动保存</span>
    </div>
  </section>`;
}

function questionInput(q, attempt) {
  const disabled = attempt?.submitted ? "disabled" : "";
  if (q.type === "choice") {
    return `<div class="options">${(q.options || []).map((option, i) => `<label class="option"><input type="radio" name="answer" value="${escapeHtml(option)}" ${attempt?.submittedAnswer === option ? "checked" : ""} ${disabled} /><span class="option-mark">${"ABCDEF"[i] || i + 1}</span><span class="option-text">${escapeHtml(option)}</span></label>`).join("")}</div>`;
  }
  if (q.type === "fill") {
    return `<label class="field answer-field">你的答案
      <input id="answer-input" type="text" value="${escapeHtml(attempt?.submittedAnswer || "")}" ${disabled} autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" inputmode="text" placeholder="输入结果后按回车" />
      <span class="muted field-hint">支持 1/2、0.5、x^2 等写法，等价数值自动判定</span>
    </label>`;
  }
  // 解答题不做文字录入：纸面作答后点「做完了，对答案」或「不会，直接看答案」
  return `<p class="muted essay-hint">解答题请在纸上完成，然后选择作答状态。标准答案与解析会在提交后展开。</p>`;
}

function queueAnswerFocus() {
  if (!isBrowser) return;
  requestAnimationFrame(() => {
    const input = document.querySelector("#answer-input");
    if (input && !input.disabled && document.activeElement !== input) input.focus({ preventScroll: true });
  });
}

function queueSearchFocus() {
  if (!isBrowser) return;
  requestAnimationFrame(() => {
    const input = document.querySelector("#search-input");
    if (input && document.activeElement !== input) input.focus({ preventScroll: true });
  });
}

/* ---------- 今日完成 ---------- */

function dailyDoneView() {
  const p = dailyPractice();
  const items = p ? p.questionIds.map((id) => ({ q: findQ(id), a: attemptFor(id) })).filter((x) => x.q) : [];
  const done = items.filter((x) => x.a && x.a.confirmed);
  const total = done.length;
  const correct = done.filter((x) => x.a.result === "correct").length;
  const wrong = done.filter((x) => MISTAKE_RESULTS.includes(x.a.result));
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const cls = pct >= 80 ? "teal" : pct >= 60 ? "orange" : "red";
  const checked = Boolean(state.checkins[dailyKey()]);
  const wrongRows = wrong.length ? wrong.map(({ q, a }) => `<div class="mistake-row"><div class="question-meta"><span class="tag orange">${resultName(a.result)}</span><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span></div>
    <strong>${escapeHtml(truncate(q.stem, 90))}</strong>
    <p class="muted">你的答案：${escapeHtml(a.submittedAnswer === "" ? "（未作答）" : a.submittedAnswer)} · 标准答案：${escapeHtml(q.answer)}</p>
    <div class="actions"><button class="secondary" type="button" data-redo="${q.id}">重做此题</button><button class="secondary" type="button" data-view="mistakes">去错题本</button></div></div>`).join("") : "";
  return `<p class="eyebrow">今日一练 / 完成</p>
    ${checked ? `<div class="checkin-banner"><strong>今日已打卡</strong><span>连续 ${streakDays(checkinDateSet())} 天</span></div>` : ""}
    <section class="panel score-panel"><div class="score-number ${cls}">${pct}<small>%</small></div><p class="muted">${correct} / ${total} 道正确${total - correct ? ` · ${total - correct} 道待巩固` : " · 全对，干得漂亮"}</p><div class="progress" style="margin-top:14px"><span style="width:${pct}%"></span></div>
      <p class="muted score-hint">${pct >= 80 ? "状态在线，明天保持这个节奏。" : pct >= 60 ? "基础还行，错题建议当天重做一遍。" : "先把错题吃透，比继续刷新题更划算。"}</p>
    </section>
    ${wrongRows ? `<section class="section"><div class="section-head"><h2>待巩固</h2><span class="muted">${wrong.length} 道已进错题本与记忆曲线</span></div><div class="table-like">${wrongRows}</div></section>` : ""}
    <div class="actions"><button class="primary" type="button" data-view="home">返回首页</button><button class="secondary" type="button" data-view="review">去复习</button><button class="secondary" type="button" data-action="export-data">导出进度</button></div>`;
}

/* ---------- 复习 ---------- */

function reviewView() {
  const now = Date.now();
  const due = dueReviewIds(state.review)
    .map((id) => ({ id, q: findQ(id) }))
    .filter((x) => x.q && x.q.project === state.project);
  const upcoming = Object.entries(state.review)
    .filter(([, r]) => r && Number.isFinite(r.due) && r.due > now)
    .map(([id, r]) => ({ id, r, q: findQ(id) }))
    .filter((x) => x.q && x.q.project === state.project)
    .sort((a, b) => a.r.due - b.r.due)
    .slice(0, 5);
  const dueRows = due.length ? due.map(({ id, q }) => {
    const rec = state.review[id];
    const overdue = Math.ceil((now - rec.due) / 86400000);
    const nextGap = REVIEW_INTERVALS[Math.min(rec.stage, REVIEW_INTERVALS.length - 1)];
    return `<div class="mistake-row"><div class="question-meta"><span class="tag red">待复习</span><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span><span class="tag ${rec.stage >= 3 ? "teal" : "navy"}">阶段 ${rec.stage}/${REVIEW_INTERVALS.length}</span></div>
      <strong>${escapeHtml(truncate(q.stem, 90))}</strong>
      <p class="muted">${overdue <= 0 ? "今天到期" : `已超期 ${overdue} 天`} · 答对后按 ${nextGap} 天间隔进入下一阶段</p>
      <div class="actions"><button class="primary" type="button" data-review-redo="${id}">现在复习</button></div></div>`;
  }).join("") : `<div class="empty">今日待复习已清空，干得漂亮！<span class="empty-sub">做错的题会自动进入记忆曲线排期。</span><button class="secondary empty-action" type="button" data-view="home">去做今日一练</button></div>`;
  const upcomingRows = upcoming.length ? upcoming.map(({ id, r, q }) => {
    const days = Math.max(1, Math.ceil((r.due - now) / 86400000));
    return `<div class="mistake-row"><div class="question-meta"><span class="tag navy">${days === 1 ? "明天" : `${days} 天后`}</span><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span></div><strong>${escapeHtml(truncate(q.stem, 80))}</strong></div>`;
  }).join("") : "";
  return `<p class="eyebrow">复习计划 / 记忆曲线</p><h1>今天该复习什么？</h1>
    <p class="lede">做错的题按 ${REVIEW_INTERVALS.join(" / ")} 天自动排期：答对拉长间隔，答错回到第 1 天。</p>
    <section class="section"><div class="section-head"><h2>今日待复习 <span class="muted">${due.length} 道</span></h2></div><div class="table-like">${dueRows}</div></section>
    ${upcomingRows ? `<section class="section"><div class="section-head"><h2>即将到期</h2><span class="muted">未来 5 道</span></div><div class="table-like">${upcomingRows}</div></section>` : ""}
    <div class="actions"><button class="secondary" type="button" data-view="mistakes">查看错题本</button><button class="secondary" type="button" data-view="home">回首页练习</button></div>`;
}

/* ---------- 错题 ---------- */

function mistakeAttempts() {
  return Object.values(state.attempts)
    .filter((a) => a && a.confirmed && MISTAKE_RESULTS.includes(a.result))
    .map((a) => ({ ...a, q: qIndex.get(a.questionId) }))
    .filter((a) => a.q && a.q.project === state.project);
}

function mistakesView() {
  const rows = mistakeAttempts();
  const cleared = state.lastCleared && state.lastCleared.project === state.project && Date.now() - state.lastCleared.at < 60000
    ? `<div class="success-banner">重做成功，该题已自动移出错题本，并进入记忆曲线排期。</div>` : "";
  return `<p class="eyebrow">复盘 / 错题</p><h1>把做错的题留下。</h1>
    <p class="lede">错误 / 不会 / 部分正确的题自动收录，重做答对即移出。</p>
    ${cleared}
    <section class="section panel">
      <div class="filter-row">
        <label>章节<select id="mistake-chapter"><option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join("")}</select></label>
        <label>结果<select id="mistake-result"><option value="all">全部结果</option><option value="incorrect">错误</option><option value="unknown">不会</option><option value="partial">部分正确</option></select></label>
        <label>错因<select id="mistake-reason"><option value="all">全部错因</option>${REASON_CODES.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></label>
      </div>
      <div id="mistake-list" class="table-like">${mistakeRows(rows)}</div>
    </section>`;
}

function mistakeRows(rows) {
  if (!rows.length) {
    return `<div class="empty">当前项目还没有错题记录。<span class="empty-sub">做错的题会自动收录到这里。</span><button class="secondary empty-action" type="button" data-view="home">去练一题</button></div>`;
  }
  return rows.map((a) => {
    const reasonTag = a.reasonCode ? `<span class="tag orange">${escapeHtml(a.reasonCode)}</span>` : "";
    const resultTagClass = a.result === "incorrect" ? "red" : a.result === "partial" ? "orange" : "navy";
    const note = a.note ? `<p class="muted mistake-note">复盘：${escapeHtml(a.note)}</p>` : "";
    return `<div class="mistake-row" data-chapter="${escapeHtml(a.q.chapter)}" data-result="${a.result}" data-reason="${escapeHtml(a.reasonCode || "")}">
      <div class="question-meta"><span class="tag ${resultTagClass}">${resultName(a.result)}</span>${reasonTag}<span class="tag">${escapeHtml(a.q.chapter)}</span></div>
      <strong>${escapeHtml(truncate(a.q.stem, 110))}</strong>${note}
      <p class="muted">标准答案：${escapeHtml(a.q.answer)}</p>
      <div class="actions"><button class="secondary" type="button" data-redo="${a.questionId}">重做此题</button><button class="text-button" type="button" data-detail="${a.questionId}">看解析</button></div></div>`;
  }).join("");
}

function filterMistakes() {
  if (!isBrowser) return;
  const chapter = document.querySelector("#mistake-chapter")?.value || "all";
  const result = document.querySelector("#mistake-result")?.value || "all";
  const reason = document.querySelector("#mistake-reason")?.value || "all";
  let visible = 0;
  document.querySelectorAll("#mistake-list .mistake-row").forEach((row) => {
    const hide = (chapter !== "all" && row.dataset.chapter !== chapter) || (result !== "all" && row.dataset.result !== result) || (reason !== "all" && row.dataset.reason !== reason);
    row.hidden = hide;
    if (!hide) visible += 1;
  });
  const list = document.querySelector("#mistake-list");
  if (list && !visible) {
    const hint = document.createElement("div");
    hint.className = "empty";
    hint.id = "mistake-filter-empty";
    hint.textContent = "没有符合筛选条件的错题，换个条件试试。";
    list.appendChild(hint);
  } else {
    document.querySelector("#mistake-filter-empty")?.remove();
  }
}

/* ---------- 模拟考试 ---------- */

function examSetupView() {
  const counts = [10, 15, 20];
  const chapterOptions = `<option value="all">全部章节</option>${PROJECTS[state.project].chapters.map((c) => `<option value="${escapeHtml(c.name)}" ${state.examSetup.chapter === c.name ? "selected" : ""}>${escapeHtml(c.name)}</option>`).join("")}`;
  const history = (state.examResults || []).slice(0, 8).map((r) => {
    const pct = Math.round((r.accuracy || 0) * 100);
    const cls = pct >= 80 ? "teal" : pct >= 60 ? "orange" : "red";
    return `<div class="mistake-row"><div class="question-meta"><span class="tag ${cls}">${pct}%</span><span class="tag">${escapeHtml(r.projectName || "")}</span><span class="tag">${r.count} 题</span><span class="tag">${escapeHtml(r.chapter === "all" ? "全部章节" : r.chapter)}</span></div><div class="exam-result-line"><span>${r.correct}/${r.total} 正确</span><span class="muted">${fmtDate(r.date)} · ${fmtDuration(r.durationSeconds)}</span></div></div>`;
  }).join("");
  return `<p class="eyebrow">模拟考试 / ${PROJECTS[state.project].code}</p>
    <h1>限时成套，检验真水平。</h1>
    <p class="lede">从当前科目客观题库随机组卷，交卷自动判分。10 / 15 / 20 题可选，每题 ${EXAM_MINUTES_PER_QUESTION} 分钟。</p>
    <section class="section panel">
      <div class="section-head"><h2>组一套卷</h2><span class="muted">客观题自动判分</span></div>
      <label>题目数量<div class="exam-count-row">${counts.map((n) => `<button class="exam-count${state.examSetup.count === n ? " active" : ""}" type="button" data-exam-count="${n}">${n} 题 · ${n * EXAM_MINUTES_PER_QUESTION} 分钟</button>`).join("")}</div></label>
      <label class="mt-14">难度范围<div class="exam-count-row">${DIFF_OPTS.map(([v, label]) => `<button class="exam-count${state.examSetup.difficulty === v ? " active" : ""}" type="button" data-exam-difficulty="${v}">${label}</button>`).join("")}</div></label>
      <label class="mt-14">章节范围<select id="exam-chapter">${chapterOptions}</select></label>
      <div class="actions"><button class="primary" type="button" data-action="start-exam">开始考试</button><button class="secondary" type="button" data-view="home">返回首页</button></div>
      <p id="exam-notice" class="notice" hidden></p>
    </section>
    ${history ? `<section class="section"><div class="section-head"><h2>历史成绩</h2><span class="muted">最近 ${Math.min((state.examResults || []).length, 8)} 次</span></div><div class="table-like">${history}</div></section>` : `<div class="empty">还没有考试记录。先来一套 10 题的基础卷试试。</div>`}`;
}

function examView() {
  const ex = state.exam;
  if (!ex) return `<section class="panel"><h2>没有进行中的考试</h2><p class="muted">可以先组一套卷。</p><button class="primary" type="button" data-view="exam-setup">去组卷</button></section>`;
  const q = findQ(ex.questionIds[ex.cursor]);
  if (!q) { submitExam(true); return ""; }
  const answered = ex.answers[q.id];
  const remaining = Math.max(0, ex.deadline - Date.now());
  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");
  const answeredCount = Object.keys(ex.answers).filter((k) => String(ex.answers[k]).trim() !== "").length;
  const pageNumbers = ex.questionIds.map((id, i) => `<button class="exam-page${i === ex.cursor ? " current" : ""}${ex.answers[id] ? " done" : ""}" type="button" data-exam-page="${i}" aria-label="第 ${i + 1} 题">${i + 1}</button>`).join("");
  const input = q.type === "choice"
    ? `<div class="options">${q.options.map((o, i) => `<label class="option"><input type="radio" name="exam-answer" value="${escapeHtml(o)}" ${answered === o ? "checked" : ""} /><span class="option-mark">${"ABCDEF"[i] || i + 1}</span><span class="option-text">${escapeHtml(o)}</span></label>`).join("")}</div>`
    : `<label class="field answer-field">你的答案<input id="exam-answer-input" type="text" value="${escapeHtml(answered || "")}" autocomplete="off" spellcheck="false" enterkeyhint="done" /></label>`;
  return `<div class="practice-top">
    <p class="eyebrow">模拟考试 / 限时作答</p>
    <button class="text-button" type="button" data-action="exit-exam">退出考试</button>
  </div>
  <div class="exam-topbar"><span class="tag navy">${ex.cursor + 1} / ${ex.questionIds.length}</span><span class="exam-timer${remaining < 60000 ? " danger" : ""}" id="exam-timer">${mm}:${ss}</span><span class="muted">已答 ${answeredCount}/${ex.questionIds.length}</span></div>
  <div class="exam-pages">${pageNumbers}</div>
  <section class="panel question-panel">
    <div class="question-meta"><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span><span class="tag">难度 ${Number(q.difficulty) || 1}</span></div>
    <div class="question-stem">${escapeHtml(q.stem)}</div>
    ${input}
    <div class="actions"><button class="secondary" type="button" data-action="exam-prev" ${ex.cursor === 0 ? "disabled" : ""}>上一题</button><button class="secondary" type="button" data-action="exam-next" ${ex.cursor === ex.questionIds.length - 1 ? "disabled" : ""}>下一题</button></div>
    <div class="actions"><button class="primary big" type="button" data-action="submit-exam">交卷（${answeredCount}/${ex.questionIds.length} 已答）</button></div>
  </section>`;
}

function examResultView() {
  const r = lastExamResult;
  if (!r) return `<section class="panel"><h2>还没有成绩</h2><p class="muted">成绩只保留本次会话，重新考试即可查看。</p><button class="primary" type="button" data-view="exam-setup">去考试</button></section>`;
  const pct = Math.round(r.accuracy * 100);
  const cls = pct >= 80 ? "teal" : pct >= 60 ? "orange" : "red";
  const rows = r.details.filter((d) => d.question).map((d) => `<div class="mistake-row"><div class="question-meta"><span class="tag ${d.correct ? "teal" : "red"}">${d.correct ? "正确" : "错误"}</span><span class="tag teal">${TYPE_NAMES[d.question.type]}</span><span class="tag">${escapeHtml(d.question.chapter)}</span></div>
    <strong>${escapeHtml(truncate(d.question.stem, 100))}</strong>
    <p class="muted">你的答案：${escapeHtml(d.submitted === undefined || d.submitted === null || d.submitted === "" ? "（未作答）" : d.submitted)}</p>
    ${d.correct ? "" : `<p class="muted">标准答案：${escapeHtml(d.question.answer)}</p><div class="example-solution">${escapeHtml(d.question.explanation)}</div>`}
    </div>`).join("");
  return `<p class="eyebrow">模拟考试 / 成绩单</p>
    <section class="panel score-panel"><div class="score-number ${cls}">${pct}<small>%</small></div><p class="muted">${r.correct} / ${r.total} 正确 · ${r.auto ? "时间到自动交卷" : `用时 ${fmtDuration(r.durationSeconds)}`}</p><div class="progress" style="margin-top:14px"><span style="width:${pct}%"></span></div></section>
    ${rows ? `<section class="section"><div class="section-head"><h2>逐题解析</h2><span class="muted">错题已进错题本</span></div><div class="table-like">${rows}</div></section>` : ""}
    <div class="actions"><button class="primary" type="button" data-action="exam-again">再考一套</button><button class="secondary" type="button" data-view="mistakes">去错题本</button><button class="secondary" type="button" data-view="home">返回首页</button></div>`;
}

/* ---------- 搜索 ---------- */

function searchResultsHtml() {
  const query = searchQuery.trim().toLowerCase();
  if (!query) {
    const chapters = PROJECTS[state.project].chapters.slice(0, 8);
    return `<div class="empty">输入关键词开始搜索。<span class="empty-sub">可以搜题干、解析、答案或章节，例如「洛必达」「秩」「收敛」。</span></div>
      <p class="result-label">常搜章节</p>
      <div class="chips">${chapters.map((c) => `<button class="chip" type="button" data-search-fill="${escapeHtml(c.name)}">${escapeHtml(c.name)}</button>`).join("")}</div>`;
  }
  const hits = [];
  for (const q of projectQuestions()) {
    if ((searchText.get(q.id) || "").includes(query)) hits.push(q);
    if (hits.length >= 30) break;
  }
  const chapterHits = [];
  for (const [key, text] of chapterSearch) {
    const [projectId, chapterName] = key.split("|");
    if (projectId === state.project && text.includes(query)) chapterHits.push(chapterName);
  }
  const chapterRows = chapterHits.map((name) => `<div class="result-item result-chapter">
      <span class="result-main"><strong>${escapeHtml(name)}</strong><span class="muted">${chapterCount(state.project, name)} 道题 · 配套讲义</span></span>
      <span class="result-actions"><button class="text-button" type="button" data-note-chapter="${escapeHtml(name)}">讲义</button><button class="text-button" type="button" data-chapter-practice="${escapeHtml(name)}">练习</button></span>
    </div>`).join("");
  const questionRows = hits.map((q) => `<button class="result-item" type="button" data-detail="${q.id}"><span class="result-main"><strong>${escapeHtml(truncate(q.stem, 78))}</strong><span class="muted">${escapeHtml(q.chapter)} · ${TYPE_NAMES[q.type]} · 答案 ${escapeHtml(truncate(q.answer, 20))}</span></span><span class="chapter-arrow">›</span></button>`).join("");
  if (!chapterRows && !questionRows) {
    return `<div class="empty">没有找到「${escapeHtml(searchQuery)}」。<span class="empty-sub">换个关键词，或切换科目再搜。</span></div>
      <p class="result-label">试试这些</p>
      <div class="chips">${["极限", "中值定理", "秩", "收敛"].map((w) => `<button class="chip" type="button" data-search-fill="${w}">${w}</button>`).join("")}</div>`;
  }
  return `${chapterRows ? `<p class="result-label">章节 / 讲义</p><div class="table-like">${chapterRows}</div>` : ""}
    ${questionRows ? `<p class="result-label">题目（最多 30 条）</p><div class="table-like">${questionRows}</div>` : ""}`;
}

function searchView() {
  return `<p class="eyebrow">检索 / ${PROJECTS[state.project].code}</p>
    <h1>搜题</h1>
    <label class="search-field">${ICON.search}
      <input id="search-input" type="search" value="${escapeHtml(searchQuery)}" placeholder="题干、答案、章节或知识点" autocomplete="off" enterkeyhint="search" aria-label="搜索题目" />
    </label>
    <div id="search-results" class="section">${searchResultsHtml()}</div>`;
}

function renderSearchResults() {
  if (!isBrowser) return;
  const box = document.querySelector("#search-results");
  if (box) box.innerHTML = searchResultsHtml();
}

/* ---------- 题目详情 ---------- */

function detailView() {
  const q = detailId ? findQ(detailId) : null;
  if (!q) {
    return `<section class="panel"><h2>题目不存在</h2><p class="muted">题库可能已更新。</p><button class="primary" type="button" data-action="back">返回</button></section>`;
  }
  const note = noteFor(q.chapter);
  const options = q.type === "choice"
    ? `<div class="options read-only">${q.options.map((o, i) => `<div class="option${o === q.answer ? " is-answer" : ""}"><span class="option-mark">${"ABCDEF"[i] || i + 1}</span><span class="option-text">${escapeHtml(o)}</span>${o === q.answer ? '<span class="tag teal">答案</span>' : ""}</div>`).join("")}</div>`
    : "";
  return `<div class="practice-top"><p class="eyebrow">题目详情 / ${escapeHtml(q.chapter)}</p><button class="text-button" type="button" data-action="back">${ICON.back} 返回</button></div>
    <section class="panel question-panel">
      <div class="question-meta"><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span>${q.sub ? `<span class="tag">${escapeHtml(q.sub)}</span>` : ""}<span class="tag">难度 ${Number(q.difficulty) || 1}</span></div>
      <div class="question-stem">${escapeHtml(q.stem)}</div>
      ${options}
      <div class="answer-box">
        <div class="answer-line"><span class="muted">标准答案</span><strong>${escapeHtml(q.answer)}</strong></div>
        <h3 class="solution-title">解题过程</h3>
        <span class="explain">${escapeHtml(q.explanation)}</span>
        ${note?.pitfalls?.length ? `<div class="pitfall-hint">易错点：${escapeHtml(note.pitfalls[0])}</div>` : ""}
        <p class="question-source muted">来源：${escapeHtml(q.source)}</p>
      </div>
      <div class="actions"><button class="primary" type="button" data-action="practice-this">练这道题</button><button class="secondary" type="button" data-action="back">返回</button></div>
    </section>`;
}

/* ---------- 我的 / 设置 ---------- */

function settingsView() {
  const s = state.settings;
  const canInstall = Boolean(installPrompt);
  const total = questions.filter((q) => q.reviewStatus === "approved").length;
  return `<p class="eyebrow">我的 / 学习设置</p>
    <h1>让这套工具适合你。</h1>
    <section class="section panel">
      <div class="section-head"><h2>学习目标</h2><span class="muted">${daysToExam() === null ? "未设定" : `还剩 ${daysToExam()} 天`}</span></div>
      <label class="setting-row"><span><strong>初试日期</strong><span class="muted">用于首页倒计时</span></span><input id="exam-date" type="date" value="${escapeHtml(s.examDate || "")}" /></label>
      <div class="setting-row"><span><strong>每日题量</strong><span class="muted">1–7 题，按状态自适应组卷</span></span>
        <div class="count-control"><button class="icon-button" type="button" data-count="-1" aria-label="减少题量">−</button><strong class="count-value">${state.count}</strong><button class="icon-button" type="button" data-count="1" aria-label="增加题量">+</button></div>
      </div>
    </section>

    <section class="section panel">
      <div class="section-head"><h2>外观</h2><span class="muted">${s.theme === "auto" ? "跟随系统" : s.theme === "dark" ? "深色" : "浅色"}</span></div>
      <div class="setting-row"><span><strong>主题</strong><span class="muted">晚上刷题用深色更护眼</span></span>
        <div class="segmented" id="theme-seg">${[["auto", "跟随"], ["light", "浅色"], ["dark", "深色"]].map(([v, l]) => `<button type="button" class="${s.theme === v ? "active" : ""}" data-theme-value="${v}">${l}</button>`).join("")}</div>
      </div>
      <div class="setting-row"><span><strong>字号</strong><span class="muted">题干与解析一起放大</span></span>
        <div class="segmented" id="font-seg">${[["normal", "标准"], ["large", "大字"]].map(([v, l]) => `<button type="button" class="${s.fontScale === v ? "active" : ""}" data-font-value="${v}">${l}</button>`).join("")}</div>
      </div>
    </section>

    <section class="section panel">
      <div class="section-head"><h2>数据</h2><span class="muted">仅存于本机</span></div>
      <p class="muted small">进度保存在当前浏览器。换设备或清理缓存前先导出，导入后可完整恢复。</p>
      <div class="actions"><button class="secondary" type="button" data-action="export-data">导出进度</button><label class="secondary file-import">导入进度<input id="import-file" type="file" accept=".json,application/json" hidden /></label><button class="secondary danger-text" type="button" data-action="clear-data">清空数据</button></div>
    </section>

    ${canInstall ? `<section class="section panel"><div class="setting-row"><span><strong>安装到主屏幕</strong><span class="muted">像 App 一样打开，支持离线</span></span><button class="secondary" type="button" data-action="install-app">安装</button></div></section>` : `<section class="section panel"><div class="setting-row"><span><strong>安装到主屏幕</strong><span class="muted">浏览器菜单 → 添加到主屏幕，可离线使用</span></span></div></section>`}

    <section class="section panel">
      <div class="section-head"><h2>关于</h2><span class="muted">v0.2.0</span></div>
      <div class="stats stats-3">
        <div class="stat"><span class="muted">题库</span><strong>${total}</strong></div>
        <div class="stat"><span class="muted">科目</span><strong>${Object.keys(PROJECTS).length}</strong></div>
        <div class="stat"><span class="muted">已学章节</span><strong>${Object.keys(state.learned || {}).length}</strong></div>
      </div>
      <p class="muted small mt-14">题库与讲义用于备考练习，可能存在疏漏，请以官方大纲与教材为准。</p>
    </section>`;
}

/* ---------- 事件（委托，绑定一次） ---------- */

function onClick(event) {
  const el = event.target instanceof Element ? event.target : null;
  if (!el) return;

  const viewBtn = el.closest("[data-view]");
  if (viewBtn) { event.preventDefault(); openView(viewBtn.dataset.view); return; }

  const projectBtn = el.closest("[data-project]");
  if (projectBtn) {
    const next = projectBtn.dataset.project;
    if (PROJECTS[next] && next !== state.project) {
      // 引导层里已经填了日期的话，先存下来再重绘，避免输入被重置
      if (!state.settings.onboarded) {
        const dateInput = document.querySelector("#ob-date");
        if (dateInput && dateInput.value) state.settings.examDate = dateInput.value;
      }
      state.project = next;
      state.presetChapter = "all";
      state.presetSub = "all";
      invalidateMastery();
      save();
      refresh();
    }
    return;
  }

  const actionBtn = el.closest("[data-action]");
  if (actionBtn) { event.preventDefault(); handleAction(actionBtn.dataset.action, actionBtn); return; }

  const countBtn = el.closest("[data-count]");
  if (countBtn) {
    state.count = Math.max(1, Math.min(7, state.count + Number(countBtn.dataset.count)));
    save();
    refresh();
    return;
  }

  const resultBtn = el.closest("[data-result][data-question]");
  if (resultBtn) { chooseResult(resultBtn.dataset.question, resultBtn.dataset.result); return; }

  const redoBtn = el.closest("[data-redo]");
  if (redoBtn) { startRework(redoBtn.dataset.redo, "mistakes"); return; }

  const reviewBtn = el.closest("[data-review-redo]");
  if (reviewBtn) { startRework(reviewBtn.dataset.reviewRedo, "review"); return; }

  const chapterPractice = el.closest("[data-chapter-practice]");
  if (chapterPractice) {
    state.presetChapter = chapterPractice.dataset.chapterPractice;
    state.presetSub = "all";
    save();
    openView("home");
    return;
  }

  const subPractice = el.closest("[data-sub-practice]");
  if (subPractice) {
    state.presetChapter = subPractice.dataset.subPractice;
    state.presetSub = subPractice.dataset.subName;
    save();
    openView("home");
    return;
  }

  const noteBtn = el.closest("[data-note-chapter]");
  if (noteBtn) {
    state.presetNoteChapter = noteBtn.dataset.noteChapter;
    state.presetNoteSub = noteBtn.dataset.noteSub || null;
    openView("notes");
    return;
  }

  const detailBtn = el.closest("[data-detail]");
  if (detailBtn) { openDetail(detailBtn.dataset.detail); return; }

  const searchFill = el.closest("[data-search-fill]");
  if (searchFill) {
    searchQuery = searchFill.dataset.searchFill;
    if (isBrowser) setSearchInputValue(searchQuery);
    renderSearchResults();
    return;
  }

  const themeBtn = el.closest("[data-theme-value]");
  if (themeBtn) {
    state.settings.theme = themeBtn.dataset.themeValue;
    save();
    applyChrome();
    refresh();
    return;
  }

  const fontBtn = el.closest("[data-font-value]");
  if (fontBtn) {
    state.settings.fontScale = fontBtn.dataset.fontValue;
    save();
    applyChrome();
    refresh();
    return;
  }

  // 模拟考试
  const examCount = el.closest("[data-exam-count]");
  if (examCount) { state.examSetup.count = Number(examCount.dataset.examCount); save(); refresh(); return; }
  const examDiff = el.closest("[data-exam-difficulty]");
  if (examDiff) { state.examSetup.difficulty = examDiff.dataset.examDifficulty; save(); refresh(); return; }
  const examPage = el.closest("[data-exam-page]");
  if (examPage && state.exam) { state.exam.cursor = Number(examPage.dataset.examPage); save(); refresh({ top: true }); return; }
}

function handleAction(action, el) {
  switch (action) {
    case "back": goBack(); return;
    case "start-practice": startPractice(); return;
    case "open-summary": openView("daily-done"); return;
    case "clear-sub": state.presetSub = "all"; save(); refresh(); return;
    case "submit-answer": submitAnswer(); return;
    case "essay-done": submitEssay(el.dataset.question, "done"); return;
    case "essay-giveup": skipQuestion(el.dataset.question); return;
    case "next-question": nextQuestion(); return;
    case "prev-question": if (state.session && state.session.cursor > 0) { state.session.cursor -= 1; save(); refresh({ top: true }); } return;
    case "exit-practice": {
      const practice = sessionPractice();
      if (practice && practice.kind === "rework" && state.session) delete state.practices[state.session.key];
      state.session = null;
      save();
      openView("home");
      return;
    }
    case "confirm-mistake": confirmMistake(); return;
    case "cancel-mistake": confirmDraft = null; refresh(); return;
    case "export-data": exportData(); return;
    case "clear-data": clearData(); return;
    case "install-app": promptInstall(); return;
    case "finish-onboarding": finishOnboarding(); return;
    case "skip-onboarding": state.settings.onboarded = true; save(); refresh(); return;
    case "practice-this": if (detailId) startRework(detailId, "home"); return;
    case "start-exam": startExam(); return;
    case "exam-prev": if (state.exam && state.exam.cursor > 0) { state.exam.cursor -= 1; save(); refresh({ top: true }); } return;
    case "exam-next": if (state.exam && state.exam.cursor < state.exam.questionIds.length - 1) { state.exam.cursor += 1; save(); refresh({ top: true }); } return;
    case "submit-exam": submitExam(false); return;
    case "exit-exam": exitExam(); return;
    case "exam-again": openView("exam-setup"); return;
    default: return;
  }
}

function onChange(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) return;
  const id = el.id;
  if (id === "count-input") {
    state.count = Math.max(1, Math.min(7, Number(el.value) || 1));
    save();
    refresh();
  } else if (id === "chapter-select") {
    state.presetChapter = el.value;
    state.presetSub = "all";
    save();
    refresh();
  } else if (id === "difficulty-select") {
    state.presetDifficulty = el.value;
    save();
  } else if (id === "exam-chapter") {
    state.examSetup.chapter = el.value;
    save();
  } else if (id === "ob-date" || id === "exam-date") {
    state.settings.examDate = el.value;
    save();
    refresh();
  } else if (id === "import-file") {
    importData(event);
  } else if (id === "exam-answer-input") {
    saveExamAnswer(el.value.trim());
  } else if (id === "mistake-chapter" || id === "mistake-result" || id === "mistake-reason") {
    filterMistakes();
  } else if (el.name === "exam-answer") {
    saveExamAnswer(el.value);
  }
}

function onInput(event) {
  const el = event.target;
  if (el instanceof HTMLInputElement && el.id === "search-input") {
    searchQuery = el.value;
    renderSearchResults();
  }
}

function onKeydown(event) {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return;
  if (el.id === "answer-input" && event.key === "Enter") { event.preventDefault(); submitAnswer(); }
  if (el.id === "exam-answer-input" && event.key === "Enter") { event.preventDefault(); saveExamAnswer(el.value.trim()); const next = document.querySelector("[data-action='exam-next']"); if (next) next.click(); }
  if (el.id === "search-input" && event.key === "Escape") { el.blur(); }
}

function setSearchInputValue(value) {
  const input = document.querySelector("#search-input");
  if (input) input.value = value;
}

/* ---------- 组卷 ---------- */

function startPractice() {
  const key = dailyKey();
  const existing = state.practices[key];
  if (existing && existing.status === "completed") { openView("daily-done"); return; }
  if (!existing) {
    const plan = buildDailyPlan({
      questions, attempts: state.attempts, project: state.project,
      chapter: state.presetChapter || "all", sub: state.presetSub || "all",
      count: state.count, now: Date.now(), difficulty: state.presetDifficulty || "all",
    });
    if (!plan.items.length) {
      const notice = document.querySelector("#home-notice");
      if (notice) { notice.hidden = false; notice.textContent = plan.notice || "当前范围没有可组卷的题目，请更换章节或项目。"; }
      else toast(plan.notice || "当前范围没有可组卷的题目");
      // 展开范围面板，让用户看到哪里被限制了
      document.querySelector(".disclosure")?.setAttribute("open", "");
      return;
    }
    state.practices[key] = {
      practiceDate: today(),
      project: state.project,
      requestedCount: state.count,
      chapter: plan.chapter,
      questionIds: plan.items.map((it) => it.id),
      reasons: Object.fromEntries(plan.items.map((it) => [it.id, it.reason])),
      status: "in_progress",
      createdAt: new Date().toISOString(),
      kind: "daily",
    };
    save();
    if (plan.notice) toast(plan.notice);
  }
  const practice = state.practices[key];
  state.session = { key, cursor: resumeCursor(practice), kind: "daily" };
  save();
  openView("practice");
}

function resumeCursor(practice) {
  const idx = practice.questionIds.findIndex((id) => !state.attempts[id]?.submitted);
  if (idx !== -1) return idx;
  const unconfirmed = practice.questionIds.findIndex((id) => !state.attempts[id]?.confirmed);
  return unconfirmed === -1 ? 0 : unconfirmed;
}

/* ---------- 作答与确认 ---------- */

function submittedValue() {
  const selected = document.querySelector("input[name='answer']:checked");
  return selected?.value || document.querySelector("#answer-input")?.value.trim() || "";
}

function submitAnswer() {
  const btn = document.querySelector("[data-action='submit-answer']");
  const id = btn ? btn.dataset.question : null;
  const q = id ? findQ(id) : null;
  if (!q) return;
  const answer = submittedValue();
  if (!answer) { toast("先写下你的答案"); document.querySelector("#answer-input")?.focus(); return; }
  const start = questionShownAt[id] || Date.now();
  const durationSeconds = Math.max(0, Math.round((Date.now() - start) / 1000));
  const result = q.type === "essay" ? "pending_confirmation" : answersMatch(answer, q.answer) ? "correct" : "incorrect";
  state.attempts[id] = {
    questionId: id,
    practiceKey: state.session ? state.session.key : dailyKey(),
    submitted: true,
    submittedAnswer: answer,
    result,
    confirmed: false,
    durationSeconds,
    updatedAt: new Date().toISOString(),
  };
  delete questionShownAt[id];
  invalidateMastery();
  save();
  refresh({ top: true });
}

function submitEssay(id, mode) {
  const start = questionShownAt[id] || Date.now();
  const durationSeconds = Math.max(0, Math.round((Date.now() - start) / 1000));
  state.attempts[id] = {
    questionId: id,
    practiceKey: state.session ? state.session.key : dailyKey(),
    submitted: true,
    submittedAnswer: mode === "done" ? "（纸面作答）" : "（直接看答案）",
    result: "pending_confirmation",
    confirmed: false,
    durationSeconds,
    updatedAt: new Date().toISOString(),
  };
  delete questionShownAt[id];
  invalidateMastery();
  save();
  refresh({ top: true });
}

function skipQuestion(id) {
  const q = findQ(id);
  if (!q) return;
  const start = questionShownAt[id] || Date.now();
  const durationSeconds = Math.max(0, Math.round((Date.now() - start) / 1000));
  state.attempts[id] = {
    questionId: id,
    practiceKey: state.session ? state.session.key : dailyKey(),
    submitted: true,
    submittedAnswer: "（未作答）",
    result: "pending_confirmation",
    confirmed: false,
    durationSeconds,
    updatedAt: new Date().toISOString(),
  };
  delete questionShownAt[id];
  invalidateMastery();
  save();
  refresh({ top: true });
}

function chooseResult(id, result) {
  if (MISTAKE_RESULTS.includes(result)) { confirmDraft = { id, result }; refresh(); return; }
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
  invalidateMastery();
  save();
  refresh({ top: true });
}

function nextQuestion() {
  const p = sessionPractice();
  if (!p) { openView("home"); return; }
  if (state.session.cursor < p.questionIds.length - 1) {
    state.session.cursor += 1;
    save();
    refresh({ top: true });
  } else if (p.kind === "rework") {
    const back = state.reworkReturn || "mistakes";
    state.session = null;
    state.reworkReturn = null;
    save();
    openView(back, { replace: true });
  } else {
    state.session = null;
    save();
    openView("daily-done", { replace: true });
  }
}

function startRework(id, from) {
  const key = `rework-${Date.now()}`;
  state.practices[key] = { kind: "rework", project: state.project, questionIds: [id], status: "in_progress", createdAt: new Date().toISOString() };
  state.session = { key, cursor: 0, kind: "rework" };
  state.reworkReturn = from;
  save();
  openView("practice");
}

function openDetail(id) {
  detailId = id;
  openView("detail");
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
    refresh();
    const notice = document.querySelector("#exam-notice");
    if (notice) { notice.hidden = false; notice.textContent = plan.notice || "当前范围客观题不足，请更换章节、难度或减少题数。"; }
    else toast(plan.notice || "当前范围客观题不足");
    return;
  }
  state.exam = {
    questionIds: plan.items.map((q) => q.id),
    chapter: state.examSetup.chapter || "all",
    difficulty: state.examSetup.difficulty || "all",
    count,
    answers: {},
    cursor: 0,
    startedAt: Date.now(),
    deadline: Date.now() + count * EXAM_MINUTES_PER_QUESTION * 60000,
  };
  save();
  openView("exam");
}

function saveExamAnswer(value) {
  if (!state.exam) return;
  state.exam.answers[state.exam.questionIds[state.exam.cursor]] = value;
  save();
}

function exitExam() {
  if (!state.exam) { openView("exam-setup"); return; }
  if (isBrowser && !window.confirm("退出后本次考试作废，成绩不会记录。确定退出？")) return;
  state.exam = null;
  save();
  openView("exam-setup");
}

function submitExam(auto) {
  if (!state.exam) return;
  const unanswered = state.exam.questionIds.filter((id) => !String(state.exam.answers[id] || "").trim()).length;
  if (!auto && unanswered && isBrowser) {
    if (!window.confirm(`还有 ${unanswered} 题未作答，确定现在交卷？`)) return;
  }
  clearInterval(examTimer);
  examTimer = null;
  const result = scoreExam(questions, state.exam.answers, state.exam.questionIds);
  // 考试错题自动进错题本与记忆曲线；答对且此前是错题的自动移出
  const examKey = `exam-${Date.now()}`;
  result.details.forEach((d) => {
    const prev = state.attempts[d.id] || {};
    const resultCode = d.correct ? "correct" : "incorrect";
    state.attempts[d.id] = { ...prev, questionId: d.id, practiceKey: examKey, submitted: true, submittedAnswer: d.submitted, result: resultCode, confirmed: true, durationSeconds: 0, updatedAt: new Date().toISOString(), confirmedAt: new Date().toISOString() };
    const prevRev = state.review[d.id] || { stage: 0, due: 0 };
    const stage = nextReviewStage(resultCode, prevRev.stage);
    state.review[d.id] = { stage, due: reviewDueAt(stage), updatedAt: new Date().toISOString() };
  });
  const durationSeconds = Math.round((Date.now() - state.exam.startedAt) / 1000);
  const rec = {
    date: new Date().toISOString(),
    project: state.project,
    projectName: PROJECTS[state.project].name,
    chapter: state.exam.chapter,
    count: state.exam.count,
    correct: result.correct,
    total: result.total,
    accuracy: result.accuracy,
    durationSeconds,
    auto: Boolean(auto),
  };
  state.examResults = [rec, ...(state.examResults || [])].slice(0, 50);
  lastExamResult = { ...rec, details: result.details };
  state.exam = null;
  invalidateMastery();
  save();
  openView("exam-result", { replace: true });
}

/* ---------- 引导 / 设置动作 ---------- */

function finishOnboarding() {
  const dateInput = document.querySelector("#ob-date");
  state.settings.examDate = (dateInput && dateInput.value) || state.settings.examDate || defaultExamDate();
  state.settings.onboarded = true;
  save();
  refresh({ top: true });
  toast("设置完成，开始今天的第一组题吧");
}

function clearData() {
  if (!isBrowser) return;
  if (!window.confirm("会清空本机的做题记录、错题、打卡和设置，且无法恢复。建议先导出备份。确定清空？")) return;
  store.clear();
  state = defaultState();
  searchQuery = "";
  confirmDraft = null;
  save();
  openView("home", { replace: true });
  toast("已清空本机数据");
}

function exportData() {
  if (!isBrowser) return;
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `海螺游学进度-${today().replace(/-/g, "")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast("已导出备份文件");
}

function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || (!("attempts" in data) && !("review" in data) && !("checkins" in data))) throw new Error("bad");
      state = { ...defaultState(), ...data, settings: { ...defaultState().settings, ...(data.settings || {}) }, examSetup: { ...defaultState().examSetup, ...(data.examSetup || {}) } };
      invalidateMastery();
      save();
      applyChrome();
      refresh({ top: true });
      toast("进度已导入");
    } catch {
      toast("导入失败：文件格式不正确");
    }
    event.target.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function promptInstall() {
  if (!installPrompt) { toast("当前浏览器不支持应用内安装，可用浏览器菜单添加到主屏幕"); return; }
  installPrompt.prompt();
  installPrompt.userChoice.finally(() => { installPrompt = null; });
}

/* ---------- 启动 ---------- */

function setCurriculum(data) {
  curriculum = data || {};
  PROJECTS = Object.keys(curriculum).length ? curriculum : FALLBACK_PROJECTS;
}

function bootstrap() {
  const app = document.querySelector("#app");
  app.innerHTML = '<div class="loading-screen"><div class="loading-spinner"></div><p>正在加载题库…</p><p class="muted small">首次打开需要下载约 1.4 MB，之后可离线使用</p></div>';

  const load = () => Promise.all([
    fetch("data/questions.json").then((r) => { if (!r.ok) throw new Error(`questions ${r.status}`); return r.json(); }),
    fetch("data/curriculum.json").then((r) => { if (!r.ok) throw new Error(`curriculum ${r.status}`); return r.json(); }),
    fetch("data/notes.json").then((r) => { if (!r.ok) throw new Error(`notes ${r.status}`); return r.json(); }),
  ]);

  load().then(([data, structure, noteData]) => {
    questions = data;
    notes = noteData || {};
    setCurriculum(structure);
    rebuildIndexes();
    prunePractices();
    applyChrome();
    view = "home";
    render();
    // 首次进入建立一条首页历史记录，之后每次切页都能用系统返回键退回
    try { history.replaceState({ view }, ""); } catch { /* ignore */ }
    registerServiceWorker();
    bindGlobalEvents();
    initInstallPrompt();
  }).catch((error) => {
    console.error(error);
    app.innerHTML = `<div class="loading-screen"><p class="load-error">题库加载失败，请检查网络后刷新重试。</p><p class="muted small">${escapeHtml(error.message || "")}</p><button class="primary" type="button" id="retry-load">重新加载</button></div>`;
    document.querySelector("#retry-load")?.addEventListener("click", () => location.reload());
  });
}

let globalEventsBound = false;

function bindGlobalEvents() {
  if (globalEventsBound) return;
  globalEventsBound = true;
  window.addEventListener("popstate", onPopState);
  document.addEventListener("click", onClick);
  document.addEventListener("change", onChange);
  document.addEventListener("input", onInput);
  document.addEventListener("keydown", onKeydown);
  // 系统主题切换时（跟随系统模式）实时更新
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChangeTheme = () => { if ((state.settings.theme || "auto") === "auto") { applyChrome(); render(); } };
    if (mq.addEventListener) mq.addEventListener("change", onChangeTheme);
    else if (mq.addListener) mq.addListener(onChangeTheme);
  }
}

function initInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    if (view === "settings") render();
  });
  window.addEventListener("appinstalled", () => { installPrompt = null; });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  // 首次安装时新 SW 接管页面不需要刷新；只有「已有旧版本」时才提示更新
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register("sw.js").then((reg) => {
    reg.addEventListener("updatefound", () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state !== "installed" || !navigator.serviceWorker.controller) return;
        toast("有新版本可用", {
          actionLabel: "刷新",
          onAction: () => {
            window.__swReloadPending = true;
            worker.postMessage({ type: "SKIP_WAITING" });
            window.location.reload();
          },
        });
      });
    });
  }).catch(() => { /* 离线能力失败不影响主流程 */ });
  if (hadController) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // 只在用户主动点「刷新」后重载，避免正在作答时被切页
      if (window.__swReloadPending && !window.__swReloaded) {
        window.__swReloaded = true;
        window.location.reload();
      }
    });
  }
}

// 浏览器里自启动；Node（测试）里只导出可渲染的纯视图
if (isBrowser && document.querySelector("#app")) bootstrap();

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    __test: {
      setData(nextQuestions, nextCurriculum, nextNotes) {
        questions = nextQuestions || [];
        setCurriculum(nextCurriculum || {});
        notes = nextNotes || {};
        rebuildIndexes();
      },
      setState(next) { state = { ...defaultState(), ...(next || {}), settings: { ...defaultSettings(), ...((next && next.settings) || {}) } }; invalidateMastery(); },
      getState() { return state; },
      setView(next) { view = next; },
      setSearchQuery(value) { searchQuery = value; },
      setDetailId(value) { detailId = value; },
      setLastExamResult(value) { lastExamResult = value; },
      noteKeyFor(chapter) { return NOTE_KEY[chapter] || chapter; },
      views: { homeView, chaptersView, learnView, notesView, practiceView, dailyDoneView, reviewView, mistakesView, examSetupView, examView, examResultView, settingsView, searchView, detailView, errorView, onboardingHtml },
      helpers: { daysToExam, streakDays, checkinDateSet, statsForProject, chapterMasteryMap, mistakeAttempts, dueCount, resolveTheme: resolvedTheme, dailyKey },
    },
  };
}
