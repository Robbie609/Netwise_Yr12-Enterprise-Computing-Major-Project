const API_BASE = "http://127.0.0.1:8765";
let quizData = null;
let questions = [];
let currentIndex = 0;
let answers = {};
let lessonId = null;

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

  const quizId = qs("quiz_id");
  lessonId = qs("lesson_id");
  if (!quizId) { showError("No quiz specified."); return; }

  try {
    const res = await fetch(`${API_BASE}/quiz_detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz_id: quizId })
    });
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    if (!data.success) { showError("Quiz not found."); return; }

    quizData = data.quiz;
    questions = data.questions || [];
    currentIndex = 0;
    answers = {};

    if (!questions.length) { showError("This quiz has no questions yet."); return; }

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
  document.getElementById("quiz-card").style.display = "flex";
  document.getElementById("result-card").style.display = "none";
  renderProfileFromSession();
  document.getElementById("back-link").href = lessonId ? `lessons.html` : "lessons.html";
  document.getElementById("quiz-title").textContent = quizData.title;
  renderQuestion();
}

function renderProfileFromSession() {
  const sessionUser = JSON.parse(sessionStorage.getItem("netwiser_user") || "{}");
  document.getElementById("profile-name").textContent = sessionUser.username || "Student";
  document.getElementById("profile-email").textContent = sessionUser.email || "";
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
  document.getElementById("prev-btn").addEventListener("click", () => navigate(-1));
  document.getElementById("next-btn").addEventListener("click", () => navigate(1));
  document.getElementById("retake-btn").addEventListener("click", () => {
    currentIndex = 0;
    answers = {};
    document.getElementById("quiz-card").style.display = "flex";
    document.getElementById("result-card").style.display = "none";
    renderQuestion();
  });
}

function renderQuestion() {
  const q = questions[currentIndex];
  document.getElementById("quiz-progress-text").textContent = `Question ${currentIndex + 1} of ${questions.length}`;
  document.getElementById("question-text").textContent = q.question_text;

  const options = [
    { letter: "a", text: q.option_a },
    { letter: "b", text: q.option_b },
    { letter: "c", text: q.option_c },
    { letter: "d", text: q.option_d },
  ];

  const optionsContainer = document.getElementById("quiz-options");
  optionsContainer.innerHTML = options.map(opt => `
    <div class="quiz-option ${answers[q.question_id] === opt.letter ? "selected" : ""}" data-letter="${opt.letter}">
      <span class="quiz-option-letter">${opt.letter.toUpperCase()}</span>
      <span>${esc(opt.text)}</span>
    </div>
  `).join("");

  optionsContainer.querySelectorAll(".quiz-option").forEach(el => {
    el.addEventListener("click", () => {
      answers[q.question_id] = el.dataset.letter;
      renderQuestion();
    });
  });

  renderDots();

  document.getElementById("prev-btn").disabled = currentIndex === 0;
  const nextBtn = document.getElementById("next-btn");
  nextBtn.textContent = currentIndex === questions.length - 1 ? "Submit Quiz" : "Next →";
}

function renderDots() {
  const dots = document.getElementById("quiz-dots");
  dots.innerHTML = questions.map((q, i) => `
    <div class="quiz-dot ${answers[q.question_id] ? "answered" : ""} ${i === currentIndex ? "current" : ""}"></div>
  `).join("");
}

function navigate(delta) {
  if (delta > 0 && currentIndex === questions.length - 1) {
    submitQuiz();
    return;
  }
  currentIndex = Math.max(0, Math.min(questions.length - 1, currentIndex + delta));
  renderQuestion();
}

async function submitQuiz() {
  const nextBtn = document.getElementById("next-btn");
  nextBtn.disabled = true;
  nextBtn.textContent = "Submitting…";

  try {
    const sessionUser = JSON.parse(sessionStorage.getItem("netwiser_user"));
    const res = await fetch(`${API_BASE}/quiz_submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: sessionUser.user_id,
        quiz_id: quizData.quiz_id,
        answers: answers,
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Submission failed");

    renderResult(data);
  } catch (e) {
    nextBtn.disabled = false;
    nextBtn.textContent = "Submit Quiz";
    alert("Could not submit your quiz. Please try again.");
  }
}

function renderResult(data) {
  document.getElementById("quiz-card").style.display = "none";
  document.getElementById("result-card").style.display = "flex";

  const scoreEl = document.getElementById("result-score");
  scoreEl.textContent = `${data.score}%`;
  scoreEl.className = "result-score-num " + (data.score >= 80 ? "good" : data.score >= 60 ? "mid" : "low");

  document.getElementById("result-label").textContent = `${data.correct_count} of ${data.total_questions} correct`;

  const breakdown = document.getElementById("result-breakdown");
  breakdown.innerHTML = data.detail.map((d, i) => `
    <div class="rb-row">
      <span class="rb-icon" style="color:${d.is_correct ? 'var(--cyan)' : 'var(--error-red)'}">${d.is_correct ? "✓" : "✕"}</span>
      <span class="rb-text">Q${i + 1}: ${esc(d.question_text)}</span>
    </div>
  `).join("");

  if (data.unlocked_achievements && data.unlocked_achievements.length) {
    const toast = document.getElementById("achievement-toast");
    toast.textContent = `🏆 Achievement unlocked: ${data.unlocked_achievements.map(a => a.title).join(", ")}`;
    toast.style.display = "block";
  } else {
    document.getElementById("achievement-toast").style.display = "none";
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