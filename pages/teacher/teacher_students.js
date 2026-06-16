const API_BASE = "http://127.0.0.1:8765";
let activeProfile = null;
let activeClassId = null;
let sortMode = "rank";
let searchTerm = "";
let riskOnly = false;

document.addEventListener("DOMContentLoaded", () => {
  bindNavEvents();
  bindToolbar();
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
    const res = await fetch(`${API_BASE}/teacher_dashboard`, {
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
  document.getElementById("loading-view").classList.remove("hidden");
  document.getElementById("error-view").style.display = "none";
  document.getElementById("dashboard-view").classList.remove("active");
}
function showError(msg) {
  document.getElementById("loading-view").style.display = "none";
  document.getElementById("error-view").style.display = "flex";
  document.getElementById("error-message").textContent = msg;
}
function enterDashboard() {
  const loading = document.getElementById("loading-view");
  loading.classList.add("hidden");
  setTimeout(() => { loading.style.display = "none"; }, 300);
  document.getElementById("error-view").style.display = "none";
  document.getElementById("dashboard-view").classList.add("active");
  renderProfile();
  renderClassPills();
  renderTable();
}

function bindNavEvents() {
  const toggle = document.getElementById("profile-toggle");
  const dropdown = document.getElementById("profile-dropdown");
  toggle.addEventListener("click", e => { e.stopPropagation(); dropdown.classList.toggle("active"); });
  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target !== toggle) dropdown.classList.remove("active");
  });
  document.getElementById("logout-btn").addEventListener("click", e => { e.preventDefault(); logout(); });
  document.getElementById("dd-close").addEventListener("click", () => {
    document.getElementById("drilldown").style.display = "none";
  });
  document.getElementById("retry-btn")?.addEventListener("click", loadData);
}

function bindToolbar() {
  document.getElementById("search-input").addEventListener("input", e => {
    searchTerm = e.target.value.trim().toLowerCase();
    renderTable();
  });
  document.getElementById("sort-select").addEventListener("change", e => {
    sortMode = e.target.value;
    renderTable();
  });
  document.getElementById("risk-only-checkbox").addEventListener("change", e => {
    riskOnly = e.target.checked;
    renderTable();
  });
}

function renderProfile() {
  const p = activeProfile;
  document.getElementById("pd-name").textContent = `${p.first_name} ${p.last_name}`;
  document.getElementById("pd-email").textContent = p.email;
  document.getElementById("pd-school").textContent = p.school;
}

function renderClassPills() {
  const container = document.getElementById("class-pills");
  const classes = activeProfile.classes || [];
  if (classes.length <= 1) { container.style.display = "none"; return; }

  container.innerHTML = classes.map(c => `
    <button class="class-pill${activeClassId === c.class_id ? " active" : ""}" data-cid="${esc(c.class_id)}">${esc(c.class_code)}</button>
  `).join("");

  container.querySelectorAll(".class-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const cid = btn.dataset.cid;
      activeClassId = (activeClassId === cid) ? null : cid;
      renderClassPills();
      renderTable();
    });
  });
}

function filteredStudents() {
  let list = activeProfile.students || [];
  if (activeClassId) list = list.filter(s => s.class_id === activeClassId);
  if (riskOnly) list = list.filter(s => s.at_risk);
  if (searchTerm) {
    list = list.filter(s =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm)
    );
  }
  list = [...list];
  if (sortMode === "name") list.sort((a,b) => a.last_name.localeCompare(b.last_name));
  else if (sortMode === "progress") list.sort((a,b) => b.module_progress_pct - a.module_progress_pct);
  else if (sortMode === "quiz") list.sort((a,b) => b.avg_quiz_score - a.avg_quiz_score);
  else if (sortMode === "sim") list.sort((a,b) => b.avg_sim_score - a.avg_sim_score);
  else list.sort((a,b) => a.rank - b.rank);
  return list;
}

