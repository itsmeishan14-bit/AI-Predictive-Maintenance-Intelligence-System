// ============================================
// ROUTES — AI Agent API
// ============================================

const express = require('express');
const router = express.Router();
const agent = require('../agent-engine');

// GET /api/agent/status — Agent status
router.get('/status', (req, res) => {
    res.json({ success: true, data: agent.getStatus() });
});

// POST /api/agent/start — Start the agent
router.post('/start', (req, res) => {
    agent.start();
    res.json({ success: true, message: 'Agent started', data: agent.getStatus() });
});

// POST /api/agent/stop — Stop the agent
router.post('/stop', (req, res) => {
    agent.stop();
    res.json({ success: true, message: 'Agent stopped', data: agent.getStatus() });
});

// GET /api/agent/logs — Agent activity log
router.get('/logs', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({ success: true, data: agent.getLogs(limit) });
});

// GET /api/agent/insights — Agent-generated insights
router.get('/insights', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json({ success: true, data: agent.getInsights(limit) });
});

// GET /api/agent/decisions — Agent maintenance decisions
router.get('/decisions', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json({ success: true, data: agent.getDecisions(limit) });
});

// POST /api/agent/ask — Ask the agent a question
router.post('/ask', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ success: false, error: 'question is required' });
    const answer = await agent.ask(question);
    res.json({ success: true, data: { question, answer, timestamp: Date.now() } });
});

module.exports = router;
