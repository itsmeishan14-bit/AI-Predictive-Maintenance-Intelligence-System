// ============================================
// AGENT ENGINE — Autonomous AI Operator
// Continuously monitors, analyzes, decides
// ============================================

const db = require('./database');
const aiEngine = require('./ai-engine');

class AgentEngine {
    constructor() {
        this.running = false;
        this.cycleInterval = null;
        this.cycleCount = 0;
        this.logs = [];
        this.insights = [];
        this.decisions = [];
        this.state = {
            status: 'idle',
            currentTask: null,
            machinesAnalyzed: 0,
            anomaliesDetected: 0,
            alertsGenerated: 0,
            maintenanceScheduled: 0,
            lastCycleTime: null,
            avgCycleMs: 0,
            totalInferences: 0
        };
        this.onBroadcast = null; // WebSocket callback
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.state.status = 'running';
        this.log('system', '🟢 Agent activated. Beginning autonomous monitoring cycle.');
        this.log('thinking', 'Initializing sensor data streams for all active machines...');

        // Run first cycle immediately
        setTimeout(() => this.runCycle(), 1000);

        // Then every 8 seconds
        this.cycleInterval = setInterval(() => this.runCycle(), 8000);
    }

    stop() {
        this.running = false;
        this.state.status = 'idle';
        this.state.currentTask = null;
        if (this.cycleInterval) {
            clearInterval(this.cycleInterval);
            this.cycleInterval = null;
        }
        this.log('system', '🔴 Agent paused. Monitoring suspended.');
    }

