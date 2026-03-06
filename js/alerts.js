// ============================================
// ALERTS — Alert System & Notifications
// ============================================

const Alerts = (() => {
    function render() {
        const container = document.getElementById('view-alerts');
        if (!container) return;
        const alerts = DataEngine.generateAlerts();
        const critical = alerts.filter(a => a.type === 'critical');
        const warning = alerts.filter(a => a.type === 'warning');
        const info = alerts.filter(a => a.type === 'info');

        container.innerHTML = `
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Alert Center</h3>
            <p class="section-subtitle">Maintenance intelligence & predictive alerts</p>
          </div>
          <div class="section-actions">
            <span class="badge badge-critical">${critical.length} Critical</span>
            <span class="badge badge-warning">${warning.length} Warning</span>
            <span class="badge badge-info">${info.length} Info</span>
          </div>
        </div>

        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
          <div class="kpi-card" style="border-left: 3px solid var(--accent-red);">
            <div class="kpi-card-label">Critical Alerts</div>
            <div class="kpi-card-value text-red">${critical.length}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Require immediate action</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid var(--accent-amber);">
            <div class="kpi-card-label">Warning Alerts</div>
            <div class="kpi-card-value text-amber">${warning.length}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Monitor closely</div>
          </div>
          <div class="kpi-card" style="border-left: 3px solid var(--accent-cyan);">
            <div class="kpi-card-label">Informational</div>
            <div class="kpi-card-value text-cyan">${info.length}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Scheduled maintenance</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div><h3 class="section-title">All Alerts</h3></div>
          <div class="tabs" id="alert-filter-tabs">
            <div class="tab-item active" onclick="Alerts.filter('all', this)">All (${alerts.length})</div>
            <div class="tab-item" onclick="Alerts.filter('critical', this)">Critical</div>
            <div class="tab-item" onclick="Alerts.filter('warning', this)">Warning</div>
            <div class="tab-item" onclick="Alerts.filter('info', this)">Info</div>
          </div>
        </div>
        <div id="alerts-list">
          ${renderAlertsList(alerts)}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Maintenance Schedule</h3>
            <p class="section-subtitle">AI-recommended maintenance actions</p>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-body" style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Action Required</th>
                  <th>Priority</th>
                  <th>Deadline</th>
                  <th>Est. Downtime</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>LTH-002</strong></td>
                  <td>Bearing replacement</td>
                  <td><span class="badge badge-critical">CRITICAL</span></td>
                  <td class="font-mono">Within 48 hrs</td>
                  <td>4 hours</td>
                  <td><span class="badge badge-warning">Pending</span></td>
                </tr>
                <tr>
                  <td><strong>CNC-002</strong></td>
                  <td>Cooling system inspection</td>
                  <td><span class="badge badge-warning">HIGH</span></td>
                  <td class="font-mono">Within 5 days</td>
                  <td>2 hours</td>
                  <td><span class="badge badge-info">Scheduled</span></td>
                </tr>
                <tr>
                  <td><strong>WLD-002</strong></td>
                  <td>Electrode replacement</td>
                  <td><span class="badge badge-warning">HIGH</span></td>
                  <td class="font-mono">Within 7 days</td>
                  <td>1.5 hours</td>
                  <td><span class="badge badge-info">Scheduled</span></td>
                </tr>
                <tr>
                  <td><strong>PRE-001</strong></td>
                  <td>Hydraulic fluid replacement</td>
                  <td><span class="badge badge-info">MEDIUM</span></td>
                  <td class="font-mono">Within 72 hrs</td>
                  <td>1 hour</td>
                  <td><span class="badge badge-info">Scheduled</span></td>
                </tr>
                <tr>
                  <td><strong>GRN-001</strong></td>
                  <td>Grinding wheel replacement</td>
                  <td><span class="badge badge-success">LOW</span></td>
                  <td class="font-mono">Next cycle</td>
                  <td>30 min</td>
                  <td><span class="badge badge-success">Planned</span></td>
                </tr>
                <tr>
                  <td><strong>PRE-002</strong></td>
                  <td>Full system recalibration</td>
                  <td><span class="badge badge-warning">HIGH</span></td>
                  <td class="font-mono">In progress</td>
                  <td>8 hours</td>
                  <td><span class="badge badge-warning">In Progress</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    }

    function renderAlertsList(alerts) {
        return alerts.map((a, i) => `
      <div class="alert-item animate-in" style="animation-delay:${i * 0.05}s">
        <div class="alert-item-icon ${a.type}">
          ${a.type === 'critical' ? svgIcons.alertCircle : a.type === 'warning' ? svgIcons.alertTriangle : svgIcons.info}
        </div>
        <div class="alert-item-content">
          <div class="alert-item-title">${a.title}</div>
          <div class="alert-item-desc">${a.desc}</div>
          <div class="alert-item-meta">
            <span class="badge badge-${a.type === 'critical' ? 'critical' : a.type === 'warning' ? 'warning' : 'info'}">${a.type.toUpperCase()}</span>
            <span class="alert-item-time">${svgIcons.clock} ${a.time}</span>
            <span>${a.machine}</span>
            <span class="font-mono">${a.sensor}: ${a.value}</span>
          </div>
        </div>
      </div>
    `).join('');
    }

    function filter(type, el) {
        const alerts = DataEngine.generateAlerts();
        const filtered = type === 'all' ? alerts : alerts.filter(a => a.type === type);
        document.getElementById('alerts-list').innerHTML = renderAlertsList(filtered);
        document.querySelectorAll('#alert-filter-tabs .tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    return { render, filter };
})();
