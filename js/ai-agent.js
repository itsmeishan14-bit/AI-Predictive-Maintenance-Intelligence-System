// ============================================
// AI AGENT — Frontend Panel
// Activity log, insights, thinking animation
// ============================================

const AIAgent = (() => {
    let agentLogListener = null;
    let agentInsightListener = null;
    let agentStatusListener = null;
    let statusPollTimer = null;

    function render() {
        const container = document.getElementById('view-agent');
        if (!container) return;

        container.innerHTML = `
      <!-- Agent Hero -->
      <div class="agent-hero holo-card animate-in">
        <div class="scanline-overlay"></div>
        <div class="agent-hero-inner">
          <div class="agent-avatar-wrap">
            <div class="agent-avatar" id="agent-avatar">
              <div class="agent-avatar-ring"></div>
              <span>🤖</span>
            </div>
          </div>
          <div class="agent-hero-info">
            <h2 class="agent-hero-title">Autonomous AI Agent</h2>
            <p class="agent-hero-sub">Continuously monitors machines, runs inference, detects anomalies, and makes maintenance decisions without human intervention.</p>
            <div class="agent-hero-stats" id="agent-stats">
              <div class="agent-stat"><span class="agent-stat-val" id="agent-cycles">0</span><span class="agent-stat-label">Cycles</span></div>
              <div class="agent-stat"><span class="agent-stat-val" id="agent-inferences">0</span><span class="agent-stat-label">Inferences</span></div>
              <div class="agent-stat"><span class="agent-stat-val" id="agent-anomalies">0</span><span class="agent-stat-label">Anomalies</span></div>
              <div class="agent-stat"><span class="agent-stat-val" id="agent-decisions-count">0</span><span class="agent-stat-label">Decisions</span></div>
            </div>
          </div>
          <div class="agent-controls">
            <button class="btn btn-primary agent-btn-start" id="agent-btn-toggle" onclick="AIAgent.toggleAgent()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Agent
            </button>
            <div class="agent-status-chip" id="agent-status-chip">
              <span class="agent-status-dot idle"></span>
              <span id="agent-status-text">Idle</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Current Task -->
      <div class="section">
        <div class="agent-thinking-bar" id="agent-thinking-bar" style="display:none">
          <div class="agent-thinking-pulse"></div>
          <span class="agent-thinking-text" id="agent-thinking-text">Analyzing sensor data...</span>
        </div>
      </div>

      <!-- Ask the Agent -->
      <div class="section">
        <div class="chart-card holo-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">💬 Ask the Agent</div>
              <div class="chart-card-subtitle">Ask questions in natural language — the agent uses real backend data</div>
            </div>
          </div>
          <div class="chart-card-body">
            <div class="agent-ask-area">
              <input type="text" class="agent-ask-input" id="agent-ask-input" placeholder="e.g. What's your biggest concern right now?" onkeydown="if(event.key==='Enter')AIAgent.askAgent()">
              <button class="btn btn-primary" onclick="AIAgent.askAgent()">Ask</button>
            </div>
            <div id="agent-ask-response" class="agent-ask-response"></div>
            <div class="agent-quick-asks">
              <button class="chat-quick-btn" onclick="AIAgent.quickAsk('What is your biggest concern?')">🔴 Biggest risk?</button>
              <button class="chat-quick-btn" onclick="AIAgent.quickAsk('Give me a summary')">📊 Fleet summary</button>
              <button class="chat-quick-btn" onclick="AIAgent.quickAsk('Predict next failures')">🔮 Failure forecast</button>
              <button class="chat-quick-btn" onclick="AIAgent.quickAsk('How can we optimize?')">⚡ Optimize</button>
              <button class="chat-quick-btn" onclick="AIAgent.quickAsk('Should we shut anything down?')">🛑 Safety check</button>
              <button class="chat-quick-btn" onclick="AIAgent.quickAsk('Explain your reasoning')">🧠 Explain AI</button>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-grid" style="grid-template-columns: 1fr 1fr;">
        <!-- Insights -->
        <div class="chart-card holo-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">🧠 Agent Insights</div>
              <div class="chart-card-subtitle">AI-generated analysis and recommendations</div>
            </div>
            <span class="badge badge-info" style="font-size:10px" id="agent-insights-badge">0 insights</span>
          </div>
          <div class="chart-card-body">
            <div class="agent-insights-list" id="agent-insights-list">
              <div class="agent-empty-state">Agent hasn't generated insights yet. Start the agent to begin.</div>
            </div>
          </div>
        </div>

        <!-- Activity Log -->
        <div class="chart-card holo-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">📋 Activity Log</div>
              <div class="chart-card-subtitle">Real-time agent decisions and actions</div>
            </div>
            <span class="badge badge-info" style="font-size:10px" id="agent-log-badge">0 entries</span>
          </div>
          <div class="chart-card-body">
            <div class="agent-log-list" id="agent-log-list">
              <div class="agent-empty-state">No activity yet. Start the agent to see its thought process.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Maintenance Decisions -->
      <div class="section" style="margin-top:24px;">
        <div class="chart-card holo-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">📋 Maintenance Decisions</div>
              <div class="chart-card-subtitle">Autonomous scheduling by the AI agent</div>
            </div>
          </div>
          <div class="chart-card-body">
            <div id="agent-decisions-list" class="agent-decisions-list">
              <div class="agent-empty-state">No decisions yet. The agent will schedule maintenance as it detects issues.</div>
            </div>
          </div>
        </div>
      </div>
    `;

        // Setup WebSocket listeners
        setupListeners();
        // Fetch initial state
        fetchStatus();
        fetchLogs();
        fetchInsights();
        fetchDecisions();
        // Poll status
        statusPollTimer = setInterval(fetchStatus, 3000);
    }

    function setupListeners() {
        // Agent log stream
        agentLogListener = (data) => appendLog(data);
        API.on('ws:agent_log', agentLogListener);

        agentInsightListener = (data) => prependInsight(data);
        API.on('ws:agent_insight', agentInsightListener);

        agentStatusListener = (data) => updateStatusUI(data);
        API.on('ws:agent_status', agentStatusListener);

        API.on('ws:agent_cycle_complete', (data) => {
            SoundFX.dataFlowTick();
        });
    }

    async function toggleAgent() {
        const btn = document.getElementById('agent-btn-toggle');
        const chip = document.getElementById('agent-status-chip');
        const statusRes = await API.get('/api/agent/status');
        const isRunning = statusRes?.data?.status === 'running';

        if (isRunning) {
            await API.post('/api/agent/stop', {});
            SoundFX.alertBeep();
            Animations.showToast('🤖 Agent paused — autonomous monitoring suspended.', 'info');
        } else {
            await API.post('/api/agent/start', {});
            SoundFX.successBeep();
            Animations.showToast('🤖 Agent activated — autonomous monitoring started!', 'success');
        }
        fetchStatus();
    }

    async function fetchStatus() {
        const res = await API.get('/api/agent/status');
        if (res?.success) updateStatusUI(res.data);
    }

    function updateStatusUI(data) {
        if (!data) return;
        const btn = document.getElementById('agent-btn-toggle');
        const statusText = document.getElementById('agent-status-text');
        const statusDot = document.querySelector('.agent-status-dot');
        const avatar = document.getElementById('agent-avatar');
        const thinkingBar = document.getElementById('agent-thinking-bar');
        const thinkingText = document.getElementById('agent-thinking-text');

        const isRunning = data.status === 'running';

        if (btn) {
            btn.innerHTML = isRunning
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Agent'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Agent';
            btn.className = isRunning ? 'btn btn-ghost agent-btn-start' : 'btn btn-primary agent-btn-start';
        }
        if (statusText) statusText.textContent = isRunning ? 'Running' : 'Idle';
        if (statusDot) { statusDot.className = 'agent-status-dot ' + (isRunning ? 'running' : 'idle'); }
        if (avatar) avatar.className = isRunning ? 'agent-avatar active' : 'agent-avatar';
        if (thinkingBar) {
            thinkingBar.style.display = isRunning ? 'flex' : 'none';
        }
        if (thinkingText && data.currentTask) thinkingText.textContent = data.currentTask;

        // Stats
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('agent-cycles', data.cycleCount || 0);
        el('agent-inferences', data.totalInferences || 0);
        el('agent-anomalies', data.anomaliesDetected || 0);
        el('agent-decisions-count', data.decisionsCount || 0);
    }

    async function fetchLogs() {
        const res = await API.get('/api/agent/logs?limit=30');
        if (!res?.success || !res.data.length) return;
        const list = document.getElementById('agent-log-list');
        if (!list) return;
        list.innerHTML = '';
        res.data.forEach(log => appendLog(log, false));
        const badge = document.getElementById('agent-log-badge');
        if (badge) badge.textContent = res.data.length + ' entries';
    }

    async function fetchInsights() {
        const res = await API.get('/api/agent/insights?limit=10');
        if (!res?.success || !res.data.length) return;
        const list = document.getElementById('agent-insights-list');
        if (!list) return;
        list.innerHTML = '';
        res.data.forEach(ins => prependInsight(ins, false));
        const badge = document.getElementById('agent-insights-badge');
        if (badge) badge.textContent = res.data.length + ' insights';
    }

    async function fetchDecisions() {
        const res = await API.get('/api/agent/decisions?limit=10');
        if (!res?.success || !res.data.length) return;
        const list = document.getElementById('agent-decisions-list');
        if (!list) return;
        list.innerHTML = res.data.map(d => `
      <div class="agent-decision-card ${d.priority === 'URGENT' ? 'urgent' : ''}">
        <div class="agent-decision-header">
          <span class="agent-decision-priority ${d.priority.toLowerCase()}">${d.priority}</span>
          <span class="agent-decision-machine">${d.machineName}</span>
        </div>
        <div class="agent-decision-action">${d.action}</div>
        <div class="agent-decision-meta">${d.reasoning}</div>
        <div class="agent-decision-deadline">Deadline: ${new Date(d.deadline).toLocaleDateString()}</div>
      </div>
    `).join('');
    }

    function appendLog(log, animate = true) {
        const list = document.getElementById('agent-log-list');
        if (!list) return;
        // Remove empty state
        const empty = list.querySelector('.agent-empty-state');
        if (empty) empty.remove();

        const icons = { system: '⚙️', thinking: '🧠', insight: '💡', decision: '📋', alert: '🚨', summary: '📊', user: '👤', agent: '🤖' };
        const entry = document.createElement('div');
        entry.className = 'agent-log-entry' + (animate ? ' animate-in' : '');
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `
      <span class="agent-log-icon">${icons[log.type] || '📝'}</span>
      <div class="agent-log-content">
        <div class="agent-log-text">${formatMd(log.message)}</div>
        <div class="agent-log-time">${time}</div>
      </div>
    `;
        list.appendChild(entry);
        list.scrollTop = list.scrollHeight;

        // Update badge
        const badge = document.getElementById('agent-log-badge');
        if (badge) {
            const count = list.querySelectorAll('.agent-log-entry').length;
            badge.textContent = count + ' entries';
        }
    }

    function prependInsight(insight, animate = true) {
        const list = document.getElementById('agent-insights-list');
        if (!list) return;
        const empty = list.querySelector('.agent-empty-state');
        if (empty) empty.remove();

        const severityColors = { high: 'var(--accent-red)', medium: 'var(--accent-amber)', info: 'var(--accent-cyan)' };
        const card = document.createElement('div');
        card.className = 'agent-insight-card' + (animate ? ' animate-in' : '');
        const time = new Date(insight.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        card.innerHTML = `
      <div class="agent-insight-header">
        <span class="agent-insight-type" style="color:${severityColors[insight.severity] || severityColors.info}">${insight.type?.toUpperCase() || 'INSIGHT'}</span>
        <span class="agent-insight-time">${time}</span>
      </div>
      <div class="agent-insight-title">${insight.title || ''}</div>
      <div class="agent-insight-text">${formatMd(insight.text || '')}</div>
      ${insight.machine ? `<span class="agent-insight-machine">${insight.machine}</span>` : ''}
    `;
        list.insertBefore(card, list.firstChild);

        const badge = document.getElementById('agent-insights-badge');
        if (badge) {
            const count = list.querySelectorAll('.agent-insight-card').length;
            badge.textContent = count + ' insights';
        }
    }

    async function askAgent() {
        const input = document.getElementById('agent-ask-input');
        const responseDiv = document.getElementById('agent-ask-response');
        if (!input || !responseDiv) return;
        const question = input.value.trim();
        if (!question) return;
        input.value = '';

        responseDiv.innerHTML = '<div class="agent-ask-thinking"><div class="typing-dots"><span></span><span></span><span></span></div> Agent is thinking...</div>';
        SoundFX.hoverClick();

        const res = await API.post('/api/agent/ask', { question });
        if (res?.success) {
            responseDiv.innerHTML = `
        <div class="agent-ask-q">🗣️ ${escHtml(question)}</div>
        <div class="agent-ask-a">🤖 ${formatMd(res.data.answer)}</div>
      `;
            SoundFX.predictionBeep();
        } else {
            responseDiv.innerHTML = '<div class="agent-ask-a" style="color:var(--accent-red)">❌ Failed to reach the agent. Is the server running?</div>';
        }
    }

    function quickAsk(question) {
        document.getElementById('agent-ask-input').value = question;
        askAgent();
    }

    function formatMd(text) {
        return (text || '')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');
    }

    function escHtml(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function cleanup() {
        if (agentLogListener) API.off('ws:agent_log', agentLogListener);
        if (agentInsightListener) API.off('ws:agent_insight', agentInsightListener);
        if (agentStatusListener) API.off('ws:agent_status', agentStatusListener);
        if (statusPollTimer) clearInterval(statusPollTimer);
        agentLogListener = null;
        agentInsightListener = null;
        agentStatusListener = null;
        statusPollTimer = null;
    }

    return { render, toggleAgent, askAgent, quickAsk, cleanup };
})();
