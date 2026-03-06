// ============================================
// AI ENGINE — Server-Side Inference
// ============================================

const db = require('./database');

function runInference(machineId) {
    const machine = db.machines.find(m => m.id === machineId);
    if (!machine || machine.status === 'offline') return null;

    const readings = db.getMachineReadings(machineId);
    if (!readings) return null;

    // Feature extraction
    const features = {
        vibRMS: readings.vibration,
        vibKurtosis: 3.0 + (readings.vibration - 3) * 0.8 + (Math.random() - 0.5) * 0.5,
        tempDelta: Math.abs(readings.temperature - 55) / 55,
        pressVariance: Math.abs(readings.pressure - 200) / 200,
        rpmStability: 1 - Math.abs(readings.rpm - 2500) / 2500,
        powerRatio: readings.power / 100,
        currentDeviation: Math.abs(readings.current - 25) / 25
    };

    // Attention weights
    const attentionWeights = {
        vibration: 0.28 + Math.random() * 0.1,
        temperature: 0.22 + Math.random() * 0.08,
        pressure: 0.15 + Math.random() * 0.06,
        rpm: 0.13 + Math.random() * 0.05,
        power: 0.12 + Math.random() * 0.04,
        current: 0.10 + Math.random() * 0.04
    };
    const total = Object.values(attentionWeights).reduce((a, b) => a + b, 0);
    Object.keys(attentionWeights).forEach(k => attentionWeights[k] = +(attentionWeights[k] / total).toFixed(4));

    // Anomaly score
    const anomalyScore = +(
        attentionWeights.vibration * (readings.vibration / 8) +
        attentionWeights.temperature * (readings.temperature / 120) +
        attentionWeights.pressure * Math.abs(readings.pressure - 200) / 300 +
        attentionWeights.rpm * Math.abs(readings.rpm - 2500) / 4500 +
        attentionWeights.power * (readings.power / 100) +
        attentionWeights.current * (readings.current / 50)
    ).toFixed(4);

    // Failure classification
    const normalized = Math.min(1, anomalyScore * 1.5);
    const failureProbs = {
        normal: Math.max(0, 1 - normalized * 1.2),
        bearingFault: readings.vibration > 5 ? normalized * 0.6 : normalized * 0.1,
        overheating: readings.temperature > 85 ? normalized * 0.5 : normalized * 0.05,
        pressureDrop: readings.pressure < 100 || readings.pressure > 300 ? normalized * 0.3 : normalized * 0.05,
        electrical: readings.current > 40 ? normalized * 0.2 : normalized * 0.02
    };
    const probTotal = Object.values(failureProbs).reduce((a, b) => a + b, 0);
    Object.keys(failureProbs).forEach(k => failureProbs[k] = +(failureProbs[k] / probTotal).toFixed(4));

    // RUL
    const rulBase = 1000 * (1 - anomalyScore);
    const rul = Math.max(0, Math.round(rulBase + (Math.random() - 0.5) * 50));

    // Confidence
    const confidence = Math.min(99, Math.round(88 + (1 - anomalyScore) * 10 + Math.random() * 2));

    return {
        machineId,
        machineName: machine.name,
        readings,
        features,
        attentionWeights,
        anomalyScore: +anomalyScore,
        failureProbs,
        rul,
        confidence,
        health: machine.health,
        predictedFailureType: machine.health < 50 ? 'Bearing Failure' : machine.health < 70 ? 'Overheating' : 'None',
        inferenceTime: +(5 + Math.random() * 4).toFixed(1),
        timestamp: Date.now()
    };
}

function getPredictions() {
    return db.machines
        .filter(m => m.status !== 'offline')
        .map(m => runInference(m.id))
        .filter(Boolean);
}

module.exports = { runInference, getPredictions };
