// ============================================
// WEBSOCKET — Real-Time Data Broadcasting
// ============================================

const WebSocket = require('ws');
const db = require('./database');
const aiEngine = require('./ai-engine');

function initWebSocket(server) {
    const wss = new WebSocket.Server({ server, path: '/ws' });
    let broadcastInterval = null;

    wss.on('connection', (ws) => {
        console.log('[WS] Client connected. Total:', wss.clients.size);

        // Send initial state on connect
        try {
            ws.send(JSON.stringify({
                type: 'init',
                data: {
                    machines: db.machines,
                    kpis: db.getKPIs(),
                    systemStatus: db.updateSystemStatus(),
                    alerts: db.alerts.slice(0, 5)
                }
            }));
        } catch (err) {
            console.error('[WS] Failed to send init data:', err.message);
        }

        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw);
                handleClientMessage(ws, msg);
            } catch (e) {
                try {
                    ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
                } catch (_) { /* client may have disconnected */ }
            }
        });

        ws.on('close', () => {
            console.log('[WS] Client disconnected. Total:', wss.clients.size);
        });

        ws.on('error', (err) => {
            console.error('[WS] Client error:', err.message);
        });
    });

    // Handle messages from frontend
    function handleClientMessage(ws, msg) {
        try {
            switch (msg.type) {
                case 'inference':
                    if (!msg.machineId) {
                        ws.send(JSON.stringify({ type: 'error', message: 'machineId is required' }));
                        return;
                    }
                    const result = aiEngine.runInference(msg.machineId);
                    ws.send(JSON.stringify({ type: 'inference_result', data: result }));
                    break;
                case 'get_readings':
                    if (!msg.machineId) {
                        ws.send(JSON.stringify({ type: 'error', message: 'machineId is required' }));
                        return;
                    }
                    const readings = db.getMachineReadings(msg.machineId);
                    ws.send(JSON.stringify({ type: 'readings', machineId: msg.machineId, data: readings }));
                    break;
                case 'acknowledge_alert':
                    if (!msg.alertId) {
                        ws.send(JSON.stringify({ type: 'error', message: 'alertId is required' }));
                        return;
                    }
                    const alert = db.alerts.find(a => a.id === msg.alertId);
                    if (alert) {
                        alert.acknowledged = true;
                        broadcast(wss, { type: 'alert_updated', data: alert });
                    }
                    break;
                default:
                    ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type: ' + msg.type }));
            }
        } catch (err) {
            console.error('[WS] handleClientMessage error:', err.message);
            try {
                ws.send(JSON.stringify({ type: 'error', message: 'Server error processing your request' }));
            } catch (_) { /* client may have disconnected */ }
        }
    }

    // Broadcast live data to all connected clients every 3 seconds
    broadcastInterval = setInterval(() => {
        if (wss.clients.size === 0) return;

        try {
            // Get fresh readings for all active machines
            const allReadings = db.getAllReadings();
            const systemStatus = db.updateSystemStatus();
            const kpis = db.getKPIs();

            const payload = {
                type: 'live_update',
                data: {
                    readings: allReadings,
                    systemStatus,
                    kpis,
                    timestamp: Date.now()
                }
            };

            broadcast(wss, payload);

            // Occasionally generate a random alert
            if (Math.random() < 0.05) {
                const atRiskMachines = db.machines.filter(m => m.health < 60 && m.status !== 'offline');
                if (atRiskMachines.length > 0) {
                    const m = atRiskMachines[Math.floor(Math.random() * atRiskMachines.length)];
                    const newAlert = {
                        id: db.nextAlertId(),
                        type: m.health < 40 ? 'critical' : 'warning',
                        machine: m.id,
                        title: m.health < 40 ? 'Anomaly Spike Detected' : 'Sensor Drift Warning',
                        desc: `AI detected unusual pattern in ${m.name} — confidence ${(85 + Math.random() * 10).toFixed(1)}%`,
                        sensor: 'vibration',
                        value: +(3 + Math.random() * 5).toFixed(1),
                        time: Date.now(),
                        acknowledged: false
                    };
                    db.alerts.unshift(newAlert);
                    broadcast(wss, { type: 'new_alert', data: newAlert });
                }
            }
        } catch (err) {
            console.error('[WS] Broadcast interval error:', err.message);
        }
    }, 3000);

    // Cleanup
    wss.on('close', () => {
        if (broadcastInterval) clearInterval(broadcastInterval);
    });

    return wss;
}

function broadcast(wss, data) {
    const json = JSON.stringify(data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(json);
            } catch (err) {
                console.error('[WS] Send error:', err.message);
            }
        }
    });
}

module.exports = { initWebSocket };
