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
        ws.send(JSON.stringify({
            type: 'init',
            data: {
                machines: db.machines,
                kpis: db.getKPIs(),
                systemStatus: db.updateSystemStatus(),
                alerts: db.alerts.slice(0, 5)
            }
        }));

        ws.on('message', (raw) => {
            try {
                const msg = JSON.parse(raw);
                handleClientMessage(ws, msg);
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        });

        ws.on('close', () => {
            console.log('[WS] Client disconnected. Total:', wss.clients.size);
        });
    });

    // Handle messages from frontend
    function handleClientMessage(ws, msg) {
        switch (msg.type) {
            case 'inference':
                const result = aiEngine.runInference(msg.machineId);
                ws.send(JSON.stringify({ type: 'inference_result', data: result }));
                break;
            case 'get_readings':
                const readings = db.getMachineReadings(msg.machineId);
                ws.send(JSON.stringify({ type: 'readings', machineId: msg.machineId, data: readings }));
                break;
            case 'acknowledge_alert':
                const alert = db.alerts.find(a => a.id === msg.alertId);
                if (alert) {
                    alert.acknowledged = true;
                    broadcast(wss, { type: 'alert_updated', data: alert });
                }
                break;
        }
    }

    // Broadcast live data to all connected clients every 3 seconds
    broadcastInterval = setInterval(() => {
        if (wss.clients.size === 0) return;

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
                    id: 'ALT-' + String(db.alerts.length + 1).padStart(3, '0'),
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
            client.send(json);
        }
    });
}

module.exports = { initWebSocket };
