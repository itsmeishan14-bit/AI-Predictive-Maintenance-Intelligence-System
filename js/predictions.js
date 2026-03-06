// ============================================
// PREDICTIONS — AI Model Insights
// ============================================

const Predictions = (() => {
    function render() {
        const container = document.getElementById('view-analytics');
        if (!container) return;
        const predictions = DataEngine.getPredictions();

        container.innerHTML = `
      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Predictive Analytics</h3>
            <p class="section-subtitle">AI-powered failure predictions & anomaly detection</p>
          </div>
        </div>

        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
          <div class="kpi-card cyan animate-in">
            <div class="kpi-card-label">Model Accuracy</div>
            <div class="kpi-card-value">94.7%</div>
            <div class="kpi-card-change up">${svgIcons.arrowUp} <span>1.2% improvement</span></div>
          </div>
          <div class="kpi-card magenta animate-in">
            <div class="kpi-card-label">Anomalies Detected</div>
            <div class="kpi-card-value">${predictions.filter(p => p.anomalyScore > 0.4).length}</div>
            <div class="kpi-card-change down">${svgIcons.arrowDown} <span>Active anomalies</span></div>
          </div>
          <div class="kpi-card emerald animate-in">
            <div class="kpi-card-label">Avg. Prediction Confidence</div>
            <div class="kpi-card-value">${Math.round(predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length)}%</div>
            <div class="kpi-card-change up">${svgIcons.arrowUp} <span>High confidence</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="chart-grid">
          <div class="chart-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">Failure Probability by Machine</div>
                <div class="chart-card-subtitle">AI-predicted failure likelihood</div>
              </div>
            </div>
            <div class="chart-card-body">
              <div class="bar-chart-container" id="failure-prob-chart"></div>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-card-header">
              <div>
                <div class="chart-card-title">Anomaly Scores</div>
                <div class="chart-card-subtitle">Real-time anomaly detection</div>
              </div>
            </div>
            <div class="chart-card-body">
              ${renderAnomalyScores(predictions)}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">Remaining Useful Life (RUL)</div>
              <div class="chart-card-subtitle">Predicted operating hours until maintenance required</div>
            </div>
          </div>
          <div class="chart-card-body">
            <div class="machine-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
              ${renderRULGauges(predictions)}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <div>
            <h3 class="section-title">Prediction Details</h3>
            <p class="section-subtitle">Per-machine AI analysis</p>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-body" style="overflow-x:auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Machine</th>
                  <th>Health</th>
                  <th>RUL (hrs)</th>
                  <th>Failure Prob</th>
                  <th>Anomaly Score</th>
                  <th>Confidence</th>
                  <th>Predicted Failure</th>
                </tr>
              </thead>
              <tbody>
                ${predictions.map(p => `
                  <tr>
                    <td><strong>${p.machineId}</strong><br><span style="color:var(--text-muted);font-size:11px">${p.machineName}</span></td>
                    <td><span style="color:${p.health > 70 ? 'var(--accent-emerald)' : p.health > 40 ? 'var(--accent-amber)' : 'var(--accent-red)'}">${p.health}%</span></td>
                    <td class="font-mono">${p.rul}</td>
                    <td><span class="badge ${p.failureProbability > 60 ? 'badge-critical' : p.failureProbability > 30 ? 'badge-warning' : 'badge-success'}">${p.failureProbability}%</span></td>
                    <td class="font-mono">${p.anomalyScore}</td>
                    <td>${p.confidence}%</td>
                    <td>${p.predictedFailureType === 'None' ? '<span style="color:var(--text-muted)">None</span>' : '<span class="badge badge-warning">' + p.predictedFailureType + '</span>'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

        renderFailureProbChart(predictions);
        renderRULCanvases(predictions);
    }

    function renderAnomalyScores(predictions) {
        return predictions.sort((a, b) => b.anomalyScore - a.anomalyScore).slice(0, 6).map(p => {
            const pct = Math.min(100, p.anomalyScore * 100);
            const color = pct > 60 ? 'var(--accent-red)' : pct > 30 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
            return `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
          <span style="min-width:70px;font-size:12px;color:var(--text-secondary)">${p.machineId}</span>
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.04);border-radius:99px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:99px;transition:width 1s ease"></div>
          </div>
          <span class="font-mono" style="min-width:40px;font-size:12px;font-weight:600;color:${color}">${p.anomalyScore.toFixed(2)}</span>
        </div>
      `;
        }).join('');
    }

    function renderRULGauges(predictions) {
        return predictions.filter(p => p.rul > 0).map(p => {
            const color = p.rul > 500 ? '#00e676' : p.rul > 200 ? '#ffb300' : '#ff3d71';
            return `
        <div class="gauge-container animate-in" style="padding:16px;">
          <div class="gauge-chart-container small">
            <canvas class="rul-gauge-canvas" data-value="${p.rul}" data-max="1000" data-color="${color}"></canvas>
            <div class="gauge-value-overlay" style="top:58%;left:50%;transform:translate(-50%,-50%)">
              <div class="gauge-value-number" style="font-size:16px;color:${color}">${p.rul}</div>
              <div class="gauge-value-unit">hours</div>
            </div>
          </div>
          <div class="gauge-label">${p.machineId}</div>
          <div style="font-size:11px;color:var(--text-muted)">${p.machineName}</div>
        </div>
      `;
        }).join('');
    }

    function renderRULCanvases(predictions) {
        document.querySelectorAll('.rul-gauge-canvas').forEach(canvas => {
            const val = parseFloat(canvas.dataset.value);
            const max = parseFloat(canvas.dataset.max);
            const color = canvas.dataset.color;
            Charts.drawGauge(canvas, val, max, color, { size: 100 });
        });
    }

    function renderFailureProbChart(predictions) {
        const container = document.getElementById('failure-prob-chart');
        if (!container) return;
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const sorted = [...predictions].sort((a, b) => b.failureProbability - a.failureProbability);
        Charts.drawBarChart(canvas, sorted.map(p => ({
            label: p.machineId,
            value: p.failureProbability,
            color: p.failureProbability > 60 ? 'rgba(255,61,113,0.8)' : p.failureProbability > 30 ? 'rgba(255,179,0,0.8)' : 'rgba(0,230,118,0.8)'
        })));
    }

    return { render };
})();
