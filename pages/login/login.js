const loginForm = document.getElementById("loginForm");
const userInput = document.getElementById("userInput");
const passInput = document.getElementById("passInput");
const errorMsg = document.getElementById("errorMsg");
const loginCard = document.getElementById("loginCard");
const togglePassword = document.getElementById("togglePassword");

// Show / hide password
togglePassword.addEventListener("click", () => {
    const isHidden = passInput.type === "password";
    passInput.type = isHidden ? "text" : "password";
    togglePassword.classList.toggle("visible", isHidden);
});

// LOGIN SUBMIT
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = userInput.value.trim();
    const password = passInput.value;

    errorMsg.style.display = "none";

    try {
        const res = await fetch("http://127.0.0.1:8765/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error("Invalid login");
        }

        // ROLE ROUTING (NETWISER FIX)
        if (data.role === "student") {
            window.location.href = "../students/student_dashboard.html";
        } 
        else if (data.role === "teacher") {
            window.location.href = "../teacher/teacher_dashboard.html";
        } 
        else {
            throw new Error("Unknown role access denied");
        }

    } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.style.display = "block";

        loginCard.classList.add("error-shake");
        setTimeout(() => loginCard.classList.remove("error-shake"), 400);
    }
});
/* --- NEW INTERACTIVE GRID SYSTEM (BACKGROUND ONLY) --- */
const canvas = document.getElementById('interactiveGrid');
const ctx = canvas.getContext('2d');
let width, height;
let mouse = { x: -1000, y: -1000 };
let targetMouse = { x: -1000, y: -1000 };

const gridSize = 55;
const glowRadius = 200;
const ease = 0.1;

function resize() {
width = canvas.width = window.innerWidth;
height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
targetMouse.x = e.clientX;
targetMouse.y = e.clientY;
});

function animate() {
ctx.clearRect(0, 0, width, height);

// Interpolation for smooth trailing
mouse.x += (targetMouse.x - mouse.x) * ease;
mouse.y += (targetMouse.y - mouse.y) * ease;

// 1. Draw Subtle Static Grid
ctx.beginPath();
ctx.lineWidth = 1;
ctx.strokeStyle = "rgba(0, 242, 255, 0.06)";

for (let x = 0; x <= width; x += gridSize) {
ctx.moveTo(x, 0); ctx.lineTo(x, height);
}
for (let y = 0; y <= height; y += gridSize) {
ctx.moveTo(0, y); ctx.lineTo(width, y);
}
ctx.stroke();

// 2. Draw Reactive Glow (Only affects existing lines)
ctx.globalCompositeOperation = 'source-atop';
const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, glowRadius);
g.addColorStop(0, "rgba(0, 242, 255, 0.9)");
g.addColorStop(0.5, "rgba(0, 85, 255, 0.3)");
g.addColorStop(1, "rgba(0, 0, 0, 0)");
ctx.fillStyle = g;
ctx.fillRect(0, 0, width, height);

// 3. Draw Pulsing Intersections
ctx.globalCompositeOperation = 'source-over';
for (let x = 0; x <= width; x += gridSize) {
for (let y = 0; y <= height; y += gridSize) {
const d = Math.hypot(x - mouse.x, y - mouse.y);
if (d < glowRadius) {
const s = 1 - (d / glowRadius);
ctx.fillStyle = `rgba(0, 242, 255, ${s * 0.5})`;
ctx.fillRect(x - 1, y - 1, 2, 2);
}
}
}

requestAnimationFrame(animate);
}

resize();
animate();