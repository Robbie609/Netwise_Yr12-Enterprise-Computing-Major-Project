/* ==========================================================================
   laptop.js — NetwiserOS Window Manager & Kernel
   Boots the simulator, authenticates the session, and exposes a small
   OS API (window.OS) that app modules (apps/*.js) register against.
   ========================================================================== */

const API_BASE = "http://127.0.0.1:8765";

const OS = (() => {
  let activeProfile = null;
  let zCounter = 100;
  let windowSeq = 0;
  const windows = new Map(); // win_id -> { el, appId, title, minimized, maximized, prevRect }
  const apps = new Map(); // appId -> { label, icon, render(container, ctx), singleton }
  const notifications = [];

  /* ---------- ICONS ---------- */
  const ICON = {
    files: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    browser: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>`,
    terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    notepad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
    scanner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    minimize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    maximize: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`,
  };

  /* ---------- APP REGISTRY ---------- */
  function registerApp(appId, config) {
    apps.set(appId, config);
  }

  function getProfile() { return activeProfile; }
  function getIcon(name) { return ICON[name] || ICON.files; }

  /* ---------- BOOT / SESSION ---------- */
  async function boot() {
    setBootProgress(15, "Verifying session…");
    const stored = sessionStorage.getItem("netwiser_user");
    if (!stored) { redirectToLogin(); return; }

    let sessionUser;
    try { sessionUser = JSON.parse(stored); } catch { redirectToLogin(); return; }
    if (!sessionUser?.user_id) { redirectToLogin(); return; }

    setBootProgress(45, "Loading student profile…");
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
      activeProfile.user_id = sessionUser.user_id;

      setBootProgress(80, "Starting NetwiserOS…");
      setTimeout(() => {
        setBootProgress(100, "Ready.");
        setTimeout(showDesktop, 250);
      }, 300);
    } catch (e) {
      showError("Could not connect to the server. Check that the Netwiser engine is running.");
    }
  }

  function setBootProgress(pct, label) {
    const fill = document.getElementById("boot-bar-fill");
    const lbl = document.getElementById("boot-label");
    if (fill) fill.style.width = `${pct}%`;
    if (lbl) lbl.textContent = label;
  }

  function redirectToLogin() {
    sessionStorage.removeItem("netwiser_user");
    window.location.href = "../../login/login.html";
  }
  function logout() {
    sessionStorage.removeItem("netwiser_user");
    window.location.href = "../../login/login.html";
  }
  function showError(msg) {
    document.getElementById("boot-view").style.display = "none";
    document.getElementById("error-view").style.display = "flex";
    document.getElementById("error-message").textContent = msg;
  }
  function showDesktop() {
    document.getElementById("boot-view").style.display = "none";
    document.getElementById("os-root").classList.remove("os-hidden");
    renderDesktopIcons();
    renderStartMenu();
    bindGlobalUI();
    startClock();
    notify("NetwiserOS", `Welcome back, ${activeProfile.first_name}. All systems nominal.`);
  }

  /* ---------- DESKTOP ICONS ---------- */
  function renderDesktopIcons() {
    const container = document.getElementById("desktop-icons");
    container.innerHTML = "";
    [...apps.entries()].forEach(([appId, cfg]) => {
      const el = document.createElement("div");
      el.className = "desktop-icon";
      el.innerHTML = `
        <div class="desktop-icon-glyph" style="color:${cfg.color || 'var(--lightblue)'}">${getIcon(cfg.icon)}</div>
        <span class="desktop-icon-label">${esc(cfg.label)}</span>
      `;
      el.addEventListener("dblclick", () => openApp(appId));
      el.addEventListener("click", (e) => {
        document.querySelectorAll(".desktop-icon").forEach(i => i.classList.remove("selected"));
        el.classList.add("selected");
      });
      container.appendChild(el);
    });
  }

  /* ---------- START MENU ---------- */
  function renderStartMenu() {
    const p = activeProfile;
    document.getElementById("start-avatar").textContent = (p.first_name[0] || "") + (p.last_name[0] || "");
    document.getElementById("start-user-name").textContent = `${p.first_name} ${p.last_name}`;
    document.getElementById("start-user-meta").textContent = `${p.class_code || ""} · Year ${p.year_level || ""}`;

    const menu = document.getElementById("start-menu-apps");
    menu.innerHTML = [...apps.entries()].map(([appId, cfg]) => `
      <button class="start-menu-app" data-app="${appId}">
        <div class="start-menu-app-icon" style="color:${cfg.color || 'var(--lightblue)'}">${getIcon(cfg.icon)}</div>
        <span class="start-menu-app-label">${esc(cfg.label)}</span>
      </button>
    `).join("") + `
      <div style="height:1px;background:rgba(255,255,255,0.06);margin:0.4rem 0.2rem;"></div>
      <button class="start-menu-app" data-app="__logout">
        <div class="start-menu-app-icon" style="color:var(--error-red)">${getIcon('close')}</div>
        <span class="start-menu-app-label">Sign Out</span>
      </button>
    `;

    menu.querySelectorAll(".start-menu-app").forEach(btn => {
      btn.addEventListener("click", () => {
        const appId = btn.dataset.app;
        toggleStartMenu(false);
        if (appId === "__logout") { logout(); return; }
        openApp(appId);
      });
    });
  }

  function toggleStartMenu(force) {
    const menu = document.getElementById("start-menu");
    const show = force !== undefined ? force : menu.style.display === "none";
    menu.style.display = show ? "block" : "none";
    if (show) document.getElementById("notif-panel").style.display = "none";
  }

  /* ---------- NOTIFICATIONS ---------- */
  function notify(title, body) {
    notifications.unshift({ title, body, time: new Date() });
    renderNotifList();
    document.getElementById("notif-dot").style.display = "block";
    spawnToast(title, body);
  }

  function spawnToast(title, body) {
    const layer = document.getElementById("toast-layer");
    const toast = document.createElement("div");
    toast.className = "os-toast";
    toast.innerHTML = `
      <div class="os-toast-icon">${getIcon('settings')}</div>
      <div class="os-toast-text">
        <span class="os-toast-title">${esc(title)}</span>
        <span class="os-toast-body">${esc(body)}</span>
      </div>
    `;
    layer.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity 0.3s"; setTimeout(() => toast.remove(), 300); }, 4500);
  }

  function renderNotifList() {
    const list = document.getElementById("notif-list");
    if (!notifications.length) {
      list.innerHTML = `<div class="notif-empty">No notifications.</div>`;
      return;
    }
    list.innerHTML = notifications.map(n => `
      <div class="notif-item">
        <span class="notif-item-title">${esc(n.title)}</span>
        <span class="notif-item-body">${esc(n.body)}</span>
        <span class="notif-item-time">${n.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    `).join("");
  }

  function toggleNotifPanel(force) {
    const panel = document.getElementById("notif-panel");
    const show = force !== undefined ? force : panel.style.display === "none";
    panel.style.display = show ? "flex" : "none";
    if (show) {
      document.getElementById("start-menu").style.display = "none";
      document.getElementById("notif-dot").style.display = "none";
    }
  }

  /* ---------- CLOCK ---------- */
  function startClock() {
    const clockEl = document.getElementById("tray-clock");
    function tick() {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    tick();
    setInterval(tick, 1000 * 15);
  }

  /* ---------- WINDOW MANAGEMENT ---------- */
  function openApp(appId, options = {}) {
    const cfg = apps.get(appId);
    if (!cfg) return;

    // Singleton apps: focus existing window instead of opening a new one
    if (cfg.singleton) {
      const existing = [...windows.values()].find(w => w.appId === appId);
      if (existing) {
        restoreWindow(existing.id);
        focusWindow(existing.id);
        if (cfg.onReopen) cfg.onReopen(existing, options);
        return existing.id;
      }
    }

    const winId = "win-" + (++windowSeq);
    const layer = document.getElementById("window-layer");

    const winEl = document.createElement("div");
    winEl.className = "os-window";
    winEl.id = winId;

    const w = options.width || cfg.width || 620;
    const h = options.height || cfg.height || 440;
    const x = options.x ?? (60 + (windowSeq % 5) * 30);
    const y = options.y ?? (40 + (windowSeq % 5) * 28);

    winEl.style.width = w + "px";
    winEl.style.height = h + "px";
    winEl.style.left = x + "px";
    winEl.style.top = y + "px";

    winEl.innerHTML = `
      <div class="win-titlebar" data-winid="${winId}">
        <span class="win-titlebar-icon">${getIcon(cfg.icon)}</span>
        <span class="win-titlebar-title">${esc(cfg.label)}</span>
        <div class="win-controls">
          <button class="win-ctrl-btn win-minimize" title="Minimize">${getIcon('minimize')}</button>
          <button class="win-ctrl-btn win-maximize" title="Maximize">${getIcon('maximize')}</button>
          <button class="win-ctrl-btn win-close" title="Close">${getIcon('close')}</button>
        </div>
      </div>
      <div class="win-body" id="${winId}-body"></div>
      <div class="win-resize-handle"></div>
    `;

    layer.appendChild(winEl);

    const winRecord = { id: winId, el: winEl, appId, title: cfg.label, minimized: false, maximized: false, prevRect: null };
    windows.set(winId, winRecord);

    bindWindowChrome(winRecord, cfg);
    focusWindow(winId);
    renderTaskbarApps();

    const bodyEl = document.getElementById(`${winId}-body`);
    const ctx = makeAppContext(winRecord);
    try {
      cfg.render(bodyEl, ctx);
    } catch (e) {
      bodyEl.innerHTML = `<div class="app-empty-state">This app failed to load.</div>`;
      console.error(e);
    }

    return winId;
  }

  function makeAppContext(winRecord) {
    return {
      profile: activeProfile,
      notify,
      closeSelf: () => closeWindow(winRecord.id),
      setTitle: (title) => {
        winRecord.title = title;
        winRecord.el.querySelector(".win-titlebar-title").textContent = title;
        renderTaskbarApps();
      },
      openApp,
    };
  }

  function bindWindowChrome(winRecord, cfg) {
    const { el, id } = winRecord;
    const titlebar = el.querySelector(".win-titlebar");

    el.addEventListener("mousedown", () => focusWindow(id));

    titlebar.querySelector(".win-close").addEventListener("click", (e) => { e.stopPropagation(); closeWindow(id); });
    titlebar.querySelector(".win-minimize").addEventListener("click", (e) => { e.stopPropagation(); minimizeWindow(id); });
    titlebar.querySelector(".win-maximize").addEventListener("click", (e) => { e.stopPropagation(); toggleMaximize(id); });

    // Drag
    let dragging = false, startX, startY, origX, origY;
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".win-ctrl-btn") || winRecord.maximized) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      origX = el.offsetLeft; origY = el.offsetTop;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      el.style.left = Math.max(0, origX + (e.clientX - startX)) + "px";
      el.style.top = Math.max(0, origY + (e.clientY - startY)) + "px";
    });
    document.addEventListener("mouseup", () => { dragging = false; });

    // Resize
    const handle = el.querySelector(".win-resize-handle");
    let resizing = false, rStartX, rStartY, rOrigW, rOrigH;
    handle.addEventListener("mousedown", (e) => {
      if (winRecord.maximized) return;
      resizing = true;
      rStartX = e.clientX; rStartY = e.clientY;
      rOrigW = el.offsetWidth; rOrigH = el.offsetHeight;
      e.preventDefault(); e.stopPropagation();
    });
    document.addEventListener("mousemove", (e) => {
      if (!resizing) return;
      el.style.width = Math.max(320, rOrigW + (e.clientX - rStartX)) + "px";
      el.style.height = Math.max(220, rOrigH + (e.clientY - rStartY)) + "px";
    });
    document.addEventListener("mouseup", () => { resizing = false; });

    titlebar.addEventListener("dblclick", () => toggleMaximize(id));
  }

  function focusWindow(id) {
    windows.forEach(w => w.el.classList.remove("focused"));
    const w = windows.get(id);
    if (!w) return;
    w.el.style.zIndex = ++zCounter;
    w.el.classList.add("focused");
    renderTaskbarApps(id);
  }

  function closeWindow(id) {
    const w = windows.get(id);
    if (!w) return;
    w.el.remove();
    windows.delete(id);
    renderTaskbarApps();
  }

  function minimizeWindow(id) {
    const w = windows.get(id);
    if (!w) return;
    w.minimized = true;
    w.el.classList.add("minimized");
    renderTaskbarApps();
  }

  function restoreWindow(id) {
    const w = windows.get(id);
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove("minimized");
  }

  function toggleMaximize(id) {
    const w = windows.get(id);
    if (!w) return;
    if (!w.maximized) {
      w.prevRect = { left: w.el.style.left, top: w.el.style.top, width: w.el.style.width, height: w.el.style.height };
      w.el.style.left = "0px";
      w.el.style.top = "0px";
      w.el.style.width = "100%";
      w.el.style.height = "100%";
      w.maximized = true;
    } else {
      const r = w.prevRect;
      if (r) { w.el.style.left = r.left; w.el.style.top = r.top; w.el.style.width = r.width; w.el.style.height = r.height; }
      w.maximized = false;
    }
  }

  function renderTaskbarApps(activeId) {
    const container = document.getElementById("taskbar-apps");
    container.innerHTML = "";
    windows.forEach(w => {
      const cfg = apps.get(w.appId);
      const btn = document.createElement("button");
      btn.className = "taskbar-app-btn" + (w.minimized ? "" : " active") + (activeId === w.id ? " active" : "");
      btn.innerHTML = `${getIcon(cfg?.icon)}<span>${esc(w.title)}</span>`;
      btn.addEventListener("click", () => {
        if (w.minimized) { restoreWindow(w.id); focusWindow(w.id); }
        else if (w.el.classList.contains("focused")) { minimizeWindow(w.id); }
        else { focusWindow(w.id); }
      });
      container.appendChild(btn);
    });
  }

  /* ---------- GLOBAL UI BINDINGS ---------- */
  function bindGlobalUI() {
    document.getElementById("start-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleStartMenu(); });
    document.getElementById("notif-btn").addEventListener("click", (e) => { e.stopPropagation(); toggleNotifPanel(); });
    document.getElementById("notif-clear-btn").addEventListener("click", () => { notifications.length = 0; renderNotifList(); });
    document.getElementById("exit-btn").addEventListener("click", () => {
      window.location.href = "../student_dashboard.html";
    });
    document.getElementById("retry-btn")?.addEventListener("click", () => window.location.reload());

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#start-menu") && !e.target.closest("#start-btn")) {
        document.getElementById("start-menu").style.display = "none";
      }
      if (!e.target.closest("#notif-panel") && !e.target.closest("#notif-btn")) {
        document.getElementById("notif-panel").style.display = "none";
      }
    });

    document.getElementById("desktop").addEventListener("click", (e) => {
      if (e.target.id === "desktop" || e.target.id === "desktop-icons") {
        document.querySelectorAll(".desktop-icon").forEach(i => i.classList.remove("selected"));
      }
    });
  }

  function esc(str) {
    return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  return { registerApp, openApp, notify, getProfile, getIcon, esc, boot, API_BASE };
})();

document.addEventListener("DOMContentLoaded", () => OS.boot());