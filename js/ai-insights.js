// ============================================
// AI INSIGHTS — Enhanced Model Visualization
// ============================================

const AIInsights = (() => {
    let liveInferenceTimer = null;

    function render() {
        const container = document.getElementById('view-ai');
        if (!container) return;
        const predictions = DataEngine.getPredictions();
        const arch = AIModel.ARCHITECTURE;
        const metrics = AIModel.METRICS;

        // Aggregate feature importance
        const featureAgg = {};
        predictions.forEach(p => {
            Object.entries(p.featureImportance).forEach(([k, v]) => {
                if (!featureAgg[k]) featureAgg[k] = [];
                featureAgg[k].push(v);
            });
        });
        const avgFeatures = Object.entries(featureAgg).map(([name, vals]) => ({
            name, value: vals.reduce((a, b) => a + b, 0) / vals.length
        })).sort((a, b) => b.value - a.value);
        const maxFeature = Math.max(...avgFeatures.map(f => f.value));

        container.innerHTML = `
      <!-- Hero -->
      <div class="ai-hero holo-card animate-in">
        <div class="scanline-overlay"></div>
        <div class="ai-hero-content">
          <div class="ai-hero-badge">
            <span class="ai-pulse-ring"></span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            AI Engine Active
          </div>
          <h2 class="ai-hero-title">${arch.name} <span class="text-muted" style="font-size:16px;font-weight:400">— ${arch.type}</span></h2>
          <p class="ai-hero-desc">Real-time predictive maintenance powered by deep learning. Processing sensor data from ${DataEngine.MACHINES.filter(m => m.status !== 'offline').length} active machines across 6 sensor channels.</p>
          <div class="ai-hero-stats">
            <div class="ai-hero-stat">
              <span class="ai-hero-stat-value text-emerald">${(metrics.overall.accuracy * 100).toFixed(1)}%</span>
              <span class="ai-hero-stat-label">Accuracy</span>
            </div>
            <div class="ai-hero-stat">
              <span class="ai-hero-stat-value text-cyan">${(metrics.overall.aucRoc * 100).toFixed(1)}%</span>
              <span class="ai-hero-stat-label">AUC-ROC</span>
            </div>
            <div class="ai-hero-stat">
              <span class="ai-hero-stat-value text-magenta">±${metrics.overall.maeRUL}h</span>
              <span class="ai-hero-stat-label">MAE (RUL)</span>
            </div>
            <div class="ai-hero-stat">
              <span class="ai-hero-stat-value text-amber">${arch.totalParams}</span>
              <span class="ai-hero-stat-label">Parameters</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Neural Network Brain Visualization -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">🧠 Neural Network Brain</h3>
            <p class="section-subtitle">Watch the AI process data through 7 neural layers in real-time</p>
          </div>
        </div>
        <div class="chart-card holo-card breathing-border">
          <div class="chart-card-body" style="padding:0">
            <div class="neural-viz-canvas" id="neural-brain-container"></div>
          </div>
        </div>
      </div>

      <!-- Live Inference Demo -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">🔴 Live Inference Demo</h3>
            <p class="section-subtitle">Watch the AI model process real-time sensor data and fire the neural network</p>
          </div>
          <button class="btn btn-primary" id="btn-run-inference" onclick="AIInsights.toggleLiveInference()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Live Inference
          </button>
        </div>

        <div class="ai-inference-grid">
          <!-- Input -->
          <div class="chart-card ai-inference-card">
            <div class="chart-card-header">
              <div class="chart-card-title">📡 Sensor Input</div>
            </div>
            <div class="chart-card-body" id="inference-input">
              <div class="ai-waiting-state">Click "Start Live Inference" to begin</div>
            </div>
          </div>
          <!-- Attention -->
          <div class="chart-card ai-inference-card">
            <div class="chart-card-header">
              <div class="chart-card-title">🎯 Attention Weights</div>
            </div>
            <div class="chart-card-body" id="inference-attention">
              <div class="ai-waiting-state">Waiting for input...</div>
            </div>
          </div>
          <!-- Output -->
          <div class="chart-card ai-inference-card">
            <div class="chart-card-header">
              <div class="chart-card-title">📊 Prediction Output</div>
            </div>
            <div class="chart-card-body" id="inference-output">
              <div class="ai-waiting-state">Waiting for inference...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Neural Network Architecture -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Neural Network Architecture</h3>
            <p class="section-subtitle">Layer-by-layer model structure of ${arch.name}</p>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-body">
            <div class="nn-architecture">
              ${arch.layers.map((layer, i) => `
                <div class="nn-layer animate-in" style="animation-delay:${i * 100}ms">
                  <div class="nn-layer-icon nn-${layer.type}">
                    ${getNNIcon(layer.type)}
                  </div>
                  <div class="nn-layer-info">
                    <div class="nn-layer-name">${layer.name}</div>
                    <div class="nn-layer-desc">${layer.desc}</div>
                  </div>
                  <div class="nn-layer-nodes">
                    <span class="nn-node-count">${layer.nodes}</span>
                    <span class="nn-node-label">${layer.type === 'attention' ? 'heads' : 'units'}</span>
                  </div>
                  ${i < arch.layers.length - 1 ? '<div class="nn-connector"><div class="nn-connector-line"></div><div class="nn-connector-arrow">▼</div></div>' : ''}
                </div>
              `).join('')}
            </div>
            <div class="nn-summary">
              <div class="metric-item"><div class="metric-item-label">Total Parameters</div><div class="metric-item-value text-cyan">${arch.totalParams}</div></div>
              <div class="metric-item"><div class="metric-item-label">Trainable</div><div class="metric-item-value text-emerald">${arch.trainableParams}</div></div>
              <div class="metric-item"><div class="metric-item-label">Non-Trainable</div><div class="metric-item-value text-muted">${arch.nonTrainableParams}</div></div>
              <div class="metric-item"><div class="metric-item-label">Framework</div><div class="metric-item-value">${arch.framework}</div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Training & Performance -->
      <div class="section">
        <div class="chart-grid">
          <!-- Training History -->
          <div class="chart-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">Training History</div>
                <div class="chart-card-subtitle">${metrics.training.epochs} epochs · ${metrics.training.trainingTime} · ${metrics.training.gpuUsed}</div>
              </div>
              <div class="tabs" id="training-tabs">
                <div class="tab-item active" onclick="AIInsights.switchTrainingView('loss', this)">Loss</div>
                <div class="tab-item" onclick="AIInsights.switchTrainingView('accuracy', this)">Accuracy</div>
              </div>
            </div>
            <div class="chart-card-body">
              <div class="line-chart-container" id="training-history-chart"></div>
              <div class="chart-legend" id="training-chart-legend">
                <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-cyan)"></div>Training Loss</div>
                <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-magenta)"></div>Validation Loss</div>
              </div>
            </div>
          </div>

          <!-- Confusion Matrix -->
          <div class="chart-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">Confusion Matrix</div>
                <div class="chart-card-subtitle">Classification results on test set (1,191 samples)</div>
              </div>
            </div>
            <div class="chart-card-body">
              <div class="confusion-matrix" id="confusion-matrix"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Importance & Per-Class Metrics -->
      <div class="section">
        <div class="chart-grid">
          <div class="chart-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">Feature Importance (SHAP Values)</div>
                <div class="chart-card-subtitle">Mean absolute contribution to predictions</div>
              </div>
            </div>
            <div class="chart-card-body">
              <div class="feature-bar-list">
                ${avgFeatures.map((f, i) => {
            const colors = ['#00e5ff', '#f637ec', '#ffb300', '#00e676', '#536dfe', '#b388ff'];
            const pct = (f.value / maxFeature * 100).toFixed(0);
            return `
                    <div class="feature-bar-item animate-in" style="animation-delay:${i * 80}ms">
                      <span class="feature-bar-label">${f.name}</span>
                      <div class="feature-bar-track">
                        <div class="feature-bar-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div>
                      </div>
                      <span class="feature-bar-value">${(f.value * 100).toFixed(1)}%</span>
                    </div>
                  `;
        }).join('')}
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">Per-Class Metrics</div>
                <div class="chart-card-subtitle">Precision, Recall, F1-Score per failure type</div>
              </div>
            </div>
            <div class="chart-card-body" style="overflow-x:auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Precision</th>
                    <th>Recall</th>
                    <th>F1</th>
                    <th>Support</th>
                  </tr>
                </thead>
                <tbody>
                  ${metrics.perClass.map(c => `
                    <tr>
                      <td><strong>${c.name}</strong></td>
                      <td><span class="font-mono ${c.precision > 0.97 ? 'text-emerald' : 'text-amber'}">${c.precision.toFixed(3)}</span></td>
                      <td><span class="font-mono ${c.recall > 0.97 ? 'text-emerald' : 'text-amber'}">${c.recall.toFixed(3)}</span></td>
                      <td><span class="font-mono ${c.f1 > 0.97 ? 'text-emerald' : 'text-amber'}">${c.f1.toFixed(3)}</span></td>
                      <td class="font-mono">${c.support}</td>
                    </tr>
                  `).join('')}
                  <tr style="border-top:2px solid var(--border-color)">
                    <td><strong>Weighted Avg</strong></td>
                    <td class="font-mono text-cyan">${metrics.overall.precision.toFixed(3)}</td>
                    <td class="font-mono text-cyan">${metrics.overall.recall.toFixed(3)}</td>
                    <td class="font-mono text-cyan">${metrics.overall.f1.toFixed(3)}</td>
                    <td class="font-mono">1,191</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Pipeline -->
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Feature Extraction Pipeline</h3>
            <p class="section-subtitle">End-to-end data processing in ~12ms per batch</p>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-body">
            <div class="pipeline-flow">
              ${AIModel.FEATURE_PIPELINE.map((step, i) => `
                <div class="pipeline-step animate-in" style="animation-delay:${i * 80}ms">
                  <div class="pipeline-step-number">${i + 1}</div>
                  <div class="pipeline-step-content">
                    <div class="pipeline-step-name">${step.name}</div>
                    <div class="pipeline-step-desc">${step.desc}</div>
                  </div>
                  <div class="pipeline-step-time">${step.duration}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Training Config -->
      <div class="section">
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">Training Configuration</div>
              <div class="chart-card-subtitle">Hyperparameters and training setup</div>
            </div>
          </div>
          <div class="chart-card-body">
            <div class="training-config-grid">
              ${Object.entries(metrics.training).map(([k, v]) => `
                <div class="training-config-item">
                  <span class="training-config-key">${formatConfigKey(k)}</span>
                  <span class="training-config-val font-mono">${v}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

        renderTrainingChart('loss');
        renderConfusionMatrix();
        // Init Neural Brain
        setTimeout(() => NeuralViz.init('neural-brain-container'), 300);
    }

    function getNNIcon(type) {
        const icons = {
            input: '📥',
            conv: '🔲',
            lstm: '🔄',
            attention: '🎯',
            dense: '🧠',
            output: '📤'
        };
        return icons[type] || '⬡';
    }

    function formatConfigKey(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    }

    // Training chart with switchable views
    function renderTrainingChart(mode = 'loss') {
        const container = document.getElementById('training-history-chart');
        if (!container) return;
        container.innerHTML = '';
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);

        const h = AIModel.TRAINING_HISTORY;
        const legend = document.getElementById('training-chart-legend');

        if (mode === 'loss') {
            Charts.drawLineChart(canvas, [
                { data: h.trainLoss, color: 'rgb(0,229,255)', fill: true },
                { data: h.valLoss, color: 'rgb(246,55,236)', fill: true }
            ], { minY: 0 });
            if (legend) legend.innerHTML = `
        <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-cyan)"></div>Training Loss</div>
        <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-magenta)"></div>Validation Loss</div>
      `;
        } else {
            Charts.drawLineChart(canvas, [
                { data: h.trainAcc, color: 'rgb(0,230,118)', fill: true },
                { data: h.valAcc, color: 'rgb(255,179,0)', fill: true }
            ], { minY: 0.5, maxY: 1.0 });
            if (legend) legend.innerHTML = `
        <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-emerald)"></div>Training Accuracy</div>
        <div class="chart-legend-item"><div class="chart-legend-dot" style="background:var(--accent-amber)"></div>Validation Accuracy</div>
      `;
        }
    }

    function switchTrainingView(mode, el) {
        document.querySelectorAll('#training-tabs .tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        renderTrainingChart(mode);
    }

    // Confusion Matrix Renderer
    function renderConfusionMatrix() {
        const container = document.getElementById('confusion-matrix');
        if (!container) return;
        const cm = AIModel.CONFUSION_MATRIX;
        const maxVal = Math.max(...cm.matrix.flat());

        let html = '<div class="cm-grid">';
        // Header row
        html += '<div class="cm-corner"></div>';
        cm.labels.forEach(l => html += `<div class="cm-header">${l.substring(0, 6)}</div>`);
        // Data rows
        cm.matrix.forEach((row, i) => {
            html += `<div class="cm-row-label">${cm.labels[i].substring(0, 6)}</div>`;
            row.forEach((val, j) => {
                const intensity = val / maxVal;
                const isDiag = i === j;
                const bg = isDiag
                    ? `rgba(0, 230, 118, ${0.1 + intensity * 0.5})`
                    : val > 3
                        ? `rgba(255, 61, 113, ${intensity * 0.4})`
                        : `rgba(255, 255, 255, ${0.02 + intensity * 0.05})`;
                html += `<div class="cm-cell" style="background:${bg}"><span class="cm-val">${val}</span></div>`;
            });
        });
        html += '</div>';
        html += '<div style="text-align:center;margin-top:12px;font-size:11px;color:var(--text-muted)"><strong>Y-axis:</strong> Actual &nbsp;&nbsp; <strong>X-axis:</strong> Predicted</div>';
        container.innerHTML = html;
    }

    // Live Inference Toggle
    function toggleLiveInference() {
        const btn = document.getElementById('btn-run-inference');
        if (liveInferenceTimer) {
            clearInterval(liveInferenceTimer);
            liveInferenceTimer = null;
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Live Inference`;
            return;
        }
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
        runLiveInference();
        liveInferenceTimer = setInterval(runLiveInference, 2500);
    }

    function runLiveInference() {
        // Pick a random active machine
        const activeMachines = DataEngine.MACHINES.filter(m => m.status !== 'offline');
        const machine = activeMachines[Math.floor(Math.random() * activeMachines.length)];
        const readings = DataEngine.getMachineReadings(machine.id);
        if (!readings) return;

        const result = AIModel.runInference(readings);
        SoundFX.predictionBeep();
        NeuralViz.triggerInference(result.attentionWeights);

        // Update Input Panel
        const inputPanel = document.getElementById('inference-input');
        if (inputPanel) {
            inputPanel.innerHTML = `
        <div class="inference-machine-label">
          <span class="badge badge-info">${machine.id}</span>
          <span style="font-size:12px;color:var(--text-secondary)">${machine.name}</span>
        </div>
        <div class="inference-sensors">
          ${Object.entries(readings).map(([key, val]) => {
                const range = DataEngine.SENSOR_RANGES[key];
                const pct = ((val - range.min) / (range.max - range.min) * 100).toFixed(0);
                const isWarn = val > range.warn;
                const isCrit = val > range.crit;
                return `
              <div class="inference-sensor-row">
                <span class="inference-sensor-name">${key}</span>
                <div class="inference-sensor-bar">
                  <div class="inference-sensor-fill" style="width:${pct}%;background:${isCrit ? 'var(--accent-red)' : isWarn ? 'var(--accent-amber)' : 'var(--accent-emerald)'}"></div>
                </div>
                <span class="inference-sensor-val font-mono" style="color:${isCrit ? 'var(--accent-red)' : isWarn ? 'var(--accent-amber)' : 'var(--text-primary)'}">${val.toFixed(1)}</span>
              </div>
            `;
            }).join('')}
        </div>
        <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">Inference: ${result.inferenceTime}ms</div>
      `;
        }

        // Update Attention Panel
        const attPanel = document.getElementById('inference-attention');
        if (attPanel) {
            const maxAtt = Math.max(...Object.values(result.attentionWeights));
            attPanel.innerHTML = `
        <div class="attention-bars">
          ${Object.entries(result.attentionWeights).sort((a, b) => b[1] - a[1]).map(([key, val]) => {
                const pct = (val / maxAtt * 100).toFixed(0);
                return `
              <div class="attention-bar-row">
                <span class="attention-bar-label">${key}</span>
                <div class="attention-bar-track">
                  <div class="attention-bar-fill" style="width:${pct}%;background:linear-gradient(90deg, rgba(0,229,255,0.3), rgba(0,229,255,0.8))"></div>
                </div>
                <span class="attention-bar-val font-mono">${(val * 100).toFixed(1)}%</span>
              </div>
            `;
            }).join('')}
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--text-muted)">Multi-head self-attention aggregation</div>
      `;
        }

        // Update Output Panel
        const outputPanel = document.getElementById('inference-output');
        if (outputPanel) {
            const topClass = Object.entries(result.failureProbs).sort((a, b) => b[1] - a[1])[0];
            const isAnomaly = result.anomalyScore > 0.5;
            outputPanel.innerHTML = `
        <div class="inference-result-hero">
          <div class="inference-result-class ${isAnomaly ? 'danger' : 'safe'}">
            ${isAnomaly ? '⚠️' : '✅'} ${formatClassName(topClass[0])}
          </div>
          <div class="inference-result-conf">Confidence: <strong>${result.confidence}%</strong></div>
        </div>
        <div class="inference-probs">
          ${Object.entries(result.failureProbs).sort((a, b) => b[1] - a[1]).map(([cls, prob]) => `
            <div class="inference-prob-row">
              <span class="inference-prob-name">${formatClassName(cls)}</span>
              <div class="inference-prob-bar">
                <div class="inference-prob-fill" style="width:${(prob * 100).toFixed(0)}%;background:${cls === 'normal' ? 'var(--accent-emerald)' : 'var(--accent-amber)'}"></div>
              </div>
              <span class="inference-prob-val font-mono">${(prob * 100).toFixed(1)}%</span>
            </div>
          `).join('')}
        </div>
        <div class="inference-rul-display">
          <div><span style="color:var(--text-muted)">RUL Estimate:</span> <strong class="font-mono">${result.rul} hours</strong></div>
          <div><span style="color:var(--text-muted)">Anomaly Score:</span> <strong class="font-mono" style="color:${isAnomaly ? 'var(--accent-red)' : 'var(--accent-emerald)'}">${result.anomalyScore}</strong></div>
        </div>
      `;
        }
    }

    function formatClassName(cls) {
        return cls.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    }

    function cleanup() {
        if (liveInferenceTimer) {
            clearInterval(liveInferenceTimer);
            liveInferenceTimer = null;
        }
        NeuralViz.destroy();
    }

    return { render, toggleLiveInference, switchTrainingView, cleanup };
})();
