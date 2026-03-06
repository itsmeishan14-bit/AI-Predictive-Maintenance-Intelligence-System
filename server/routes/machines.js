// ============================================
// ROUTES — Machines API
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/machines — List all machines
router.get('/', (req, res) => {
    const { status } = req.query;
    let result = db.machines;
    if (status && status !== 'all') {
        result = result.filter(m => m.status === status);
    }
    res.json({ success: true, data: result, count: result.length });
});

// GET /api/machines/:id — Single machine details
router.get('/:id', (req, res) => {
    const machine = db.machines.find(m => m.id === req.params.id);
    if (!machine) return res.status(404).json({ success: false, error: 'Machine not found' });
    const readings = db.getMachineReadings(machine.id);
    res.json({ success: true, data: { ...machine, readings } });
});

// GET /api/machines/:id/readings — Live sensor readings
router.get('/:id/readings', (req, res) => {
    const readings = db.getMachineReadings(req.params.id);
    if (!readings) return res.status(404).json({ success: false, error: 'Machine not found or offline' });
    res.json({ success: true, data: readings });
});

// GET /api/machines/:id/history — Sensor history
router.get('/:id/history', (req, res) => {
    const history = db.sensorHistory[req.params.id];
    if (!history) return res.status(404).json({ success: false, error: 'Machine not found' });
    const sensor = req.query.sensor || 'vibration';
    const points = parseInt(req.query.points) || 60;
    const data = (history[sensor] || []).slice(-points);
    res.json({ success: true, data, sensor, machineId: req.params.id });
});

module.exports = router;
