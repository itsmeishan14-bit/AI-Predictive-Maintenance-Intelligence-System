// ============================================
// DIGITAL TWIN — Pseudo-3D Machine Canvas
// Shows live sensor heatmaps, rotating parts,
// and health indicator zones
// ============================================

const DigitalTwin = (() => {
    let canvas, ctx, animId = null, isRunning = false;
    let W, H, currentMachine = null, currentReadings = null;
    let rotation = 0, heatPulse = 0;

    function init(containerId, machine, readings) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d');
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = rect.width; H = rect.height;
        canvas.width = W * dpr; canvas.height = H * dpr;
        canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        currentMachine = machine;
        currentReadings = readings;
        isRunning = true;
        animate();
    }

    function updateReadings(readings) {
        currentReadings = readings;
    }

    function animate() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, W, H);
        rotation += 0.008;
        heatPulse += 0.03;
        const r = currentReadings || {};
        const health = currentMachine?.health || 50;

        drawMachineBody(health);
        drawMotorUnit(r.rpm || 2000, health);
        drawHeatZones(r.temperature || 50, r.vibration || 2);
        drawBearingUnit(r.vibration || 2, health);
        drawPressureGauge(r.pressure || 200);
        drawStatusOverlay(health);
        drawGrid();

        animId = requestAnimationFrame(animate);
    }

    function drawGrid() {
        ctx.strokeStyle = 'rgba(0,229,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < W; x += 30) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let y = 0; y < H; y += 30) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
    }

    function drawMachineBody(health) {
        const cx = W * 0.5, cy = H * 0.5;
        const bw = W * 0.6, bh = H * 0.35;
        // Machine body with perspective
        ctx.save();
        ctx.translate(cx, cy);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-bw / 2 + 8, -bh / 2 + 8, bw, bh);
        // Body gradient
        const gradient = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
        gradient.addColorStop(0, 'rgba(30,40,65,0.9)');
        gradient.addColorStop(1, 'rgba(20,28,48,0.9)');
        ctx.fillStyle = gradient;
        ctx.strokeStyle = health > 70 ? 'rgba(0,230,118,0.3)' : health > 40 ? 'rgba(255,179,0,0.3)' : 'rgba(255,61,113,0.4)';
        ctx.lineWidth = 1.5;
        roundRect(ctx, -bw / 2, -bh / 2, bw, bh, 8);
        ctx.fill();
        ctx.stroke();
        // Inner panel lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-bw / 2 + bw * i / 4, -bh / 2 + 5);
            ctx.lineTo(-bw / 2 + bw * i / 4, bh / 2 - 5);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawMotorUnit(rpm, health) {
        const cx = W * 0.3, cy = H * 0.5;
        const r = 35;
        // Motor housing
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(83,109,254,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Rotating element
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation * (rpm / 1000));
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(r * 0.8, 0);
            ctx.strokeStyle = `rgba(83,109,254,${0.3 + Math.sin(rotation * 3 + i) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        // Center
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = rpm > 4200 ? '#ff3d71' : '#536dfe';
        ctx.fill();
        ctx.restore();
        // Label
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('MOTOR', cx, cy + r + 18);
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillStyle = rpm > 4200 ? '#ff3d71' : '#00e5ff';
        ctx.fillText(Math.round(rpm) + ' RPM', cx, cy + r + 30);
    }

    function drawHeatZones(temp, vibration) {
        const cx = W * 0.55, cy = H * 0.42;
        // Heat gradient overlay
        const heatIntensity = Math.min(1, temp / 120);
        const vibIntensity = Math.min(1, vibration / 8);
        // Temperature zone
        const heatR = 40 + Math.sin(heatPulse) * 5;
        const heatGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, heatR);
        heatGrad.addColorStop(0, `rgba(255,${Math.round(200 - heatIntensity * 150)},${Math.round(100 - heatIntensity * 100)},${0.15 + heatIntensity * 0.25})`);
        heatGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(cx, cy, heatR, 0, Math.PI * 2);
        ctx.fillStyle = heatGrad;
        ctx.fill();
        // Vibration zone
        const vibX = W * 0.7, vibY = H * 0.55;
        const vibR = 30 + Math.sin(heatPulse * 2) * vibIntensity * 8;
        const vibGrad = ctx.createRadialGradient(vibX, vibY, 0, vibX, vibY, vibR);
        vibGrad.addColorStop(0, `rgba(246,55,236,${0.1 + vibIntensity * 0.3})`);
        vibGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(vibX, vibY, vibR, 0, Math.PI * 2);
        ctx.fillStyle = vibGrad;
        ctx.fill();
        // Labels
        ctx.font = '9px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('THERMAL', cx, cy - heatR - 4);
        ctx.fillText('VIBRATION', vibX, vibY - vibR - 4);
    }

    function drawBearingUnit(vibration, health) {
        const cx = W * 0.7, cy = H * 0.5;
        const r = 20;
        const isAnomaly = vibration > 5;
        // Bearing ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isAnomaly ? 'rgba(255,61,113,0.6)' : 'rgba(0,230,118,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();
        if (isAnomaly) {
            ctx.beginPath();
            ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,61,113,${0.1 + Math.sin(heatPulse * 3) * 0.15})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        // Rolling elements
        ctx.save();
        ctx.translate(cx, cy);
        const wobble = isAnomaly ? Math.sin(heatPulse * 5) * 2 : 0;
        ctx.rotate(rotation * 0.5 + wobble * 0.05);
        for (let i = 0; i < 8; i++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.arc(r * 0.65, 0, 3, 0, Math.PI * 2);
            ctx.fillStyle = isAnomaly ? `rgba(255,61,113,${0.5 + Math.sin(heatPulse + i) * 0.3})` : 'rgba(0,230,118,0.4)';
            ctx.fill();
        }
        ctx.restore();
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'center';
        ctx.fillText('BEARING', cx, cy + r + 18);
    }

    function drawPressureGauge(pressure) {
        const cx = W * 0.15, cy = H * 0.35;
        const r = 22;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.stroke();
        const pct = Math.min(1, pressure / 350);
        const angle = Math.PI * 0.8 + pct * Math.PI * 1.4;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 0.8, angle);
        ctx.strokeStyle = pct > 0.9 ? '#ff3d71' : pct > 0.75 ? '#ffb300' : '#00e5ff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = '#00e5ff';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(pressure), cx, cy + 4);
        ctx.font = '8px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('PSI', cx, cy + 14);
    }

    function drawStatusOverlay(health) {
        // Top-right status
        const statusColor = health > 70 ? '#00e676' : health > 40 ? '#ffb300' : '#ff3d71';
        const statusText = health > 70 ? 'NOMINAL' : health > 40 ? 'DEGRADED' : 'CRITICAL';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = statusColor;
        ctx.textAlign = 'right';
        ctx.fillText('● ' + statusText, W - 15, 20);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('HEALTH: ' + health + '%', W - 15, 34);
        // Bottom info
        ctx.textAlign = 'left';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(0,229,255,0.4)';
        ctx.fillText('DIGITAL TWIN · LIVE', 12, H - 10);
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function destroy() {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
    }

    return { init, destroy, updateReadings };
})();
