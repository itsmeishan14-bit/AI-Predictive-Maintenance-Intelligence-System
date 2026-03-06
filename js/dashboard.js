// ============================================
// DASHBOARD — Enhanced Futuristic Control Center
// ============================================

const Dashboard = (() => {
    function render() {
        const kpis = DataEngine.getKPIs();
        const container = document.getElementById('view-dashboard');
        if (!container) return;

        const h = new Date().getHours();
        const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        container.innerHTML = `
      <!-- Welcome Banner -->
      <div class="welcome-banner holo-card animate-in">
        <div class="welcome-content">
          <h2 class="welcome-title">${greeting}, Operator 👋</h2>
          <p class="welcome-desc">Here's your plant overview for today. ${kpis.criticalCount > 0 ? '<span class="text-red">There ' + (kpis.criticalCount === 1 ? 'is 1 machine' : 'are ' + kpis.criticalCount + ' machines') + ' requiring immediate attention.</span>' : '<span class="text-emerald">All systems running within normal parameters.</span>'}</p>
        </div>
        <div class="welcome-time">
          <div class="welcome-clock">${timeStr}</div>
          <div class="welcome-date">${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Key Performance Indicators</h3>
            <p class="section-subtitle">Plant performance at a glance · ${kpis.activeMachines}/${kpis.totalMachines} machines active</p>
          </div>
        </div>
        <div class="kpi-grid">
          ${renderKPICard('Overall Effectiveness', kpis.oee + '%', kpis.oeeChange, 'cyan', 'up', svgIcons.gauge, 'kpi-spark-oee', 'OEE = Availability × Performance × Quality')}
          ${renderKPICard('At-Risk Machines', kpis.predictedFailures, kpis.failuresChange, 'magenta', kpis.failuresChange < 0 ? 'up' : 'down', svgIcons.alert, 'kpi-spark-fail', 'Predicted service within 200 hours')}
          ${renderKPICard('Savings This Year', '$' + (kpis.costSavings / 1000).toFixed(0) + 'K', kpis.savingsChange, 'emerald', 'up', svgIcons.dollar, 'kpi-spark-save', 'Cost avoided via predictive maintenance')}
          ${renderKPICard('Fleet Health Score', kpis.fleetHealth + '%', kpis.healthChange, 'amber', kpis.healthChange > 0 ? 'up' : 'down', svgIcons.heart, 'kpi-spark-health', 'Weighted average across all machines')}
        </div>
      </div>

      <!-- Charts & System Status Row -->
      <div class="section">
        <div class="dashboard-main-grid">
          <div class="dashboard-charts-area">
            <div class="chart-grid">
              <div class="chart-card holo-card breathing-border">
                <div class="chart-card-header">
                  <div>
                    <div class="chart-card-title">Sensor Trend Analysis</div>
                    <div class="chart-card-subtitle">Vibration & Temperature — Last 60 minutes</div>
                  </div>
                  <div class="tabs">
                    <div class="tab-item active">1H</div>
                    <div class="tab-item">6H</div>
                    <div class="tab-item">24H</div>
                    <div class="tab-item">7D</div>
                  </div>
                </div>
                <div class="chart-card-body">
                  <div class="line-chart-container" id="main-trend-chart"></div>
                  <div class="chart-legend">
                    <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-cyan)"></div>Vibration (mm/s)</div>
                    <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-magenta)"></div>Temperature (°C)</div>
                    <div class="chart-legend-item" style="margin-left:auto;color:var(--accent-red);font-size:10px">— — Critical Threshold</div>
                  </div>
                </div>
              </div>
              <div class="chart-card holo-card breathing-border">
                <div class="chart-card-header">
                  <div>
                    <div class="chart-card-title">Fleet Status Overview</div>
                    <div class="chart-card-subtitle">Current machine health distribution</div>
                  </div>
                </div>
                <div class="chart-card-body">
                  <div class="metric-grid">
                    <div class="metric-item"><div class="metric-item-label">✅ Healthy</div><div class="metric-item-value text-emerald">${kpis.healthyCount}</div></div>
                    <div class="metric-item"><div class="metric-item-label">⚠️ Warning</div><div class="metric-item-value text-amber">${kpis.warningCount}</div></div>
                    <div class="metric-item"><div class="metric-item-label">🔴 Critical</div><div class="metric-item-value text-red">${kpis.criticalCount}</div></div>
                    <div class="metric-item"><div class="metric-item-label">🔧 Maintenance</div><div class="metric-item-value text-cyan">${kpis.maintenanceCount}</div></div>
                  </div>
                  <div class="bar-chart-container" id="fleet-bar-chart" style="height:160px;margin-top:16px;"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="dashboard-status-area" id="system-status-panel"></div>
        </div>
      </div>

      <!-- Predictive Timeline -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Predictive Failure Timeline</h3>
            <p class="section-subtitle">AI-projected state progression for at-risk machines</p>
          </div>
        </div>
        <div class="chart-card holo-card" id="predictive-timeline-container"></div>
      </div>

      <!-- Machine Fleet -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Machine Fleet</h3>
            <p class="section-subtitle">Click any machine for detailed sensor data and digital twin</p>
          </div>
          <div class="section-actions">
            <span class="badge badge-info" style="font-size:11px">🔄 Live — updates every 3s</span>
          </div>
        </div>
        <div class="machine-grid" id="machine-fleet-grid"></div>
      </div>

      <!-- Recent Alerts -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Recent Alerts</h3>
            <p class="section-subtitle">AI-generated maintenance intelligence</p>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="App.navigateTo('alerts')">View all alerts →</button>
        </div>
        <div id="dashboard-alerts-list"></div>
      </div>
    `;

        renderMachineGrid();
        renderDashboardAlerts();
        renderDashboardCharts();
        initSparklines();
        renderPredictiveTimeline();
        SystemStatus.render();
    }

    function renderKPICard(label, value, change, color, direction, icon, sparkId, tooltip) {
        const changeText = Math.abs(change) + (typeof change === 'number' && !label.includes('At-Risk') ? '%' : '');
        return `
      <div class="kpi-card ${color} animate-in hover-lift neon-glow-${color === 'magenta' ? 'magenta' : color === 'emerald' ? 'emerald' : 'cyan'}" title="${tooltip}">
        <div class="kpi-card-top">
          <div class="kpi-card-icon ${color}">${icon}</div>
          <canvas class="kpi-sparkline" id="${sparkId}"></canvas>
        </div>
        <div class="kpi-card-label">${label}</div>
        <div class="kpi-card-value">${value}</div>
        <div class="kpi-card-change ${direction}">
          ${direction === 'up' ? svgIcons.arrowUp : svgIcons.arrowDown}
          <span>${changeText} vs last week</span>
        </div>
      </div>
    `;
    }

    function renderPredictiveTimeline() {
        const container = document.getElementById('predictive-timeline-container');
        if (!container) return;
        const atRisk = DataEngine.MACHINES.filter(m => m.rul > 0 && m.rul < 500 && m.status !== 'offline');
        if (atRisk.length === 0) {
            container.innerHTML = '<div class="chart-card-body"><p class="text-muted" style="text-align:center;padding:20px">No machines currently at risk</p></div>';
            return;
        }
        container.innerHTML = `
      <div class="chart-card-body">
        ${atRisk.map(m => {
            const now = Date.now();
            const warnHrs = Math.round(m.rul * 0.5);
            const critHrs = Math.round(m.rul * 0.8);
            const failHrs = m.rul;
            const currentStage = m.health > 70 ? 'healthy' : m.health > 40 ? 'warning' : 'critical';
            return `
            <div style="margin-bottom:20px">
              <div style="font-size:13px;font-weight:600;margin-bottom:8px">${m.name} <span class="font-mono text-muted" style="font-size:11px">${m.id}</span></div>
              <div class="timeline-track">
                <div class="timeline-node healthy">
                  <div class="timeline-node-dot ${currentStage === 'healthy' ? 'active' : ''}">✅</div>
                  <div class="timeline-node-label">Healthy</div>
                  <div class="timeline-node-time">Now</div>
                </div>
                <div class="timeline-connector ${currentStage !== 'healthy' ? 'past' : 'future'}">
                  <div class="timeline-connector-line"></div>
                </div>
                <div class="timeline-node warning">
                  <div class="timeline-node-dot ${currentStage === 'warning' ? 'active' : ''}">⚠️</div>
                  <div class="timeline-node-label">Warning</div>
                  <div class="timeline-node-time">+${warnHrs}h</div>
                </div>
                <div class="timeline-connector future">
                  <div class="timeline-connector-line"></div>
                </div>
                <div class="timeline-node critical">
                  <div class="timeline-node-dot ${currentStage === 'critical' ? 'active' : ''}">🔴</div>
                  <div class="timeline-node-label">Critical</div>
                  <div class="timeline-node-time">+${critHrs}h</div>
                </div>
                <div class="timeline-connector future">
                  <div class="timeline-connector-line"></div>
                </div>
                <div class="timeline-node failure">
                  <div class="timeline-node-dot">💥</div>
                  <div class="timeline-node-label">Failure</div>
                  <div class="timeline-node-time">+${failHrs}h</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    }

    function renderMachineGrid() {
        const grid = document.getElementById('machine-fleet-grid');
        if (!grid) return;
        grid.innerHTML = DataEngine.MACHINES.map((m, i) => {
            const readings = DataEngine.getMachineReadings(m.id);
            const healthClass = m.health > 70 ? 'high' : m.health > 40 ? 'medium' : 'low';
            return `
        <div class="machine-card holo-card animate-in hover-lift" onclick="App.showMachineDetail('${m.id}')" style="animation-delay:${i * 0.05}s" onmouseenter="SoundFX.hoverClick()">
          <div class="scanline-overlay"></div>
          <div class="machine-card-header">
            <div>
              <div class="machine-card-name">${m.name}</div>
              <div class="machine-card-id">${m.id} · ${m.location}</div>
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

    function renderDashboardAlerts() {
        const list = document.getElementById('dashboard-alerts-list');
        if (!list) return;
        const alerts = DataEngine.generateAlerts().slice(0, 4);
        list.innerHTML = alerts.map(a => `
      <div class="alert-item animate-in">
        <div class="alert-item-icon ${a.type}">${a.type === 'critical' ? svgIcons.alertCircle : a.type === 'warning' ? svgIcons.alertTriangle : svgIcons.info}</div>
        <div class="alert-item-content">
          <div class="alert-item-title">${a.title}</div>
          <div class="alert-item-desc">${a.desc}</div>
          <div class="alert-item-meta">
            <span class="badge badge-${a.type === 'critical' ? 'critical' : a.type === 'warning' ? 'warning' : 'info'}">${a.type.toUpperCase()}</span>
            <span class="alert-item-time">${svgIcons.clock} ${a.time}</span>
            <span>${a.machine}</span>
          </div>
        </div>
      </div>
    `).join('');
    }

    function renderDashboardCharts() {
        const trendContainer = document.getElementById('main-trend-chart');
        if (trendContainer) {
            const canvas = document.createElement('canvas');
            trendContainer.appendChild(canvas);
            const vibData = DataEngine.generateTimeSeries('vibration', 75, 60).map(d => d.value);
            const tempData = DataEngine.generateTimeSeries('temperature', 75, 60).map(d => d.value);
            const labels = Array.from({ length: 60 }, (_, i) => (60 - i) + 'm');
            Charts.drawLineChart(canvas, [
                { data: vibData, color: 'rgb(0,229,255)', fill: true },
                { data: tempData, color: 'rgb(246,55,236)', fill: true }
            ], { labels, threshold: 7.0 });
        }
        const barContainer = document.getElementById('fleet-bar-chart');
        if (barContainer) {
            const canvas = document.createElement('canvas');
            barContainer.appendChild(canvas);
            const kpis = DataEngine.getKPIs();
            Charts.drawBarChart(canvas, [
                { label: 'Healthy', value: kpis.healthyCount, color: 'rgba(0,230,118,0.8)' },
                { label: 'Warning', value: kpis.warningCount, color: 'rgba(255,179,0,0.8)' },
                { label: 'Critical', value: kpis.criticalCount, color: 'rgba(255,61,113,0.8)' },
                { label: 'Maint.', value: kpis.maintenanceCount, color: 'rgba(83,109,254,0.8)' },
                { label: 'Offline', value: kpis.offlineCount, color: 'rgba(92,101,128,0.8)' }
            ]);
        }
    }

    function initSparklines() {
        const sparks = [
            { id: 'kpi-spark-oee', color: 'rgb(0,229,255)' },
            { id: 'kpi-spark-fail', color: 'rgb(246,55,236)' },
            { id: 'kpi-spark-save', color: 'rgb(0,230,118)' },
            { id: 'kpi-spark-health', color: 'rgb(255,179,0)' }
        ];
        sparks.forEach(s => {
            const canvas = document.getElementById(s.id);
            if (canvas) Charts.drawSparkline(canvas, DataEngine.getSparklineData(), s.color);
        });
    }

    return { render };
})();
