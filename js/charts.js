// ============================================
// CHARTS — Custom Canvas Chart Renderer
// ============================================

const Charts = (() => {
    // Draw a smooth line chart with gradient fill
    function drawLineChart(canvas, datasets, options = {}) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;
        const pad = { top: 20, right: 20, bottom: 30, left: 50 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        // Find data range
        let allValues = [];
        datasets.forEach(ds => ds.data.forEach(v => allValues.push(v)));
        let minVal = options.minY !== undefined ? options.minY : Math.min(...allValues) * 0.9;
        let maxVal = options.maxY !== undefined ? options.maxY : Math.max(...allValues) * 1.1;
        if (maxVal === minVal) maxVal = minVal + 1;

        // Grid lines
        const gridLines = 5;
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (let i = 0; i <= gridLines; i++) {
            const y = pad.top + (chartH / gridLines) * i;
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(pad.left + chartW, y);
            ctx.stroke();
            // Label
            const val = maxVal - ((maxVal - minVal) / gridLines) * i;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(1), pad.left - 8, y + 3);
        }
        ctx.setLineDash([]);

        // X-axis labels
        if (options.labels) {
            const step = Math.max(1, Math.floor(options.labels.length / 6));
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            for (let i = 0; i < options.labels.length; i += step) {
                const x = pad.left + (chartW / (options.labels.length - 1)) * i;
                ctx.fillText(options.labels[i], x, H - 8);
            }
        }

        // Draw each dataset
        datasets.forEach(ds => {
            const points = ds.data.map((val, i) => ({
                x: pad.left + (chartW / (ds.data.length - 1)) * i,
                y: pad.top + chartH - ((val - minVal) / (maxVal - minVal)) * chartH
            }));

            // Gradient fill
            if (ds.fill !== false) {
                const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
                gradient.addColorStop(0, ds.fillColor || ds.color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
                gradient.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.moveTo(points[0].x, pad.top + chartH);
                drawSmoothPath(ctx, points);
                ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            // Line
            ctx.beginPath();
            ctx.strokeStyle = ds.color;
            ctx.lineWidth = ds.lineWidth || 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            drawSmoothPath(ctx, points);
            ctx.stroke();

            // Dots on last point
            if (ds.showLastDot !== false) {
                const last = points[points.length - 1];
                ctx.beginPath();
                ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = ds.color;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(last.x, last.y, 7, 0, Math.PI * 2);
                ctx.strokeStyle = ds.color;
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.4;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        });

        // Threshold line
        if (options.threshold !== undefined) {
            const ty = pad.top + chartH - ((options.threshold - minVal) / (maxVal - minVal)) * chartH;
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(255, 61, 113, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(pad.left, ty);
            ctx.lineTo(pad.left + chartW, ty);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255, 61, 113, 0.7)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Threshold', pad.left + chartW - 55, ty - 6);
        }
    }

    // Smooth Bezier curve through points
    function drawSmoothPath(ctx, points) {
        if (points.length < 2) return;
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
            const cp1x = points[i].x + (points[i + 1].x - points[i].x) / 3;
            const cp1y = points[i].y;
            const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) / 3;
            const cp2y = points[i + 1].y;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, points[i + 1].x, points[i + 1].y);
        }
    }

    // Draw gauge / donut chart  
    function drawGauge(canvas, value, max, color, options = {}) {
        const ctx = canvas.getContext('2d');
        const size = options.size || 140;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const radius = (size / 2) - 12;
        const lineWidth = options.lineWidth || 10;
        const startAngle = options.startAngle || (Math.PI * 0.75);
        const endAngle = options.endAngle || (Math.PI * 2.25);
        const totalAngle = endAngle - startAngle;
        const valueAngle = startAngle + (value / max) * totalAngle;

        ctx.clearRect(0, 0, size, size);

        // Background arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Value arc
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, shiftColor(color, 30));
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, valueAngle);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, valueAngle);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth + 4;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.15;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // End dot
        const dotX = cx + radius * Math.cos(valueAngle);
        const dotY = cy + radius * Math.sin(valueAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    // Draw bar chart
    function drawBarChart(canvas, data, options = {}) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;
        const pad = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartW = W - pad.left - pad.right;
        const chartH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
        const barWidth = Math.min(40, (chartW / data.length) * 0.6);
        const gap = (chartW - barWidth * data.length) / (data.length + 1);

        data.forEach((d, i) => {
            const x = pad.left + gap + i * (barWidth + gap);
            const barH = (d.value / maxVal) * chartH;
            const y = pad.top + chartH - barH;
            const radius = 4;

            // Bar gradient
            const gradient = ctx.createLinearGradient(x, y, x, pad.top + chartH);
            gradient.addColorStop(0, d.color || 'rgba(0,229,255,0.8)');
            gradient.addColorStop(1, d.color ? d.color.replace('0.8', '0.2') : 'rgba(0,229,255,0.1)');

            // Rounded bar
            ctx.beginPath();
            ctx.moveTo(x, pad.top + chartH);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, pad.top + chartH);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Glow
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = d.color || 'rgba(0,229,255,1)';
            ctx.fillRect(x - 2, y, barWidth + 4, 6);
            ctx.globalAlpha = 1;

            // Label
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d.label, x + barWidth / 2, H - 10);

            // Value on top
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(d.value.toFixed(1), x + barWidth / 2, y - 6);
        });
    }

    // Draw sparkline (mini chart)
    function drawSparkline(canvas, data, color, w = 80, h = 32) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        const range = maxVal - minVal || 1;
        const points = data.map((v, i) => ({
            x: (w / (data.length - 1)) * i,
            y: h - 4 - ((v - minVal) / range) * (h - 8)
        }));

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.moveTo(0, h);
        drawSmoothPath(ctx, points);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = 'round';
        drawSmoothPath(ctx, points);
        ctx.stroke();
    }

    // Color utility
    function shiftColor(color, amount) {
        return color; // Simplified for now
    }

    return { drawLineChart, drawGauge, drawBarChart, drawSparkline };
})();
