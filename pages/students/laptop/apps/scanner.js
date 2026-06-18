/* Security Scanner - walks WORLD's filesystem for flagged threats. */
OS.registerApp("scanner", {
  label: "Security Scanner",
  icon: "scanner",
  color: "var(--cyan)",
  width: 480,
  height: 400,
  singleton: true,
  render(container, ctx) {
    function walk(node, prefix, out) {
      if (node.type === "dir") {
        Object.entries(node.children).forEach(([name, child]) => walk(child, prefix ? `${prefix}/${name}` : name, out));
      } else if (node.tags?.includes("malware")) {
        out.push({ path: prefix, threatName: node.threatName, scanned: node.scanned, quarantined: node.quarantined });
      }
    }

    function renderIdle() {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1.25rem;padding:2rem;text-align:center">
          <div style="width:64px;height:64px;border-radius:16px;background:rgba(0,255,191,0.08);border:1px solid rgba(0,255,191,0.2);display:flex;align-items:center;justify-content:center;color:var(--cyan)">
            ${OS.getIcon("scanner")}
          </div>
          <div style="font-size:0.85rem;font-weight:700;color:#fff">System Security Scanner</div>
          <div style="font-size:0.74rem;color:var(--text-muted);max-width:280px">
            Scans every file on the system for malware and other threats.
          </div>
          <button class="app-toolbar-btn" id="scan-btn" style="width:auto;padding:0 1.2rem;height:36px;border-radius:9px">Run Full Scan</button>
        </div>
      `;
      container.querySelector("#scan-btn").addEventListener("click", runScan);
    }

    function runScan() {
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1rem">
          <div style="width:64px;height:64px;border-radius:16px;background:rgba(0,255,191,0.08);border:1px solid rgba(0,255,191,0.2);display:flex;align-items:center;justify-content:center;color:var(--cyan);animation:bootPulse 1s infinite">
            ${OS.getIcon("scanner")}
          </div>
          <div style="font-size:0.8rem;color:var(--text-sub)">Scanning system files…</div>
        </div>
      `;
      setTimeout(() => {
        const threats = [];
        walk(WORLD.fs, "", threats);
        threats.forEach(t => WORLD.scanFile(t.path));
        renderResults(threats);
        ctx.notify("Security Scanner", threats.length ? `${threats.length} threat(s) found.` : "Scan complete - no threats found.");
      }, 1100);
    }

    function renderResults(threats) {
      if (!threats.length) {
        container.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:1rem;text-align:center;padding:2rem">
            <div style="font-size:2rem">✅</div>
            <div style="font-size:0.85rem;font-weight:700;color:#fff">No threats detected</div>
            <button class="app-toolbar-btn" id="scan-again-btn" style="width:auto;padding:0 1rem">Scan Again</button>
          </div>
        `;
        container.querySelector("#scan-again-btn").addEventListener("click", runScan);
        return;
      }
      container.innerHTML = `
        <div style="padding:1.25rem;display:flex;flex-direction:column;gap:0.8rem;height:100%;overflow-y:auto">
          <div style="font-size:0.85rem;font-weight:700;color:var(--error-red)">⚠ ${threats.length} threat(s) found</div>
          ${threats.map(t => `
            <div style="background:rgba(255,51,102,0.06);border:1px solid rgba(255,51,102,0.2);border-radius:9px;padding:0.8rem 0.9rem;display:flex;flex-direction:column;gap:0.4rem">
              <div style="font-size:0.78rem;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace">${OS.esc(t.path)}</div>
              <div style="font-size:0.72rem;color:var(--error-red)">${OS.esc(t.threatName)}</div>
              <button class="app-toolbar-btn scan-quarantine-btn" data-path="${OS.esc(t.path)}" style="width:auto;padding:0 0.8rem;align-self:flex-start;${t.quarantined ? 'color:var(--cyan);border-color:var(--cyan)' : ''}">${t.quarantined ? '✓ Quarantined' : 'Quarantine'}</button>
            </div>
          `).join("")}
          <button class="app-toolbar-btn" id="scan-again-btn" style="width:auto;padding:0 1rem;align-self:center;margin-top:0.5rem">Scan Again</button>
        </div>
      `;
      container.querySelectorAll(".scan-quarantine-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          WORLD.moveToQuarantine(btn.dataset.path);
          ctx.notify("Security Scanner", `${btn.dataset.path.split("/").pop()} quarantined.`);
          const threats2 = []; walk(WORLD.fs, "", threats2);
          renderResults(threats2);
        });
      });
      container.querySelector("#scan-again-btn").addEventListener("click", runScan);
    }

    renderIdle();
  }
});