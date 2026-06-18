/* Browser — address-bar navigation across WORLD's sandboxed sites, plus a real homepage. */
OS.registerApp("browser", {
  label: "SecureWeb Browser",
  icon: "browser",
  color: "var(--lightblue)",
  width: 760,
  height: 520,
  singleton: true,
  render(container, ctx) {
    const history = ["netwiser.local/home"];
    let histPos = 0;

    container.innerHTML = `
      <div class="app-toolbar">
        <button class="app-toolbar-btn" id="bw-back" title="Back">←</button>
        <button class="app-toolbar-btn" id="bw-forward" title="Forward">→</button>
        <button class="app-toolbar-btn" id="bw-refresh" title="Reload">⟳</button>
        <div style="flex:1;display:flex;align-items:center;gap:0.4rem">
          <span id="bw-lock" style="flex-shrink:0">🔒</span>
          <input id="bw-address" class="app-address-bar secure" style="border:1px solid rgba(255,255,255,0.06);width:100%" value="netwiser.local/home"/>
        </div>
      </div>
      <div style="overflow:auto;height:calc(100% - 49px)" id="bw-page"></div>
    `;

    const addressInput = container.querySelector("#bw-address");
    const lockEl = container.querySelector("#bw-lock");
    const pageEl = container.querySelector("#bw-page");

    function homepage() {
      const tiles = [
        { icon: "📖", label: "Lessons" },
        { icon: "🎯", label: "Challenges" },
        { icon: "🧪", label: "Labs" },
        { icon: "🛡️", label: "Threat Intel" },
        { icon: "👥", label: "Community" },
      ];
      return `
        <div style="padding:3rem 2rem;text-align:center">
          <h1 style="font-size:1.8rem;font-weight:800;margin-bottom:0.4rem">Welcome to Netwiser</h1>
          <p style="color:var(--text-sub);font-size:0.95rem;margin-bottom:1.5rem">Learn. Practice. Protect.</p>
          <div style="max-width:480px;margin:0 auto 2rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:0.7rem 1rem;display:flex;align-items:center;gap:0.5rem;color:var(--text-muted);font-size:0.82rem">
            🔍 <span>Search or type a URL</span>
          </div>
          <div style="display:flex;gap:0.8rem;justify-content:center;flex-wrap:wrap;max-width:560px;margin:0 auto">
            ${tiles.map(t => `
              <div class="bw-tile" style="width:96px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:0.9rem 0.5rem;cursor:pointer;transition:all 0.15s">
                <div style="font-size:1.4rem">${t.icon}</div>
                <div style="font-size:0.72rem;margin-top:0.4rem;color:var(--text-sub);font-weight:600">${t.label}</div>
              </div>
            `).join("")}
          </div>
          <p style="font-size:0.68rem;color:var(--text-muted);margin-top:2rem">Tip: try visiting a link from an email in Mail, or a domain you looked up with <code>whois</code> in Terminal.</p>
        </div>
      `;
    }

    function notFoundPage(url) {
      return `
        <div class="app-empty-state">
          🌐<br/>This site can't be reached.<br/>
          <span style="font-size:0.7rem">"${OS.esc(url)}" is not resolvable in the NetwiserOS sandbox.</span>
        </div>
      `;
    }

    function renderUrl(url, pushHistory = true) {
      const clean = url.replace(/^https?:\/\//, "");
      addressInput.value = clean;

      if (clean === "netwiser.local/home" || clean === "netwiser.local") {
        pageEl.innerHTML = homepage();
        lockEl.textContent = "🔒";
        addressInput.className = "app-address-bar secure";
        bindHomepageTiles();
      } else {
        const site = WORLD.getSite(clean);
        if (!site) {
          pageEl.innerHTML = notFoundPage(clean);
          lockEl.textContent = "🔒";
          addressInput.className = "app-address-bar secure";
        } else {
          pageEl.innerHTML = `<div style="padding:1.5rem">${site.body}</div>`;
          lockEl.textContent = site.secure ? "🔒" : "⚠️";
          addressInput.className = "app-address-bar " + (site.secure ? "secure" : "insecure");
          WORLD.record(`visited ${clean}`);
          if (!site.secure) ctx.notify("SecureWeb Browser", `Warning: ${clean} is not secure.`);
        }
      }

      if (pushHistory) {
        history.splice(histPos + 1);
        history.push(clean);
        histPos = history.length - 1;
      }
    }

    function bindHomepageTiles() {
      pageEl.querySelectorAll(".bw-tile").forEach(t => {
        t.addEventListener("mouseenter", () => t.style.background = "rgba(255,255,255,0.07)");
        t.addEventListener("mouseleave", () => t.style.background = "rgba(255,255,255,0.03)");
        t.addEventListener("click", () => ctx.notify("Netwiser", "This section lives outside the laptop simulator — head back to the dashboard to explore it."));
      });
    }

    addressInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") renderUrl(addressInput.value.trim());
    });
    container.querySelector("#bw-back").addEventListener("click", () => {
      if (histPos > 0) { histPos--; renderUrl(history[histPos], false); }
    });
    container.querySelector("#bw-forward").addEventListener("click", () => {
      if (histPos < history.length - 1) { histPos++; renderUrl(history[histPos], false); }
    });
    container.querySelector("#bw-refresh").addEventListener("click", () => renderUrl(history[histPos], false));

    // Allow other apps (Mail) to ask the browser to navigate somewhere
    ctx.openApp.navigateBrowserTo = (url) => renderUrl(url);
    window.__netwiserNavigate = (url) => {
      ctx.openApp("browser");
      setTimeout(() => renderUrl(url), 60);
    };

    renderUrl("netwiser.local/home", false);
  }
});