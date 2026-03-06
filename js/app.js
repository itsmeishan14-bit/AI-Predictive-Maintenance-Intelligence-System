// ============================================
// APP — Main Application Controller
// Connected to Backend via REST + WebSocket
// ============================================

const App = (() => {
    let currentView = 'dashboard';
    let updateInterval = null;
    let clockInterval = null;
    let wsConnected = false;

    function init() {
        // Start particle background
        ParticleSystem.init();

        // Connect to backend WebSocket
        connectToBackend();

        navigateTo('dashboard');
        startLiveUpdates();
        startClock();

        // Welcome toasts
        setTimeout(() => {
            Animations.showToast('Good ' + getTimeGreeting() + '! PredictAI system online — monitoring 11 machines.', 'success');
            SoundFX.successBeep();
        }, 1500);
        setTimeout(() => {
            Animations.showToast('⚠ LTH-002: Bearing failure predicted within 48 hrs — review recommended', 'critical');
            SoundFX.alertBeep();
        }, 6000);

        // Enable audio context on first interaction
        document.addEventListener('click', () => { try { SoundFX.hoverClick(); } catch (e) { } }, { once: true });
    }

    function connectToBackend() {
        API.connectWS();

        // WebSocket event handlers
        API.on('ws:connected', () => {
            wsConnected = true;
            console.log('[App] Backend WebSocket connected');
            Animations.showToast('🔌 Connected to backend server', 'success');
        });

        API.on('ws:disconnected', () => {
            wsConnected = false;
            console.log('[App] Backend WebSocket disconnected');
        });

        // Handle live data updates from backend
        API.on('ws:live_update', (data) => {
            if (currentView === 'dashboard') {
                updateDashboardFromWS(data);
            }
        });

        // Handle new alerts from backend
        API.on('ws:new_alert', (alert) => {
            SoundFX.alertBeep();
            Animations.showToast(
                `${alert.type === 'critical' ? '🔴' : '⚠️'} ${alert.title} — ${alert.machine}`,
                alert.type === 'critical' ? 'critical' : 'warning'
            );
            // Update badge
            const badge = document.querySelector('.nav-item-badge');
            if (badge) {
                badge.textContent = parseInt(badge.textContent || '0') + 1;
            }
        });

        // Handle inference results from backend
        API.on('ws:inference_result', (result) => {
            SoundFX.predictionBeep();
            console.log('[App] Inference result:', result?.machineId, result?.confidence + '%');
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
        currentView = view;

        // Update nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const activeNav = document.querySelector(`.nav-item[data-view="${view}"]`);
        if (activeNav) activeNav.classList.add('active');

        // Update header
        const titles = {
            dashboard: 'Dashboard',
            machines: 'Machine Fleet',
            analytics: 'Predictive Analytics',
            alerts: 'Alert Center',
            ai: 'AI Model Insights'
        };
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = titles[view] || 'Dashboard';

        // Show view
        document.querySelectorAll('.view-page').forEach(p => p.classList.remove('active'));
        const viewEl = document.getElementById(`view-${view}`);
        if (viewEl) viewEl.classList.add('active');

        document.querySelector('.page-content')?.scrollTo(0, 0);
        SoundFX.hoverClick();

        // Render
        switch (view) {
            case 'dashboard': Dashboard.render(); break;
            case 'machines': Machines.render(); break;
            case 'analytics': Predictions.render(); break;
            case 'alerts': Alerts.render(); break;
            case 'ai': AIInsights.render(); break;
        }
    }

    function cleanup(view) {
        switch (view) {
            case 'ai':
                if (typeof AIInsights !== 'undefined') AIInsights.cleanup();
                break;
            case 'machines':
                if (typeof DigitalTwin !== 'undefined') DigitalTwin.destroy();
                break;
            case 'dashboard':
                if (typeof SystemStatus !== 'undefined') SystemStatus.destroy();
                break;
        }
    }

    function showMachineDetail(machineId) {
        navigateTo('machines');
        setTimeout(() => Machines.showDetail(machineId), 100);
    }

    function startLiveUpdates() {
        updateInterval = setInterval(() => {
            if (currentView === 'dashboard' && !wsConnected) {
                // Fallback to local data if WebSocket isn't connected
                updateDashboardReadings();
            }
            SoundFX.dataFlowTick();
        }, 3000);
    }

    // Update dashboard from WebSocket data
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

    // Local fallback update
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

    return { init, navigateTo, showMachineDetail };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
