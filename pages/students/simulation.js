const API_BASE = "http://127.0.0.1:8765";
let simData = null;
let scenarioSteps = [];
let currentStep = 0;
let correctCount = 0;
let answeredCurrent = false;

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

  const simId = qs("simulation_id");
  if (!simId) { showError("No simulation specified."); return; }

  try {
    const res = await fetch(`${API_BASE}/simulation_detail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulation_id: simId })
    });
    if (!res.ok) throw new Error("Server error");
    const data = await res.json();
    if (!data.success) { showError("Simulation not found."); return; }

    simData = data.simulation;
    scenarioSteps = buildScenario(simData);
    currentStep = 0;
    correctCount = 0;
    answeredCurrent = false;

    enterDashboard();
  } catch (e) {
    showError("Could not connect to the server. Check that the Netwiser engine is running.");
  }
}

/*
 * The Simulations table stores only a title and difficulty (no branching
 * scenario content), so this builds a short, honest scenario-style
 * exercise themed on the simulation's real title/difficulty. Every
 * resulting score is graded live and submitted to SimulationResults.
 */
function buildScenario(sim) {
  const title = (sim.title || "").toLowerCase();

  if (title.includes("phishing")) {
    return [
      {
        text: "You receive an email claiming to be from your school IT department, asking you to 'verify your account' by clicking a link and entering your password.",
        choices: [
          { text: "Click the link and log in to verify", correct: false },
          { text: "Report it and contact IT directly through a known channel", correct: true },
          { text: "Reply asking if it's legitimate", correct: false },
        ],
      },
      {
        text: "The email address is 'support@schooI-it.com' (note the capital I instead of a lowercase l). What does this suggest?",
        choices: [
          { text: "It's a typo, nothing to worry about", correct: false },
          { text: "It's likely a spoofed domain trying to impersonate a real one", correct: true },
        ],
      },
      {
        text: "The email creates urgency: 'Your account will be deleted in 24 hours.' What's the safest response?",
        choices: [
          { text: "Act fast to avoid losing access", correct: false },
          { text: "Recognize urgency as a common manipulation tactic and verify independently", correct: true },
        ],
      },
    ];
  }

  if (title.includes("privacy")) {
    return [
      {
        text: "You're setting up a new social media account. What's the safest privacy default?",
        choices: [
          { text: "Public profile, visible to everyone", correct: false },
          { text: "Private profile, visible only to approved followers", correct: true },
        ],
      },
      {
        text: "A quiz app asks for access to your contacts and location 'to personalize your experience.' What should you do?",
        choices: [
          { text: "Grant all permissions to use the app fully", correct: false },
          { text: "Deny unnecessary permissions and only allow what's required", correct: true },
        ],
      },
    ];
  }

  return [
    {
      text: `You're working through the "${sim.title}" exercise. A pop-up appears claiming you've won a prize and asks you to enter personal details to claim it.`,
      choices: [
        { text: "Enter your details to claim the prize", correct: false },
        { text: "Close the pop-up and ignore it", correct: true },
      ],
    },
    {
      text: "A friend sends you a link to download 'free software' from an unfamiliar website.",
      choices: [
        { text: "Download it since a friend sent it", correct: false },
        { text: "Verify the source before downloading anything", correct: true },
      ],
    },
  ];
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
  document.getElementById("sim-card").style.display = "flex";
  document.getElementById("sim-result-card").style.display = "none";

  const sessionUser = JSON.parse(sessionStorage.getItem("netwiser_user") || "{}");
  document.getElementById("profile-name").textContent = sessionUser.username || "Student";
  document.getElementById("profile-email").textContent = sessionUser.email || "";

  document.getElementById("sim-difficulty").textContent = `SIMULATION · ${(simData.difficulty || "").toUpperCase()}`;
  document.getElementById("sim-title").textContent = simData.title;

  renderStep();
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
  document.getElementById("sim-next-btn").addEventListener("click", () => {
    if (currentStep === scenarioSteps.length - 1) {
      submitSimulation();
    } else {
      currentStep++;
      answeredCurrent = false;
      renderStep();
    }
  });
  document.getElementById("sim-retry-btn").addEventListener("click", () => {
    currentStep = 0;
    correctCount = 0;
    answeredCurrent = false;
    document.getElementById("sim-card").style.display = "flex";
    document.getElementById("sim-result-card").style.display = "none";
    renderStep();
  });
}

function renderStep() {
  const step = scenarioSteps[currentStep];
  document.getElementById("sim-progress-text").textContent = `Step ${currentStep + 1} of ${scenarioSteps.length}`;
  document.getElementById("sim-step-text").textContent = step.text;
  document.getElementById("sim-feedback").style.display = "none";

  const nextBtn = document.getElementById("sim-next-btn");
  nextBtn.disabled = true;
  nextBtn.textContent = currentStep === scenarioSteps.length - 1 ? "Finish Simulation" : "Next →";

  const container = document.getElementById("sim-choices");
  container.innerHTML = step.choices.map((c, i) => `
    <div class="sim-choice" data-idx="${i}">${esc(c.text)}</div>
  `).join("");

  container.querySelectorAll(".sim-choice").forEach(el => {
    el.addEventListener("click", () => {
      if (answeredCurrent) return;
      answeredCurrent = true;

      const idx = parseInt(el.dataset.idx, 10);
      const choice = step.choices[idx];

      container.querySelectorAll(".sim-choice").forEach(c => c.style.pointerEvents = "none");
      el.classList.add("chosen", choice.correct ? "correct-fb" : "incorrect-fb");

      const feedback = document.getElementById("sim-feedback");
      feedback.style.display = "block";
      feedback.className = "sim-feedback " + (choice.correct ? "correct" : "incorrect");
      feedback.textContent = choice.correct
        ? "Correct — that's the safer choice."
        : "Not quite — consider the safer alternative next time.";

      if (choice.correct) correctCount++;
      document.getElementById("sim-next-btn").disabled = false;
    });
  });

  renderDots();
}

function renderDots() {
  const dots = document.getElementById("sim-dots");
  dots.innerHTML = scenarioSteps.map((s, i) => `
    <div class="quiz-dot ${i < currentStep ? "answered" : ""} ${i === currentStep ? "current" : ""}"></div>
  `).join("");
}

async function submitSimulation() {
  const nextBtn = document.getElementById("sim-next-btn");
  nextBtn.disabled = true;
  nextBtn.textContent = "Submitting…";

  const score = Math.round((correctCount / scenarioSteps.length) * 100);

  try {
    const sessionUser = JSON.parse(sessionStorage.getItem("netwiser_user"));
    const res = await fetch(`${API_BASE}/simulation_submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: sessionUser.user_id,
        simulation_id: simData.simulation_id,
        score: score,
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Submission failed");

    renderResult(score, data);
  } catch (e) {
    nextBtn.disabled = false;
    nextBtn.textContent = "Finish Simulation";
    alert("Could not submit your result. Please try again.");
  }
}

function renderResult(score, data) {
  document.getElementById("sim-card").style.display = "none";
  document.getElementById("sim-result-card").style.display = "flex";

  const scoreEl = document.getElementById("sim-result-score");
  scoreEl.textContent = `${score}%`;
  scoreEl.className = "result-score-num " + (score >= 80 ? "good" : score >= 60 ? "mid" : "low");
  document.getElementById("sim-result-label").textContent = `${correctCount} of ${scenarioSteps.length} decisions correct`;

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