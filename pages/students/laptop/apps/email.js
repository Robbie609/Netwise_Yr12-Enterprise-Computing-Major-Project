/* Email Client - phishing-detection inbox wired to WORLD.mailbox. */
OS.registerApp("email", {
  label: "Mail",
  icon: "email",
  color: "var(--purple)",
  width: 760,
  height: 520,
  singleton: true,
  render(container, ctx) {
    let selectedId = null;

    container.innerHTML = `
      <div style="display:flex;height:100%">
        <div style="width:280px;border-right:1px solid rgba(255,255,255,0.05);overflow-y:auto" id="email-list"></div>
        <div style="flex:1;padding:1.5rem;overflow:auto" id="email-body">
          <div class="app-empty-state">✉️<br/>Select an email to read it.</div>
        </div>
      </div>
    `;

    const listEl = container.querySelector("#email-list");
    const bodyEl = container.querySelector("#email-body");

    function renderList() {
      listEl.innerHTML = WORLD.mailbox.map(m => `
        <div class="email-row" data-id="${m.id}" style="padding:0.85rem 1rem;border-bottom:1px solid rgba(255,255,255,0.04);cursor:pointer;${selectedId === m.id ? 'background:rgba(255,255,255,0.05)' : ''}${!m.read ? ';border-left:2px solid var(--lightblue)' : ''}">
          <div style="display:flex;justify-content:space-between;gap:0.5rem">
            <div style="font-size:0.74rem;font-weight:${m.read ? '600' : '800'};color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">${OS.esc(m.from)}</div>
            ${m.reported ? '<span style="font-size:0.6rem;color:var(--cyan)">reported</span>' : ''}
            ${m.markedSafe ? '<span style="font-size:0.6rem;color:var(--text-muted)">safe</span>' : ''}
          </div>
          <div style="font-size:0.72rem;color:var(--text-sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:0.15rem">${OS.esc(m.subject)}</div>
          <div style="font-size:0.62rem;color:var(--text-muted);margin-top:0.2rem">${OS.esc(m.date)}</div>
        </div>
      `).join("");

      listEl.querySelectorAll(".email-row").forEach(row => {
        row.addEventListener("click", () => openMail(row.dataset.id));
      });
    }

    function openMail(id) {
      selectedId = id;
      const m = WORLD.mailbox.find(x => x.id === id);
      m.read = true;
      renderList();

      const linkHtml = m.link ? `<div style="margin-top:0.5rem"><a href="#" class="email-link" data-url="${OS.esc(m.link)}" style="color:var(--lightblue);font-family:'JetBrains Mono',monospace;font-size:0.78rem;text-decoration:underline;cursor:pointer">${OS.esc(m.link)}</a></div>` : "";

      bodyEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:1rem;height:100%">
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:#fff">${OS.esc(m.subject)}</div>
            <div style="font-size:0.74rem;color:var(--text-muted);margin-top:0.3rem">From: <span style="font-family:'JetBrains Mono',monospace">${OS.esc(m.from)}</span></div>
          </div>
          <pre style="flex:1;white-space:pre-wrap;font-family:'Inter',sans-serif;font-size:0.84rem;color:var(--text-sub);line-height:1.6;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:9px;padding:1rem">${OS.esc(m.body)}</pre>
          ${linkHtml}
          <div style="display:flex;gap:0.5rem">
            <button class="app-toolbar-btn email-report-btn" style="width:auto;padding:0 1rem;${m.reported ? 'color:var(--cyan);border-color:var(--cyan)' : ''}">${m.reported ? '✓ Reported' : 'Report Phishing'}</button>
            <button class="app-toolbar-btn email-safe-btn" style="width:auto;padding:0 1rem;${m.markedSafe ? 'color:var(--lightblue);border-color:var(--lightblue)' : ''}">${m.markedSafe ? '✓ Marked Safe' : 'Mark Safe'}</button>
          </div>
          <div id="email-feedback" style="font-size:0.74rem;"></div>
        </div>
      `;

      const feedbackEl = bodyEl.querySelector("#email-feedback");

      bodyEl.querySelector(".email-link")?.addEventListener("click", (e) => {
        e.preventDefault();
        const url = e.target.dataset.url;
        if (window.__netwiserNavigate) window.__netwiserNavigate(url);
        ctx.notify("Mail", `Opening link in SecureWeb Browser…`);
      });

      bodyEl.querySelector(".email-report-btn").addEventListener("click", () => {
        m.reported = true;
        if (m.isPhishing) {
          feedbackEl.innerHTML = `<span style="color:var(--cyan)">✓ Correct - this was a phishing attempt. Reporting it helps protect others.</span>`;
          ctx.notify("Mail", "Phishing reported correctly.");
        } else {
          feedbackEl.innerHTML = `<span style="color:var(--amber)">This email was actually legitimate. Reporting safe mail as phishing can cause real messages to be missed - double check sender domains and urgency cues first.</span>`;
          ctx.notify("Mail", "That email looks legitimate - reported in error.");
        }
        openMail(id);
      });

      bodyEl.querySelector(".email-safe-btn").addEventListener("click", () => {
        m.markedSafe = true;
        if (!m.isPhishing) {
          feedbackEl.innerHTML = `<span style="color:var(--cyan)">✓ Correct - this email is legitimate.</span>`;
          ctx.notify("Mail", "Marked safe correctly.");
        } else {
          feedbackEl.innerHTML = `<span style="color:var(--error-red)">⚠ This is actually a phishing email. Look for mismatched sender domains, urgency language, and suspicious links before trusting a message.</span>`;
          ctx.notify("Mail", "Careful - that email was phishing.");
        }
        openMail(id);
      });
    }

    renderList();
  }
});