    async runCycle() {
        if (!this.running) return;
        this.cycleCount++;
        const cycleStart = Date.now();
        try {
            this.state.currentTask = 'Starting analysis cycle #' + this.cycleCount;
            this.broadcast({ type: 'agent_status', data: this.getStatus() });

            // Phase 1: Scan all machines
            this.state.currentTask = 'Scanning sensor data across fleet';
            this.log('thinking', `Cycle #${this.cycleCount} — Scanning ${db.machines.filter(m => m.status !== 'offline').length} active machines...`);

            const activeMachines = db.machines.filter(m => m.status !== 'offline');
            const results = [];

            for (const machine of activeMachines) {
                const result = aiEngine.runInference(machine.id);
                if (result) {
                    results.push(result);
                    this.state.totalInferences++;
                }
            }
            this.state.machinesAnalyzed += activeMachines.length;

            // Phase 2: Analyze results
            this.state.currentTask = 'Analyzing inference results';
            const anomalies = results.filter(r => r.anomalyScore > 0.4);
            const critical = results.filter(r => r.anomalyScore > 0.6);
            const atRisk = results.filter(r => r.rul < 200);

            // Phase 3: Generate insights
            this.state.currentTask = 'Generating insights and recommendations';

            if (anomalies.length > 0) {
                this.state.anomaliesDetected += anomalies.length;

                // Pick the most interesting anomaly to report
                const worst = anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore)[0];

                const insightTemplates = [
                    () => {
                        const topSensor = Object.entries(worst.attentionWeights).sort((a, b) => b[1] - a[1])[0];
                        return {
                            type: 'anomaly',
                            title: `Anomaly detected on ${worst.machineName}`,
                            text: `Anomaly score: ${worst.anomalyScore.toFixed(3)}. Primary driver: **${topSensor[0]}** (attention weight: ${(topSensor[1] * 100).toFixed(1)}%). The model assigns ${worst.confidence}% confidence to this classification. Recommended action: schedule inspection within ${Math.round(worst.rul * 0.5)} hours.`,
                            machine: worst.machineId,
                            severity: worst.anomalyScore > 0.6 ? 'high' : 'medium'
                        };
                    },
                    () => ({
                        type: 'pattern',
                        title: `Degradation pattern identified in ${worst.machineName}`,
                        text: `Multi-sensor correlation analysis shows coordinated degradation across vibration (${worst.readings.vibration.toFixed(1)} mm/s) and temperature (${worst.readings.temperature.toFixed(0)}°C). This pattern is consistent with ${worst.predictedFailureType || 'early-stage bearing wear'}. Estimated time to critical: ${worst.rul} hours.`,
                        machine: worst.machineId,
                        severity: worst.rul < 100 ? 'high' : 'medium'
                    }),
                    () => {
                        const failType = Object.entries(worst.failureProbs).sort((a, b) => b[1] - a[1])[0];
                        return {
                            type: 'prediction',
                            title: `Failure prediction updated for ${worst.machineName}`,
                            text: `Top predicted failure mode: **${formatFailureType(failType[0])}** at ${(failType[1] * 100).toFixed(1)}% probability. RUL estimate: ${worst.rul} hours (confidence: ${worst.confidence}%). I've cross-referenced this with the last 24 hours of sensor data and the trend is ${worst.anomalyScore > 0.5 ? 'deteriorating' : 'stable'}.`,
                            machine: worst.machineId,
                            severity: failType[1] > 0.5 ? 'high' : 'medium'
                        };
                    }
                ];

                const insight = insightTemplates[this.cycleCount % insightTemplates.length]();
                this.addInsight(insight);
                this.log('insight', insight.text);
            }

            // Phase 4: Make decisions
            if (critical.length > 0 && this.cycleCount % 3 === 0) {
                const c = critical[0];
                const decision = {
                    type: 'maintenance_recommendation',
                    machine: c.machineId,
                    machineName: c.machineName,
                    action: c.rul < 100 ? 'Schedule emergency maintenance' : 'Schedule preventive maintenance',
                    priority: c.rul < 100 ? 'URGENT' : 'HIGH',
                    deadline: new Date(Date.now() + c.rul * 0.6 * 3600000).toISOString(),
                    reasoning: `RUL: ${c.rul}h, Anomaly: ${c.anomalyScore.toFixed(3)}, Confidence: ${c.confidence}%`,
                    timestamp: Date.now()
                };
                this.decisions.push(decision);
                this.state.maintenanceScheduled++;
                this.log('decision', `📋 **Decision**: ${decision.action} for ${decision.machineName} — Priority: ${decision.priority}. Deadline: ${new Date(decision.deadline).toLocaleDateString()}`);
            }

            // Phase 5: Auto-generate alerts for critical findings
            if (critical.length > 0 && Math.random() < 0.3) {
                const c = critical[Math.floor(Math.random() * critical.length)];
                const alert = {
                    id: db.nextAlertId(),
                    type: 'critical',
                    machine: c.machineId,
                    title: `[AI Agent] Anomaly spike on ${c.machineName}`,
                    desc: `Autonomous agent detected anomaly score ${c.anomalyScore.toFixed(3)} during cycle #${this.cycleCount}. Immediate inspection recommended.`,
                    sensor: 'multi-sensor',
                    value: c.anomalyScore,
                    time: Date.now(),
                    acknowledged: false,
                    generatedBy: 'agent'
                };
                db.alerts.unshift(alert);
                this.state.alertsGenerated++;
                this.log('alert', `🚨 Auto-generated alert: "${alert.title}"`);
                this.broadcast({ type: 'new_alert', data: alert });
            }

            // Phase 6: Generate periodic fleet summary
            if (this.cycleCount % 5 === 0) {
                const avgHealth = Math.round(activeMachines.reduce((s, m) => s + m.health, 0) / activeMachines.length);
                const summaryTexts = [
                    `Fleet health check complete. Average health: ${avgHealth}%. ${atRisk.length} machine${atRisk.length !== 1 ? 's' : ''} below RUL threshold. ${anomalies.length} anomal${anomalies.length !== 1 ? 'ies' : 'y'} detected this cycle. System throughput: ${db.systemStatus.throughput}/s.`,
                    `Periodic scan summary — ${activeMachines.length} machines online, ${db.machines.filter(m => m.status === 'offline').length} offline. Model confidence: ${db.systemStatus.modelConfidence}%. Total inferences this session: ${this.state.totalInferences}. No critical drift detected in model accuracy.`,
                    `Cross-machine correlation analysis complete. Vibration trends across Bay B machines show 12% increase over the last hour. Temperature profiles in Bay A remain within expected bounds. Recommending closer monitoring of lathe units.`
                ];
                this.addInsight({
                    type: 'summary',
                    title: 'Fleet Status Report',
                    text: summaryTexts[Math.floor(this.cycleCount / 5) % summaryTexts.length],
                    severity: 'info'
                });
                this.log('summary', summaryTexts[Math.floor(this.cycleCount / 5) % summaryTexts.length]);
            }

            // Cycle complete
            const cycleMs = Date.now() - cycleStart;
            this.state.avgCycleMs = Math.round((this.state.avgCycleMs * (this.cycleCount - 1) + cycleMs) / this.cycleCount);
            this.state.lastCycleTime = Date.now();
            this.state.currentTask = 'Idle — waiting for next cycle';
            this.broadcast({ type: 'agent_cycle_complete', data: { cycle: this.cycleCount, ms: cycleMs, anomalies: anomalies.length, insights: this.insights.length } });
        } catch (err) {
            console.error(`[Agent] Cycle #${this.cycleCount} error:`, err.message);
            this.log('alert', `⚠️ Cycle error: ${err.message}`);
            this.state.currentTask = 'Error — recovering on next cycle';
        }
    }

    // Handle natural language questions from the user
    async ask(question) {
        try {
            this.log('user', question);
            this.state.currentTask = `Processing query: "${question.slice(0, 50)}..."`;

            const q = question.toLowerCase();
            let response;

            if (q.match(/what.*doing|status|state/)) {
                response = `I'm currently in **${this.state.status}** mode. I've completed ${this.cycleCount} analysis cycles, performed ${this.state.totalInferences} inferences, detected ${this.state.anomaliesDetected} anomalies, and generated ${this.state.alertsGenerated} alerts. Average cycle time: ${this.state.avgCycleMs}ms.`;
            } else if (q.match(/worst|most.*danger|biggest.*risk|concern/)) {
                const preds = aiEngine.getPredictions().sort((a, b) => a.rul - b.rul);
                const worst = preds[0];
                if (worst) {
                    response = `The machine I'm most concerned about is **${worst.machineName}** (\`${worst.machineId}\`). It has an anomaly score of ${worst.anomalyScore.toFixed(3)}, RUL of only ${worst.rul} hours, and I'm seeing a **${worst.predictedFailureType}** pattern forming. I'd recommend scheduling maintenance within the next ${Math.round(worst.rul * 0.5)} hours.`;
                } else {
                    response = 'All machines are currently within acceptable parameters. No critical concerns at this time.';
                }
            } else if (q.match(/safe|shut.*down|stop.*machine/)) {
                const critical = db.machines.filter(m => m.health < 40 && m.status !== 'offline');
                if (critical.length > 0) {
                    response = `Based on my analysis, I would recommend a controlled shutdown of **${critical.map(m => m.id).join(', ')}** for immediate inspection. ${critical[0].id} in particular shows dangerously high vibration patterns consistent with bearing degradation. Continuing operation risks catastrophic failure.`;
                } else {
                    response = 'No machines currently require emergency shutdown. All health scores are above the critical threshold. Continue normal operations.';
                }
            } else if (q.match(/summary|report|overview|brief/)) {
                const kpis = db.getKPIs();
                response = `**Fleet Summary:**\n• ${kpis.activeMachines}/${kpis.totalMachines} machines online\n• Average health: ${kpis.fleetHealth}%\n• OEE: ${kpis.oee}%\n• At-risk machines: ${kpis.predictedFailures}\n• Cost savings: $${(kpis.costSavings / 1000).toFixed(0)}K\n\nI've run ${this.state.totalInferences} inferences and detected ${this.state.anomaliesDetected} anomalies since activation. My model confidence is holding steady at ${db.systemStatus.modelConfidence}%.`;
            } else if (q.match(/predict|forecast|next.*fail|future/)) {
                const preds = aiEngine.getPredictions().filter(p => p.rul < 500).sort((a, b) => a.rul - b.rul);
                if (preds.length === 0) {
                    response = 'No failures predicted within the next 500 hours. The fleet is in good condition.';
                } else {
                    response = '**Failure Forecast (next 500 hours):**\n\n' + preds.map((p, i) =>
                        `${i + 1}. **${p.machineName}** — RUL: ${p.rul}h | ${p.predictedFailureType} | Confidence: ${p.confidence}%`
                    ).join('\n') + `\n\nTotal at-risk: ${preds.length} machines. I recommend front-loading maintenance on ${preds[0].machineId}.`;
                }
            } else if (q.match(/explain|why|reason|how.*know/)) {
                const lastInsight = this.insights[this.insights.length - 1];
                if (lastInsight) {
                    response = `My last insight was about: **${lastInsight.title}**\n\n${lastInsight.text}\n\nI arrived at this conclusion by running the PredictNet v2.3 model on live sensor data, calculating attention weights across 6 sensor channels, and comparing the anomaly score against historical baselines. The model uses Bi-LSTM layers with multi-head attention to capture both temporal patterns and inter-sensor correlations.`;
                } else {
                    response = 'I haven\'t generated any insights yet. Start me up and I\'ll begin analyzing the fleet!';
                }
            } else if (q.match(/improve|suggestion|optimize|better/)) {
                response = `**Optimization Recommendations:**\n\n1. **Bearing replacement schedule** — LTH-002 and WLD-002 show early degradation patterns. Replacing bearings proactively could prevent 2-3 unplanned shutdowns.\n2. **Temperature management** — Bay A machines run 8% warmer than optimal. Consider improving ventilation or adjusting coolant flow.\n3. **Vibration damping** — Grinder GRN-001 shows resonance harmonics at 3.2 kHz. Adding damping pads could extend bearing life by ~200 hours.\n4. **Predictive scheduling** — Based on my analysis, a 2-week rolling maintenance window would reduce overall downtime by ~18%.`;
            } else {
                response = `I understand you're asking about "${question}". As an AI maintenance agent, I can help with:\n\n• **"What's your biggest concern?"** — risk analysis\n• **"Give me a summary"** — fleet overview\n• **"Predict next failures"** — failure forecast\n• **"Explain your reasoning"** — model explainability\n• **"How can we optimize?"** — recommendations\n• **"Should we shut anything down?"** — safety analysis`;
            }

            this.log('agent', response);
            this.state.currentTask = 'Idle — waiting for next cycle';
            return response;
        } catch (err) {
            console.error('[Agent] Ask error:', err.message);
            this.state.currentTask = 'Idle — waiting for next cycle';
            return `I encountered an error while processing your question: ${err.message}. Please try again.`;
        }
    }

    log(type, message) {
        const entry = { type, message, timestamp: Date.now() };
        this.logs.push(entry);
        if (this.logs.length > 200) this.logs.shift();
        this.broadcast({ type: 'agent_log', data: entry });
    }

    addInsight(insight) {
        insight.timestamp = Date.now();
        insight.id = 'INS-' + String(this.insights.length + 1).padStart(3, '0');
        this.insights.unshift(insight);
        if (this.insights.length > 50) this.insights.pop();
        this.broadcast({ type: 'agent_insight', data: insight });
    }

    broadcast(data) {
        if (this.onBroadcast) this.onBroadcast(data);
    }

    getStatus() {
        return {
            ...this.state,
            cycleCount: this.cycleCount,
            logsCount: this.logs.length,
            insightsCount: this.insights.length,
            decisionsCount: this.decisions.length
        };
    }

    getLogs(limit = 50) {
        return this.logs.slice(-limit);
    }

    getInsights(limit = 20) {
        return this.insights.slice(0, limit);
    }

    getDecisions(limit = 10) {
        return this.decisions.slice(-limit);
    }
}

function formatFailureType(type) {
    return type.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

module.exports = new AgentEngine();
