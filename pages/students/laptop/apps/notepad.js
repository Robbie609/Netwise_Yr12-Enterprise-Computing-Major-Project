/* Notepad — persists to WORLD so notes survive close/reopen within the session. */
OS.registerApp("notepad", {
  label: "Notes",
  icon: "notepad",
  color: "var(--amber)",
  width: 480,
  height: 420,
  singleton: true,
  render(container, ctx) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%">
        <div style="display:flex;gap:0.3rem;padding:0.5rem 0.7rem;border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(255,255,255,0.015)">
          ${["B","I","U"].map(l => `<button class="np-fmt-btn" data-cmd="${l==='B'?'bold':l==='I'?'italic':'underline'}" style="width:26px;height:26px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text-sub);cursor:pointer;font-size:0.74rem;font-weight:${l==='B'?'800':'600'};font-style:${l==='I'?'italic':'normal'};text-decoration:${l==='U'?'underline':'none'}">${l}</button>`).join("")}
          <button id="np-bullet-btn" style="width:26px;height:26px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--text-sub);cursor:pointer">•</button>
        </div>
        <textarea id="notepad-area" placeholder="Start typing notes…" style="flex:1;width:100%;background:#0a0a14;border:none;outline:none;resize:none;color:var(--text-main);font-family:'Inter',sans-serif;font-size:0.86rem;padding:1rem;line-height:1.7"></textarea>
        <div style="padding:0.5rem 0.9rem;font-size:0.65rem;color:var(--text-muted);border-top:1px solid rgba(255,255,255,0.05)" id="np-status">Last saved: just now</div>
      </div>
    `;

    const area = container.querySelector("#notepad-area");
    const status = container.querySelector("#np-status");
    area.value = WORLD.getNotes();

    let saveTimer = null;
    area.addEventListener("input", () => {
      WORLD.setNotes(area.value);
      status.textContent = "Saving…";
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { status.textContent = "Last saved: just now"; }, 500);
    });

    container.querySelectorAll(".np-fmt-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const start = area.selectionStart, end = area.selectionEnd;
        const sel = area.value.slice(start, end);
        if (!sel) return;
        const wrap = { bold: "**", italic: "_", underline: "__" }[btn.dataset.cmd];
        const next = area.value.slice(0, start) + wrap + sel + wrap + area.value.slice(end);
        area.value = next;
        WORLD.setNotes(next);
        area.focus();
      });
    });

    container.querySelector("#np-bullet-btn").addEventListener("click", () => {
      const start = area.selectionStart;
      const lineStart = area.value.lastIndexOf("\n", start - 1) + 1;
      const next = area.value.slice(0, lineStart) + "• " + area.value.slice(lineStart);
      area.value = next;
      WORLD.setNotes(next);
      area.focus();
    });
  }
});