// ============================================
// APP — Main Application Controller
// Connected to Backend via REST + WebSocket
// ============================================

const App = (() => {
    let currentView = 'dashboard';
    let updateInterval = null;
    let clockInterval = null;
    let wsConnected = false;
    let notifOpen = false;

    function init() {
        ParticleSystem.init();
        Chatbot.init();
        connectToBackend();
        navigateTo('dashboard');
        startLiveUpdates();
        startClock();
        setupNotifications();

        // Welcome toasts
        setTimeout(() => {
            Animations.showToast('Good ' + getTimeGreeting() + '! PredictAI system online — monitoring 11 machines.', 'success');
            SoundFX.successBeep();
        }, 1500);
        setTimeout(() => {
            Animations.showToast('⚠ LTH-002: Bearing failure predicted within 48 hrs — review recommended', 'critical');
            SoundFX.alertBeep();
        }, 6000);

        document.addEventListener('click', () => { try { SoundFX.hoverClick(); } catch (e) { } }, { once: true });

        // Close notification panel on outside click
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notif-panel');
            const btn = document.getElementById('btn-notifications');
            if (notifOpen && panel && !panel.contains(e.target) && !btn.contains(e.target)) {
                closeNotifications();
            }
        });
    }

    // ── Notification Panel ──
    function setupNotifications() {
        const btn = document.getElementById('btn-notifications');
        if (btn) {
            btn.onclick = toggleNotifications;
        }
        // Create the panel
        const header = document.querySelector('.main-header');
        if (header) {
            const panel = document.createElement('div');
            panel.id = 'notif-panel';
            panel.className = 'notif-panel';
            panel.innerHTML = `
        <div class="notif-header">
          <span class="notif-header-title">Notifications</span>
          <button class="notif-clear-btn" onclick="App.clearNotifications()">Clear All</button>
        </div>
        <div class="notif-list" id="notif-list">
          <div class="notif-empty">No new notifications</div>
        </div>
      `;
            header.appendChild(panel);
        }
        // Load initial alerts
        loadNotifications();
    }

    async function loadNotifications() {
        const res = await API.alerts.list();
        if (!res?.success) return;
        const unack = res.data.filter(a => !a.acknowledged).slice(0, 8);
        renderNotifications(unack);
        // Update badge count
        updateNotifBadge(unack.length);
    }

    function renderNotifications(alerts) {
        const list = document.getElementById('notif-list');
        if (!list) return;
        if (!alerts.length) {
            list.innerHTML = '<div class="notif-empty">No new notifications</div>';
            return;
        }
        list.innerHTML = alerts.map(a => {
            const icon = a.type === 'critical' ? '🔴' : a.type === 'warning' ? '⚠️' : 'ℹ️';
            const timeAgo = getTimeAgo(a.time);
            return `
        <div class="notif-item ${a.type}" onclick="App.handleNotifClick('${a.machine}', '${a.id}')">
          <span class="notif-icon">${icon}</span>
          <div class="notif-body">
            <div class="notif-title">${a.title}</div>
            <div class="notif-meta">${a.machine} · ${timeAgo}</div>
          </div>
        </div>
      `;
        }).join('');
    }

    function toggleNotifications() {
        notifOpen = !notifOpen;
        const panel = document.getElementById('notif-panel');
        if (panel) panel.classList.toggle('open', notifOpen);
        if (notifOpen) {
            loadNotifications();
            SoundFX.hoverClick();
        }
    }

    function closeNotifications() {
        notifOpen = false;
        const panel = document.getElementById('notif-panel');
        if (panel) panel.classList.remove('open');
    }

    function clearNotifications() {
        const list = document.getElementById('notif-list');
        if (list) list.innerHTML = '<div class="notif-empty">All caught up! ✅</div>';
        updateNotifBadge(0);
        closeNotifications();
    }

    function updateNotifBadge(count) {
        const badge = document.querySelector('.header-btn-badge');
        if (badge) {
            badge.style.display = count > 0 ? 'block' : 'none';
        }
        // Also update sidebar alert badge
        const navBadge = document.querySelector('.nav-item[data-view="alerts"] .nav-item-badge');
        if (navBadge) navBadge.textContent = count;
    }

    function handleNotifClick(machineId, alertId) {
        closeNotifications();
        if (machineId) {
            showMachineDetail(machineId);
        }
        // Acknowledge
        API.alerts.acknowledge(alertId);
    }

    function getTimeAgo(ts) {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    // ── WebSocket ──
    function connectToBackend() {
        API.connectWS();

        API.on('ws:connected', () => {
            wsConnected = true;
            console.log('[App] Backend WebSocket connected');
            Animations.showToast('🔌 Connected to backend server', 'success');
        });

        API.on('ws:disconnected', () => {
            wsConnected = false;
        });

        API.on('ws:live_update', (data) => {
            if (currentView === 'dashboard') updateDashboardFromWS(data);
        });

        API.on('ws:new_alert', (alert) => {
            SoundFX.alertBeep();
            Animations.showToast(
                `${alert.type === 'critical' ? '🔴' : '⚠️'} ${alert.title} — ${alert.machine}`,
                alert.type === 'critical' ? 'critical' : 'warning'
            );
            loadNotifications(); // Refresh notification panel
        });

        API.on('ws:inference_result', (result) => {
            SoundFX.predictionBeep();
        });
    }

    function getTimeGreeting() {
        const h = new Date().getHours();
        if (h < 12) return 'morning';
        if (h < 17) return 'afternoon';
        return 'evening';
    }

    function startClock() {
        updateClock();
        clockInterval = setInterval(updateClock, 30000);
    }

    function updateClock() {
        const el = document.getElementById('header-timestamp');
        if (el) {
            const now = new Date();
            const opts = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            el.textContent = now.toLocaleDateString('en-US', opts);
        }
    }

    function navigateTo(view) {
        cleanup(currentView);
        closeNotifications();
        currentView = view;

        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-view="${view}"]`);
        if (activeNav) activeNav.classList.add('active');

        const titles = {
            dashboard: 'Dashboard',
            machines: 'Machine Fleet',
            analytics: 'Predictive Analytics',
            alerts: 'Alert Center',
            ai: 'AI Model Insights',
            agent: 'Autonomous AI Agent'
        };
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = titles[view] || 'Dashboard';

        document.querySelectorAll('.view-page').forEach(p => p.classList.remove('active'));
        const viewEl = document.getElementById(`view-${view}`);
        if (viewEl) viewEl.classList.add('active');

        document.querySelector('.page-content')?.scrollTo(0, 0);
        SoundFX.hoverClick();

        switch (view) {
            case 'dashboard': Dashboard.render(); break;
            case 'machines': Machines.render(); break;
            case 'analytics': Predictions.render(); break;
            case 'alerts': Alerts.render(); break;
            case 'ai': AIInsights.render(); break;
            case 'agent': AIAgent.render(); break;
        }
    }

    function cleanup(view) {
        switch (view) {
            case 'ai': if (typeof AIInsights !== 'undefined') AIInsights.cleanup(); break;
            case 'machines': if (typeof DigitalTwin !== 'undefined') DigitalTwin.destroy(); break;
            case 'dashboard': if (typeof SystemStatus !== 'undefined') SystemStatus.destroy(); break;
            case 'agent': if (typeof AIAgent !== 'undefined') AIAgent.cleanup(); break;
        }
    }

    function showMachineDetail(machineId) {
        navigateTo('machines');
        setTimeout(() => Machines.showDetail(machineId), 100);
    }

    function startLiveUpdates() {
        updateInterval = setInterval(() => {
            if (currentView === 'dashboard' && !wsConnected) {
                updateDashboardReadings();
            }
            SoundFX.dataFlowTick();
        }, 3000);
    }

    function updateDashboardFromWS(data) {
        if (!data || !data.readings) return;
        const grid = document.getElementById('machine-fleet-grid');
        if (!grid) return;
        grid.querySelectorAll('.machine-card').forEach(card => {
            const sensors = card.querySelectorAll('.sensor-mini-value');
            if (sensors.length >= 4) {
                const machineId = card.querySelector('.machine-card-id')?.textContent?.split(' ')[0];
                if (machineId && data.readings[machineId]) {
                    const r = data.readings[machineId];
                    sensors[0].textContent = r.vibration.toFixed(1) + ' mm/s';
                    sensors[1].textContent = r.temperature.toFixed(0) + '°C';
                    sensors[2].textContent = r.pressure.toFixed(0) + ' PSI';
                    sensors[3].textContent = r.rpm.toFixed(0);
                    sensors.forEach(s => {
                        s.style.transition = 'color 0.3s';
                        s.style.color = 'var(--accent-cyan)';
                        setTimeout(() => s.style.color = '', 500);
                    });
                }
            }
        });
    }

    function updateDashboardReadings() {
        const grid = document.getElementById('machine-fleet-grid');
        if (!grid) return;
        grid.querySelectorAll('.machine-card').forEach(card => {
            const sensors = card.querySelectorAll('.sensor-mini-value');
            if (sensors.length >= 4) {
                const machineId = card.querySelector('.machine-card-id')?.textContent?.split(' ')[0];
                if (machineId) {
                    const readings = DataEngine.getMachineReadings(machineId);
                    if (readings) {
                        sensors[0].textContent = readings.vibration.toFixed(1) + ' mm/s';
                        sensors[1].textContent = readings.temperature.toFixed(0) + '°C';
                        sensors[2].textContent = readings.pressure.toFixed(0) + ' PSI';
                        sensors[3].textContent = readings.rpm.toFixed(0);
                        sensors.forEach(s => {
                            s.style.transition = 'color 0.3s';
                            s.style.color = 'var(--accent-cyan)';
                            setTimeout(() => s.style.color = '', 500);
                        });
                    }
                }
            }
        });
    }

    return { init, navigateTo, showMachineDetail, handleNotifClick, clearNotifications };
})();

document.addEventListener('DOMContentLoaded', App.init);
