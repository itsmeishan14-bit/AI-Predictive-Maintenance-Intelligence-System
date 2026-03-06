// ============================================
// ALERTS — Alert System from Backend API
// ============================================

const Alerts = (() => {
    function render() {
        const container = document.getElementById('view-alerts');
        if (!container) return;

        container.innerHTML = `
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Alert Center</h3>
            <p class="section-subtitle">AI-powered maintenance intelligence & predictive alerts</p>
          </div>
          <div class="section-actions" id="alert-badge-bar">Loading...</div>
        </div>

        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;" id="alert-kpis"></div>
      </div>

      <div class="section">
        <div class="section-header">
          <div><h3 class="section-title">All Alerts</h3></div>
          <div class="tabs" id="alert-filter-tabs">
            <div class="tab-item active" onclick="Alerts.filter('all', this)">All</div>
            <div class="tab-item" onclick="Alerts.filter('critical', this)">Critical</div>
            <div class="tab-item" onclick="Alerts.filter('warning', this)">Warning</div>
            <div class="tab-item" onclick="Alerts.filter('info', this)">Info</div>
          </div>
        </div>
        <div id="alerts-list"><div class="agent-empty-state">Loading alerts from server...</div></div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Maintenance Schedule</h3>
            <p class="section-subtitle">AI-recommended maintenance actions</p>
          </div>
        </div>
        <div class="chart-card holo-card">
          <div class="chart-card-body" style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr><th>Machine</th><th>Action Required</th><th>Priority</th><th>Deadline</th><th>Est. Downtime</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td><strong>LTH-002</strong></td><td>Bearing replacement</td><td><span class="badge badge-critical">CRITICAL</span></td><td class="font-mono">Within 48 hrs</td><td>4 hours</td><td><span class="badge badge-warning">Pending</span></td></tr>
                <tr><td><strong>CNC-002</strong></td><td>Cooling system inspection</td><td><span class="badge badge-warning">HIGH</span></td><td class="font-mono">Within 5 days</td><td>2 hours</td><td><span class="badge badge-info">Scheduled</span></td></tr>
                <tr><td><strong>WLD-002</strong></td><td>Electrode replacement</td><td><span class="badge badge-warning">HIGH</span></td><td class="font-mono">Within 7 days</td><td>1.5 hours</td><td><span class="badge badge-info">Scheduled</span></td></tr>
                <tr><td><strong>PRE-001</strong></td><td>Hydraulic fluid replacement</td><td><span class="badge badge-info">MEDIUM</span></td><td class="font-mono">Within 72 hrs</td><td>1 hour</td><td><span class="badge badge-info">Scheduled</span></td></tr>
                <tr><td><strong>GRN-001</strong></td><td>Grinding wheel replacement</td><td><span class="badge badge-success">LOW</span></td><td class="font-mono">Next cycle</td><td>30 min</td><td><span class="badge badge-success">Planned</span></td></tr>
                <tr><td><strong>PRE-002</strong></td><td>Full system recalibration</td><td><span class="badge badge-warning">HIGH</span></td><td class="font-mono">In progress</td><td>8 hours</td><td><span class="badge badge-warning">In Progress</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

        // Fetch from backend
        loadAlerts();
    }

    async function loadAlerts(filterType) {
        const res = await API.alerts.list();
        if (!res?.success) {
            // Fallback to local
            const alerts = DataEngine.generateAlerts();
            renderAlerts(filterType ? alerts.filter(a => a.type === filterType) : alerts);
            return;
        }

        const alerts = res.data;
        const critical = alerts.filter(a => a.type === 'critical');
        const warning = alerts.filter(a => a.type === 'warning');
        const info = alerts.filter(a => a.type === 'info');

        // Update badge bar
        const badgeBar = document.getElementById('alert-badge-bar');
        if (badgeBar) {
            badgeBar.innerHTML = `
        <span class="badge badge-critical">${critical.length} Critical</span>
        <span class="badge badge-warning">${warning.length} Warning</span>
        <span class="badge badge-info">${info.length} Info</span>
      `;
        }

        // Update KPIs
        const kpis = document.getElementById('alert-kpis');
        if (kpis) {
            kpis.innerHTML = `
        <div class="kpi-card holo-card neon-glow-red" style="border-left: 3px solid var(--accent-red);">
          <div class="kpi-card-label">Critical Alerts</div>
          <div class="kpi-card-value text-red">${critical.length}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">${critical.filter(a => !a.acknowledged).length} unacknowledged</div>
        </div>
        <div class="kpi-card holo-card neon-glow-amber" style="border-left: 3px solid var(--accent-amber);">
          <div class="kpi-card-label">Warning Alerts</div>
          <div class="kpi-card-value text-amber">${warning.length}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Monitor closely</div>
        </div>
        <div class="kpi-card holo-card neon-glow-cyan" style="border-left: 3px solid var(--accent-cyan);">
          <div class="kpi-card-label">Informational</div>
          <div class="kpi-card-value text-cyan">${info.length}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Scheduled maintenance</div>
        </div>
      `;
        }

        // Render list
        const filtered = filterType && filterType !== 'all' ? alerts.filter(a => a.type === filterType) : alerts;
        renderAlerts(filtered);
    }

    function renderAlerts(alerts) {
        const list = document.getElementById('alerts-list');
        if (!list) return;
        if (!alerts.length) {
            list.innerHTML = '<div class="agent-empty-state">No alerts matching this filter</div>';
            return;
        }
        list.innerHTML = alerts.map((a, i) => {
            const timeStr = typeof a.time === 'number' ? getTimeAgo(a.time) : a.time;
            const ackLabel = a.acknowledged ? '<span class="badge badge-success" style="font-size:9px;margin-left:6px">ACK</span>' : '';
            return `
      <div class="alert-item holo-card animate-in" style="animation-delay:${i * 0.04}s; margin-bottom:8px;">
        <div class="alert-item-icon ${a.type}">
          ${a.type === 'critical' ? svgIcons.alertCircle : a.type === 'warning' ? svgIcons.alertTriangle : svgIcons.info}
        </div>
        <div class="alert-item-content">
          <div class="alert-item-title">${a.title}${ackLabel}</div>
          <div class="alert-item-desc">${a.desc}</div>
          <div class="alert-item-meta">
            <span class="badge badge-${a.type === 'critical' ? 'critical' : a.type === 'warning' ? 'warning' : 'info'}">${a.type.toUpperCase()}</span>
            <span class="alert-item-time">${svgIcons.clock} ${timeStr}</span>
            <span>${a.machine}</span>
            ${a.sensor ? `<span class="font-mono">${a.sensor}: ${typeof a.value === 'number' ? a.value.toFixed(1) : a.value}</span>` : ''}
            ${!a.acknowledged ? `<button class="btn btn-ghost" style="font-size:10px;padding:2px 8px;margin-left:auto" onclick="Alerts.acknowledge('${a.id}')">Acknowledge</button>` : ''}
          </div>
        </div>
      </div>
    `;
        }).join('');
    }

    async function acknowledge(alertId) {
        const res = await API.alerts.acknowledge(alertId);
        if (res?.success) {
            Animations.showToast('Alert acknowledged ✅', 'success');
            SoundFX.successBeep();
            loadAlerts();
        }
    }

    function filter(type, el) {
        loadAlerts(type);
        document.querySelectorAll('#alert-filter-tabs .tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    function getTimeAgo(ts) {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    return { render, filter, acknowledge };
})();
