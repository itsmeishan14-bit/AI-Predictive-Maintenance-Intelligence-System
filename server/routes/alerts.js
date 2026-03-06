// ============================================
// ROUTES — Alerts API
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/alerts — All alerts
router.get('/', (req, res) => {
    try {
        const { type, acknowledged } = req.query;
        let result = [...db.alerts].sort((a, b) => b.time - a.time);
        if (type) result = result.filter(a => a.type === type);
        if (acknowledged !== undefined) result = result.filter(a => a.acknowledged === (acknowledged === 'true'));
        res.json({ success: true, data: result, count: result.length });
    } catch (err) {
        console.error('[Alerts] List error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to list alerts' });
    }
});

// GET /api/alerts/:id — Single alert
router.get('/:id', (req, res) => {
    try {
        const alert = db.alerts.find(a => a.id === req.params.id);
        if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
        res.json({ success: true, data: alert });
    } catch (err) {
        console.error('[Alerts] Get error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to get alert' });
    }
});

// PUT /api/alerts/:id/acknowledge — Acknowledge an alert
router.put('/:id/acknowledge', (req, res) => {
    try {
        const alert = db.alerts.find(a => a.id === req.params.id);
        if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
        alert.acknowledged = true;
        res.json({ success: true, data: alert, message: 'Alert acknowledged' });
    } catch (err) {
        console.error('[Alerts] Acknowledge error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
    }
});

// POST /api/alerts — Create a new alert (from AI engine)
router.post('/', (req, res) => {
    try {
        const { type, machine, title, desc, sensor, value } = req.body;
        if (!type || !machine || !title) {
            return res.status(400).json({ success: false, error: 'type, machine, and title are required' });
        }
        const newAlert = {
            id: db.nextAlertId(),
            type, machine, title,
            desc: desc || '',
            sensor: sensor || '',
            value: value || 0,
            time: Date.now(),
            acknowledged: false
        };
        db.alerts.unshift(newAlert);
        res.status(201).json({ success: true, data: newAlert });
    } catch (err) {
        console.error('[Alerts] Create error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to create alert' });
    }
});

module.exports = router;
