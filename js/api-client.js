// ============================================
// API CLIENT — Frontend ↔ Backend Bridge
// REST fetch wrapper + WebSocket client
// ============================================

const API = (() => {
    const BASE = window.location.origin;
    let ws = null;
    let wsReconnectTimer = null;
    let listeners = {};

    // ── REST Methods ──
    async function get(endpoint) {
        try {
            const res = await fetch(`${BASE}${endpoint}`);
            const json = await res.json();
            return json;
        } catch (err) {
            console.error(`[API] GET ${endpoint} failed:`, err);
            return { success: false, error: err.message };
        }
    }

    async function post(endpoint, body) {
        try {
            const res = await fetch(`${BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return await res.json();
        } catch (err) {
            console.error(`[API] POST ${endpoint} failed:`, err);
            return { success: false, error: err.message };
        }
    }

    async function put(endpoint) {
        try {
            const res = await fetch(`${BASE}${endpoint}`, { method: 'PUT' });
            return await res.json();
        } catch (err) {
            console.error(`[API] PUT ${endpoint} failed:`, err);
            return { success: false, error: err.message };
        }
    }

    // ── Machines ──
    const machines = {
        list: (status) => get(`/api/machines${status ? '?status=' + status : ''}`),
        get: (id) => get(`/api/machines/${id}`),
        readings: (id) => get(`/api/machines/${id}/readings`),
        history: (id, sensor, points) => get(`/api/machines/${id}/history?sensor=${sensor || 'vibration'}&points=${points || 60}`)
    };

    // ── Predictions ──
    const predictions = {
        list: () => get('/api/predictions'),
        get: (machineId) => get(`/api/predictions/${machineId}`),
        inference: (machineId) => post('/api/predictions/inference', { machineId })
    };

    // ── Alerts ──
    const alerts = {
        list: (type, acknowledged) => {
            let q = '/api/alerts?';
            if (type) q += `type=${type}&`;
            if (acknowledged !== undefined) q += `acknowledged=${acknowledged}`;
            return get(q);
        },
        get: (id) => get(`/api/alerts/${id}`),
        acknowledge: (id) => put(`/api/alerts/${id}/acknowledge`),
        create: (data) => post('/api/alerts', data)
    };

    // ── System ──
    const system = {
        status: () => get('/api/system/status'),
        kpis: () => get('/api/system/kpis'),
        health: () => get('/api/system/health')
    };

    // ── WebSocket ──
    function connectWS() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('[WS] Connected to', wsUrl);
                emit('ws:connected');
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    emit(`ws:${msg.type}`, msg.data || msg);
                } catch (e) {
                    console.warn('[WS] Parse error:', e);
                }
            };

            ws.onclose = () => {
                console.log('[WS] Disconnected. Reconnecting in 3s...');
                emit('ws:disconnected');
                wsReconnectTimer = setTimeout(connectWS, 3000);
            };

            ws.onerror = (err) => {
                console.warn('[WS] Error:', err);
                ws.close();
            };
        } catch (err) {
            console.warn('[WS] Connection failed:', err);
            wsReconnectTimer = setTimeout(connectWS, 3000);
        }
    }

    function sendWS(type, data) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type, ...data }));
        }
    }

    function disconnectWS() {
        if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
        if (ws) { ws.onclose = null; ws.close(); }
    }

    // ── Event System ──
    function on(event, callback) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(callback);
    }

    function off(event, callback) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(cb => cb !== callback);
    }

    function emit(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(cb => {
                try { cb(data); } catch (e) { console.error(`[API] Event handler error for ${event}:`, e); }
            });
        }
    }

    return {
        machines, predictions, alerts, system,
        connectWS, sendWS, disconnectWS,
        on, off
    };
})();
