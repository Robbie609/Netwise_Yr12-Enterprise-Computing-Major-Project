const API_BASE = "http://127.0.0.1:8765";

let activeProfile = null;
let activeLessonId = null;

/* ICONS*/
const ICON_SHIELD  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>`;
const ICON_GLOBE   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
const ICON_LOCK    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const ICON_CHECK   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_TROPHY  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5"/></svg>`;
const ICON_ANNOUNCE= `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11 14v6a2 2 0 0 0 4 0v-1"/></svg>`;
const ICON_QUIZ    = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const ICON_SIM     = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

function iconForLesson(type) {
  if (type === "NETWORK") return ICON_GLOBE;
  if (type === "CRYPTO")  return ICON_LOCK;
  return ICON_SHIELD;
}

function scoreClass(score) {
  if (score === null || score === undefined) return "score-none";
  if (score >= 80) return "score-good";
  if (score >= 60) return "score-mid";
  return "score-low";
}

/* INIT*/
document.addEventListener("DOMContentLoaded", () => {
  bindNavEvents();
  bindAIEvents();
  initSession();
  initBgCanvas();
});

/* SESSION*/
async function initSession() {
  const stored = sessionStorage.getItem("netwiser_user");
  if (!stored) { redirectToLogin(); return; }

  let sessionUser;
  try { sessionUser = JSON.parse(stored); } catch { redirectToLogin(); return; }
  if (!sessionUser?.user_id) { redirectToLogin(); return; }

  try {
    const res = await fetch(`${API_BASE}/student_dashboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: sessionUser.user_id })
    });
    const data = await res.json();
    if (!data.success) { redirectToLogin(); return; }
    activeProfile = data.profile;
    enterDashboard();
  } catch {
    redirectToLogin();
  }
}

function redirectToLogin() {
  sessionStorage.removeItem("netwiser_user");
  window.location.href = "../login/login.html";
}

function enterDashboard() {
  const loading = document.getElementById("loading-view");
  const dash    = document.getElementById("dashboard-view");
  loading.classList.add("hidden");
  setTimeout(() => { loading.style.display = "none"; }, 400);
  dash.classList.add("active");
  renderDashboard();
}

function logout() {
  sessionStorage.removeItem("netwiser_user");
  window.location.href = "../login/login.html";
}

/* NAV*/
function bindNavEvents() {
  const toggle   = document.getElementById("profile-toggle");
  const dropdown = document.getElementById("profile-dropdown");
  const logoutBtn= document.getElementById("logout-btn");

  if(toggle){toggle.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("active"); });}
  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target !== toggle) dropdown.classList.remove("active");
  });
  logoutBtn.addEventListener("click", e => { e.preventDefault(); logout(); });

  document.querySelectorAll(".nav-item[data-section]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = document.getElementById(link.dataset.section);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });
}

/* RENDER PIPELINE*/
function renderDashboard() {
  if (!activeProfile) return;
  renderProfile();
  renderHero();
  renderPerformance();
  renderAnnouncements();
  renderAchievements();
  renderRoadmap();
  renderResults();
  renderAIHistory();

  const lessons = activeProfile.lessons || [];
  const focus =
    lessons.find(l => l.status === "Current") ||
    lessons.find(l => l.status === "Completed") ||
    lessons[0];
  if (focus) selectLesson(focus.lesson_id);
}

/* PROFILE DROPDOWN */
function renderProfile() {
  const p = activeProfile;
  document.getElementById("profile-name").textContent     = `${p.first_name} ${p.last_name}`;
  document.getElementById("profile-email").textContent    = p.email;
  document.getElementById("profile-year-tag").textContent = `Year ${p.year_level}`;
  document.getElementById("profile-class-tag").textContent= p.class_code;
}

/* HERO */
function renderHero() {
  const p = activeProfile;
  const s = p.stats;

  document.getElementById("hero-first-name").textContent       = p.first_name;
  document.getElementById("hero-year-level").textContent       = `Year ${p.year_level}`;
  document.getElementById("hero-class-assignment").textContent = p.class_code;
  document.getElementById("hero-teacher").textContent          = p.teacher_name;

  const pct = s.lessons_total > 0 ? Math.round((s.lessons_completed / s.lessons_total) * 100) : 0;
  const r   = 64;
  const circ= 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const circle = document.getElementById("hero-progress-circle");
  circle.style.strokeDasharray  = `${circ}`;
  circle.style.strokeDashoffset = `${offset}`;
  document.getElementById("hero-progress-num").textContent = `${pct}%`;

  document.getElementById("stat-lessons-pill").textContent = `${s.lessons_completed}/${s.lessons_total} Lessons`;
  document.getElementById("stat-quizzes-pill").textContent = `${s.quizzes_completed}/${s.quizzes_total} Quizzes`;
  document.getElementById("stat-sims-pill").textContent    = `${s.simulations_completed}/${s.simulations_total} Simulations`;
}

/* PERFORMANCE BARS */
function renderPerformance() {
  const s = activeProfile.stats;

  function pct(done, total) { return total > 0 ? Math.round((done / total) * 100) : 0; }

  const lp = pct(s.lessons_completed,     s.lessons_total);
  const qp = pct(s.quizzes_completed,     s.quizzes_total);
  const sp = pct(s.simulations_completed, s.simulations_total);

  document.getElementById("perf-lessons-bar").style.width  = `${lp}%`;
  document.getElementById("perf-quizzes-bar").style.width  = `${qp}%`;
  document.getElementById("perf-sims-bar").style.width     = `${sp}%`;
  document.getElementById("perf-lessons-val").textContent  = `${s.lessons_completed}/${s.lessons_total}`;
  document.getElementById("perf-quizzes-val").textContent  = `${s.quizzes_completed}/${s.quizzes_total}`;
  document.getElementById("perf-sims-val").textContent     = `${s.simulations_completed}/${s.simulations_total}`;
}

/* ANNOUNCEMENTS */
function renderAnnouncements() {
  const container = document.getElementById("announcements-list");
  const list = activeProfile.announcements || [];
  if (!list.length) {
    container.innerHTML = `<div class="empty-state">No announcements from your teacher yet.</div>`;
    return;
  }
  container.innerHTML = list.map(a => `
    <div class="achievement-row-item">
      <div class="ann-icon-glow">${ICON_ANNOUNCE}</div>
      <div class="ach-details">
        <span class="ach-title">${escHtml(a.title)}</span>
        <span class="ach-desc">${escHtml(a.message)}</span>
        <span class="ach-date">${escHtml(a.created_at)}</span>
      </div>
    </div>
  `).join("");
}

/* ACHIEVEMENTS */
function renderAchievements() {
  const container = document.getElementById("achievements-list");
  const list = activeProfile.achievements || [];
  if (!list.length) {
    container.innerHTML = `<div class="empty-state">No achievements unlocked yet. Keep learning!</div>`;
    return;
  }
  container.innerHTML = list.map(a => `
    <div class="achievement-row-item">
      <div class="ach-icon-glow">${ICON_TROPHY}</div>
      <div class="ach-details">
        <span class="ach-title">${escHtml(a.title)}</span>
        <span class="ach-desc">${escHtml(a.description)}</span>
      </div>
    </div>
  `).join("");
}

/* ROADMAP */
function renderRoadmap() {
  const tree = document.getElementById("roadmap-tree");
  const sub  = document.getElementById("roadmap-sub");
  const lessons = [...(activeProfile.lessons || [])].sort((a, b) =>
    String(a.lesson_id).localeCompare(String(b.lesson_id))
  );

  const done = lessons.filter(l => l.status === "Completed").length;
  sub.textContent = `${done} / ${lessons.length} completed`;

  tree.innerHTML = "";
  lessons.forEach((lesson, i) => {
    if (i > 0) {
      const path = document.createElement("div");
      path.className = "tree-path-v" + (lessons[i - 1].status === "Completed" ? " done" : "");
      tree.appendChild(path);
    }

    const statusClass =
      lesson.status === "Completed" ? "completed" :
      lesson.status === "Current"   ? "current"   : "locked";

    let orbIcon;
    if (lesson.status === "Completed") orbIcon = ICON_CHECK;
    else if (lesson.status === "Locked") orbIcon = ICON_LOCK;
    else orbIcon = iconForLesson(lesson.type);

    const statusLabel =
      lesson.status === "Completed" ? "Completed" :
      lesson.status === "Current"   ? "In Progress" : "Locked";

    const node = document.createElement("div");
    node.className = `tree-node-v ${statusClass}`;
    node.dataset.lessonId = lesson.lesson_id;
    node.innerHTML = `
      <div class="node-orb-v">${orbIcon}</div>
      <div class="node-info-v">
        <span class="node-title-v">${escHtml(lesson.title)}</span>
        <span class="node-status-v">${statusLabel}</span>
      </div>
      <span class="node-progress-chip">${lesson.progress}%</span>
    `;

    if (lesson.status !== "Locked") {
      node.addEventListener("click", () => selectLesson(lesson.lesson_id));
    }
    tree.appendChild(node);
  });
}

/* RESULTS */
function renderResults() {
  const grid = document.getElementById("results-grid");
  const lessons = activeProfile.lessons || [];

  const relevant = lessons.filter(l =>
    (l.quiz_score !== null && l.quiz_score !== undefined) ||
    (l.sim_scores && l.sim_scores.some(s => s.score !== null && s.score !== undefined))
  );

  if (!relevant.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No quiz or simulation results yet. Complete a lesson to see your scores here.</div>`;
    return;
  }

  grid.innerHTML = relevant.map(lesson => {
    const entries = [];

    if (lesson.quiz_title && lesson.quiz_score !== null && lesson.quiz_score !== undefined) {
      entries.push(`
        <div class="result-entry">
          <div class="result-entry-icon" style="color:var(--lightblue)">${ICON_QUIZ}</div>
          <span class="result-entry-label">${escHtml(lesson.quiz_title)}</span>
          <span class="result-entry-score ${scoreClass(lesson.quiz_score)}">${lesson.quiz_score}%</span>
        </div>
      `);
    }

    (lesson.sim_scores || []).forEach(sim => {
      if (sim.score === null || sim.score === undefined) return;
      entries.push(`
        <div class="result-entry">
          <div class="result-entry-icon" style="color:var(--purple)">${ICON_SIM}</div>
          <span class="result-entry-label">${escHtml(sim.title)}</span>
          <span class="result-entry-score ${scoreClass(sim.score)}">${sim.score}%</span>
        </div>
      `);
    });

    if (!entries.length) return "";

    return `
      <div class="result-card">
        <div class="result-card-header">
          <span class="result-lesson-name">${escHtml(lesson.title)}</span>
          <span class="result-topic-tag">${escHtml(lesson.topic || "")}</span>
        </div>
        <div class="result-entries">${entries.join("")}</div>
      </div>
    `;
  }).filter(Boolean).join("") ||
  `<div class="empty-state" style="grid-column:1/-1">No results recorded yet.</div>`;
}

/* AI CHAT HISTORY */
function renderAIHistory() {
  const log  = document.getElementById("ai-chat-log");
  const msgs = activeProfile.ai_chat_log || [];
  if (!msgs.length) {
    log.innerHTML = `<div class="empty-state">No chat history yet. Ask me anything!</div>`;
    return;
  }
  log.innerHTML = msgs.map(m => `
    <div class="ai-msg-bubble ${m.role === "user" ? "user" : "assistant"}">${escHtml(m.text)}</div>
  `).join("");
  log.scrollTop = log.scrollHeight;
}

/* 
   LESSON PREVIEW
 */
function selectLesson(lessonId) {
  const lesson = (activeProfile.lessons || []).find(l => l.lesson_id === lessonId);
  if (!lesson) return;
  activeLessonId = lessonId;

  document.getElementById("preview-topic").textContent       = (lesson.topic || "").toUpperCase();
  document.getElementById("preview-diff").textContent        = lesson.difficulty || "";
  document.getElementById("preview-title").textContent       = lesson.title;
  document.getElementById("preview-description").textContent = lesson.description || "";

  const bar  = document.getElementById("preview-progress-bar");
  const pctEl= document.getElementById("preview-progress-text");
  bar.style.width = `${lesson.progress}%`;
  pctEl.textContent = `${lesson.progress}% COMPLETE`;

  const btn  = document.getElementById("preview-action-btn");
  const card = document.getElementById("preview-card");
  btn.disabled = false;
  btn.className = "btn-action";
  card.classList.remove("preview-glow-blue", "preview-glow-cyan");

  if (lesson.status === "Completed") {
    btn.textContent = "Review Chapter";
    btn.classList.add("cyan");
    card.classList.add("preview-glow-cyan");
  } else if (lesson.status === "Current") {
    btn.textContent = "Continue";
    card.classList.add("preview-glow-blue");
  } else {
    btn.textContent = "Locked";
    btn.disabled = true;
  }

  const scoresEl = document.getElementById("preview-scores");
  const rows = [];
  if (lesson.quiz_title && lesson.quiz_score !== null && lesson.quiz_score !== undefined) {
    rows.push(`
      <div class="score-row">
        <span class="score-label">📝 ${escHtml(lesson.quiz_title)}</span>
        <span class="score-val ${scoreClass(lesson.quiz_score)}">${lesson.quiz_score}%</span>
      </div>
    `);
  }
  (lesson.sim_scores || []).forEach(sim => {
    if (sim.score === null || sim.score === undefined) return;
    rows.push(`
      <div class="score-row">
        <span class="score-label">🖥 ${escHtml(sim.title)}</span>
        <span class="score-val ${scoreClass(sim.score)}">${sim.score}%</span>
      </div>
    `);
  });
  scoresEl.innerHTML = rows.join("");

  document.querySelectorAll(".tree-node-v").forEach(n => {
    n.classList.toggle("active-selection", n.dataset.lessonId === lessonId);
  });
}

/*AI WIDGET*/
function bindAIEvents() {
  const fab      = document.getElementById("ai-fab-btn");
  const win      = document.getElementById("ai-window");
  const closeBtn = document.getElementById("ai-close-btn");
  const sendBtn  = document.getElementById("ai-send-btn");
  const input    = document.getElementById("ai-chat-input");

  fab.addEventListener("click",    () => win.classList.toggle("visible"));
  closeBtn.addEventListener("click",() => win.classList.remove("visible"));

  function send() {
    const text = input.value.trim();
    if (!text) return;
    const log = document.getElementById("ai-chat-log");

    const empty = log.querySelector(".empty-state");
    if (empty) empty.remove();

    const userBubble = document.createElement("div");
    userBubble.className = "ai-msg-bubble user";
    userBubble.textContent = text;
    log.appendChild(userBubble);

    const botBubble = document.createElement("div");
    botBubble.className = "ai-msg-bubble assistant";
    botBubble.textContent = "The AI assistant is not connected to a live service yet. Keep an eye out for updates!";
    log.appendChild(botBubble);

    log.scrollTop = log.scrollHeight;
    input.value = "";
  }

  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
}

/* BACKGROUND CANVAS - animated binary particles*/
function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H;

  const CHARS = ["0", "1"];
  const COL   = "rgba(0,242,255,";
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  for (let i = 0; i < 120; i++) {
    particles.push({
      x:     Math.random() * 1400,
      y:     Math.random() * 900,
      char:  CHARS[Math.floor(Math.random() * 2)],
      speed: 0.15 + Math.random() * 0.35,
      size:  24 + Math.random() * 32,
      alpha: 0.04 + Math.random() * 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.font = "700 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";

    particles.forEach(p => {
      ctx.fillStyle = COL + p.alpha + ")";
      ctx.fillText(p.char, p.x, p.y);
      p.y += p.speed;
      if (p.y > H + 20) { p.y = -10; p.x = Math.random() * W; }
    });

    requestAnimationFrame(draw);
  }
  draw();
}

/* UTIL*/
function escHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}