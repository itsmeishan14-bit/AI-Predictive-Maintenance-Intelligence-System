// ============================================
// AI MODEL ENGINE — Neural Network Simulation
// Implements a realistic predictive maintenance
// AI model with feature extraction, inference,
// and interpretability layers.
// ============================================

const AIModel = (() => {
    // Model architecture definition
    const ARCHITECTURE = {
        name: 'PredictNet v2.3',
        type: 'Bi-LSTM with Multi-Head Self-Attention',
        framework: 'PyTorch 2.1',
        layers: [
            { name: 'Input Layer', type: 'input', nodes: 6, desc: '6 sensor channels × 100 timesteps' },
            { name: 'Conv1D Block', type: 'conv', nodes: 64, desc: '1D convolutions for local pattern extraction' },
            { name: 'Bi-LSTM Layer 1', type: 'lstm', nodes: 128, desc: 'Forward & backward temporal dependencies' },
            { name: 'Bi-LSTM Layer 2', type: 'lstm', nodes: 128, desc: 'Higher-order sequence features' },
            { name: 'Multi-Head Attention', type: 'attention', nodes: 8, desc: '8 attention heads, key-query-value' },
            { name: 'Dense Block', type: 'dense', nodes: 256, desc: 'ReLU activation + BatchNorm + Dropout(0.3)' },
            { name: 'Dense Block', type: 'dense', nodes: 128, desc: 'ReLU activation + BatchNorm + Dropout(0.2)' },
            { name: 'Output Heads', type: 'output', nodes: 3, desc: 'RUL regression, failure classification, anomaly score' }
        ],
        totalParams: '2,847,619',
        trainableParams: '2,841,283',
        nonTrainableParams: '6,336'
    };

    // Training history (realistic convergence curves)
    const TRAINING_HISTORY = (() => {
        const epochs = 150;
        const history = { trainLoss: [], valLoss: [], trainAcc: [], valAcc: [], lr: [] };
        let lr = 0.001;
        for (let i = 0; i < epochs; i++) {
            const t = i / epochs;
            // Loss with realistic plateau + sudden improvement pattern
            const plateau = i > 40 && i < 60 ? 0.02 : 0;
            const jump = i === 60 ? -0.03 : 0;
            history.trainLoss.push(Math.max(0.02, 0.82 * Math.exp(-4.5 * t) + 0.035 + plateau + jump + (Math.random() - 0.5) * 0.015));
            history.valLoss.push(Math.max(0.04, 0.88 * Math.exp(-4.0 * t) + 0.055 + plateau * 1.5 + jump + (Math.random() - 0.5) * 0.025));
            // Accuracy (inverse of loss pattern)
            history.trainAcc.push(Math.min(0.99, 0.55 + 0.44 * (1 - Math.exp(-5 * t)) - (Math.random() - 0.5) * 0.01));
            history.valAcc.push(Math.min(0.975, 0.52 + 0.43 * (1 - Math.exp(-4.5 * t)) - (Math.random() - 0.5) * 0.015));
            // Learning rate with cosine annealing warm restart
            if (i < 5) lr = 0.001 * (i + 1) / 5; // warmup
            else if (i === 60 || i === 100) lr = 0.0005; // restart
            else lr *= 0.995;
            history.lr.push(lr);
        }
        return history;
    })();

    // Confusion matrix data
    const CONFUSION_MATRIX = {
        labels: ['Normal', 'Bearing Fault', 'Overheating', 'Pressure Drop', 'Electrical'],
        matrix: [
            [487, 3, 2, 1, 0],
            [5, 234, 1, 0, 2],
            [2, 1, 198, 3, 0],
            [1, 0, 2, 156, 1],
            [0, 2, 0, 1, 89]
        ]
    };

    // Feature extraction pipeline
    const FEATURE_PIPELINE = [
        { name: 'Raw Sensor Ingestion', desc: '6 channels sampled at 1kHz', icon: 'sensor', duration: '< 1ms' },
        { name: 'Signal Preprocessing', desc: 'Bandpass filter, resampling to 100Hz, normalization', icon: 'filter', duration: '2ms' },
        { name: 'Windowing', desc: 'Sliding window: 100 steps, 50% overlap', icon: 'window', duration: '1ms' },
        { name: 'Statistical Features', desc: 'RMS, kurtosis, skewness, peak-to-peak, crest factor', icon: 'stats', duration: '1ms' },
        { name: 'Frequency Domain', desc: 'FFT, spectral entropy, dominant frequency', icon: 'freq', duration: '3ms' },
        { name: 'Model Inference', desc: 'Bi-LSTM + Attention forward pass', icon: 'model', duration: '5ms' },
        { name: 'Post-Processing', desc: 'Calibration, threshold check, alert generation', icon: 'post', duration: '< 1ms' }
    ];

    // Live inference simulation
    function runInference(sensorData) {
        const { vibration, temperature, pressure, rpm, power, current } = sensorData;

        // Simulated feature extraction
        const features = {
            vibRMS: vibration,
            vibKurtosis: 3.0 + (vibration - 3) * 0.8 + (Math.random() - 0.5) * 0.5,
            tempDelta: Math.abs(temperature - 55) / 55,
            pressVariance: Math.abs(pressure - 200) / 200,
            rpmStability: 1 - Math.abs(rpm - 2500) / 2500,
            powerRatio: power / 100,
            currentDeviation: Math.abs(current - 25) / 25
        };

        // Simulated attention weights
        const attentionWeights = {
            vibration: 0.28 + Math.random() * 0.1,
            temperature: 0.22 + Math.random() * 0.08,
            pressure: 0.15 + Math.random() * 0.06,
            rpm: 0.13 + Math.random() * 0.05,
            power: 0.12 + Math.random() * 0.04,
            current: 0.10 + Math.random() * 0.04
        };
        // Normalize
        const total = Object.values(attentionWeights).reduce((a, b) => a + b, 0);
        Object.keys(attentionWeights).forEach(k => attentionWeights[k] /= total);

        // Anomaly score (weighted combination)
        const anomalyScore =
            attentionWeights.vibration * (vibration / 8) +
            attentionWeights.temperature * (temperature / 120) +
            attentionWeights.pressure * Math.abs(pressure - 200) / 300 +
            attentionWeights.rpm * Math.abs(rpm - 2500) / 4500 +
            attentionWeights.power * (power / 100) +
            attentionWeights.current * (current / 50);

        // Failure classification probabilities
        const normalized = Math.min(1, anomalyScore * 1.5);
        const failureProbs = {
            normal: Math.max(0, 1 - normalized * 1.2),
            bearingFault: vibration > 5 ? normalized * 0.6 : normalized * 0.1,
            overheating: temperature > 85 ? normalized * 0.5 : normalized * 0.05,
            pressureDrop: pressure < 100 || pressure > 300 ? normalized * 0.3 : normalized * 0.05,
            electrical: current > 40 ? normalized * 0.2 : normalized * 0.02
        };
        // Normalize
        const probTotal = Object.values(failureProbs).reduce((a, b) => a + b, 0);
        Object.keys(failureProbs).forEach(k => failureProbs[k] = +(failureProbs[k] / probTotal).toFixed(4));

        // RUL estimation (hours)
        const rulBase = 1000 * (1 - anomalyScore);
        const rul = Math.max(0, Math.round(rulBase + (Math.random() - 0.5) * 50));

        // Confidence
        const confidence = Math.round(88 + (1 - anomalyScore) * 10 + Math.random() * 2);

        return {
            features,
            attentionWeights,
            anomalyScore: +anomalyScore.toFixed(4),
            failureProbs,
            rul,
            confidence: Math.min(99, confidence),
            inferenceTime: +(5 + Math.random() * 4).toFixed(1),
            timestamp: Date.now()
        };
    }

    // Model performance metrics
    const METRICS = {
        overall: {
            accuracy: 0.9472,
            precision: 0.9513,
            recall: 0.9361,
            f1: 0.9436,
            aucRoc: 0.9782,
            maeRUL: 23.4,
            rmseRUL: 31.7
        },
        perClass: [
            { name: 'Normal', precision: 0.984, recall: 0.988, f1: 0.986, support: 493 },
            { name: 'Bearing Fault', precision: 0.975, recall: 0.967, f1: 0.971, support: 242 },
            { name: 'Overheating', precision: 0.975, recall: 0.971, f1: 0.973, support: 204 },
            { name: 'Pressure Drop', precision: 0.969, recall: 0.975, f1: 0.972, support: 160 },
            { name: 'Electrical', precision: 0.967, recall: 0.978, f1: 0.972, support: 92 }
        ],
        training: {
            epochs: 150,
            batchSize: 64,
            optimizer: 'AdamW',
            learningRate: '1e-3 (cosine annealing)',
            weightDecay: 0.01,
            earlyStopping: 'Patience: 20 epochs',
            dataAugmentation: 'Gaussian noise, time-shift, magnitude-warp',
            crossValidation: '5-fold stratified',
            trainingTime: '47 minutes',
            gpuUsed: 'NVIDIA A100 40GB'
        }
    };

    return {
        ARCHITECTURE,
        TRAINING_HISTORY,
        CONFUSION_MATRIX,
        FEATURE_PIPELINE,
        METRICS,
        runInference
    };
})();
