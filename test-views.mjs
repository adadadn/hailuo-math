// 视图冒烟测试：不打开浏览器，直接把每个页面渲染成 HTML 字符串来断言。
// 目的：防止改样式/改状态结构时某个页面白屏、出现 undefined 或抛异常。
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
globalThis.Core = require("./core.js");
const { __test: app } = require("./app.js");

const questions = JSON.parse(readFileSync(new URL("./data/questions.json", import.meta.url), "utf8"));
const curriculum = JSON.parse(readFileSync(new URL("./data/curriculum.json", import.meta.url), "utf8"));
const notes = JSON.parse(readFileSync(new URL("./data/notes.json", import.meta.url), "utf8"));
app.setData(questions, curriculum, notes);

let failures = 0;
const check = (name, cond, detail = "") => {
  if (cond) console.log(`  PASS  ${name}`);
  else { failures += 1; console.log(`  FAIL  ${name}${detail ? `  -> ${detail}` : ""}`); }
};

const DAY = 86400000;
const math1 = questions.filter((q) => q.project === "math1");
const choiceQ = math1.find((q) => q.type === "choice");
const fillQ = math1.find((q) => q.type === "fill");
const essayQ = math1.find((q) => q.type === "essay");
const noteChapter = math1[0].chapter;

const baseState = (over = {}) => ({
  project: "math1",
  count: 5,
  attempts: {},
  practices: {},
  checkins: {},
  session: null,
  review: {},
  exam: null,
  examResults: [],
  learned: {},
  subLearned: {},
  examSetup: { count: 10, chapter: "all", difficulty: "all" },
  settings: { examDate: "2026-12-19", theme: "auto", fontScale: "normal", onboarded: true },
  ...over,
});

const reset = (over) => {
  app.setState(baseState(over));
  app.setView("home");
  app.setSearchQuery("");
  app.setDetailId(null);
  app.setLastExamResult(null);
};

const html = (name, fn) => {
  try {
    const out = fn();
    check(`${name} 渲染成功`, typeof out === "string" && out.length > 200, `len=${typeof out === "string" ? out.length : typeof out}`);
    return out;
  } catch (error) {
    check(`${name} 渲染成功`, false, error && error.message);
    return "";
  }
};
const clean = (name, out) => {
  check(`${name} 无 undefined/NaN`, out && !out.includes("undefined") && !out.includes("NaN"));
};

console.log("== 基础页面 ==");
reset();
{
  const home = html("首页（无练习）", () => app.views.homeView());
  check("首页含今日一练与倒计时", home.includes("今日一练") && home.includes("距离初试") && home.includes("2026-12-19"));
  clean("首页", home);
  const chapters = html("章节页", () => app.views.chaptersView());
  check("章节页含掌握度进度", chapters.includes("chapter-progress") && (chapters.includes("本章尚未练习") || chapters.includes("已练")));
  clean("章节页", chapters);
  const learn = html("学习中心", () => app.views.learnView());
  check("学习中心含 4 个以上章节卡片", (learn.match(/chapter-card/g) || []).length >= 4);
  clean("学习中心", learn);
  const settings = html("我的/设置", () => app.views.settingsView());
  check("设置页含主题、字号、导出", settings.includes("theme-value") && settings.includes("font-value") && settings.includes("导出进度"));
  clean("设置页", settings);
  const examSetup = html("模拟考组卷", () => app.views.examSetupView());
  check("组卷页含题量选项", examSetup.includes("data-exam-count"));
  clean("组卷页", examSetup);
}

console.log("== 练习流程 ==");
{
  const key = `${new Date().toISOString().slice(0, 10)}-math1`;
  reset({
    practices: { [key]: { kind: "daily", project: "math1", questionIds: [choiceQ.id, fillQ.id, essayQ.id], status: "in_progress", createdAt: new Date().toISOString(), reasons: { [choiceQ.id]: "错题优先" } } },
    session: { key, cursor: 0, kind: "daily" },
  });
  const p1 = html("练习页（选择题未作答）", () => app.views.practiceView());
  check("未作答有提交按钮", p1.includes("提交答案") && p1.includes("不会，直接看答案"));
  check("显示选题原因", p1.includes("错题优先"));
  clean("练习页（未作答）", p1);

  const answered = { questionId: choiceQ.id, practiceKey: key, submitted: true, submittedAnswer: choiceQ.answer, result: "correct", confirmed: false, durationSeconds: 20, updatedAt: new Date().toISOString() };
  app.setState(baseState({
    practices: { [key]: { kind: "daily", project: "math1", questionIds: [choiceQ.id, fillQ.id], status: "in_progress", createdAt: new Date().toISOString() } },
    session: { key, cursor: 0, kind: "daily" },
    attempts: { [choiceQ.id]: answered },
  }));
  const p2 = html("练习页（已作答待确认）", () => app.views.practiceView());
  check("已作答展示判题与解析", p2.includes("答对了") && p2.includes("标准答案") && p2.includes("结果"));
  check("待确认有四个结果按钮", (p2.match(/data-result=/g) || []).length === 4);
  clean("练习页（已作答）", p2);

  app.setState(baseState({
    practices: { [key]: { kind: "daily", project: "math1", questionIds: [choiceQ.id, fillQ.id], status: "in_progress", createdAt: new Date().toISOString() } },
    session: { key, cursor: 1, kind: "daily" },
    attempts: { [choiceQ.id]: { ...answered, confirmed: true }, [fillQ.id]: { ...answered, questionId: fillQ.id, result: "incorrect", submittedAnswer: "9", confirmed: false } },
  }));
  const p3 = html("练习页（填空题）", () => app.views.practiceView());
  check("填空题有输入框与回车提示", p3.includes("answer-input") && p3.includes("enterkeyhint"));
  check("答错有红色判语", p3.includes("这次没答对"));
  check("有上一题按钮", p3.includes("prev-question"));
  clean("练习页（填空）", p3);

  const finished = {
    questionId: choiceQ.id, practiceKey: key, submitted: true, submittedAnswer: "9", result: "incorrect", confirmed: true, durationSeconds: 30, updatedAt: new Date().toISOString(),
  };
  app.setState(baseState({
    practices: { [key]: { kind: "daily", project: "math1", questionIds: [choiceQ.id], status: "completed", createdAt: new Date().toISOString() } },
    checkins: { [key]: { project: "math1", practiceKey: key, completedAt: new Date().toISOString() } },
    attempts: { [choiceQ.id]: finished },
    review: { [choiceQ.id]: { stage: 0, due: Date.now() - DAY } },
  }));
  const done = html("今日小结", () => app.views.dailyDoneView());
  check("小结页显示打卡与正确率", done.includes("今日已打卡") && done.includes("0%"));
  clean("小结页", done);
}

