// ============================================
// SERVER — PredictAI Backend
// Express + WebSocket + Static Files
// ============================================

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { initWebSocket } = require('./server/websocket');
const agent = require('./server/agent-engine');

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
app.use('/api/agent', require('./server/routes/agent'));

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
            },
            agent: {
                'GET /api/agent/status': 'Agent status (running/idle, cycle count, stats)',
                'POST /api/agent/start': 'Start autonomous monitoring',
                'POST /api/agent/stop': 'Stop autonomous monitoring',
                'GET /api/agent/logs': 'Activity log (query: ?limit=50)',
                'GET /api/agent/insights': 'AI-generated insights',
                'GET /api/agent/decisions': 'Maintenance decisions',
                'POST /api/agent/ask': 'Ask the agent a question (body: { question })'
            }
        }
    });
});

// ── Static Files (Frontend) ──
app.use(express.static(path.join(__dirname)));

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

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
    console.log('║  🤖 AI Agent:  Autonomous Mode                ║');
    console.log('╚═══════════════════════════════════════════════╝');
    console.log('');

    // Connect agent broadcasts to WebSocket
    const WebSocket = require('ws');
    agent.onBroadcast = (data) => {
        const json = JSON.stringify(data);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) client.send(json);
        });
    };

    // Auto-start the agent
    agent.start();
    console.log('[Agent] Autonomous AI agent started.');
});

// ── Process-Level Error Handlers ──
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled rejection:', reason);
});
