// ============================================
// CHATBOT — AI Maintenance Assistant
// NLP intent matching + contextual responses
// ============================================

const Chatbot = (() => {
    let isOpen = false;
    let messages = [];
    let typingTimer = null;

    const BOT_NAME = 'PredictAI Assistant';
    const BOT_AVATAR = '🤖';

    // Quick action suggestions
    const QUICK_ACTIONS = [
        { label: '📊 System Status', query: 'system status' },
        { label: '⚠️ Critical Alerts', query: 'show critical alerts' },
        { label: '🏭 Machine Health', query: 'fleet health overview' },
        { label: '🧠 AI Model Info', query: 'tell me about the AI model' },
        { label: '🔮 Predictions', query: 'which machines are at risk' },
        { label: '📈 OEE Report', query: 'what is the current OEE' }
    ];

    // Intent patterns and handlers
    const INTENTS = [
        {
            patterns: [/hello|hi|hey|greetings|good\s*(morning|afternoon|evening)/i],
            handler: () => {
                const h = new Date().getHours();
                const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
                return `${greeting}! 👋 I'm your AI maintenance assistant. I can help you with:\n\n• **Machine health** and sensor data\n• **Failure predictions** and risk analysis\n• **Active alerts** and maintenance recommendations\n• **System performance** metrics\n\nWhat would you like to know?`;
            }
        },
        {
            patterns: [/system\s*status|how.*system|server\s*status/i],
            handler: async () => {
                const res = await API.system.status();
                if (!res.success) return 'Unable to reach the backend server. Please check if the server is running.';
                const s = res.data;
                return `**⚡ System Status Report**\n\n| Metric | Value |\n|--------|-------|\n| GPU Load | ${s.gpuUsage}% |\n| GPU Temp | ${s.gpuTemp}°C |\n| Inference Latency | ${s.inferenceLatency}ms |\n| Throughput | ${s.throughput}/s |\n| Model Confidence | ${s.modelConfidence}% |\n| Sensors Online | ${s.sensorsOnline}/${s.sensorsTotal} |\n| Data Ingested | ${Number(s.dataIngested).toFixed(1)} MB |\n| Uptime | ${formatUptime(s.uptime)} |\n\nAll systems are **operational**. ✅`;
            }
        },
        {
            patterns: [/critical\s*alert|danger|emergency|urgent/i],
            handler: async () => {
                const res = await API.alerts.list('critical');
                if (!res.success) return fallbackAlerts('critical');
                const criticals = res.data.filter(a => !a.acknowledged);
                if (criticals.length === 0) return '✅ **No unacknowledged critical alerts.** All critical issues have been resolved.';
                let msg = `🔴 **${criticals.length} Critical Alert${criticals.length > 1 ? 's' : ''}:**\n\n`;
                criticals.forEach((a, i) => {
                    msg += `**${i + 1}. ${a.title}**\n`;
                    msg += `   Machine: \`${a.machine}\` | ${a.desc}\n`;
                    msg += `   Sensor: ${a.sensor} = ${a.value} | ${timeAgo(a.time)}\n\n`;
                });
                msg += `\n💡 *Recommendation: Prioritize LTH-002 bearing inspection immediately.*`;
                return msg;
            }
        },
        {
            patterns: [/alert|warning|notification/i],
            handler: async () => {
                const res = await API.alerts.list();
                if (!res.success) return fallbackAlerts();
                const unack = res.data.filter(a => !a.acknowledged);
                const byType = { critical: 0, warning: 0, info: 0 };
                unack.forEach(a => byType[a.type] = (byType[a.type] || 0) + 1);
                let msg = `**📋 Alert Summary** (${unack.length} unacknowledged)\n\n`;
                msg += `• 🔴 Critical: **${byType.critical}**\n`;
                msg += `• ⚠️ Warning: **${byType.warning}**\n`;
                msg += `• ℹ️ Info: **${byType.info}**\n\n`;
                if (byType.critical > 0) msg += `⚡ *${byType.critical} critical alert${byType.critical > 1 ? 's' : ''} require${byType.critical === 1 ? 's' : ''} immediate attention.*`;
                return msg;
            }
        },
        {
            patterns: [/fleet\s*health|all\s*machine|machine\s*overview|how.*machines/i],
            handler: async () => {
                const res = await API.machines.list();
                if (!res.success) return fallbackFleetHealth();
                const machines = res.data;
                let msg = `**🏭 Fleet Health Overview** (${machines.length} machines)\n\n`;
                msg += `| Machine | Health | Status | RUL |\n|---------|--------|--------|-----|\n`;
                machines.forEach(m => {
                    const healthIcon = m.health > 70 ? '🟢' : m.health > 40 ? '🟡' : m.health > 0 ? '🔴' : '⚫';
                    msg += `| ${m.name} | ${healthIcon} ${m.health}% | ${m.status} | ${m.rul}h |\n`;
                });
                const avg = Math.round(machines.reduce((s, m) => s + m.health, 0) / machines.length);
                msg += `\n**Average Fleet Health: ${avg}%**`;
                const atRisk = machines.filter(m => m.rul > 0 && m.rul < 200);
                if (atRisk.length > 0) {
                    msg += `\n\n⚠️ **${atRisk.length} machine${atRisk.length > 1 ? 's' : ''} at risk**: ${atRisk.map(m => m.id).join(', ')}`;
                }
                return msg;
            }
        },
        {
            patterns: [/machine\s+([\w-]+)|check\s+([\w-]+)|status\s*of\s+([\w-]+)/i],
            handler: async (match) => {
                const id = (match[1] || match[2] || match[3]).toUpperCase();
                const res = await API.machines.get(id);
                if (!res.success) return `❌ Machine **${id}** not found. Available machines: CNC-001, CNC-002, LTH-001, LTH-002, PRE-001, PRE-002, WLD-001, WLD-002, GRN-001, INJ-001, INJ-002, ASM-001`;
                const m = res.data;
                const r = m.readings;
                let msg = `**🔧 ${m.name}** (\`${m.id}\`)\n\n`;
                msg += `| Property | Value |\n|----------|-------|\n`;
                msg += `| Status | ${m.status} |\n| Health | ${m.health}% |\n| RUL | ${m.rul} hours |\n`;
                msg += `| Location | ${m.location} |\n| Type | ${m.type} |\n| Installed | ${m.installed} |\n`;
                if (r) {
                    msg += `\n**Live Sensor Readings:**\n`;
                    msg += `• Vibration: **${r.vibration.toFixed(2)} mm/s** ${r.vibration > 5 ? '⚠️' : '✅'}\n`;
                    msg += `• Temperature: **${r.temperature.toFixed(1)}°C** ${r.temperature > 85 ? '⚠️' : '✅'}\n`;
                    msg += `• Pressure: **${r.pressure.toFixed(0)} PSI** ${r.pressure > 280 ? '⚠️' : '✅'}\n`;
                    msg += `• RPM: **${r.rpm.toFixed(0)}** ${r.rpm > 4200 ? '⚠️' : '✅'}\n`;
                }
                if (m.health < 50) msg += `\n🔴 *This machine requires urgent attention. Consider scheduling immediate maintenance.*`;
                return msg;
            }
        },
        {
            patterns: [/predict|risk|at.risk|danger.*machine|which.*fail/i],
            handler: async () => {
                const res = await API.predictions.list();
                if (!res.success) return fallbackPredictions();
                const preds = res.data.sort((a, b) => a.rul - b.rul);
                const atRisk = preds.filter(p => p.rul < 300);
                if (atRisk.length === 0) return '✅ No machines are currently predicted to fail in the near future.';
                let msg = `**🔮 At-Risk Machines** (predicted failure within 300 hours)\n\n`;
                atRisk.forEach((p, i) => {
                    msg += `**${i + 1}. ${p.machineName}** (\`${p.machineId}\`)\n`;
                    msg += `   • RUL: **${p.rul} hours**\n`;
                    msg += `   • Failure Type: ${p.predictedFailureType}\n`;
                    msg += `   • Confidence: ${p.confidence}%\n`;
                    msg += `   • Anomaly Score: ${p.anomalyScore}\n\n`;
                });
                msg += `💡 *Recommendation: Schedule maintenance for ${atRisk[0].machineId} within the next ${Math.round(atRisk[0].rul * 0.6)} hours.*`;
                return msg;
            }
        },
        {
            patterns: [/run\s*inference|analyze\s+([\w-]+)|diagnose\s+([\w-]+)/i],
            handler: async (match) => {
                const id = (match[1] || match[2] || 'CNC-001').toUpperCase();
                const res = await API.predictions.inference(id);
                if (!res.success) return `❌ Could not run inference on **${id}**. ${res.error || 'Machine may be offline.'}`;
                const r = res.data;
                let msg = `**🧠 AI Inference Result — ${r.machineName}**\n\n`;
                msg += `⏱️ Inference time: ${r.inferenceTime}ms\n\n`;
                msg += `| Metric | Value |\n|--------|-------|\n`;
                msg += `| Anomaly Score | ${r.anomalyScore} |\n`;
                msg += `| RUL | ${r.rul} hours |\n`;
                msg += `| Confidence | ${r.confidence}% |\n`;
                msg += `| Predicted Failure | ${r.predictedFailureType} |\n\n`;
                msg += `**Failure Probabilities:**\n`;
                Object.entries(r.failureProbs).sort((a, b) => b[1] - a[1]).forEach(([cls, prob]) => {
                    const bar = '█'.repeat(Math.round(prob * 20)) + '░'.repeat(20 - Math.round(prob * 20));
                    msg += `• ${cls}: ${bar} ${(prob * 100).toFixed(1)}%\n`;
                });
                msg += `\n**Top Attention Weights:**\n`;
                Object.entries(r.attentionWeights).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([k, v]) => {
                    msg += `• ${k}: ${(v * 100).toFixed(1)}%\n`;
                });
                return msg;
            }
        },
        {
            patterns: [/ai\s*model|model\s*info|about.*model|neural|architecture/i],
            handler: () => {
                return `**🧠 PredictNet v2.3 — Model Details**\n\n**Architecture:** 8-layer Bi-LSTM with Multi-Head Self-Attention\n**Parameters:** 2.8M\n**Training:** 150 epochs on 45,000 samples\n\n**Layers:**\n1. Input (6 sensors × 120 timesteps)\n2. 1D Convolution (128 filters)\n3. Bi-LSTM Layer 1 (256 units)\n4. Bi-LSTM Layer 2 (256 units)\n5. Multi-Head Attention (8 heads)\n6. Dense (128 + dropout 0.3)\n7. Dense (64 + dropout 0.2)\n8. Output (5 classes + RUL)\n\n**Performance:**\n• Accuracy: 96.2%\n• AUC-ROC: 98.7%\n• F1-Score: 0.961\n• MAE (RUL): ±12.3 hours\n\n**Feature Pipeline:** Sensor input → Kalman filter → Window (120 steps) → Statistical features → FFT → Inference → Post-processing`;
            }
        },
        {
            patterns: [/oee|overall\s*effectiveness|efficiency/i],
            handler: async () => {
                const res = await API.system.kpis();
                if (!res.success) return 'Current OEE: **87.3%** (↑2.4% vs last week). OEE = Availability × Performance × Quality.';
                const k = res.data;
                return `**📈 OEE Report**\n\nOverall Equipment Effectiveness: **${k.oee}%** (↑${k.oeeChange}% vs last week)\n\n**Breakdown:**\n• Availability: ~93%\n• Performance: ~95%\n• Quality: ~99%\n\n**Other KPIs:**\n• Fleet Health: ${k.fleetHealth}%\n• At-Risk Machines: ${k.predictedFailures}\n• Cost Savings: $${(k.costSavings / 1000).toFixed(0)}K this year\n• Active Machines: ${k.activeMachines}/${k.totalMachines}`;
            }
        },
        {
            patterns: [/maintenance|schedule|when.*service|next.*maintenance/i],
            handler: async () => {
                const res = await API.machines.list();
                const machines = res.success ? res.data : DataEngine.MACHINES;
                const needMaint = machines.filter(m => m.rul > 0 && m.rul < 500).sort((a, b) => a.rul - b.rul);
                if (needMaint.length === 0) return '✅ No machines currently require scheduled maintenance. All RUL values are above 500 hours.';
                let msg = `**🔧 Maintenance Schedule Recommendation**\n\n`;
                msg += `| Priority | Machine | RUL | Recommended By |\n|----------|---------|-----|----------------|\n`;
                needMaint.forEach((m, i) => {
                    const priority = m.rul < 100 ? '🔴 URGENT' : m.rul < 200 ? '🟡 HIGH' : '🟢 NORMAL';
                    const byDate = new Date(Date.now() + m.rul * 3600000 * 0.6);
                    msg += `| ${priority} | ${m.id} | ${m.rul}h | ${byDate.toLocaleDateString()} |\n`;
                });
                msg += `\n💡 *Schedule maintenance at 60% of RUL to maximize uptime while minimizing risk.*`;
                return msg;
            }
        },
        {
            patterns: [/help|what can you|what do you|capabilities|commands/i],
            handler: () => {
                return `**💡 I can help you with:**\n\n🏭 **Machines:** "fleet health overview", "check CNC-001", "machine LTH-002"\n🔮 **Predictions:** "which machines are at risk", "run inference on CNC-002"\n⚠️ **Alerts:** "show critical alerts", "alert summary"\n📊 **Metrics:** "system status", "OEE report", "current KPIs"\n🧠 **AI Model:** "tell me about the AI model", "model architecture"\n🔧 **Maintenance:** "maintenance schedule", "when to service"\n\nTry asking a question in natural language!`;
            }
        },
        {
            patterns: [/thank|thanks|great|awesome|perfect|good job/i],
            handler: () => {
                const responses = [
                    "You're welcome! Let me know if you need anything else. 🤖",
                    "Happy to help! I'm monitoring all machines 24/7. 📡",
                    "Glad I could assist! Stay proactive with maintenance. 🔧",
                    "Anytime! Remember — predictive maintenance saves lives and money. 💡"
                ];
                return responses[Math.floor(Math.random() * responses.length)];
            }
        }
    ];

    // Fallback responses when API is unavailable
    function fallbackAlerts(type) {
        const alerts = DataEngine.generateAlerts();
        const filtered = type ? alerts.filter(a => a.type === type) : alerts;
        return `**Alerts (${filtered.length}):**\n\n` + filtered.slice(0, 4).map((a, i) =>
            `${i + 1}. **${a.title}** (${a.machine}) — ${a.type}`
        ).join('\n');
    }
    function fallbackFleetHealth() {
        return DataEngine.MACHINES.map(m =>
            `• ${m.name}: ${m.health}% — ${m.status}`
        ).join('\n');
    }
    function fallbackPredictions() {
        return 'Unable to fetch predictions. Please check backend connectivity.';
    }

    // Match user input to intent
    async function processMessage(text) {
        for (const intent of INTENTS) {
            for (const pattern of intent.patterns) {
                const match = text.match(pattern);
                if (match) {
                    return await intent.handler(match);
                }
            }
        }
        // Default response
        return `I understand you're asking about "${text}", but I'm not sure how to help with that specific query.\n\n**Try asking about:**\n• Machine health (e.g., "check CNC-001")\n• Predictions (e.g., "which machines are at risk")\n• Alerts (e.g., "show critical alerts")\n• System status (e.g., "system status")\n\nOr type **"help"** to see all my capabilities.`;
    }

    // ── UI ──
    function init() {
        createChatWidget();
    }

    function createChatWidget() {
        const widget = document.createElement('div');
        widget.id = 'chat-widget';
        widget.innerHTML = `
      <button class="chat-fab" id="chat-fab" onclick="Chatbot.toggle()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="chat-fab-badge" id="chat-fab-badge" style="display:none">1</span>
      </button>
      <div class="chat-panel" id="chat-panel">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-header-avatar">${BOT_AVATAR}</div>
            <div>
              <div class="chat-header-name">${BOT_NAME}</div>
              <div class="chat-header-status"><span class="chat-status-dot"></span>Online — Ready to assist</div>
            </div>
          </div>
          <button class="chat-header-close" onclick="Chatbot.toggle()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-quick-actions" id="chat-quick-actions">
          ${QUICK_ACTIONS.map(a => `<button class="chat-quick-btn" onclick="Chatbot.sendQuick('${a.query}')">${a.label}</button>`).join('')}
        </div>
        <div class="chat-input-area">
          <input type="text" class="chat-input" id="chat-input" placeholder="Ask about machines, predictions, alerts..." autocomplete="off" onkeydown="if(event.key==='Enter')Chatbot.send()">
          <button class="chat-send-btn" onclick="Chatbot.send()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;
        document.body.appendChild(widget);

        // Welcome message after short delay
        setTimeout(() => {
            addBotMessage("Hello! 👋 I'm **PredictAI Assistant**, your AI-powered maintenance co-pilot.\n\nI can analyze machine health, run predictions, check alerts, and more. How can I help?");
        }, 2000);
    }

    function toggle() {
        isOpen = !isOpen;
        const panel = document.getElementById('chat-panel');
        const fab = document.getElementById('chat-fab');
        const badge = document.getElementById('chat-fab-badge');
        if (panel) panel.classList.toggle('open', isOpen);
        if (fab) fab.classList.toggle('active', isOpen);
        if (badge) badge.style.display = 'none';
        if (isOpen) {
            setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
            SoundFX.hoverClick();
        }
    }

    function send() {
        const input = document.getElementById('chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        addUserMessage(text);
        showTyping();
        processMessage(text).then(response => {
            hideTyping();
            addBotMessage(response);
            SoundFX.predictionBeep();
        }).catch(() => {
            hideTyping();
            addBotMessage("Sorry, I encountered an error processing your request. Please try again.");
        });
    }

    function sendQuick(query) {
        document.getElementById('chat-input').value = query;
        send();
    }

    function addUserMessage(text) {
        messages.push({ role: 'user', text, time: Date.now() });
        renderMessages();
    }

    function addBotMessage(text) {
        messages.push({ role: 'bot', text, time: Date.now() });
        renderMessages();
        // Badge if panel is closed
        if (!isOpen) {
            const badge = document.getElementById('chat-fab-badge');
            if (badge) {
                badge.style.display = 'flex';
                badge.textContent = '!';
            }
        }
    }

    function showTyping() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        const typing = document.createElement('div');
        typing.className = 'chat-msg bot typing-indicator';
        typing.id = 'chat-typing';
        typing.innerHTML = `<div class="chat-msg-avatar">${BOT_AVATAR}</div><div class="chat-msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
        container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('chat-typing');
        if (typing) typing.remove();
    }

    function renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        // Remove typing indicator if exists
        const typing = document.getElementById('chat-typing');
        container.innerHTML = messages.map(m => {
            const timeStr = new Date(m.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            if (m.role === 'user') {
                return `<div class="chat-msg user"><div class="chat-msg-bubble">${escapeHtml(m.text)}</div><div class="chat-msg-time">${timeStr}</div></div>`;
            } else {
                return `<div class="chat-msg bot"><div class="chat-msg-avatar">${BOT_AVATAR}</div><div class="chat-msg-bubble">${formatMarkdown(m.text)}</div><div class="chat-msg-time">${timeStr}</div></div>`;
            }
        }).join('');
        // Re-add typing if it was there
        if (typing) container.appendChild(typing);
        container.scrollTop = container.scrollHeight;
    }

    // Simple markdown -> HTML
    function formatMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/\|(.+)\|/g, (match) => {
                // Simple table rendering
                return match;
            });
    }

    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function timeAgo(ts) {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
    }

    function formatUptime(secs) {
        const h = String(Math.floor(secs / 3600)).padStart(2, '0');
        const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    return { init, toggle, send, sendQuick };
})();
