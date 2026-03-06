// ============================================
// ROUTES — Predictions API
// ============================================

const express = require('express');
const router = express.Router();
const aiEngine = require('../ai-engine');

// GET /api/predictions — All machine predictions
router.get('/', (req, res) => {
    try {
        const predictions = aiEngine.getPredictions();
        res.json({ success: true, data: predictions, count: predictions.length });
    } catch (err) {
        console.error('[Predictions] List error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to generate predictions' });
    }
});

// POST /api/predictions/inference — Run inference on a specific machine
router.post('/inference', (req, res) => {
    try {
        const { machineId } = req.body;
        if (!machineId) return res.status(400).json({ success: false, error: 'machineId is required' });
        const result = aiEngine.runInference(machineId);
        if (!result) return res.status(404).json({ success: false, error: 'Machine not found or offline' });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Predictions] Inference error:', err.message);
        res.status(500).json({ success: false, error: 'Inference failed: ' + err.message });
    }
});

// GET /api/predictions/:machineId — Single machine prediction
router.get('/:machineId', (req, res) => {
    try {
        const result = aiEngine.runInference(req.params.machineId);
        if (!result) return res.status(404).json({ success: false, error: 'Machine not found or offline' });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('[Predictions] Get error:', err.message);
        res.status(500).json({ success: false, error: 'Failed to get prediction' });
    }
});

module.exports = router;
