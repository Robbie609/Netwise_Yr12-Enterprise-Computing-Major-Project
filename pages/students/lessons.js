const API_BASE = "http://127.0.0.1:8765";
let activeProfile = null;
let activeFilter = "all";
let searchTerm = "";

const ICON_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>`;
const ICON_GLOBE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
const ICON_LOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const ICON_QUIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
const ICON_SIM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;

function iconForType(type) {
  if (type === "NETWORK") return ICON_GLOBE;
  if (type === "CRYPTO") return ICON_LOCK;
  return ICON_SHIELD;
}
function scoreClass(score) {
  if (score === null || score === undefined) return "score-none";
  if (score >= 80) return "score-good";
  if (score >= 60) return "score-mid";
  return "score-low";
}

document.addEventListener("DOMContentLoaded", () => {
  bindNavEvents();
  bindToolbar();
  initBgCanvas();
  loadData();
});

function loadData() {
  showLoading();
  initSession();
}

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
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    if (!data.success) { redirectToLogin(); return; }
    activeProfile = data.profile;
    enterDashboard();
  } catch (e) {
    showError("Could not connect to the server. Check that the Netwiser engine is running.");
  }
}

function redirectToLogin() {
  sessionStorage.removeItem("netwiser_user");
  window.location.href = "../login/login.html";
}
function logout() {
  sessionStorage.removeItem("netwiser_user");
  window.location.href = "../login/login.html";
}

function showLoading() {
  document.getElementById("loading-view").style.display = "flex";
  document.getElementById("error-view").style.display = "none";
  document.getElementById("dashboard-view").classList.remove("active");
}
function showError(msg) {
  document.getElementById("loading-view").style.display = "none";
  document.getElementById("error-view").style.display = "flex";
  document.getElementById("error-message").textContent = msg;
}
function enterDashboard() {
  document.getElementById("loading-view").style.display = "none";
  document.getElementById("error-view").style.display = "none";
  document.getElementById("dashboard-view").classList.add("active");
  renderProfile();
  renderLessons();
}

function bindNavEvents() {
  const toggle = document.getElementById("profile-toggle");
  const dropdown = document.getElementById("profile-dropdown");
  toggle.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("active"); });
  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target !== toggle) dropdown.classList.remove("active");
  });
  document.getElementById("logout-btn").addEventListener("click", e => { e.preventDefault(); logout(); });
  document.getElementById("dp-close").addEventListener("click", () => {
    document.getElementById("detail-panel").style.display = "none";
  });
  document.getElementById("retry-btn")?.addEventListener("click", loadData);
}

function bindToolbar() {
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      activeFilter = pill.dataset.filter;
      renderLessons();
    });
  });
  document.getElementById("search-input").addEventListener("input", e => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderLessons();
  });
}

function renderProfile() {
  const p = activeProfile;
  document.getElementById("profile-name").textContent = `${p.first_name} ${p.last_name}`;
  document.getElementById("profile-email").textContent = p.email;
  document.getElementById("profile-year-tag").textContent = `Year ${p.year_level}`;
  document.getElementById("profile-class-tag").textContent = p.class_code;
}

function filteredLessons() {
  let list = [...(activeProfile.lessons || [])].sort((a,b) => String(a.lesson_id).localeCompare(String(b.lesson_id)));
  if (activeFilter !== "all") list = list.filter(l => l.status === activeFilter);
  if (searchTerm) {
    list = list.filter(l =>
      l.title.toLowerCase().includes(searchTerm) ||
      (l.topic || "").toLowerCase().includes(searchTerm)
    );
  }
  return list;
}

function renderLessons() {
  const grid = document.getElementById("lessons-grid");
  const sub = document.getElementById("lessons-sub");
  const lessons = filteredLessons();
  const total = (activeProfile.lessons || []).length;

  sub.textContent = `${lessons.length} of ${total} lesson${total !== 1 ? "s" : ""}`;

  if (!lessons.length) {
    grid.innerHTML = `<div class="empty-state">No lessons match your filters.</div>`;
    return;
  }

  grid.innerHTML = lessons.map(l => {
    const statusKey = l.status === "Completed" ? "completed" : l.status === "Current" ? "current" : "locked";
    const statusLabel = l.status === "Completed" ? "Completed" : l.status === "Current" ? "In Progress" : "Locked";
    const icon = l.status === "Completed" ? ICON_CHECK : l.status === "Locked" ? ICON_LOCK : iconForType(l.type);

    return `
      <div class="lesson-card ${statusKey}" data-lesson-id="${esc(l.lesson_id)}">
        <div class="lc-top">
          <div class="lc-icon-wrap">${icon}</div>
          <span class="lc-status-badge ${statusKey}">${statusLabel}</span>
        </div>
        <div>
          <div class="lc-title-text">${esc(l.title)}</div>
          <div class="lc-meta-row">
            <span>${esc(l.topic || "")}</span>
            <span class="lc-diff-chip">${esc(l.difficulty || "")}</span>
          </div>
        </div>
        <p class="lc-desc">${esc(l.description || "")}</p>
        <div class="lc-progress-row">
          <div class="lc-bar-track"><div class="lc-bar-fill" style="width:${l.progress}%"></div></div>
          <span class="lc-pct-text">${l.progress}%</span>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".lesson-card").forEach(card => {
    card.addEventListener("click", () => {
      const lesson = (activeProfile.lessons || []).find(l => l.lesson_id === card.dataset.lessonId);
      if (lesson) showDetail(lesson, lesson.status === "Locked");
    });
  });
}

