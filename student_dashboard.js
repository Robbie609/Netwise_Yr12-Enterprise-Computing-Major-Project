// TARGET DATA SPECIFICATIONS (YEAR 6-8 INTERACTIVE PARAMS)
const MODULE_DATA = [
    {
id: "pass",
title: "Password Power",
desc: "Learn how to build strong, memorable password shields that trick sorting bots and brute force dictionary engines.",
status: "Completed",
progress: 100,
color: "#00ffbf",
stateClass: "completed",
icon: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`
    },
    {
id: "browse",
title: "Safe Browsing",
desc: "Identify malicious tracking cookies, secure protocols, and stay safe while surfing modern web domains.",
status: "In Progress",
progress: 25,
color: "#00f2ff",
stateClass: "current",
icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
    },
    {
id: "scam",
title: "Scam Spotting",
desc: "Train your senses to flag phishing traps, social engineering tricks, and fake validation requests instantly.",
status: "Locked",
progress: 0,
color: "#0055ff",
stateClass: "locked",
icon: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="5"></ellipse><circle cx="12" cy="12" r="4"></circle></svg>`
    },
    {
id: "foot",
title: "Digital Footprint",
desc: "Analyze your online traces and discover how data brokers assemble profiles based on casual sharing.",
status: "Locked",
progress: 0,
color: "#0055ff",
stateClass: "locked",
// link to an svg of a foot and needs to be turned from black to white using css filters
icon: `<img src="https://svgsilh.com/svg/651817.svg" alt="Footprint Icon" style="width: 50%; height: 50%; filter: invert(1) sepia(1) grayscale(1) brightness(200%);">`
    }
];

// LOGIC GATE PROCESSOR
const ACCESS_KEY = "EBHS-2026-ENC";
const btn = document.getElementById('access-btn');
const input = document.getElementById('class-code');
const errorMsg = document.getElementById('error-msg');
const loginBox = document.getElementById('login-box');
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

function processAuth() {
    if (input.value.trim().toUpperCase() === ACCESS_KEY) {
btn.innerText = "Access Granted";
loginBox.classList.add('success-pulse');
setTimeout(() => {
    loginView.classList.add('fade-out');
    setTimeout(() => {
dashboardView.classList.add('active');
initScrollInversion(); // Fire viewport listener engines
    }, 800);
}, 600);
    } else {
input.classList.add('error');
errorMsg.classList.add('show');
setTimeout(() => input.classList.remove('error'), 400);
    }
}
btn.addEventListener('click', processAuth);
input.addEventListener('keypress', (e) => { if(e.key === 'Enter') processAuth(); });

// DYNAMIC RENDERING & DATA UNIFICATION HUB
const treeRoot = document.getElementById('vertical-tree-root');

function compileVerticalTree() {
    let innerHTML = '';
    MODULE_DATA.forEach((node, index) => {
innerHTML += `
    <div class="tree-node-v ${node.stateClass}" data-id="${node.id}" id="node-${node.id}">
<div class="node-orb-v">${node.icon}</div>
<div class="node-info-v">
    <div class="node-title-v">${node.title}</div>
    <div class="node-status-v">${node.status}</div>
</div>
    </div>
`;
if(index < MODULE_DATA.length - 1) {
    const pathActive = node.stateClass === 'completed' && MODULE_DATA[index+1].stateClass !== 'locked';
    innerHTML += `<div class="tree-path-v ${pathActive ? 'active' : ''}"></div>`;
}
    });
    treeRoot.innerHTML = innerHTML;
}

function switchHeroViewport(modId) {
    const data = MODULE_DATA.find(m => m.id === modId);
    const textZone = document.getElementById('hero-text-zone');
    const graphicZone = document.getElementById('hero-graphic-zone');
    
    textZone.classList.add('changing');
    graphicZone.classList.add('changing');
    
    setTimeout(() => {
document.getElementById('hero-card').style.setProperty('--theme-color', data.color);
document.getElementById('hero-card').style.setProperty('--theme-progress', `${data.progress}%`);

document.getElementById('hero-tag').innerText = `${data.status} Module`;
document.getElementById('hero-title').innerText = data.title;
document.getElementById('hero-desc').innerText = data.desc;
document.getElementById('hero-icon-container').innerHTML = data.icon;

const cta = document.getElementById('hero-btn');
if (data.stateClass === 'completed') cta.innerText = "Review Chapter";
else if (data.stateClass === 'current') cta.innerText = "Resume Mission";
else cta.innerText = "Module Locked";

textZone.classList.remove('changing');
graphicZone.classList.remove('changing');
    }, 300);
}

// SCROLL REVEAL (PARALLAX ENGINE)
function initScrollInversion() {
    const nodes = document.querySelectorAll('.tree-node-v');
    const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
    if(entry.isIntersecting) {
entry.target.classList.add('revealed');
    }
});
    }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

    nodes.forEach(n => observer.observe(n));
    // Trigger layout calculations for items currently in window view
    window.dispatchEvent(new Event('scroll'));
}

// INITIALIZATION REGISTRY
compileVerticalTree();
switchHeroViewport('browse'); // Default active window focus context

document.querySelectorAll('.tree-node-v').forEach(el => {
    el.addEventListener('click', () => {
document.querySelectorAll('.tree-node-v').forEach(n => n.classList.remove('current'));
el.classList.add('current');
switchHeroViewport(el.dataset.id);
    });
});

// NAVBAR INTERACTIVE DROPDOWN
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
profileBtn.addEventListener('click', (e) => { e.stopPropagation(); profileDropdown.classList.toggle('active'); });
document.addEventListener('click', () => profileDropdown.classList.remove('active'));

// PARTICLES ENGINE
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let pts = [];
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

for(let i=0; i<100; i++) {
    pts.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, s: Math.random()*1.5, d: Math.random()*0.4+0.1, o: Math.random()*0.4 });
}
function loop() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pts.forEach(p => {
p.y -= p.d; if(p.y < 0) { p.y = canvas.height; p.x = Math.random()*canvas.width; }
ctx.fillStyle = `rgba(0, 242, 255, ${p.o})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(loop);
}
loop();