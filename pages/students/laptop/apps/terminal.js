OS.registerApp("terminal", {
  label: "Terminal",
  icon: "terminal",
  color: "var(--cyan)",
  width: 620,
  height: 420,
  singleton: true,
  render(container, ctx) {
    container.style.background = "#020208";
    container.innerHTML = `
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;padding:1rem;height:100%;display:flex;flex-direction:column;color:var(--cyan)">
        <div id="term-log" style="flex:1;overflow-y:auto;white-space:pre-wrap;line-height:1.6"></div>
        <div style="display:flex;align-items:center;gap:0.4rem">
          <span id="term-prompt" style="color:var(--lightblue);flex-shrink:0">netwiser@laptop:~$</span>
          <input id="term-input" style="flex:1;background:transparent;border:none;outline:none;color:var(--cyan);font-family:'JetBrains Mono',monospace;font-size:0.8rem" autocomplete="off" spellcheck="false"/>
        </div>
      </div>
    `;

    const log = container.querySelector("#term-log");
    const input = container.querySelector("#term-input");
    const promptEl = container.querySelector("#term-prompt");

    let cwd = ["Documents"]; // current path segments, relative to root
    const history = [];
    let histIdx = -1;

    function pathStr() { return cwd.length ? cwd.join("/") : ""; }
    function promptStr() { return `netwiser@laptop:~/${pathStr()}$`; }
    function refreshPrompt() { promptEl.textContent = promptStr(); }

    function println(text = "") { log.textContent += text + "\n"; log.scrollTop = log.scrollHeight; }

    function resolveTarget(arg) {
      // returns absolute path-array for a relative or absolute-ish arg
      if (!arg || arg === ".") return [...cwd];
      if (arg === "..") return cwd.slice(0, -1);
      if (arg === "~" || arg === "/") return [];
      const parts = arg.split("/").filter(Boolean);
      let base = arg.startsWith("/") ? [] : [...cwd];
      for (const p of parts) {
        if (p === "..") base.pop();
        else if (p !== ".") base.push(p);
      }
      return base;
    }

    const commands = {
      help: () =>
`Available commands:
  help                Show all commands
  ls                   List directory contents
  cd [dir]            Change directory
  cat [file]           View file contents
  scan [file]          Scan file for threats
  whois [domain]       Lookup domain information
  ping [host]          Ping a host
  quarantine [file]    Move a flagged file to Quarantine
  pwd                  Print working directory
  clear                Clear terminal`,

      pwd: () => "~/" + pathStr(),

      ls: (args) => {
        const target = args[0] ? resolveTarget(args[0]) : cwd;
        const items = WORLD.listDir(target.join("/"));
        if (items === null) return `ls: cannot access '${args[0]}': No such directory`;
        if (!items.length) return "(empty)";
        return items.map(it => it.type === "dir" ? `${it.name}/` : it.name).join("   ");
      },

      cd: (args) => {
        if (!args[0]) { cwd = []; refreshPrompt(); return null; }
        const target = resolveTarget(args[0]);
        const dir = WORLD.getDir(target.join("/"));
        if (!dir) return `cd: ${args[0]}: No such directory`;
        cwd = target;
        refreshPrompt();
        return null;
      },

      cat: (args) => {
        if (!args[0]) return "cat: missing file operand";
        const target = resolveTarget(args[0]);
        const file = WORLD.getFile(target.join("/"));
        if (!file) return `cat: ${args[0]}: No such file`;
        if (file.kind === "exe") return `cat: ${args[0]}: cannot display binary file (use 'scan' instead)`;
        return file.content;
      },

      scan: (args) => {
        if (!args[0]) return "scan: missing file operand. Usage: scan [file]";
        const target = resolveTarget(args[0]);
        const result = WORLD.scanFile(target.join("/"));
        if (!result.ok) return result.message;
        WORLD.record(`scanned ${target.join("/")}`);
        return result.message;
      },

      quarantine: (args) => {
        if (!args[0]) return "quarantine: missing file operand";
        const target = resolveTarget(args[0]);
        const ok = WORLD.moveToQuarantine(target.join("/"));
        if (!ok) return `quarantine: ${args[0]}: No such file`;
        ctx.notify("Security", `${args[0]} moved to Quarantine.`);
        return `Moved '${args[0]}' to Quarantine.`;
      },

      whois: (args) => {
        if (!args[0]) return "whois: missing domain. Usage: whois [domain]";
        return WORLD.whois(args[0]);
      },

      ping: (args) => {
        if (!args[0]) return "ping: missing host. Usage: ping [host]";
        return WORLD.ping(args[0]);
      },

      clear: () => { log.textContent = ""; return null; },

      whoami: () => `${ctx.profile.first_name} ${ctx.profile.last_name} (student)`,
    };

    function exec(raw) {
      const parts = raw.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      const cmd = (parts[0] || "").toLowerCase();
      const args = parts.slice(1).map(a => a.replace(/^"|"$/g, ""));
      if (!cmd) return null;
      const handler = commands[cmd];
      if (!handler) return `command not found: ${cmd} (type 'help' for a list)`;
      return handler(args);
    }

    println("NetwiserOS Terminal v2.0");
    println("Type 'help' for available commands. Try: ls, cat passwords.txt, scan malware-sample.exe, whois netwiser-secure-login.verify-account.cc\n");

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const raw = input.value.trim();
        input.value = "";
        if (!raw) return;
        history.push(raw); histIdx = history.length;
        println(`${promptStr()} ${raw}`);
        const result = exec(raw);
        if (result !== null && result !== undefined) println(result + "\n");
      } else if (e.key === "ArrowUp") {
        if (histIdx > 0) { histIdx--; input.value = history[histIdx]; }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (histIdx < history.length - 1) { histIdx++; input.value = history[histIdx]; }
        else { histIdx = history.length; input.value = ""; }
        e.preventDefault();
      }
    });

    container.addEventListener("click", () => input.focus());
    setTimeout(() => input.focus(), 50);
  }
});