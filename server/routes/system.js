// ============================================
// ROUTES — System Status API
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/system/status — System status
router.get('/status', (req, res) => {
    res.json({ success: true, data: db.updateSystemStatus() });
});

// GET /api/system/kpis — KPI dashboard data
router.get('/kpis', (req, res) => {
    res.json({ success: true, data: db.getKPIs() });
});

// GET /api/system/health — Simple health check
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: Math.floor((Date.now() - db.systemStatus.serverStartTime) / 1000),
        version: '2.0.0',
        model: db.systemStatus.modelVersion
    });
});

module.exports = router;