function showDetail(lesson, isLocked) {
  const panel = document.getElementById("detail-panel");
  document.getElementById("dp-topic").textContent = (lesson.topic || "").toUpperCase();
  document.getElementById("dp-title").textContent = lesson.title;
  document.getElementById("dp-desc").textContent = isLocked
    ? "This lesson is locked. Complete earlier lessons to unlock it."
    : (lesson.description || "");

  document.getElementById("dp-progress-bar").style.width = `${lesson.progress}%`;
  document.getElementById("dp-pct").textContent = `${lesson.progress}% COMPLETE`;

  renderModuleList(lesson);
  renderActions(lesson, isLocked);
  renderScores(lesson);

  panel.style.display = "block";
  panel.scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function renderModuleList(lesson) {
  const container = document.getElementById("dp-module-list");
  const modules = lesson.modules || [];

  if (!modules.length) {
    container.innerHTML = `<div class="dp-module-row"><span class="dp-module-title" style="color:var(--text-muted)">No modules found for this lesson.</span></div>`;
    return;
  }

  container.innerHTML = modules.map(m => {
    const key = m.status === "Completed" ? "completed" : m.status === "In Progress" ? "in-progress" : "locked";
    const label = m.status === "Completed" ? "Completed" : m.status === "In Progress" ? "In Progress" : "Locked";
    const orderIcon = m.status === "Completed" ? "✓" : m.order_no;
    return `
      <div class="dp-module-row ${key}">
        <div class="dp-module-order">${orderIcon}</div>
        <span class="dp-module-title">${esc(m.module_title)}</span>
        <span class="dp-module-status ${key}">${label}</span>
      </div>
    `;
  }).join("");
}

function renderActions(lesson, isLocked) {
  const container = document.getElementById("dp-actions");

  if (isLocked) {
    container.innerHTML = `<button class="dp-btn primary" disabled>Lesson Locked</button>`;
    return;
  }

  const buttons = [];

  const nextModule = (lesson.modules || []).find(m => m.status !== "Completed");
  if (nextModule) {
    buttons.push(`
      <button class="dp-btn primary" data-action="module" data-id="${esc(nextModule.module_id)}">
        ${lesson.status === "Completed" ? "Review Module" : "Continue Module"}
      </button>
    `);
  }

  if (lesson.quiz_id) {
    const done = lesson.quiz_score !== null && lesson.quiz_score !== undefined;
    buttons.push(`
      <button class="dp-btn tertiary" data-action="quiz" data-id="${esc(lesson.quiz_id)}">
        ${done ? `Retake Quiz (${lesson.quiz_score}%)` : "Take Quiz"}
      </button>
    `);
  }

  (lesson.sim_scores || []).forEach(sim => {
    const done = sim.score !== null && sim.score !== undefined;
    buttons.push(`
      <button class="dp-btn secondary" data-action="sim" data-id="${esc(sim.simulation_id)}">
        ${done ? `Retry ${esc(sim.title)} (${sim.score}%)` : `Try ${esc(sim.title)}`}
      </button>
    `);
  });

  container.innerHTML = buttons.join("") || `<span style="color:var(--text-muted);font-size:0.78rem">No actions available for this lesson yet.</span>`;

  container.querySelectorAll(".dp-btn[data-action]").forEach(btn => {
    btn.addEventListener("click", () => handleAction(btn.dataset.action, btn.dataset.id, lesson));
  });
}

function renderScores(lesson) {
  const scoresEl = document.getElementById("dp-scores");
  const rows = [];
  if (lesson.quiz_title && lesson.quiz_score !== null && lesson.quiz_score !== undefined) {
    rows.push(`
      <div class="score-row">
        <span class="score-label">${ICON_QUIZ.replace('width="18" height="18"','width="14" height="14"')} ${esc(lesson.quiz_title)}</span>
        <span class="score-val ${scoreClass(lesson.quiz_score)}">${lesson.quiz_score}%</span>
      </div>
    `);
  }
  (lesson.sim_scores || []).forEach(sim => {
    if (sim.score === null || sim.score === undefined) return;
    rows.push(`
      <div class="score-row">
        <span class="score-label">${ICON_SIM.replace('width="18" height="18"','width="14" height="14"')} ${esc(sim.title)}</span>
        <span class="score-val ${scoreClass(sim.score)}">${sim.score}%</span>
      </div>
    `);
  });
  scoresEl.innerHTML = rows.length ? rows.join("") : `<div class="score-row"><span class="score-label" style="color:var(--text-muted)">No quiz or simulation results yet</span></div>`;
}

function handleAction(action, id, lesson) {
  if (action === "module") {
    window.location.href = `module.html?module_id=${encodeURIComponent(id)}&lesson_id=${encodeURIComponent(lesson.lesson_id)}`;
  } else if (action === "quiz") {
    window.location.href = `quiz.html?quiz_id=${encodeURIComponent(id)}&lesson_id=${encodeURIComponent(lesson.lesson_id)}`;
  } else if (action === "sim") {
    window.location.href = `../students/laptop/laptop.html?simulation_id=${encodeURIComponent(id)}&lesson_id=${encodeURIComponent(lesson.lesson_id)}`;
  }
}

function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let W, H;
  const particles = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener("resize", resize);
  resize();
  for (let i = 0; i < 50; i++) {
    particles.push({ x: Math.random()*1400, y: Math.random()*900, char: Math.random() > 0.5 ? "0" : "1", speed: 0.12 + Math.random()*0.3, alpha: 0.03 + Math.random()*0.08 });
  }
  (function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.font = "700 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    particles.forEach(p => {
      ctx.fillStyle = `rgba(0,242,255,${p.alpha})`;
      ctx.fillText(p.char, p.x, p.y);
      p.y += p.speed;
      if (p.y > H+20) { p.y = -10; p.x = Math.random()*W; }
    });
    requestAnimationFrame(draw);
  })();
}

function esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}