const API_BASE = "http://127.0.0.1:8765";
let activeProfile = null;
let activeClassId = null;
let radarRAF = null;

const ICON_ANNOUNCE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11 14v6a2 2 0 0 0 4 0v-1"/></svg>`;

document.addEventListener("DOMContentLoaded", () => {
  bindNavEvents();
  bindAnnouncementForm();
  initBgCanvas();
  initSession();
});

async function initSession() {
  const stored = sessionStorage.getItem("netwiser_user");
  if (!stored) { redirectToLogin(); return; }
  let sessionUser;
  try { sessionUser = JSON.parse(stored); } catch { redirectToLogin(); return; }
  if (!sessionUser?.user_id) { redirectToLogin(); return; }

  try {
    const res = await fetch(`${API_BASE}/teacher_dashboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: sessionUser.user_id })
    });
    const data = await res.json();
    if (!data.success) { redirectToLogin(); return; }
    activeProfile = data.profile;

    console.log("PROFILE", activeProfile);

    try {
    enterDashboard();} catch (e) {
    console.error("DASHBOARD CRASH", e);}
  } catch {
    redirectToLogin();
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
function enterDashboard() {
  const loading = document.getElementById("loading-view");
  const dash = document.getElementById("dashboard-view");
  loading.classList.add("hidden");
  setTimeout(() => { loading.style.display = "none"; }, 400);
  dash.classList.add("active");
  renderDashboard();
}

function bindNavEvents() {
  const toggle = document.getElementById("profile-toggle");
  const dropdown = document.getElementById("profile-dropdown");
  const logoutBtn = document.getElementById("logout-btn");

  toggle.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("active"); });
  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target !== toggle) dropdown.classList.remove("active");
  });
  logoutBtn.addEventListener("click", e => { e.preventDefault(); logout(); });

  document.querySelectorAll(".nav-item[data-sec]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      document.getElementById(link.dataset.sec)?.scrollIntoView({ behavior:"smooth", block:"start" });
      document.querySelectorAll(".nav-item").forEach(l => l.classList.remove("active"));
      link.classList.add("active");
    });
  });

  document.getElementById("dd-close").addEventListener("click", () => {
    document.getElementById("drilldown").style.display = "none";
  });
}

function renderDashboard() {
  if (!activeProfile) return;
  renderProfile();
  renderHero();
  renderClassPills();
  renderKPIs();
  renderAtRisk();
  renderStudents();
  renderLessonProgress();
  renderAnnouncements();
  startRadar();
}

function renderProfile() {
  const p = activeProfile;

  document.getElementById("pd-name").textContent =
    `${p.first_name} ${p.last_name}`;

  document.getElementById("pd-email").textContent =
    p.email || "";

  document.getElementById("pd-school").textContent =
    p.school || "";
}

function renderHero() {
  const p = activeProfile;
  const s = p.stats || {};

  document.getElementById("hero-name").textContent =
    `${p.first_name} ${p.last_name}`;

  document.getElementById("hero-school").textContent =
    p.school || "";

  document.getElementById("hs-classes").textContent =
    (p.classes || []).length;

  document.getElementById("hs-students").textContent =
    filteredStudents().length;

  document.getElementById("hs-engagement").textContent =
    `${s.class_activity || 0}%`;

  document.getElementById("rl-modules").textContent =
    `${s.active_modules || 0} / ${s.total_modules || 0}`;

  document.getElementById("rl-risk").textContent =
    `${s.at_risk_count || 0} students`;

  document.getElementById("rl-top").textContent =
    s.top_performer || "-";
}


function renderClassPills() {
  const container = document.getElementById("class-pills");
  const classes = activeProfile.classes;
  if (classes.length <= 1) { container.style.display = "none"; return; }

  container.innerHTML = classes.map(c => `
    <button class="class-pill${activeClassId === c.class_id ? " active" : ""}" data-cid="${esc(c.class_id)}">${esc(c.class_code)}</button>
  `).join("");

  container.querySelectorAll(".class-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const cid = btn.dataset.cid;
      activeClassId = (activeClassId === cid) ? null : cid;
      renderClassPills();
      renderHero();
      renderKPIs();
      renderAtRisk();
      renderStudents();
    });
  });
}

function filteredStudents() {
  const all = activeProfile.students || [];
  return activeClassId ? all.filter(s => s.class_id === activeClassId) : all;
}

function renderKPIs() {
  const students = filteredStudents();
  const s = activeProfile.stats;
  const avgEngagement = students.length ? Math.round(students.reduce((a,x) => a + x.engagement, 0) / students.length) : 0;
  const atRiskCount = students.filter(x => x.at_risk).length;
  const top = students.reduce((best, x) => (!best || x.engagement > best.engagement) ? x : best, null);

  document.getElementById("kpi-engagement").textContent = `${avgEngagement}%`;
  document.getElementById("kpi-modules").textContent = `${s.active_modules} / ${s.total_modules}`;
  document.getElementById("kpi-risk").textContent = `${atRiskCount}`;
  document.getElementById("kpi-top").textContent = top ? `${top.first_name} ${top.last_name}` : "-";
}

function renderAtRisk() {
  const panel = document.getElementById("at-risk-panel");
  const list = document.getElementById("arp-list");
  const atRisk = filteredStudents().filter(s => s.at_risk);

  if (!atRisk.length) { panel.style.display = "none"; return; }
  panel.style.display = "block";

  list.innerHTML = atRisk.map(s => {
    const initials = (s.first_name[0] || "") + (s.last_name[0] || "");
    return `
      <div class="arp-row">
        <div class="arp-avatar">${esc(initials)}</div>
        <span class="arp-name">${esc(s.first_name)} ${esc(s.last_name)}</span>
        <span class="arp-class">${esc(s.class_code)}</span>
        <span class="arp-score">${s.engagement}% engagement</span>
      </div>
    `;
  }).join("");
}

function renderStudents() {
  const grid = document.getElementById("student-grid");
  const sub = document.getElementById("students-sub");
  const students = filteredStudents();

  sub.textContent = `${students.length} student${students.length !== 1 ? "s" : ""}`;

  if (!students.length) {
    grid.innerHTML = `<div class="empty-state">No students in the selected class.</div>`;
    return;
  }

  grid.innerHTML = students.map((s, idx) => {
    const isTop = s.is_top;
    const cardCls = `student-card${isTop ? " top" : ""}${s.at_risk ? " at-risk" : ""}`;

    const chips = [
      ...s.quiz_results.map(q => `<span class="result-chip quiz ${grade(q.score)}" title="${esc(q.title)}">${esc(q.title.replace(/ Quiz$/i,"").substring(0,14))}: ${q.score}%</span>`),
      ...s.sim_results.map(r => `<span class="result-chip sim ${grade(r.score)}" title="${esc(r.title)}">${esc(r.title.substring(0,14))}: ${r.score}%</span>`)
    ].join("");

    return `
      <div class="${cardCls}" data-sid="${esc(s.student_id)}">
        <div class="sc-header">
          <div class="sc-identity">
            <div class="sc-rank">#${s.rank}</div>
            <div class="sc-name-block">
              <span class="sc-name">${esc(s.first_name)} ${esc(s.last_name)}${isTop ? " 👑" : ""}</span>
              <span class="sc-meta">${esc(s.class_code)} · Year ${s.year_level}</span>
            </div>
          </div>
          <span class="sc-engage">${s.engagement}%</span>
        </div>
        <div class="sc-bars">
          <div class="sc-bar-row"><span class="sc-bar-lbl">Progress</span><div class="sc-bar-track"><div class="sc-bar-fill blue" style="width:${s.module_progress_pct}%"></div></div><span class="sc-bar-val">${s.module_progress_pct}%</span></div>
          <div class="sc-bar-row"><span class="sc-bar-lbl">Quizzes</span><div class="sc-bar-track"><div class="sc-bar-fill cyan" style="width:${s.avg_quiz_score}%"></div></div><span class="sc-bar-val">${s.avg_quiz_score > 0 ? s.avg_quiz_score+"%" : "-"}</span></div>
          <div class="sc-bar-row"><span class="sc-bar-lbl">Sims</span><div class="sc-bar-track"><div class="sc-bar-fill purple" style="width:${s.avg_sim_score}%"></div></div><span class="sc-bar-val">${s.avg_sim_score > 0 ? s.avg_sim_score+"%" : "-"}</span></div>
        </div>
        ${chips ? `<div class="sc-results">${chips}</div>` : ""}
      </div>
    `;
  }).join("");
}

function renderLessonProgress() {
  const grid = document.getElementById("lesson-grid");
  const sub = document.getElementById("progress-sub");
  const modules = activeProfile.modules || [];

  const active = modules.filter(m => m.status !== "Locked").length;
  sub.textContent = `${active} of ${modules.length} lessons active`;

  if (!modules.length) {
    grid.innerHTML = `<div class="empty-state">No lessons found.</div>`;
    return;
  }

  grid.innerHTML = modules.map(m => {
    const key = m.status === "Completed" ? "completed" : m.status === "In Progress" ? "inprogress" : "locked";
    const label = m.status === "Completed" ? "Completed" : m.status === "In Progress" ? "In Progress" : "Locked";
    return `
      <div class="lesson-card" data-lid="${esc(m.lesson_id)}">
        <div class="lc-top">
          <span class="lc-title">${esc(m.title)}</span>
          <span class="lc-status ${key}">${label}</span>
        </div>
        <div class="lc-topic">${esc(m.topic || "")} · ${esc(m.difficulty || "")}</div>
        <div class="lc-bar-row">
          <div class="lc-bar-track"><div class="lc-bar-fill" style="width:${m.progress}%"></div></div>
          <span class="lc-pct">${m.progress}%</span>
        </div>
      </div>
    `;
  }).join("");

  grid.querySelectorAll(".lesson-card").forEach(card => {
    card.addEventListener("click", () => showDrilldown(card.dataset.lid));
  });
}

function showDrilldown(lessonId) {
  const lesson = (activeProfile.modules || []).find(m => m.lesson_id === lessonId);
  const students = filteredStudents();
  const panel = document.getElementById("drilldown");
  const title = document.getElementById("dd-title");
  const body = document.getElementById("dd-body");

  title.textContent = lesson ? `${lesson.title} - Student Breakdown` : "Student Breakdown";

  body.innerHTML = students.map(s => {
    const quizzes = s.quiz_results.filter(q => q.lesson_id === lessonId);
    const sims = s.sim_results.filter(r => r.lesson_id === lessonId);
    const rows = [
      ...quizzes.map(q => `<div class="dd-row"><span class="dd-label">📝 ${esc(q.title)}</span><span class="dd-val ${grade(q.score)}">${q.score}%</span></div>`),
      ...sims.map(r => `<div class="dd-row"><span class="dd-label">🖥 ${esc(r.title)}</span><span class="dd-val ${grade(r.score)}">${r.score}%</span></div>`)
    ];
    return `
      <div class="dd-student">
        <div class="dd-name">${esc(s.first_name)} ${esc(s.last_name)}</div>
        ${rows.length ? rows.join("") : `<div class="dd-row"><span class="dd-label" style="color:var(--text-muted)">No results yet</span></div>`}
      </div>
    `;
  }).join("");

  panel.style.display = "block";
  panel.scrollIntoView({ behavior:"smooth", block:"nearest" });
}

function renderAnnouncements() {
  const feed = document.getElementById("ann-feed");
  const anns = activeProfile.announcements || [];

  if (!anns.length) {
    feed.innerHTML = `<div class="ann-empty">No announcements yet. Post one to your students!</div>`;
    return;
  }

  feed.innerHTML = anns.map(a => `
    <div class="ann-card">
      <div class="ann-icon">${ICON_ANNOUNCE}</div>
      <div class="ann-content">
        <div class="ann-title">${esc(a.title)}</div>
        <div class="ann-msg">${esc(a.message)}</div>
        <div class="ann-date">${esc(a.created_at)}</div>
      </div>
    </div>
  `).join("");
}

function bindAnnouncementForm() {
  document.getElementById("ann-post-btn").addEventListener("click", () => {
    const titleEl = document.getElementById("ann-title-in");
    const msgEl = document.getElementById("ann-msg-in");
    const note = document.getElementById("ann-feedback");
    const title = titleEl.value.trim();
    const message = msgEl.value.trim();

    if (!title || !message) {
      note.style.color = "var(--error)";
      note.textContent = "Please fill in both fields.";
      return;
    }

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2,"0")}/${(now.getMonth()+1).toString().padStart(2,"0")}/${now.getFullYear()}`;
    activeProfile.announcements.unshift({
      notification_id: "TEMP",
      teacher_id: activeProfile.teacher_id,
      title, message,
      created_at: dateStr,
    });
    renderAnnouncements();
    titleEl.value = "";
    msgEl.value = "";
    note.style.color = "var(--green)";
    note.textContent = "Announcement posted!";
    setTimeout(() => { note.textContent = ""; }, 3000);
  });
}

