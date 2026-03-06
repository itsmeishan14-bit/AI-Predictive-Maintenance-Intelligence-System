// ============================================
// NEURAL VIZ — Animated Neural Network Brain
// Canvas-based visualization with firing nodes,
// glowing connections, and data flow particles
// ============================================

const NeuralViz = (() => {
    let canvas, ctx, animId = null;
    let nodes = [], connections = [], dataParticles = [];
    let W, H, isRunning = false, inferenceActive = false;

    const LAYERS = [
        { name: 'Input', count: 6, color: '#00e5ff', x: 0 },
        { name: 'Conv', count: 8, color: '#536dfe', x: 0 },
        { name: 'LSTM-1', count: 10, color: '#f637ec', x: 0 },
        { name: 'LSTM-2', count: 10, color: '#f637ec', x: 0 },
        { name: 'Attn', count: 8, color: '#ffb300', x: 0 },
        { name: 'Dense', count: 6, color: '#b388ff', x: 0 },
        { name: 'Output', count: 3, color: '#00e676', x: 0 }
    ];

    function init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        canvas = document.createElement('canvas');
        canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:12px;';
        container.appendChild(canvas);
        ctx = canvas.getContext('2d');
        resize(container);
        buildNetwork();
        isRunning = true;
        animate();
    }

    function resize(container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        W = rect.width;
        H = rect.height;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
    }

    function buildNetwork() {
        nodes = [];
        connections = [];
        const padX = 60, padY = 30;
        const layerSpacing = (W - padX * 2) / (LAYERS.length - 1);

        LAYERS.forEach((layer, li) => {
            layer.x = padX + li * layerSpacing;
            const nodeSpacing = (H - padY * 2) / (layer.count + 1);
            for (let ni = 0; ni < layer.count; ni++) {
                const node = {
                    x: layer.x,
                    y: padY + nodeSpacing * (ni + 1),
                    layer: li,
                    color: layer.color,
                    radius: li === 0 || li === LAYERS.length - 1 ? 6 : 4,
                    fire: 0,       // 0-1 firing intensity
                    fireDecay: 0.02 + Math.random() * 0.02,
                    pulsePhase: Math.random() * Math.PI * 2,
                    id: `${li}-${ni}`
                };
                nodes.push(node);
            }
        });

        // Create connections between adjacent layers
        for (let li = 0; li < LAYERS.length - 1; li++) {
            const fromNodes = nodes.filter(n => n.layer === li);
            const toNodes = nodes.filter(n => n.layer === li + 1);
            fromNodes.forEach(fn => {
                // Connect to random subset
                const count = Math.min(3, toNodes.length);
                const shuffled = [...toNodes].sort(() => Math.random() - 0.5);
                for (let c = 0; c < count; c++) {
                    connections.push({
                        from: fn,
                        to: shuffled[c],
                        weight: 0.2 + Math.random() * 0.8,
                        glow: 0,
                        glowDecay: 0.03
                    });
                }
            });
        }
    }

    function triggerInference(attentionWeights) {
        inferenceActive = true;
        // Fire input nodes
        const inputNodes = nodes.filter(n => n.layer === 0);
        inputNodes.forEach((n, i) => {
            setTimeout(() => { n.fire = 1; spawnDataParticles(n, 3); }, i * 60);
        });

        // Sequential layer activation
        for (let li = 1; li < LAYERS.length; li++) {
            const layerNodes = nodes.filter(n => n.layer === li);
            layerNodes.forEach((n, i) => {
                setTimeout(() => {
                    n.fire = 0.7 + Math.random() * 0.3;
                    if (li < LAYERS.length - 1) spawnDataParticles(n, 2);
                    // Glow connections leading to this node
                    connections.filter(c => c.to === n).forEach(c => { c.glow = 1; });
                }, li * 200 + i * 30);
            });
        }

        setTimeout(() => { inferenceActive = false; }, LAYERS.length * 250);
    }

    function spawnDataParticles(fromNode, count) {
        const targetNodes = connections.filter(c => c.from === fromNode).map(c => c.to);
        for (let i = 0; i < Math.min(count, targetNodes.length); i++) {
            const target = targetNodes[i];
            dataParticles.push({
                x: fromNode.x,
                y: fromNode.y,
                tx: target.x,
                ty: target.y,
                progress: 0,
                speed: 0.015 + Math.random() * 0.01,
                color: fromNode.color,
                size: 2 + Math.random() * 2
            });
        }
    }

    function animate() {
        if (!isRunning) return;
        ctx.clearRect(0, 0, W, H);
        const time = Date.now() * 0.001;

        // Draw connections
        connections.forEach(conn => {
            conn.glow = Math.max(0, conn.glow - conn.glowDecay);
            const baseAlpha = 0.06 + conn.weight * 0.04;
            const alpha = baseAlpha + conn.glow * 0.5;
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            // Curved connections
            const midX = (conn.from.x + conn.to.x) / 2;
            const midY = (conn.from.y + conn.to.y) / 2 + (Math.random() > 0.5 ? 1 : -1) * 5;
            ctx.quadraticCurveTo(midX, midY, conn.to.x, conn.to.y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = conn.glow > 0.1 ? 1.5 : 0.5;
            ctx.stroke();
            // Glow effect
            if (conn.glow > 0.1) {
                ctx.strokeStyle = conn.from.color;
                ctx.globalAlpha = conn.glow * 0.3;
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });

        // Draw nodes
        nodes.forEach(node => {
            node.fire = Math.max(0, node.fire - node.fireDecay);
            const pulse = Math.sin(node.pulsePhase + time * 2) * 0.15;
            const baseRadius = node.radius + pulse;
            const totalRadius = baseRadius + node.fire * 4;

            // Outer glow when firing
            if (node.fire > 0.05) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, totalRadius + 8, 0, Math.PI * 2);
                ctx.fillStyle = node.color.replace(')', '') + ',' + (node.fire * 0.15) + ')';
                if (!node.color.includes('rgba')) {
                    ctx.fillStyle = `rgba(${hexToRGB(node.color)},${node.fire * 0.15})`;
                }
                ctx.fill();
            }

            // Main node
            ctx.beginPath();
            ctx.arc(node.x, node.y, totalRadius, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, totalRadius);
            gradient.addColorStop(0, node.color);
            gradient.addColorStop(1, node.color + '40');
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.5 + node.fire * 0.5;
            ctx.fill();
            ctx.globalAlpha = 1;

            // White center
            ctx.beginPath();
            ctx.arc(node.x, node.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.4 + node.fire * 0.6})`;
            ctx.fill();
        });

        // Draw data particles
        dataParticles = dataParticles.filter(p => p.progress < 1);
        dataParticles.forEach(p => {
            p.progress += p.speed;
            p.x = p.x + (p.tx - p.x) * p.speed * 3;
            p.y = p.y + (p.ty - p.y) * p.speed * 3;
            const alpha = 1 - p.progress;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.8;
            ctx.fill();
            // Trail
            ctx.beginPath();
            ctx.arc(p.x - (p.tx - p.x) * 0.05, p.y - (p.ty - p.y) * 0.05, p.size * alpha * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha * 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Layer labels
        ctx.globalAlpha = 0.4;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9ea7c0';
        LAYERS.forEach(l => {
            ctx.fillText(l.name, l.x, H - 8);
        });
        ctx.globalAlpha = 1;

        animId = requestAnimationFrame(animate);
    }

    function hexToRGB(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r},${g},${b}`;
    }

    function destroy() {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
    }

    return { init, destroy, triggerInference };
})();
