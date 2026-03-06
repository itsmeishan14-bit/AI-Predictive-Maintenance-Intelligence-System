// ============================================
// ROUTES — System Status API
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/system/status — System status
router.get('/status', (req, res) => {
    try {
        res.json({ success: true, data: db.updateSystemStatus() });
    } catch (err) {
        console.error('[System] Status error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to get system status' });
    }
});

// GET /api/system/kpis — KPI dashboard data
router.get('/kpis', (req, res) => {
    try {
        res.json({ success: true, data: db.getKPIs() });
    } catch (err) {
        console.error('[System] KPIs error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to get KPIs' });
    }
});

// GET /api/system/health — Simple health check
router.get('/health', (req, res) => {
    try {
        res.json({
            success: true,
            status: 'healthy',
            uptime: Math.floor((Date.now() - db.systemStatus.serverStartTime) / 1000),
            version: '2.0.0',
            model: db.systemStatus.modelVersion
        });
    } catch (err) {
        console.error('[System] Health error:', err.message);
        res.status(500).json({ success: false, error: 'Health check failed' });
    }
});

module.exports = router;
