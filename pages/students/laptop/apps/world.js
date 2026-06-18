const WORLD = (() => {

  const fs = {
    name: "This PC",
    type: "dir",
    children: {
      "Documents": {
        type: "dir",
        children: {
          "Reports": { type: "dir", children: {} },
          "Notes": { type: "dir", children: {} },
          "Evidence": { type: "dir", children: {} },
          "Downloads": { type: "dir", children: {} },
          "passwords.txt": {
            type: "file", kind: "text",
            content:
`# personal vault - DO NOT SHARE
school_portal: Spr1ng2024!
email: correct-horse-battery-staple
router_admin: admin123
note: I really need to stop reusing "admin123" everywhere.`,
            tags: ["sensitive"], scanned: false,
          },
          "log-analysis.csv": {
            type: "file", kind: "csv",
            content:
`timestamp,source_ip,dest_ip,port,action
2024-05-21 02:14:03,203.0.113.55,10.0.0.12,3389,BLOCKED
2024-05-21 02:14:09,203.0.113.55,10.0.0.12,3389,BLOCKED
2024-05-21 02:14:15,203.0.113.55,10.0.0.12,22,BLOCKED
2024-05-21 09:01:22,10.0.0.8,142.250.72.46,443,ALLOWED
2024-05-21 10:30:55,10.0.0.12,185.220.101.13,4444,ALLOWED
2024-05-21 10:31:02,10.0.0.12,185.220.101.13,4444,ALLOWED
2024-05-21 10:45:10,10.0.0.4,151.101.1.69,443,ALLOWED`,
            tags: ["sensitive"], scanned: false,
          },
          "phishing-email.eml": {
            type: "file", kind: "eml",
            content:
`From: it-support@netwiser-secure.com
To: student@netwiser.local
Subject: Action required: verify your account

Dear user,
We detected unusual activity. Click the secure link below within 24 hours
or your account will be suspended:

http://netwiser-secure-login.verify-account.cc/reset

Netwiser IT Support`,
            tags: ["phishing"], scanned: false,
          },
          "malware-sample.exe": {
            type: "file", kind: "exe",
            content: "[binary executable - 412 KB]",
            tags: ["malware"], scanned: false,
            threatName: "Trojan.GenKryptor.882",
          },
        },
      },
      "Desktop": { type: "dir", children: {} },
      "Downloads": {
        type: "dir",
        children: {
          "invoice_4471.pdf.exe": {
            type: "file", kind: "exe",
            content: "[binary executable - 88 KB, disguised as PDF]",
            tags: ["malware"], scanned: false,
            threatName: "Worm.Disguise.PDFSpoof",
          },
        },
      },
      "Quarantine": { type: "dir", children: {} },
      "Network": { type: "dir", children: {} },
    },
  };

  function resolvePath(path) {
    const parts = path.split("/").filter(Boolean);
    let node = fs;
    const trail = [];
    for (const p of parts) {
      if (node.type !== "dir" || !node.children[p]) return null;
      node = node.children[p];
      trail.push(p);
    }
    return { node, trail };
  }

  function getDir(path) {
    const r = resolvePath(path);
    if (!r || r.node.type !== "dir") return null;
    return r.node;
  }

  function listDir(path) {
    const dir = getDir(path);
    if (!dir) return null;
    return Object.entries(dir.children).map(([name, n]) => ({ name, ...n }));
  }

  function getFile(path) {
    const r = resolvePath(path);
    if (!r || r.node.type !== "file") return null;
    return r.node;
  }

  function moveToQuarantine(path) {
    const parts = path.split("/").filter(Boolean);
    const name = parts.pop();
    const parentDir = getDir(parts.join("/"));
    if (!parentDir || !parentDir.children[name]) return false;
    const file = parentDir.children[name];
    delete parentDir.children[name];
    fs.children["Quarantine"].children[name] = file;
    file.quarantined = true;
    return true;
  }

  function deleteFile(path) {
    const parts = path.split("/").filter(Boolean);
    const name = parts.pop();
    const parentDir = getDir(parts.join("/"));
    if (!parentDir || !parentDir.children[name]) return false;
    delete parentDir.children[name];
    return true;
  }

  /* 
     SCAN ENGINE - used by Terminal `scan`, Files "Scan", and Scanner app
*/
  function scanFile(path) {
    const file = getFile(path);
    if (!file) return { ok: false, message: `No such file: ${path}` };
    file.scanned = true;
    if (file.tags?.includes("malware")) {
      return {
        ok: true, threat: true,
        message: `THREAT DETECTED: ${file.threatName || "Unknown.Malware"}\nFile: ${path}\nRecommendation: Quarantine immediately.`,
      };
    }
    if (file.tags?.includes("phishing")) {
      return {
        ok: true, threat: true,
        message: `SUSPICIOUS CONTENT: phishing indicators found in ${path}\nMismatched sender domain, urgency language, and a suspicious link were detected.`,
      };
    }
    if (file.tags?.includes("sensitive")) {
      return {
        ok: true, threat: false,
        message: `Scan complete: ${path}\nNo malware signatures found, but this file contains sensitive data (credentials/logs). Consider encrypting or deleting it.`,
      };
    }
    return { ok: true, threat: false, message: `Scan complete: ${path}\nNo threats found.` };
  }

  /* 
     WHOIS / DOMAIN INTEL - used by Terminal `whois` and `ping`
      */
  const domainIntel = {
    "netwiser.local": { registrar: "Netwiser Internal Registry", created: "2019-01-01", reputation: "trusted", ip: "10.0.0.1" },
    "netwiser-secure-login.verify-account.cc": { registrar: "NameForge Anonymous Reg.", created: "2024-05-19", reputation: "malicious", ip: "185.220.101.13", notes: "Registered 2 days before phishing email was sent. Hosted in a known bulletproof-hosting range. .cc TLD often abused for phishing." },
    "schoolnews.netwiser.edu": { registrar: "Netwiser Internal Registry", created: "2020-03-11", reputation: "trusted", ip: "10.0.0.4" },
    "totally-not-a-scam.biz": { registrar: "NameForge Anonymous Reg.", created: "2024-06-01", reputation: "malicious", ip: "203.0.113.55", notes: "No SSL certificate, recently registered, flagged by 14 blocklists." },
    "googlle.com": { registrar: "PrivacyShield Registrars", created: "2024-04-02", reputation: "malicious", ip: "203.0.113.91", notes: "Typosquat of google.com. Designed to capture credentials." },
  };

  function whois(domain) {
    domain = domain.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    const info = domainIntel[domain];
    if (!info) {
      return `No record found for ${domain}.\nThis domain is not in the Netwiser threat-intel database - treat unknown domains with caution.`;
    }
    let out = `Domain: ${domain}\nRegistrar: ${info.registrar}\nCreated: ${info.created}\nIP: ${info.ip}\nReputation: ${info.reputation.toUpperCase()}`;
    if (info.notes) out += `\nNotes: ${info.notes}`;
    return out;
  }

  function ping(host) {
    const domain = host.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
    const info = domainIntel[domain];
    const ip = info?.ip || "0.0.0.0";
    if (!info) {
      return `Pinging ${host} [${ip}] with 32 bytes of data:\nRequest timed out.\nRequest timed out.\n(Unknown host - not resolvable in the sandbox network.)`;
    }
    const lines = [1,2,3,4].map(i => `Reply from ${ip}: bytes=32 time=${(8+i*3)}ms TTL=57`);
    return `Pinging ${host} [${ip}] with 32 bytes of data:\n${lines.join("\n")}\n\nPing statistics for ${ip}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`;
  }

  /* 
     BROWSER SITES - simple key:URL -> rendered page model
      */
  const sites = {
    "netwiser.local/home": {
      title: "Netwiser Home", secure: true,
      render: () => null /* handled specially as the real homepage in browser.js */,
    },
    "netwiser-secure-login.verify-account.cc/reset": {
      title: "Account Verification Required", secure: false,
      body: `
        <div style="max-width:420px;margin:2rem auto;background:#fff;color:#111;border-radius:10px;padding:2rem;font-family:Arial,sans-serif">
          <div style="font-weight:800;font-size:1.1rem;color:#1a3c8c;margin-bottom:1rem">Netwiser<span style="color:#e63946">Secure</span></div>
          <div style="font-weight:700;margin-bottom:0.5rem">⚠ Your account will be suspended</div>
          <p style="font-size:0.85rem;line-height:1.5;color:#333">We detected unusual login activity. Enter your school portal username and password below to verify your identity immediately.</p>
          <input placeholder="Username" style="width:100%;margin-top:1rem;padding:0.6rem;border:1px solid #ccc;border-radius:5px"/>
          <input placeholder="Password" type="password" style="width:100%;margin-top:0.6rem;padding:0.6rem;border:1px solid #ccc;border-radius:5px"/>
          <button style="width:100%;margin-top:1rem;padding:0.7rem;background:#e63946;color:#fff;border:none;border-radius:5px;font-weight:700;cursor:pointer">Verify Now</button>
          <p style="font-size:0.68rem;color:#999;margin-top:1rem">This page is a simulated phishing site for training purposes - no real data is collected.</p>
        </div>`,
    },
    "totally-not-a-scam.biz": {
      title: "FREE GIFT CARD CLAIM", secure: false,
      body: `
        <div style="max-width:460px;margin:2rem auto;background:#111;color:#0f0;border-radius:10px;padding:2rem;font-family:'Comic Sans MS',sans-serif;text-align:center;border:3px dashed #0f0">
          <div style="font-size:1.4rem;font-weight:900">🎉 YOU WON A $500 GIFT CARD! 🎉</div>
          <p style="margin-top:1rem;font-size:0.9rem">Congratulations visitor #999,999! Click below before your prize expires in 0:59!</p>
          <button style="margin-top:1rem;padding:0.8rem 1.4rem;background:#0f0;color:#000;border:none;border-radius:6px;font-weight:800;cursor:pointer">CLAIM NOW</button>
          <p style="font-size:0.65rem;color:#888;margin-top:1.5rem">Simulated scam page - for training purposes only.</p>
        </div>`,
    },
    "googlle.com": {
      title: "Googlle Search", secure: false,
      body: `
        <div style="max-width:500px;margin:3rem auto;text-align:center;font-family:Arial,sans-serif">
          <div style="font-size:2.2rem;font-weight:700;color:#4285F4">G<span style="color:#EA4335">o</span><span style="color:#FBBC05">o</span><span style="color:#4285F4">g</span><span style="color:#34A853">l</span><span style="color:#EA4335">l</span><span style="color:#4285F4">e</span></div>
          <input style="width:80%;margin-top:1.5rem;padding:0.7rem 1rem;border-radius:24px;border:1px solid #ccc"/>
          <p style="font-size:0.65rem;color:#999;margin-top:2rem">Note the misspelled domain (googlle.com) and missing security certificate - a classic typosquat.</p>
        </div>`,
    },
    "schoolnews.netwiser.edu": {
      title: "Netwiser School News", secure: true,
      body: `
        <div style="max-width:560px;margin:2rem auto;font-family:Arial,sans-serif">
          <h2 style="margin-bottom:1rem">This Week's Announcements</h2>
          <p style="font-size:0.85rem;line-height:1.6;color:#ccc">Cybersecurity Awareness Week kicks off Monday. Remember: legitimate IT staff will never ask for your password by email. Report suspicious messages using the "Report Phishing" button in Mail.</p>
        </div>`,
    },
  };

  function getSite(url) {
    url = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return sites[url] || null;
  }

  /* 
     MAILBOX - shared, mutable inbox
      */
  const mailbox = [
    {
      id: "m1",
      from: "it-support@netwiser-secure.com",
      fromDomain: "netwiser-secure.com",
      subject: "Action required: verify your account",
      date: "10:24 AM",
      body: `Dear user,\n\nWe detected unusual activity on your account. Click the secure link below within 24 hours or your account will be suspended:\n\nhttp://netwiser-secure-login.verify-account.cc/reset\n\nNetwiser IT Support`,
      isPhishing: true,
      reported: false,
      markedSafe: false,
      read: false,
      link: "netwiser-secure-login.verify-account.cc/reset",
    },
    {
      id: "m2",
      from: "rowan.robin@class.netwiser.edu",
      fromDomain: "class.netwiser.edu",
      subject: "Group project notes",
      date: "9:02 AM",
      body: `Hey! Attaching my half of the slides for tomorrow. Let me know if the intro section needs trimming.\n\n- Rowan`,
      isPhishing: false,
      reported: false,
      markedSafe: false,
      read: false,
    },
    {
      id: "m3",
      from: "no-reply@schoolnews.netwiser.edu",
      fromDomain: "schoolnews.netwiser.edu",
      subject: "This week's announcements",
      date: "Yesterday",
      body: `This week: Cybersecurity Awareness Week kicks off Monday.\n\nVisit schoolnews.netwiser.edu for the full newsletter.`,
      isPhishing: false,
      reported: false,
      markedSafe: false,
      read: true,
      link: "schoolnews.netwiser.edu",
    },
    {
      id: "m4",
      from: "prizes@totally-not-a-scam.biz",
      fromDomain: "totally-not-a-scam.biz",
      subject: "🎉 YOU'VE WON A $500 GIFT CARD!!! 🎉",
      date: "Yesterday",
      body: `CONGRATULATIONS!!! You have been randomly selected to receive a $500 gift card. Click here immediately to claim before it expires:\n\nhttp://totally-not-a-scam.biz\n\nDon't miss out!`,
      isPhishing: true,
      reported: false,
      markedSafe: false,
      read: false,
      link: "totally-not-a-scam.biz",
    },
  ];

  /* 
     NOTES - persisted across notepad open/close within the session
      */
  let notesContent = `Cybersecurity Notes
You have new mail! 
• Spot the Panic
• Check the Sender
• Guard Your Secrets
• Think before you click`;

  function getNotes() { return notesContent; }
  function setNotes(text) { notesContent = text; }

  /* 
     SIMPLE SCORE / EVENT LOG - lets apps react to player actions
      */
  const log = [];
  function record(event) { log.push({ event, time: new Date() }); }

  return {
    fs, listDir, getFile, getDir, resolvePath, moveToQuarantine, deleteFile,
    scanFile, whois, ping, getSite, mailbox, getNotes, setNotes, record, log,
  };
})();