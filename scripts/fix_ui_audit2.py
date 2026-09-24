# -*- coding: utf-8 -*-
"""海螺游学 app.js 第二轮优化：加载态/考试错题收录/完成小结/导出导入"""
import io

P = r"D:\考研数学项目\app.js"
src = io.open(P, encoding="utf-8").read()
orig = src
def rep(old, new, must=True):
    global src
    if old not in src:
        if must:
            raise SystemExit("NOT FOUND: " + old[:70])
        return
    src = src.replace(old, new, 1)

# 1) render 分支加 daily-done 视图
rep(
"""    : view === "exam-result" ? examResultView()
    : homeView();""",
"""    : view === "exam-result" ? examResultView()
    : view === "daily-done" ? dailyDoneView()
    : homeView();"""
)

# 2) 每日一练全部完成后进入小结页（替代直接回首页）
rep(
"""  } else {
    state.session = null;
    save();
    view = "home";
    render();
  }
}""",
"""  } else {
    state.session = null;
    save();
    view = "daily-done";
    render();
  }
}"""
)

# 3) 小结视图函数（插在复习视图前）
rep(
"""/* ---------- 复习（记忆曲线） ---------- */""",
"""/* ---------- 今日练习完成小结 ---------- */

function dailyDoneView() {
  const p = dailyPractice();
  const items = p ? p.questionIds.map((id) => ({ q: questions.find((x) => x.id === id), a: attemptFor(id) })).filter((x) => x.q) : [];
  const done = items.filter((x) => x.a && x.a.confirmed);
  const total = done.length;
  const correct = done.filter((x) => x.a.result === "correct").length;
  const wrong = done.filter((x) => MISTAKE_RESULTS.includes(x.a.result));
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const cls = pct >= 80 ? "teal" : pct >= 60 ? "orange" : "red";
  const wrongRows = wrong.length ? wrong.map(({ q, a }) => `<div class="mistake-row"><div class="question-meta"><span class="tag orange">${resultName(a.result)}</span><span class="tag teal">${TYPE_NAMES[q.type]}</span><span class="tag">${escapeHtml(q.chapter)}</span></div>
    <strong>${escapeHtml(q.stem)}</strong>
    <p class="muted">你的答案：${escapeHtml(a.submittedAnswer === "" ? "（未作答）" : a.submittedAnswer)} · 标准答案：${escapeHtml(q.answer)}</p>
    <div class="actions"><button class="secondary" data-redo="${q.id}">重做此题</button><button class="secondary" data-view="mistakes">去错题本</button></div></div>`).join("") : "";
  return `<p class="eyebrow">今日一练 / 完成</p>
    <section class="panel score-panel"><div class="score-number ${cls}">${pct}<small>%</small></div><p class="muted">${correct} / ${total} 道正确${total - correct ? ` · ${total - correct} 道待巩固` : " · 全对，干得漂亮"}</p><div class="progress" style="margin-top:14px"><span style="width:${pct}%"></span></div></section>
    ${wrongRows ? `<section class="section"><div class="section-head"><h2>待巩固</h2><span class="muted">${wrong.length} 道已进错题本与记忆曲线</span></div><div class="table-like">${wrongRows}</div></section>` : ""}
    <div class="actions"><button class="primary" data-view="home">返回首页</button><button class="secondary" data-action="export-data">导出进度</button></div>`;
}

/* ---------- 复习（记忆曲线） ---------- */"""
)

# 4) 首页加数据导出/导入入口（打卡日历后、footer 前）
rep(
"""    <section class="section"><div class="section-head"><h2>打卡日历</h2><span class="muted">近 30 天 · 绿点为已打卡</span></div>
      <div class="panel">${calendarHtml(ckSet)}</div>
    </section>
    <footer class="footer">""",
"""    <section class="section"><div class="section-head"><h2>打卡日历</h2><span class="muted">近 30 天 · 绿点为已打卡</span></div>
      <div class="panel">${calendarHtml(ckSet)}</div>
    </section>
    <section class="section panel"><div class="section-head"><h2>数据备份</h2><span class="muted">换设备 / 清理浏览器前先导出</span></div>
      <p class="lede">进度保存在当前浏览器。导出为文件后可迁移到新设备，或分享给朋友导入。</p>
      <div class="actions"><button class="secondary" data-action="export-data">导出进度</button><label class="secondary file-import">导入进度<input id="import-file" type="file" accept=".json,application/json" hidden /></label></div>
    </section>
    <footer class="footer">"""
)

# 5) 事件绑定：导出/导入
rep(
"""  document.querySelector("[data-action='exam-again']")?.addEventListener("click", () => { view = "exam-setup"; render(); });
}""",
"""  document.querySelector("[data-action='exam-again']")?.addEventListener("click", () => { view = "exam-setup"; render(); });
  document.querySelector("[data-action='export-data']")?.addEventListener("click", exportData);
  document.querySelector("#import-file")?.addEventListener("change", importData);
}

/* ---------- 数据导出 / 导入 ---------- */

function exportData() {
  const blob = new Blob([JSON.stringify(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `海螺游学进度-${today().replace(/-/g, "")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function importData(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== "object" || (!("attempts" in data) && !("review" in data) && !("checkins" in data))) throw new Error("bad");
      state = { ...defaultState(), ...data, examSetup: { ...defaultState().examSetup, ...(data.examSetup || {}) } };
      save();
      render();
      alert("进度导入成功");
    } catch {
      alert("导入失败：文件格式不正确");
    }
    event.target.value = "";
  };
  reader.readAsText(file, "utf-8");
}"""
)

# 6) 模拟考试错题自动收录进错题本与记忆曲线（scoreExam 之后）
rep(
"""  const result = scoreExam(questions, state.exam.answers, state.exam.questionIds);
  const durationSeconds = Math.round((Date.now() - state.exam.startedAt) / 1000);""",
"""  const result = scoreExam(questions, state.exam.answers, state.exam.questionIds);
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
  const durationSeconds = Math.round((Date.now() - state.exam.startedAt) / 1000);"""
)

# 7) 加载态与失败提示
rep(
"""Promise.all([
  fetch("data/questions.json").then((response) => response.json()),
  fetch("data/curriculum.json").then((response) => response.json()),
  fetch("data/notes.json").then((response) => response.json()),
]).then(([data, structure, noteData]) => {
  questions = data;
  notes = noteData || {};
  setCurriculum(structure);
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
});""",
"""const appEl = document.querySelector("#app");
appEl.innerHTML = '<div class="loading-screen"><div class="loading-spinner"></div><p>正在加载题库…</p></div>';
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
}).catch(() => {
  appEl.innerHTML = '<div class="loading-screen"><p class="load-error">题库加载失败，请检查网络后刷新重试。</p><button class="primary" onclick="location.reload()">重新加载</button></div>';
});"""
)

io.open(P, "w", encoding="utf-8", newline="").write(src)
print("app.js patched:", "YES" if src != orig else "NO")
