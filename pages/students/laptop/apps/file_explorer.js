OS.registerApp("files", {
  label: "File Explorer",
  icon: "files",
  color: "var(--amber)",
  width: 700,
  height: 480,
  singleton: true,
  render(container, ctx) {
    let path = []; // path segments from root
    const history = [[]];
    let histPos = 0;

    const FILE_ICON = {
      text: "📄", csv: "📊", eml: "✉️", exe: "⚠️", log: "📄",
    };

    container.innerHTML = `
      <div class="app-toolbar">
        <button class="app-toolbar-btn" id="fe-back" title="Back">←</button>
        <button class="app-toolbar-btn" id="fe-up" title="Up">↑</button>
        <div class="app-address-bar" id="fe-address">This PC</div>
      </div>
      <div style="display:flex;height:calc(100% - 49px)">
        <div style="width:170px;border-right:1px solid rgba(255,255,255,0.05);padding:0.75rem;display:flex;flex-direction:column;gap:0.2rem;overflow-y:auto" id="fe-sidebar"></div>
        <div style="flex:1;padding:1.1rem;overflow:auto" id="fe-content"></div>
      </div>
    `;

    const addressEl = container.querySelector("#fe-address");
    const contentEl = container.querySelector("#fe-content");
    const sidebarEl = container.querySelector("#fe-sidebar");

    function rootShortcuts() {
      return ["Documents", "Desktop", "Downloads", "Quarantine", "Network"];
    }

    function renderSidebar() {
      sidebarEl.innerHTML = rootShortcuts().map(name => `
        <div class="fe-folder-row" data-target="${name}" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.6rem;border-radius:7px;cursor:pointer;font-size:0.78rem;color:var(--text-sub);">
          📁 <span style="flex:1">${name}</span>
        </div>
      `).join("");
      sidebarEl.querySelectorAll(".fe-folder-row").forEach(row => {
        row.addEventListener("click", () => navigate([row.dataset.target]));
      });
      highlightSidebar();
    }

    function highlightSidebar() {
      sidebarEl.querySelectorAll(".fe-folder-row").forEach(r => {
        r.style.background = (path[0] === r.dataset.target && path.length === 1) ? "rgba(255,255,255,0.06)" : "transparent";
      });
    }

    function navigate(newPath, pushHistory = true) {
      path = newPath;
      if (pushHistory) { history.splice(histPos + 1); history.push([...path]); histPos = history.length - 1; }
      render();
    }

    function goBack() {
      if (histPos > 0) { histPos--; path = [...history[histPos]]; render(); }
    }
    function goUp() {
      if (path.length) navigate(path.slice(0, -1));
    }

    function openFile(name, file) {
      if (file.kind === "exe") {
        contentEl.innerHTML = exeView(name, file);
      } else {
        contentEl.innerHTML = fileView(name, file);
      }
      bindFileViewActions(name, file);
    }

    function fileView(name, file) {
      const safeContent = OS.esc(file.content);
      return `
        <div style="display:flex;flex-direction:column;height:100%;gap:0.75rem">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div style="font-size:0.85rem;font-weight:700;color:#fff">${FILE_ICON[file.kind] || "📄"} ${OS.esc(name)}</div>
            <div style="display:flex;gap:0.4rem">
              <button class="app-toolbar-btn fe-scan-btn" style="width:auto;padding:0 0.8rem">Scan</button>
              <button class="app-toolbar-btn fe-close-btn" style="width:auto;padding:0 0.8rem">Close</button>
            </div>
          </div>
          <pre style="flex:1;background:#0a0a14;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:1rem;font-family:'JetBrains Mono',monospace;font-size:0.76rem;color:var(--text-sub);overflow:auto;white-space:pre-wrap">${safeContent}</pre>
          <div id="fe-scan-result" style="font-size:0.74rem;color:var(--text-muted)"></div>
        </div>
      `;
    }

    function exeView(name, file) {
      return `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1rem;text-align:center">
          <div style="font-size:2rem">⚠️</div>
          <div style="font-size:0.85rem;font-weight:700;color:#fff">${OS.esc(name)}</div>
          <div style="font-size:0.74rem;color:var(--text-muted);max-width:300px">Executable file. ${file.scanned ? (file.tags?.includes('malware') ? `Previously scanned - flagged as <span style="color:var(--error-red)">${OS.esc(file.threatName)}</span>.` : "Previously scanned - no threats found.") : "Not yet scanned."}</div>
          <div style="display:flex;gap:0.5rem">
            <button class="app-toolbar-btn fe-scan-btn" style="width:auto;padding:0 1rem">Run Scan</button>
            ${file.scanned && file.tags?.includes("malware") ? `<button class="app-toolbar-btn fe-quarantine-btn" style="width:auto;padding:0 1rem;color:var(--error-red);border-color:var(--error-red)">Quarantine</button>` : ""}
            <button class="app-toolbar-btn fe-close-btn" style="width:auto;padding:0 1rem">Close</button>
          </div>
          <div id="fe-scan-result" style="font-size:0.74rem;color:var(--text-sub);white-space:pre-wrap;max-width:380px"></div>
        </div>
      `;
    }

    function bindFileViewActions(name, file) {
      const fullPath = [...path, name].join("/");
      contentEl.querySelector(".fe-close-btn")?.addEventListener("click", () => render());
      contentEl.querySelector(".fe-scan-btn")?.addEventListener("click", () => {
        const result = WORLD.scanFile(fullPath);
        const resEl = contentEl.querySelector("#fe-scan-result");
        if (resEl) {
          resEl.textContent = result.message;
          resEl.style.color = result.threat ? "var(--error-red)" : "var(--cyan)";
        }
        if (result.threat) ctx.notify("Security Scanner", `Threat found in ${name}.`);
        else ctx.notify("Security Scanner", `${name}: no threats found.`);
        // re-render exe view to surface quarantine button after scan
        if (file.kind === "exe") {
          setTimeout(() => { contentEl.innerHTML = exeView(name, file); bindFileViewActions(name, file); contentEl.querySelector("#fe-scan-result").textContent = result.message; contentEl.querySelector("#fe-scan-result").style.color = result.threat ? "var(--error-red)" : "var(--cyan)"; }, 50);
        }
      });
      contentEl.querySelector(".fe-quarantine-btn")?.addEventListener("click", () => {
        WORLD.moveToQuarantine(fullPath);
        ctx.notify("Security", `${name} moved to Quarantine.`);
        render();
      });
    }

    function render() {
      addressEl.textContent = "This PC" + (path.length ? " > " + path.join(" > ") : "");
      highlightSidebar();

      const items = WORLD.listDir(path.join("/"));
      if (items === null) {
        contentEl.innerHTML = `<div class="app-empty-state">📁<br/>Folder not found.</div>`;
        return;
      }
      if (!items.length) {
        contentEl.innerHTML = `<div class="app-empty-state">📂 This folder is empty.</div>`;
        return;
      }

      contentEl.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,90px);gap:1rem">
          ${items.map(it => `
            <div class="fe-item" data-name="${OS.esc(it.name)}" style="display:flex;flex-direction:column;align-items:center;gap:0.4rem;padding:0.6rem 0.3rem;border-radius:9px;cursor:pointer;text-align:center;${it.tags?.includes('malware') ? 'outline:1px solid rgba(255,51,102,0.25)' : ''}">
              <div style="font-size:1.8rem">${it.type === 'dir' ? '📁' : (FILE_ICON[it.kind] || '📄')}</div>
              <span style="font-size:0.68rem;color:#fff;line-height:1.2;word-break:break-word">${OS.esc(it.name)}</span>
              ${it.scanned ? `<span style="font-size:0.58rem;color:${it.tags?.includes('malware')||it.tags?.includes('phishing') ? 'var(--error-red)' : 'var(--cyan)'}">${it.tags?.includes('malware')||it.tags?.includes('phishing') ? '⚠ flagged' : '✓ clean'}</span>` : ""}
            </div>
          `).join("")}
        </div>
      `;

      contentEl.querySelectorAll(".fe-item").forEach(el => {
        el.addEventListener("mouseenter", () => el.style.background = "rgba(255,255,255,0.05)");
        el.addEventListener("mouseleave", () => el.style.background = "transparent");
        el.addEventListener("dblclick", () => {
          const name = el.dataset.name;
          const item = items.find(i => i.name === name);
          if (item.type === "dir") navigate([...path, name]);
          else openFile(name, item);
        });
      });
    }

    container.querySelector("#fe-back").addEventListener("click", goBack);
    container.querySelector("#fe-up").addEventListener("click", goUp);

    renderSidebar();
    render();
  }
});