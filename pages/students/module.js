const API_BASE = "http://127.0.0.1:8765";
let activeProfile = null;
let currentLesson = null;
let currentModuleId = null;

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener("DOMContentLoaded", () => {
  bindNavEvents();
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

    const lessonId = qs("lesson_id");
    currentModuleId = qs("module_id");
    currentLesson = (activeProfile.lessons || []).find(l => l.lesson_id === lessonId);

    if (!currentLesson) {
      showError("Lesson not found. It may have been removed or you don't have access.");
      return;
    }
    if (!currentModuleId) {
      currentModuleId = (currentLesson.modules || [])[0]?.module_id;
    }
    if (!currentModuleId) {
      showError("This lesson has no modules yet.");
      return;
    }

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
  renderModule();
}

function bindNavEvents() {
  const toggle = document.getElementById("profile-toggle");
  const dropdown = document.getElementById("profile-dropdown");
  toggle.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("active"); });
  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target !== toggle) dropdown.classList.remove("active");
  });
  document.getElementById("logout-btn").addEventListener("click", e => { e.preventDefault(); logout(); });
  document.getElementById("retry-btn")?.addEventListener("click", loadData);
}

function renderProfile() {
  const p = activeProfile;
  document.getElementById("profile-name").textContent = `${p.first_name} ${p.last_name}`;
  document.getElementById("profile-email").textContent = p.email;
}

function renderModule() {
  const modules = currentLesson.modules || [];
  const module = modules.find(m => m.module_id === currentModuleId);
  if (!module) { showError("Module not found in this lesson."); return; }

  document.getElementById("back-link").href = "lessons.html";
  document.getElementById("module-position").textContent = `MODULE ${module.order_no} OF ${modules.length}`;
  document.getElementById("module-title").textContent = module.module_title;
  document.getElementById("lesson-context").textContent = `Part of: ${currentLesson.title}`;
  document.getElementById("lesson-desc").textContent = currentLesson.description || "";

  const navContainer = document.getElementById("module-nav");
  navContainer.innerHTML = modules.map(m => {
    const key = m.status === "Completed" ? "completed" : (m.module_id === currentModuleId ? "active" : (m.status === "In Progress" ? "active" : "locked"));
    const label = m.status === "Completed" ? "Completed" : (m.module_id === currentModuleId ? "Current" : (m.status === "In Progress" ? "In Progress" : "Pending"));
    return `
      <div class="lmn-row ${key}" data-mid="${esc(m.module_id)}">
        <div class="lmn-order">${m.status === "Completed" ? "✓" : m.order_no}</div>
        <span class="lmn-title">${esc(m.module_title)}</span>
        <span class="lmn-status">${label}</span>
      </div>
    `;
  }).join("");

  navContainer.querySelectorAll(".lmn-row").forEach(row => {
    row.addEventListener("click", () => {
      window.location.href = `module.html?module_id=${encodeURIComponent(row.dataset.mid)}&lesson_id=${encodeURIComponent(currentLesson.lesson_id)}`;
    });
  });

  const badge = document.getElementById("status-badge");
  const btn = document.getElementById("complete-btn");

  if (module.status === "Completed") {
    badge.textContent = "Completed";
    badge.className = "status-badge completed";
    btn.textContent = "Completed";
    btn.disabled = true;
  } else {
    badge.textContent = module.status === "In Progress" ? "In Progress" : "Not Started";
    badge.className = module.status === "In Progress" ? "status-badge in-progress" : "status-badge";
    btn.textContent = "Mark Complete";
    btn.disabled = false;
    btn.onclick = () => markComplete(module.module_id);

    if (module.status !== "In Progress") {
      markInProgress(module.module_id);
    }
  }
}

async function markInProgress(moduleId) {
  try {
    const sessionUser = JSON.parse(sessionStorage.getItem("netwiser_user"));
    await fetch(`${API_BASE}/module_progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: sessionUser.user_id, module_id: moduleId, status: "In Progress" })
    });
  } catch (e) { /* non-critical, ignore */ }
}

async function markComplete(moduleId) {
  const btn = document.getElementById("complete-btn");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    const sessionUser = JSON.parse(sessionStorage.getItem("netwiser_user"));
    const res = await fetch(`${API_BASE}/module_progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: sessionUser.user_id, module_id: moduleId, status: "Completed" })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to save");

    if (data.unlocked_achievements && data.unlocked_achievements.length) {
      showAchievementToast(data.unlocked_achievements);
    }

    // Refresh local state and re-render
    await initSession();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Mark Complete";
    alert("Could not save your progress. Please try again.");
  }
}

function showAchievementToast(achievements) {
  const toast = document.getElementById("achievement-toast");
  const names = achievements.map(a => a.title).join(", ");
  toast.textContent = `🏆 Achievement unlocked: ${names}`;
  toast.style.display = "block";
}

function initBgCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  let W, H;
  const particles = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener("resize", resize);
  resize();
  for (let i = 0; i < 40; i++) {
    particles.push({ x: Math.random()*1400, y: Math.random()*900, char: Math.random() > 0.5 ? "0" : "1", speed: 0.12 + Math.random()*0.3, alpha: 0.03 + Math.random()*0.06 });
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