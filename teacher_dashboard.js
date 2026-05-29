 // Profile Dropdown Toggle
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            if (profileDropdown.classList.contains('show')) {
                profileDropdown.classList.remove('show');
            }
        });

        // Exact Data Models
        const students = [
            { name: "Rowan Robin", engage: 99, status: "top", risk: false },
            { name: "Tarik Bansal", engage: 95, status: "high", risk: false },
            { name: "Garv Kumar", engage: 94, status: "high", risk: false },
            { name: "Parth Gupta", engage: 92, status: "high", risk: false },
            { name: "Leo Shen", engage: 91, status: "high", risk: false },
            { name: "Tony Xia", engage: 88, status: "mid", risk: false },
            { name: "Yazan Al Hatu", engage: 85, status: "mid", risk: false },
            { name: "Jared Yu", engage: 82, status: "mid", risk: false },
            { name: "Siddhant Rajkarne", engage: 80, status: "mid", risk: false },
            { name: "Neel Venkat", engage: 78, status: "mid", risk: false },
            { name: "Jerrard Hakim", engage: 75, status: "mid", risk: false },
            { name: "Rigved Gambhir", engage: 65, status: "low", risk: true },
            { name: "Sai Karthik Ravi", engage: 62, status: "low", risk: true },
            { name: "Rithwick Baye", engage: 58, status: "low", risk: true }
        ];

        const modules = [
            {
                id: "pass",
                title: "Password Power",
                desc: "Learn how to build strong, memorable password shields that trick sorting bots and brute force dictionary engines.",
                status: "Completed",
                progress: 100,
                color: "#00ffbf",
                stateClass: "completed",
                icon: `<svg viewBox="0 0 24 24"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4V7zm2 6a1.5 1.5 0 0 1 1.5 1.5c0 .6-.35 1.1-.86 1.34V17h-1.28v-1.16A1.5 1.5 0 0 1 12 13z"/></svg>`
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
                icon: `<img src="https://svgsilh.com/svg/651817.svg" alt="Footprint Icon" style="width: 50%; height: 50%; filter: invert(1) sepia(1) grayscale(1) brightness(200%);">`
            }
        ];

        // Render Fixed Module Cards
        const modGrid = document.getElementById('modulesGrid');
        modules.forEach(m => {
            modGrid.innerHTML += `
                <div class="module-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div class="module-icon" style="color: ${m.color}">
                            ${m.icon}
                        </div>
                        <span class="module-meta">${m.status}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <div class="module-title">${m.title}</div>
                        <div class="module-desc">${m.desc}</div>
                        <div style="margin-top: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px; color: var(--text-secondary)">
                                <span>Progress</span>
                                <span style="font-family: 'JetBrains Mono', monospace">${m.progress}%</span>
                            </div>
                            <div class="sc-progress-track">
                                <div class="sc-progress-fill" style="width: ${m.progress}%; background: ${m.color}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Render Student Grid
        const stGrid = document.getElementById('studentGrid');
        students.forEach(st => {
            // place will show who is #1 and #2 and so on
            const place = st.status === 'top' ? '1' : st.engage >= 95 ? '2' : st.engage >= 94 ? '3' : st.engage >= 92 ? '4' : st.engage >= 91 ? '5' : st.engage >= 88 ? '6' : st.engage >= 85 ? '7' : st.engage >= 82 ? '8' : st.engage >= 80 ? '9' : st.engage >= 78 ? '10' : st.engage >= 75 ? '11' : st.engage >= 65 ? '12' : st.engage >= 62 ? '13' : st.engage >= 58 ? '14' : '';
            let cardClass = 'student-card';
            if(st.status === 'top') cardClass += ' top-performer';
            if(st.risk) cardClass += ' at-risk';

            stGrid.innerHTML += `
                <div class="${cardClass}">
                    <div class="sc-header">
                        <div class="sc-identity">
                            <div class="sc-avatar">${place}</div>
                            <div class="sc-name">${st.name} ${st.status === 'top' ? '👑' : ''}</div>
                        </div>
                        <div class="sc-metric">${st.engage}%</div>
                    </div>
                    <div class="sc-progress-track">
                        <div class="sc-progress-fill" style="width: ${st.engage}%"></div>
                    </div>
                </div>
            `;
        });

        // Cyber Threat Radar Visualization Panel
        const radarCanvas = document.getElementById('radarCanvas');
        const rCtx = radarCanvas.getContext('2d');
        let sweepAngle = 0;
        
        const blips = [
            { r: 45, angle: 1.2, color: '#10B981', size: 4, label: "SYS_OK" }, // Green
            { r: 75, angle: 3.8, color: '#f5a623', size: 5, label: "ATTACK_VECT" }, // Yellow
            { r: 90, angle: 5.5, color: '#ff4757', size: 5, label: "BREACH_SUSP" }  // Red
        ];

        function drawRadar() {
            const cx = radarCanvas.width / 2;
            const cy = radarCanvas.height / 2;
            const maxRadius = 100;

            rCtx.clearRect(0, 0, radarCanvas.width, radarCanvas.height);

            // Subtle pulsing base system integrity aura
            const pulseFactor = Math.sin(Date.now() * 0.0025) * 4;
            
            // Outer Concentric Rings
            rCtx.shadowBlur = 0;
            for(let r = 25; r <= maxRadius; r += 25) {
                rCtx.beginPath();
                rCtx.arc(cx, cy, r + (r === maxRadius ? pulseFactor * 0.3 : 0), 0, Math.PI * 2);
                rCtx.strokeStyle = `rgba(0, 242, 255, ${0.05 + (r / 500)})`;
                rCtx.lineWidth = 1;
                rCtx.stroke();
            }

            // Crosshairs axes
            rCtx.beginPath();
            rCtx.moveTo(cx - maxRadius, cy); rCtx.lineTo(cx + maxRadius, cy);
            rCtx.moveTo(cx, cy - maxRadius); rCtx.lineTo(cx, cy + maxRadius);
            rCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            rCtx.stroke();

            // Draw Threat Blips
            blips.forEach(blip => {
                const bx = cx + blip.r * Math.cos(blip.angle);
                const by = cy + blip.r * Math.sin(blip.angle);

                // Calculate proximity to sweep line for fade trace effect
                let angleDiff = sweepAngle - blip.angle;
                while (angleDiff < 0) angleDiff += Math.PI * 2;
                angleDiff = angleDiff % (Math.PI * 2);

                let alpha = 0.15;
                if (angleDiff < 1.5) {
                    alpha = 1.0 - (angleDiff / 1.5);
                }

                rCtx.beginPath();
                rCtx.arc(bx, by, blip.size, 0, Math.PI * 2);
                rCtx.fillStyle = blip.color;
                rCtx.shadowBlur = 12;
                rCtx.shadowColor = blip.color;
                rCtx.globalAlpha = Math.max(alpha, 0.15);
                rCtx.fill();
                rCtx.globalAlpha = 1.0;
            });
            rCtx.shadowBlur = 0;

            // Core Network Status Integrity Center Node
            rCtx.beginPath();
            rCtx.arc(cx, cy, 6 + pulseFactor * 0.5, 0, Math.PI * 2);
            rCtx.fillStyle = '#00f2ff';
            rCtx.shadowBlur = 15;
            rCtx.shadowColor = '#00f2ff';
            rCtx.fill();
            rCtx.shadowBlur = 0;

            // Sweep Line
            const sx = cx + maxRadius * Math.cos(sweepAngle);
            const sy = cy + maxRadius * Math.sin(sweepAngle);

            // Draw sweep gradient trail using canvas arc
            rCtx.beginPath();
            rCtx.moveTo(cx, cy);
            rCtx.arc(cx, cy, maxRadius, sweepAngle, sweepAngle - 0.4, true);
            rCtx.closePath();
            let gradient = rCtx.createRadialGradient(cx, cy, 10, cx, cy, maxRadius);
            gradient.addColorStop(0, 'rgba(0, 242, 255, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 242, 255, 0.0)');
            rCtx.fillStyle = gradient;
            rCtx.fill();

            // Main sharp sweep arm line
            rCtx.beginPath();
            rCtx.moveTo(cx, cy);
            rCtx.lineTo(sx, sy);
            rCtx.strokeStyle = 'rgba(0, 242, 255, 0.4)';
            rCtx.lineWidth = 1.5;
            rCtx.stroke();

            // Update Sweep Angle position slowly (Ambient cinematic flow)
            sweepAngle = (sweepAngle + 0.015) % (Math.PI * 2);

            requestAnimationFrame(drawRadar);
        }
        drawRadar();

        // Classroom Neural Network Engine Setup
        const canvas = document.getElementById('neuralCanvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let nodes = [];

        function resizeCanvas() {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            width = rect.width;
            height = rect.height;
        }

        class Node {
            constructor(student) {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.25;
                this.vy = (Math.random() - 0.5) * 0.25;
                this.student = student;
                this.phase = Math.random() * Math.PI * 2;
                
                if(student.status === 'top') {
                    this.baseSize = 6;
                    this.color = '#00f2ff';
                    this.isTop = true;
                } else if(student.risk) {
                    this.baseSize = 3;
                    this.color = '#f5a623';
                    this.isTop = false;
                } else if(student.status === 'high') {
                    this.baseSize = 4.5;
                    this.color = '#00f2ff';
                    this.isTop = false;
                } else {
                    this.baseSize = 3;
                    this.color = '#64748b';
                    this.isTop = false;
                }
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if(this.x < 0 || this.x > width) this.vx *= -1;
                if(this.y < 0 || this.y > height) this.vy *= -1;
                
                this.phase += 0.025;
            }

            draw() {
                let size = this.baseSize;
                let shadowColor = this.color;
                let blur = 10;

                if(this.isTop) {
                    size += Math.sin(this.phase) * 1.2;
                    blur = 20 + Math.sin(this.phase) * 5;
                } else if (this.student.risk) {
                    size += Math.sin(this.phase * 2.5) * 0.4;
                    blur = 5 + Math.sin(this.phase * 2.5) * 2;
                }

                ctx.beginPath();
                ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                
                ctx.shadowBlur = blur;
                ctx.shadowColor = shadowColor;
                ctx.fill();
                
                ctx.shadowBlur = 0;

                if(this.isTop) {
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.font = '500 11px Inter';
                    ctx.fillText('Rowan R.', this.x + 10, this.y + 4);
                } else if (this.student.risk && this.student.name === 'Rithwick Baye') {
                    ctx.fillStyle = 'rgba(245,166,35,0.7)';
                    ctx.font = '10px Inter';
                    ctx.fillText('Rithwick B.', this.x + 8, this.y + 3);
                }
            }
        }

        function initNeural() {
            resizeCanvas();
            nodes = students.map(s => new Node(s));
            for(let i=0; i<10; i++) {
                nodes.push(new Node({name: "ghost", status: "mid", risk: false}));
            }
        }

        function animateNeural() {
            ctx.clearRect(0, 0, width, height);

            for(let i=0; i<nodes.length; i++) {
                for(let j=i+1; j<nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx*dx + dy*dy);

                    if(dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        
                        const opacity = (1 - dist/100) * 0.15;
                        if(nodes[i].isTop || nodes[j].isTop) {
                            ctx.strokeStyle = `rgba(0,242,255,${opacity * 1.5})`;
                        } else if(nodes[i].student.risk || nodes[j].student.risk) {
                            ctx.strokeStyle = `rgba(245,166,35,${opacity})`;
                        } else {
                            ctx.strokeStyle = `rgba(100,116,139,${opacity})`;
                        }
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }

            nodes.forEach(n => {
                n.update();
                n.draw();
            });

            requestAnimationFrame(animateNeural);
        }

        window.addEventListener('resize', initNeural);
        initNeural();
        animateNeural();