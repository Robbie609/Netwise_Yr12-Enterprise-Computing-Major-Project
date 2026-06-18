OS.registerApp("settings", {
  label: "Settings",
  icon: "settings",
  color: "var(--text-sub)",
  width: 560,
  height: 460,
  singleton: true,
  render(container, ctx) {
    const p = ctx.profile;
    const state = { twoFA: false, firewall: true, autoUpdate: true };

    function toggle(key, label, desc) {
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:0.7rem 0.9rem">
          <div>
            <div style="font-size:0.8rem;color:#fff;font-weight:600">${label}</div>
            <div style="font-size:0.68rem;color:var(--text-muted);margin-top:0.15rem">${desc}</div>
          </div>
          <button class="settings-toggle" data-key="${key}" style="width:42px;height:24px;border-radius:12px;border:none;cursor:pointer;background:${state[key] ? 'var(--cyan)' : 'rgba(255,255,255,0.1)'};position:relative;flex-shrink:0;transition:background 0.15s">
            <span style="position:absolute;top:3px;left:${state[key] ? '21px' : '3px'};width:18px;height:18px;border-radius:50%;background:#fff;transition:left 0.15s"></span>
          </button>
        </div>
      `;
    }

    function render() {
      container.innerHTML = `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1.5rem;overflow-y:auto;height:100%">
          <div>
            <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-muted);margin-bottom:0.6rem">Account</div>
            <div style="display:flex;flex-direction:column;gap:0.4rem">
              ${[`Name: ${p.first_name} ${p.last_name}`, `Class: ${p.class_code || "-"}`, `Year level: ${p.year_level || "-"}`].map(i => `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:0.6rem 0.85rem;font-size:0.78rem;color:var(--text-sub)">${OS.esc(i)}</div>`).join("")}
            </div>
          </div>
          <div>
            <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-muted);margin-bottom:0.6rem">Privacy &amp; Security</div>
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              ${toggle("twoFA", "Two-Factor Authentication", "Adds a second verification step at login.")}
              ${toggle("firewall", "Firewall", "Blocks unsolicited inbound connections.")}
              ${toggle("autoUpdate", "Auto-Updates", "Keeps security definitions current.")}
            </div>
          </div>
          <div>
            <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-muted);margin-bottom:0.6rem">Display</div>
            <div style="display:flex;flex-direction:column;gap:0.4rem">
              <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:0.6rem 0.85rem;font-size:0.78rem;color:var(--text-sub)">Theme: Dark (default)</div>
            </div>
          </div>
        </div>
      `;
      container.querySelectorAll(".settings-toggle").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          state[key] = !state[key];
          if (key === "twoFA") ctx.notify("Settings", state.twoFA ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
          if (key === "firewall" && !state.firewall) ctx.notify("Security", "Warning: firewall disabled. Your system is more vulnerable.");
          render();
        });
      });
    }

    render();
  }
});