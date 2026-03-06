// ============================================
// SYSTEM STATUS — AI System Monitor Panel
// GPU, latency, throughput, model confidence
// ============================================

const SystemStatus = (() => {
    let interval = null;
    const state = {
        gpuUsage: 34,
        gpuTemp: 52,
        inferenceLatency: 8.4,
        throughput: 847,
        modelConfidence: 94.2,
        sensorsOnline: 11,
        sensorsTotal: 12,
        dataIngested: 0,
        uptime: 0
    };

    function render() {
        const container = document.getElementById('system-status-panel');
        if (!container) return;

        container.innerHTML = `
      <div class="sys-panel">
        <div class="sys-panel-header">
          <span class="sys-panel-title">⚡ SYSTEM STATUS</span>
          <span class="sys-status-dot online"></span>
        </div>
        <div class="sys-metrics">
          <div class="sys-metric">
            <div class="sys-metric-bar-wrap">
              <div class="sys-metric-bar" id="sys-gpu-bar" style="width:${state.gpuUsage}%"></div>
            </div>
            <div class="sys-metric-row">
              <span class="sys-metric-label">GPU Load</span>
              <span class="sys-metric-value" id="sys-gpu-val">${state.gpuUsage}%</span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-row">
              <span class="sys-metric-label">GPU Temp</span>
              <span class="sys-metric-value" id="sys-gputemp-val">${state.gpuTemp}°C</span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-row">
              <span class="sys-metric-label">Inference</span>
              <span class="sys-metric-value text-cyan" id="sys-latency-val">${state.inferenceLatency}ms</span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-row">
              <span class="sys-metric-label">Throughput</span>
              <span class="sys-metric-value" id="sys-throughput-val">${state.throughput}/s</span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-bar-wrap">
              <div class="sys-metric-bar confidence" id="sys-conf-bar" style="width:${state.modelConfidence}%"></div>
            </div>
            <div class="sys-metric-row">
              <span class="sys-metric-label">Model Conf.</span>
              <span class="sys-metric-value text-emerald" id="sys-conf-val">${state.modelConfidence}%</span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-row">
              <span class="sys-metric-label">Sensors</span>
              <span class="sys-metric-value" id="sys-sensors-val">
                <span class="text-emerald">${state.sensorsOnline}</span>/<span class="text-muted">${state.sensorsTotal}</span>
              </span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-row">
              <span class="sys-metric-label">Data In</span>
              <span class="sys-metric-value font-mono" id="sys-data-val">0 MB</span>
            </div>
          </div>
          <div class="sys-metric">
            <div class="sys-metric-row">
              <span class="sys-metric-label">Uptime</span>
              <span class="sys-metric-value font-mono" id="sys-uptime-val">00:00:00</span>
            </div>
          </div>
        </div>
      </div>
    `;

        startUpdate();
    }

    function startUpdate() {
        if (interval) clearInterval(interval);
        state.uptime = 0;
        state.dataIngested = 0;
        interval = setInterval(() => {
            state.uptime++;
            state.gpuUsage = Math.round(30 + Math.random() * 20);
            state.gpuTemp = Math.round(48 + Math.random() * 10);
            state.inferenceLatency = +(6 + Math.random() * 6).toFixed(1);
            state.throughput = Math.round(800 + Math.random() * 200);
            state.modelConfidence = +(92 + Math.random() * 6).toFixed(1);
            state.dataIngested += +(0.02 + Math.random() * 0.05).toFixed(2);

            updateDOM('sys-gpu-val', state.gpuUsage + '%');
            updateDOM('sys-gputemp-val', state.gpuTemp + '°C');
            updateDOM('sys-latency-val', state.inferenceLatency + 'ms');
            updateDOM('sys-throughput-val', state.throughput + '/s');
            updateDOM('sys-conf-val', state.modelConfidence + '%');
            updateDOM('sys-data-val', state.dataIngested.toFixed(1) + ' MB');
            updateDOM('sys-uptime-val', formatUptime(state.uptime));
            // Bars
            const gpuBar = document.getElementById('sys-gpu-bar');
            if (gpuBar) gpuBar.style.width = state.gpuUsage + '%';
            const confBar = document.getElementById('sys-conf-bar');
            if (confBar) confBar.style.width = state.modelConfidence + '%';
        }, 2000);
    }

    function updateDOM(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    function formatUptime(secs) {
        const h = String(Math.floor(secs / 3600)).padStart(2, '0');
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function destroy() {
        if (interval) clearInterval(interval);
    }

    return { render, destroy };
})();
