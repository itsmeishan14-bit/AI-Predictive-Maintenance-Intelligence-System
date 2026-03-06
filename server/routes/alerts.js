// ============================================
// ROUTES — Alerts API
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/alerts — All alerts
router.get('/', (req, res) => {
    const { type, acknowledged } = req.query;
    let result = [...db.alerts].sort((a, b) => b.time - a.time);
    if (type) result = result.filter(a => a.type === type);
    if (acknowledged !== undefined) result = result.filter(a => a.acknowledged === (acknowledged === 'true'));
    res.json({ success: true, data: result, count: result.length });
});

// GET /api/alerts/:id — Single alert
router.get('/:id', (req, res) => {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    res.json({ success: true, data: alert });
});

// PUT /api/alerts/:id/acknowledge — Acknowledge an alert
router.put('/:id/acknowledge', (req, res) => {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    alert.acknowledged = true;
    res.json({ success: true, data: alert, message: 'Alert acknowledged' });
});

// POST /api/alerts — Create a new alert (from AI engine)
router.post('/', (req, res) => {
    const { type, machine, title, desc, sensor, value } = req.body;
    if (!type || !machine || !title) {
        return res.status(400).json({ success: false, error: 'type, machine, and title are required' });
    }
    const newAlert = {
        id: 'ALT-' + String(db.alerts.length + 1).padStart(3, '0'),
        type, machine, title,
        desc: desc || '',
        sensor: sensor || '',
        value: value || 0,
        time: Date.now(),
        acknowledged: false
    };
    db.alerts.unshift(newAlert);
    res.status(201).json({ success: true, data: newAlert });
});

module.exports = router;
