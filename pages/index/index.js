// --- 1. THREE.JS SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ 
canvas: document.querySelector('#webgl-canvas'), 
antialias: true, 
alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- 2. BINARY DATA PARTICLE SYSTEM ---
const createTextTexture = (text) => {
const canvas = document.createElement('canvas');
canvas.width = 64; canvas.height = 64;
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#00f2ff';
ctx.font = 'bold 50px JetBrains Mono';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(text, 32, 32);
return new THREE.CanvasTexture(canvas);
};

const tex0 = createTextTexture('0');
const tex1 = createTextTexture('1');

const particlesGroup = new THREE.Group();
const pCount = 800;
const pData = [];

for(let i=0; i<pCount; i++) {
const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
map: Math.random() > 0.5 ? tex0 : tex1,
transparent: true,
opacity: 0.6,
blending: THREE.AdditiveBlending
}));

// Cylinder formation
const angle = Math.random() * Math.PI * 2;
const radius = 10 + Math.random() * 40;
sprite.position.set(
Math.cos(angle) * radius,
Math.sin(angle) * radius,
(Math.random() - 0.5) * 1500
);
sprite.scale.set(2, 2, 1);
particlesGroup.add(sprite);
pData.push({ speed: 1.5 + Math.random() * 5 });
}
scene.add(particlesGroup);

// --- 3. THE NETWISER CORE (3D OBJECT) ---
// A complex geometric node: Octahedron inside a wireframe sphere
const coreGroup = new THREE.Group();
const core = new THREE.Mesh(
new THREE.OctahedronGeometry(.35, 1),
new THREE.MeshPhongMaterial({ color: 0xff2a2a, emissive: 0xff2a2a, emissiveIntensity: 3, wireframe: true })
);
const coreInner = new THREE.Mesh(
new THREE.OctahedronGeometry(3, 3),
new THREE.MeshPhongMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 6, wireframe: true })
);
const coreOuter = new THREE.Mesh(
new THREE.IcosahedronGeometry(8, 1),
new THREE.MeshBasicMaterial({ color: 0x001a66, wireframe: true, transparent: true, opacity: 0.4 })
);
coreGroup.add(core, coreInner, coreOuter);
coreGroup.position.set(0, 0, -300); // Start deep in portal
scene.add(coreGroup);

const ambient = new THREE.AmbientLight(0xffffff, 0.5);
const point = new THREE.PointLight(0x00f2ff, 2, 100);
scene.add(ambient, point);

// --- 4. ANIMATION & SCROLL LOGIC ---
gsap.registerPlugin(ScrollTrigger);

// Hero Sequence
const heroTimeline = gsap.timeline({
scrollTrigger: {
trigger: "#hero",
start: "top top",
end: "+=400%",
pin: true,
scrub: 1
}
});

// Portal Text sequence
const texts = ['.t1', '.t2', '.t3', '.t4', '.t5'];
texts.forEach((t, i) => {
heroTimeline.to(t, { opacity: 1, y: -20, duration: 1 }, i * 1.5)
.to(t, { opacity: 0, y: -40, duration: 1 }, (i * 1.5) + 1);
});

// Core Emerge
heroTimeline.to(coreGroup.position, { z: 100, duration: 10 }, 8);

// --- 5. CORE OBJECT TRACKING ---
// Intro section: Move Core to the Right
gsap.to(coreGroup.position, {
x: 25,
scrollTrigger: {
trigger: "#intro-trigger",
start: "top bottom",
end: "bottom top",
scrub: 1
}
});

// Features section: Orbiting effect
gsap.to(coreGroup.rotation, {
y: Math.PI * 2,
scrollTrigger: {
trigger: "#features-trigger",
start: "top bottom",
end: "bottom top",
scrub: 1
}
});
gsap.to(coreGroup.position, {
x: -25,
scrollTrigger: {
trigger: "#features-trigger",
start: "top bottom",
end: "bottom top",
scrub: 1
}
});

// Teacher section: Align with Dashboard
gsap.to(coreGroup.position, {
x: 35, y: 10, scale: 1.5,
scrollTrigger: {
trigger: "#teacher-trigger",
start: "top bottom",
end: "bottom top",
scrub: 1
}
});

// Final CTA: Centered and Pulse
gsap.to(coreGroup.position, {
x: 0, y: 15, z: 50,
scrollTrigger: {
trigger: "#cta-trigger",
start: "top bottom",
scrub: 1
}
});

// --- 6. INTERACTIVE CARD HOVER ---
document.querySelectorAll('.feature-card').forEach(card => {
card.addEventListener('mousemove', (e) => {
const rect = card.getBoundingClientRect();
const x = (e.clientX - rect.left) / rect.width - 0.75;
const y = (e.clientY - rect.top) / rect.height - 0.75;
gsap.to(card, {
rotateY: x * 20,
rotateX: -y * 20,
transformPerspective: 1000,
duration: 0.5
});
});
card.addEventListener('mouseleave', () => {
gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5 });
});
});

// --- 7. RENDER LOOP ---
function animate() {
requestAnimationFrame(animate);

// Animate Binary Particles
particlesGroup.children.forEach((p, i) => {
p.position.z += pData[i].speed;
if(p.position.z > 100) p.position.z = -1000;
p.material.opacity = gsap.utils.mapRange(-1000, 100, 0, 0.6, p.position.z);
});

// Core Self-Rotation
coreInner.rotation.x += 0.5;
coreInner.rotation.y += 0.5;
coreOuter.rotation.z -= 0.75;
coreOuter.rotation.x += 0.75;
core.rotation.x += 0.1;
core.rotation.y += 0.1;
core.rotation.z += 0.1;
renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth, window.innerHeight);
});
