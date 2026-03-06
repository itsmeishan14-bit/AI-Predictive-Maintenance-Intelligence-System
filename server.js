// ============================================
// SERVER — PredictAI Backend
// Express + WebSocket + Static Files
// ============================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { initWebSocket } = require('./server/websocket');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        const start = Date.now();
        res.on('finish', () => {
            const ms = Date.now() - start;
            console.log(`[API] ${req.method} ${req.url} — ${res.statusCode} (${ms}ms)`);
        });
    }
    next();
});

// ── API Routes ──
app.use('/api/machines', require('./server/routes/machines'));
app.use('/api/predictions', require('./server/routes/predictions'));
app.use('/api/alerts', require('./server/routes/alerts'));
app.use('/api/system', require('./server/routes/system'));

// ── API Info ──
app.get('/api', (req, res) => {
    res.json({
        name: 'PredictAI API',
        version: '2.0.0',
        endpoints: {
            machines: {
                'GET /api/machines': 'List all machines (query: ?status=healthy|warning|critical)',
                'GET /api/machines/:id': 'Machine details + live readings',
                'GET /api/machines/:id/readings': 'Live sensor readings',
                'GET /api/machines/:id/history': 'Sensor history (query: ?sensor=vibration&points=60)'
            },
            predictions: {
                'GET /api/predictions': 'All machine predictions',
                'GET /api/predictions/:machineId': 'Single machine prediction',
                'POST /api/predictions/inference': 'Run inference (body: { machineId })'
            },
            alerts: {
                'GET /api/alerts': 'All alerts (query: ?type=critical&acknowledged=false)',
                'GET /api/alerts/:id': 'Single alert',
                'PUT /api/alerts/:id/acknowledge': 'Acknowledge an alert',
                'POST /api/alerts': 'Create alert (body: { type, machine, title, desc })'
            },
            system: {
                'GET /api/system/status': 'System metrics (GPU, latency, etc.)',
                'GET /api/system/kpis': 'Dashboard KPIs',
                'GET /api/system/health': 'Health check'
            },
            websocket: {
                'ws://host/ws': 'Real-time data stream (sensor readings, alerts, system status)'
            }
        }
    });
});

// ── Static Files (Frontend) ──
app.use(express.static(path.join(__dirname)));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ── Start Server + WebSocket ──
const wss = initWebSocket(server);

server.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║         PredictAI — Backend Server            ║');
    console.log('╠═══════════════════════════════════════════════╣');
    console.log(`║  🌐 HTTP:      http://localhost:${PORT}            ║`);
    console.log(`║  🔌 WebSocket: ws://localhost:${PORT}/ws           ║`);
    console.log(`║  📡 API Docs:  http://localhost:${PORT}/api        ║`);
    console.log('║  🧠 AI Engine: Online                         ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');
});