function renderTable() {
  const wrap = document.getElementById("table-wrap");
  const sub  = document.getElementById("students-sub");
  const students = filteredStudents();

  sub.textContent = `${students.length} student${students.length !== 1 ? "s" : ""}`;

  if (!students.length) {
    wrap.innerHTML = `<div class="empty-state">No students match your filters.</div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="students-table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Progress</th>
          <th>Quiz Avg</th>
          <th>Sim Avg</th>
          <th>Engagement</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(s => `
          <tr data-sid="${esc(s.student_id)}">
            <td>
              <div class="td-name">
                <div class="td-rank">#${s.rank}</div>
                <div class="td-name-text">
                  <strong>${esc(s.first_name)} ${esc(s.last_name)}</strong>
                  <span>${esc(s.class_code)} · Year ${s.year_level}${s.at_risk ? ' · <span class="risk-badge">AT RISK</span>'.replace('<span class="risk-badge">','').replace('</span>','') : ''}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="td-bar-cell">
                <div class="td-bar-track"><div class="td-bar-fill blue" style="width:${s.module_progress_pct}%"></div></div>
                <span class="td-bar-val">${s.module_progress_pct}%</span>
              </div>
            </td>
            <td>
              <div class="td-bar-cell">
                <div class="td-bar-track"><div class="td-bar-fill cyan" style="width:${s.avg_quiz_score}%"></div></div>
                <span class="td-bar-val">${s.avg_quiz_score > 0 ? s.avg_quiz_score+"%" : "—"}</span>
              </div>
            </td>
            <td>
              <div class="td-bar-cell">
                <div class="td-bar-track"><div class="td-bar-fill purple" style="width:${s.avg_sim_score}%"></div></div>
                <span class="td-bar-val">${s.avg_sim_score > 0 ? s.avg_sim_score+"%" : "—"}</span>
              </div>
            </td>
            <td>
              <span class="td-engage" style="color:${s.at_risk ? 'var(--amber)' : '#fff'}">${s.engagement}%</span>
              ${s.at_risk ? '<span class="risk-badge" style="margin-left:0.5rem">AT RISK</span>' : ''}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll("tbody tr").forEach(row => {
    row.addEventListener("click", () => showDrilldown(row.dataset.sid));
  });
}

function showDrilldown(studentId) {
  const s = (activeProfile.students || []).find(x => x.student_id === studentId);
  if (!s) return;
  const panel = document.getElementById("drilldown");
  const title = document.getElementById("dd-title");
  const body  = document.getElementById("dd-body");

  title.textContent = `${s.first_name} ${s.last_name} — Detail`;

  const quizRows = s.quiz_results.length
    ? s.quiz_results.map(q => `<div class="dd-row"><span class="dd-label">📝 ${esc(q.title)}</span><span class="dd-val ${grade(q.score)}">${q.score}%</span></div>`).join("")
    : `<div class="dd-row"><span class="dd-label" style="color:var(--text-muted)">No quiz results yet</span></div>`;

  const simRows = s.sim_results.length
    ? s.sim_results.map(r => `<div class="dd-row"><span class="dd-label">🖥 ${esc(r.title)}</span><span class="dd-val ${grade(r.score)}">${r.score}%</span></div>`).join("")
    : `<div class="dd-row"><span class="dd-label" style="color:var(--text-muted)">No simulation results yet</span></div>`;

  body.innerHTML = `
    <div class="dd-student">
      <div class="dd-name">Module Progress</div>
      <div class="dd-row"><span class="dd-label">Completed</span><span class="dd-val">${s.modules_completed} / ${s.modules_total}</span></div>
    </div>
    <div class="dd-student">
      <div class="dd-name">Quiz Results</div>
      ${quizRows}
    </div>
    <div class="dd-student">
      <div class="dd-name">Simulation Results</div>
      ${simRows}
    </div>
  `;

  panel.style.display = "block";
  panel.scrollIntoView({ behavior:"smooth", block:"nearest" });
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