function startRadar() {
  const canvas = document.getElementById("radar-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let sweep = 0;

  const students = (activeProfile.students || []).slice(0, 12);
  const blips = students.map((s, i) => ({
    r: 18 + ((s.engagement / 100) * 72),
    angle: (i / Math.max(students.length,1)) * Math.PI * 2,
    color: s.at_risk ? "#f59e0b" : (i === 0 ? "#10b981" : "#00f2ff"),
    size: s.at_risk ? 5 : (i === 0 ? 6 : 3.5),
  }));

  function draw() {
    const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2, R = 90;
    ctx.clearRect(0,0,W,H);

    for (let r = 22; r <= R; r += 22) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(0,242,255,${0.04 + r/1800})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(cx-R, cy); ctx.lineTo(cx+R, cy);
    ctx.moveTo(cx, cy-R); ctx.lineTo(cx, cy+R);
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, sweep, sweep - 0.45, true);
    ctx.closePath();
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, R);
    grad.addColorStop(0, "rgba(0,242,255,0.18)");
    grad.addColorStop(1, "rgba(0,242,255,0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R*Math.cos(sweep), cy + R*Math.sin(sweep));
    ctx.strokeStyle = "rgba(0,242,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    blips.forEach(b => {
      const diff = (sweep - b.angle + Math.PI*2) % (Math.PI*2);
      const alpha = diff < 1.6 ? Math.max(1 - diff/1.6, 0.18) : 0.18;
      const bx = cx + b.r*Math.cos(b.angle), by = cy + b.r*Math.sin(b.angle);
      ctx.beginPath();
      ctx.arc(bx, by, b.size, 0, Math.PI*2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = b.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });

    const pulse = Math.sin(Date.now()*0.003)*1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 5+pulse, 0, Math.PI*2);
    ctx.fillStyle = "#00f2ff";
    ctx.shadowBlur = 16;
    ctx.shadowColor = "#00f2ff";
    ctx.fill();
    ctx.shadowBlur = 0;

    sweep = (sweep + 0.015) % (Math.PI*2);
    radarRAF = requestAnimationFrame(draw);
  }

  if (radarRAF) cancelAnimationFrame(radarRAF);
  draw();
}

function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let W, H;
  const particles = [];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener("resize", resize);
  resize();

  for (let i = 0; i < 55; i++) {
    particles.push({
      x: Math.random()*1400, y: Math.random()*900,
      char: Math.random() > 0.5 ? "0" : "1",
      speed: 0.12 + Math.random()*0.3,
      alpha: 0.03 + Math.random()*0.07,
    });
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

function grade(score) {
  if (score === null || score === undefined) return "none";
  if (score >= 80) return "good";
  if (score >= 60) return "mid";
  return "low";
}

function esc(str) {
  return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
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
