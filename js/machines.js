// ============================================
// MACHINES — Machine Detail View + Digital Twin
// ============================================

const Machines = (() => {
    function render() {
        const container = document.getElementById('view-machines');
        if (!container) return;
        DigitalTwin.destroy();

        container.innerHTML = `
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Machine Fleet Management</h3>
            <p class="section-subtitle">Select a machine to view its digital twin and live sensor data</p>
          </div>
          <div class="section-actions">
            <div class="tabs">
              <div class="tab-item active" onclick="Machines.filterStatus('all')">All</div>
              <div class="tab-item" onclick="Machines.filterStatus('healthy')">Healthy</div>
              <div class="tab-item" onclick="Machines.filterStatus('warning')">Warning</div>
              <div class="tab-item" onclick="Machines.filterStatus('critical')">Critical</div>
            </div>
          </div>
        </div>
        <div class="machine-grid" id="machines-full-grid"></div>
      </div>

      <div id="machine-detail-panel" style="display:none;">
        <div class="section">
          <div class="section-header">
            <div>
              <h3 class="section-title" id="detail-machine-name"></h3>
              <p class="section-subtitle" id="detail-machine-info"></p>
            </div>
            <div class="section-actions">
              <button class="btn btn-ghost" onclick="Machines.closeDetail()">
                ${svgIcons.close} Back to Fleet
              </button>
            </div>
          </div>

          <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
            <div class="kpi-card cyan animate-in neon-glow-cyan">
              <div class="kpi-card-label">Health Score</div>
              <div class="kpi-card-value" id="detail-health"></div>
            </div>
            <div class="kpi-card emerald animate-in neon-glow-emerald">
              <div class="kpi-card-label">Remaining Useful Life</div>
              <div class="kpi-card-value" id="detail-rul"></div>
            </div>
            <div class="kpi-card magenta animate-in neon-glow-magenta">
              <div class="kpi-card-label">Failure Probability</div>
              <div class="kpi-card-value" id="detail-failure-prob"></div>
            </div>
          </div>

          <!-- Digital Twin -->
          <div class="chart-card holo-card breathing-border" style="margin-bottom:24px">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">🏭 Digital Twin — Live Visualization</div>
                <div class="chart-card-subtitle">Real-time sensor heat zones, rotating components, and anomaly detection</div>
              </div>
              <span class="badge badge-info" style="font-size:10px">🔴 LIVE</span>
            </div>
            <div class="chart-card-body">
              <div class="digital-twin-canvas" id="digital-twin-container">
                <div class="scanline-overlay"></div>
              </div>
            </div>
          </div>

          <div class="chart-grid">
            <div class="chart-card holo-card">
              <div class="chart-card-header">
                <div>
                  <div class="chart-card-title">Live Sensor Gauges</div>
                  <div class="chart-card-subtitle">Real-time readings</div>
                </div>
              </div>
              <div class="chart-card-body">
                <div class="sensor-grid" id="detail-gauges"></div>
              </div>
            </div>
            <div class="chart-card holo-card">
              <div class="chart-card-header">
                <div>
                  <div class="chart-card-title">Vibration Trend</div>
                  <div class="chart-card-subtitle">Last 60 minutes with critical threshold</div>
                </div>
              </div>
              <div class="chart-card-body">
                <div class="line-chart-container small" id="detail-vibration-chart"></div>
              </div>
            </div>
          </div>

          <div style="margin-top: 24px;">
            <div class="chart-card holo-card">
              <div class="chart-card-header">
                <div>
                  <div class="chart-card-title">Multi-Sensor History</div>
                  <div class="chart-card-subtitle">Temperature & Pressure trends over time</div>
                </div>
              </div>
              <div class="chart-card-body">
                <div class="line-chart-container" id="detail-multi-chart"></div>
                <div class="chart-legend">
                  <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-amber)"></div>Temperature (°C)</div>
                  <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-blue)"></div>Pressure (PSI)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

        renderFullGrid('all');
    }

    function renderFullGrid(filter) {
        const grid = document.getElementById('machines-full-grid');
        if (!grid) return;
        const machines = filter === 'all' ? DataEngine.MACHINES : DataEngine.MACHINES.filter(m => m.status === filter);
        grid.innerHTML = machines.map((m, i) => {
            const readings = DataEngine.getMachineReadings(m.id);
            const healthClass = m.health > 70 ? 'high' : m.health > 40 ? 'medium' : 'low';
            return `
        <div class="machine-card holo-card animate-in hover-lift" onclick="App.showMachineDetail('${m.id}')" style="animation-delay:${i * 0.05}s" onmouseenter="SoundFX.hoverClick()">
          <div class="scanline-overlay"></div>
          <div class="machine-card-header">
            <div>
              <div class="machine-card-name">${m.name}</div>
              <div class="machine-card-id">${m.id} · ${m.type} · ${m.location}</div>
            </div>
            <div class="machine-card-status ${m.status}"><span class="status-dot"></span>${m.status}</div>
          </div>
          <div class="machine-card-health">
            <div class="health-bar-container">
              <div class="health-bar"><div class="health-bar-fill ${healthClass}" style="width:${m.health}%"></div></div>
              <span class="health-value" style="color:${m.health > 70 ? 'var(--accent-emerald)' : m.health > 40 ? 'var(--accent-amber)' : 'var(--accent-red)'}">${m.health}%</span>
            </div>
          </div>
          ${readings ? `
          <div class="machine-card-sensors">
            <div class="sensor-mini"><span class="sensor-mini-label">Vibration</span><span class="sensor-mini-value">${readings.vibration.toFixed(1)} mm/s</span></div>
            <div class="sensor-mini"><span class="sensor-mini-label">Temp</span><span class="sensor-mini-value">${readings.temperature.toFixed(0)}°C</span></div>
            <div class="sensor-mini"><span class="sensor-mini-label">Pressure</span><span class="sensor-mini-value">${readings.pressure.toFixed(0)} PSI</span></div>
            <div class="sensor-mini"><span class="sensor-mini-label">RPM</span><span class="sensor-mini-value">${readings.rpm.toFixed(0)}</span></div>
          </div>` : '<div style="padding:8px 0;color:var(--text-muted);font-size:12px;">⏻ Machine offline</div>'}
        </div>
      `;
        }).join('');
    }

    function showDetail(machineId) {
        const machine = DataEngine.MACHINES.find(m => m.id === machineId);
        if (!machine) return;
        SoundFX.predictionBeep();

        document.getElementById('machines-full-grid')?.parentElement && (document.getElementById('machines-full-grid').parentElement.style.display = 'none');
        const panel = document.getElementById('machine-detail-panel');
        if (panel) panel.style.display = 'block';

        document.getElementById('detail-machine-name').textContent = machine.name;
        document.getElementById('detail-machine-info').textContent = `${machine.id} · ${machine.type} · ${machine.location} · Installed: ${machine.installed}`;
        document.getElementById('detail-health').textContent = machine.health + '%';
        document.getElementById('detail-rul').textContent = machine.rul + ' hrs';
        document.getElementById('detail-failure-prob').textContent = Math.round((100 - machine.health) * 1.1) + '%';

        renderDetailGauges(machine);
        renderDetailCharts(machine);

        // Launch Digital Twin
        const readings = DataEngine.getMachineReadings(machine.id);
        setTimeout(() => {
            DigitalTwin.init('digital-twin-container', machine, readings);
        }, 200);
    }

    function renderDetailGauges(machine) {
        const container = document.getElementById('detail-gauges');
        if (!container) return;
        const readings = DataEngine.getMachineReadings(machine.id);
        if (!readings) return;

        const sensors = [
            { key: 'vibration', label: 'Vibration', unit: 'mm/s', color: '#00e5ff', max: 10 },
            { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f637ec', max: 120 },
            { key: 'pressure', label: 'Pressure', unit: 'PSI', color: '#536dfe', max: 350 },
            { key: 'rpm', label: 'RPM', unit: 'RPM', color: '#ffb300', max: 5000 }
        ];

        container.innerHTML = sensors.map(s => `
      <div class="gauge-container">
        <div class="gauge-chart-container small">
          <canvas id="gauge-${s.key}"></canvas>
          <div class="gauge-value-overlay" style="top:58%;left:50%;transform:translate(-50%,-50%)">
            <div class="gauge-value-number" style="font-size:16px;color:${s.color}">${readings[s.key].toFixed(s.key === 'rpm' ? 0 : 1)}</div>
            <div class="gauge-value-unit">${s.unit}</div>
          </div>
        </div>
        <div class="gauge-label">${s.label}</div>
      </div>
    `).join('');

        sensors.forEach(s => {
            const canvas = document.getElementById(`gauge-${s.key}`);
            if (canvas) Charts.drawGauge(canvas, readings[s.key], s.max, s.color, { size: 100 });
        });
    }

    function renderDetailCharts(machine) {
        const vibContainer = document.getElementById('detail-vibration-chart');
        if (vibContainer) {
            vibContainer.innerHTML = '';
            const canvas = document.createElement('canvas');
            vibContainer.appendChild(canvas);
            const data = DataEngine.generateTimeSeries('vibration', machine.health, 60).map(d => d.value);
            Charts.drawLineChart(canvas, [{ data, color: 'rgb(0,229,255)', fill: true }], {
                threshold: DataEngine.SENSOR_RANGES.vibration.crit
            });
        }
        const multiContainer = document.getElementById('detail-multi-chart');
        if (multiContainer) {
            multiContainer.innerHTML = '';
            const canvas = document.createElement('canvas');
            multiContainer.appendChild(canvas);
            const tempData = DataEngine.generateTimeSeries('temperature', machine.health, 60).map(d => d.value);
            const pressData = DataEngine.generateTimeSeries('pressure', machine.health, 60).map(d => d.value / 4);
            Charts.drawLineChart(canvas, [
                { data: tempData, color: 'rgb(255,179,0)', fill: true },
                { data: pressData, color: 'rgb(83,109,254)', fill: true }
            ]);
        }
    }

    function closeDetail() {
        DigitalTwin.destroy();
        const panel = document.getElementById('machine-detail-panel');
        if (panel) panel.style.display = 'none';
        const gridSection = document.getElementById('machines-full-grid')?.parentElement;
        if (gridSection) gridSection.style.display = 'block';
    }

    function filterStatus(status) {
        renderFullGrid(status);
        document.querySelectorAll('#view-machines .tab-item').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
    }

    return { render, showDetail, closeDetail, filterStatus };
})();