console.log("== 复习 / 错题 ==");
{
  const key = `${new Date().toISOString().slice(0, 10)}-math1`;
  reset({
    review: { [choiceQ.id]: { stage: 1, due: Date.now() - DAY }, [fillQ.id]: { stage: 2, due: Date.now() + DAY } },
    attempts: {
      [choiceQ.id]: { questionId: choiceQ.id, practiceKey: key, submitted: true, result: "incorrect", confirmed: true, reasonCode: "计算错误", note: "<b>卡在换元</b>", updatedAt: new Date().toISOString() },
    },
  });
  const review = html("复习页", () => app.views.reviewView());
  check("复习页有到期题与即将到期", review.includes("今日待复习") && review.includes("即将到期"));
  clean("复习页", review);
  const mistakes = html("错题本", () => app.views.mistakesView());
  check("错题本含错因与重做", mistakes.includes("计算错误") && mistakes.includes("重做此题"));
  check("错题备注已转义", mistakes.includes("&lt;b&gt;卡在换元&lt;/b&gt;") && !mistakes.includes("<b>卡在换元</b>"));
  clean("错题本", mistakes);
  const mastery = app.helpers.chapterMasteryMap();
  check("掌握度统计按章节聚合", mastery.get(choiceQ.chapter) && mastery.get(choiceQ.chapter).total === 1);
}

console.log("== 讲义 / 搜索 / 详情 ==");
{
  reset();
  const st = app.getState();
  st.presetNoteChapter = noteChapter;
  st.presetNoteSub = null;
  const notesHtml = html("讲义页", () => app.views.notesView());
  check("讲义含公式或考点", notesHtml.includes("核心考点") || notesHtml.includes("必备公式"));
  clean("讲义页", notesHtml);

  reset();
  const emptySearch = html("搜索页（空）", () => app.views.searchView());
  check("空搜索有提示", emptySearch.includes("输入关键词"));
  app.setSearchQuery("洛必达");
  const search = html("搜索页（关键词）", () => app.views.searchView());
  check("搜索命中题目或章节", search.includes("result-item") || search.includes("没有找到"));
  clean("搜索页", search);

  app.setDetailId(choiceQ.id);
  const detail = html("题目详情", () => app.views.detailView());
  check("详情页有答案与解析", detail.includes("标准答案") && detail.includes("解题过程"));
  check("选择题详情标出正确选项", detail.includes("is-answer"));
  clean("题目详情", detail);
}

console.log("== 模拟考试 ==");
{
  reset();
  const exQuestions = math1.filter((q) => q.type !== "essay").slice(0, 3);
  app.setState(baseState({
    exam: { questionIds: exQuestions.map((q) => q.id), chapter: "all", difficulty: "all", count: 3, answers: { [exQuestions[0].id]: exQuestions[0].answer }, cursor: 0, startedAt: Date.now(), deadline: Date.now() + 6 * 60000 },
  }));
  const exam = html("考试进行中", () => app.views.examView());
  check("考试页有计时器与交卷", exam.includes("exam-timer") && exam.includes("交卷"));
  check("考试页有退出考试", exam.includes("exit-exam"));
  clean("考试页", exam);

  app.setLastExamResult({
    date: new Date().toISOString(), project: "math1", projectName: "数学一", chapter: "all", count: 2,
    correct: 1, total: 2, accuracy: 0.5, durationSeconds: 150, auto: false,
    details: [
      { id: exQuestions[0].id, question: exQuestions[0], submitted: exQuestions[0].answer, correct: true },
      { id: exQuestions[1].id, question: exQuestions[1], submitted: "0", correct: false },
    ],
  });
  const result = html("成绩单", () => app.views.examResultView());
  check("成绩单有百分比与逐题解析", result.includes("50") && result.includes("逐题解析"));
  clean("成绩单", result);
}

console.log("== 引导层 / 异常页 ==");
{
  app.setState(baseState({ settings: { examDate: "", theme: "auto", fontScale: "normal", onboarded: false } }));
  const onboarding = html("首次引导", () => app.views.onboardingHtml());
  check("引导含科目、题量、日期", onboarding.includes("备考科目") && onboarding.includes("每日题量") && onboarding.includes("初试日期"));
  clean("首次引导", onboarding);
  const err = html("异常兜底", () => app.views.errorView(new Error("boom")));
  check("异常页有返回与导出", err.includes("返回首页") && err.includes("导出备份"));
}

console.log(failures === 0 ? "\n全部通过 ✔" : `\n${failures} 项失败 ✘`);
process.exit(failures === 0 ? 0 : 1);
