// ============================================
// PARTICLE SYSTEM — AI Data Flow Background
// Uses requestAnimationFrame for performance
// ============================================

const ParticleSystem = (() => {
    let canvas, ctx, particles = [], connections = [], animId = null;
    let W, H, mouse = { x: -1000, y: -1000 };
    const CONFIG = {
        particleCount: 80,
        connectionDist: 150,
        speed: 0.3,
        particleSize: { min: 1, max: 2.5 },
        colors: [
            'rgba(0,229,255,',    // cyan
            'rgba(246,55,236,',   // magenta
            'rgba(83,109,254,',   // blue
            'rgba(0,230,118,',    // emerald
        ],
        mouseRadius: 180
    };

    function init() {
        canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.6;';
        document.body.insertBefore(canvas, document.body.firstChild);
        ctx = canvas.getContext('2d');
        resize();
        createParticles();
        animate();
        window.addEventListener('resize', resize);
        document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    }

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                vx: (Math.random() - 0.5) * CONFIG.speed,
                vy: (Math.random() - 0.5) * CONFIG.speed,
                size: CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min),
                color: CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)],
                alpha: 0.3 + Math.random() * 0.4,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, W, H);
        const time = Date.now() * 0.001;

        // Update & draw particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.02;
            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;

            // Mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseRadius) {
                const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * 0.02;
                p.vx += dx * force * 0.1;
                p.vy += dy * force * 0.1;
            }
            // Dampen velocity
            p.vx *= 0.999;
            p.vy *= 0.999;

            const pulseAlpha = p.alpha + Math.sin(p.pulse) * 0.15;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color + pulseAlpha + ')';
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.connectionDist) {
                    const alpha = (1 - dist / CONFIG.connectionDist) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }

        animId = requestAnimationFrame(animate);
    }

    function destroy() {
        if (animId) cancelAnimationFrame(animId);
        canvas?.remove();
    }

    return { init, destroy };
})();
