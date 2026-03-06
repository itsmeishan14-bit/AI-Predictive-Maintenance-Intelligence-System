// ============================================
// DATABASE — In-Memory Data Store
// Simulates a real database for the hackathon
// ============================================

const machines = [
    { id: 'CNC-001', name: 'CNC Milling Machine #1', type: 'CNC Mill', location: 'Bay A-1', status: 'healthy', health: 94, rul: 847, installed: '2023-03-15' },
    { id: 'CNC-002', name: 'CNC Milling Machine #2', type: 'CNC Mill', location: 'Bay A-2', status: 'warning', health: 67, rul: 213, installed: '2022-11-08' },
    { id: 'LTH-001', name: 'CNC Lathe #1', type: 'Lathe', location: 'Bay B-1', status: 'healthy', health: 91, rul: 762, installed: '2023-06-20' },
    { id: 'LTH-002', name: 'CNC Lathe #2', type: 'Lathe', location: 'Bay B-2', status: 'critical', health: 32, rul: 48, installed: '2021-09-12' },
    { id: 'PRE-001', name: 'Hydraulic Press #1', type: 'Press', location: 'Bay C-1', status: 'healthy', health: 88, rul: 654, installed: '2023-01-10' },
    { id: 'PRE-002', name: 'Hydraulic Press #2', type: 'Press', location: 'Bay C-2', status: 'maintenance', health: 55, rul: 0, installed: '2022-04-18' },
    { id: 'WLD-001', name: 'Robotic Welder #1', type: 'Welder', location: 'Bay D-1', status: 'healthy', health: 96, rul: 920, installed: '2024-02-05' },
    { id: 'WLD-002', name: 'Robotic Welder #2', type: 'Welder', location: 'Bay D-2', status: 'warning', health: 71, rul: 187, installed: '2022-07-22' },
    { id: 'GRN-001', name: 'Surface Grinder #1', type: 'Grinder', location: 'Bay E-1', status: 'healthy', health: 85, rul: 589, installed: '2023-08-14' },
    { id: 'INJ-001', name: 'Injection Molder #1', type: 'Injection', location: 'Bay F-1', status: 'healthy', health: 92, rul: 801, installed: '2023-05-03' },
    { id: 'INJ-002', name: 'Injection Molder #2', type: 'Injection', location: 'Bay F-2', status: 'offline', health: 0, rul: 0, installed: '2021-12-01' },
    { id: 'ASM-001', name: 'Assembly Robot #1', type: 'Assembly', location: 'Bay G-1', status: 'healthy', health: 89, rul: 678, installed: '2023-10-20' }
];

const SENSOR_RANGES = {
    vibration: { min: 0.5, max: 8.0, unit: 'mm/s', warn: 5.0, crit: 7.0 },
    temperature: { min: 35, max: 120, unit: '°C', warn: 85, crit: 100 },
    pressure: { min: 80, max: 350, unit: 'PSI', warn: 280, crit: 320 },
    rpm: { min: 500, max: 5000, unit: 'RPM', warn: 4200, crit: 4700 },
    power: { min: 10, max: 100, unit: 'kW', warn: 80, crit: 95 },
    current: { min: 5, max: 50, unit: 'A', warn: 40, crit: 47 }
};

let alertCounter = 8; // Tracks next alert ID to avoid collisions

const alerts = [
    { id: 'ALT-001', type: 'critical', machine: 'LTH-002', title: 'Bearing Failure Imminent', desc: 'Vibration anomaly detected — predicted bearing failure within 48 hours.', time: Date.now() - 120000, sensor: 'vibration', value: 7.2, acknowledged: false },
    { id: 'ALT-002', type: 'warning', machine: 'CNC-002', title: 'Spindle Temperature Rising', desc: 'Spindle temperature trending 18% above baseline.', time: Date.now() - 900000, sensor: 'temperature', value: 92, acknowledged: false },
    { id: 'ALT-003', type: 'warning', machine: 'WLD-002', title: 'Weld Quality Degradation', desc: 'Electrode wear detected. Current fluctuation exceeding ±5%.', time: Date.now() - 1920000, sensor: 'current', value: 43, acknowledged: false },
    { id: 'ALT-004', type: 'info', machine: 'PRE-001', title: 'Scheduled Maintenance Due', desc: 'Hydraulic fluid replacement in 72 hours.', time: Date.now() - 3600000, sensor: 'pressure', value: 245, acknowledged: true },
    { id: 'ALT-005', type: 'critical', machine: 'LTH-002', title: 'Excessive Vibration', desc: 'Vibration exceeded critical threshold (7.0 mm/s). Machine auto-throttled.', time: Date.now() - 300000, sensor: 'vibration', value: 7.8, acknowledged: false },
    { id: 'ALT-006', type: 'info', machine: 'GRN-001', title: 'Grinding Wheel Wear Normal', desc: 'Wheel wear at 45%. Replace at next maintenance.', time: Date.now() - 7200000, sensor: 'rpm', value: 3200, acknowledged: true },
    { id: 'ALT-007', type: 'warning', machine: 'CNC-002', title: 'Tool Wear Accelerating', desc: 'Tool wear rate +25% in last 4 hours.', time: Date.now() - 2700000, sensor: 'vibration', value: 5.4, acknowledged: false },
    { id: 'ALT-008', type: 'info', machine: 'ASM-001', title: 'Lubrication Level Low', desc: 'Joint lubrication at 22%. Refill scheduled next shift.', time: Date.now() - 10800000, sensor: 'temperature', value: 58, acknowledged: true }
];

// Sensor data history storage (ring buffer per machine)
const sensorHistory = {};
machines.forEach(m => {
    sensorHistory[m.id] = {
        vibration: [], temperature: [], pressure: [], rpm: [], power: [], current: []
    };
});

// Generate a single sensor reading
function generateSensorValue(sensor, health, anomaly = false) {
    const range = SENSOR_RANGES[sensor];
    const healthFactor = (100 - health) / 100;
    const base = range.min + (range.max - range.min) * healthFactor * 0.7;
    const noise = (Math.random() - 0.5) * (range.max - range.min) * 0.1;
    const anomalyBoost = anomaly ? (range.max - range.min) * 0.3 * Math.random() : 0;
    return Math.min(range.max, Math.max(range.min, base + noise + anomalyBoost));
}

// Get live readings for a machine
function getMachineReadings(machineId) {
    const machine = machines.find(m => m.id === machineId);
    if (!machine || machine.status === 'offline') return null;
    const anomaly = machine.health < 50 && Math.random() < 0.2;
    const readings = {
        vibration: generateSensorValue('vibration', machine.health, anomaly),
        temperature: generateSensorValue('temperature', machine.health, anomaly),
        pressure: generateSensorValue('pressure', machine.health, anomaly),
        rpm: generateSensorValue('rpm', machine.health, anomaly),
        power: generateSensorValue('power', machine.health, anomaly),
        current: generateSensorValue('current', machine.health, anomaly),
        timestamp: Date.now()
    };

    // Store in history (keep last 120 points)
    const history = sensorHistory[machineId];
    if (history) {
        Object.keys(readings).forEach(key => {
            if (key !== 'timestamp' && history[key]) {
                history[key].push({ value: readings[key], time: readings.timestamp });
                if (history[key].length > 120) history[key].shift();
            }
        });
    }

    return readings;
}

// Get all readings for all active machines
function getAllReadings() {
    const result = {};
    machines.forEach(m => {
        if (m.status !== 'offline') {
            result[m.id] = getMachineReadings(m.id);
        }
    });
    return result;
}

// Get KPIs
function getKPIs() {
    const active = machines.filter(m => m.status !== 'offline');
    const avgHealth = active.reduce((sum, m) => sum + m.health, 0) / active.length;
    return {
        oee: 87.3,
        oeeChange: 2.4,
        predictedFailures: machines.filter(m => m.rul > 0 && m.rul < 200).length,
        failuresChange: -1,
        costSavings: 284500,
        savingsChange: 12.8,
        fleetHealth: Math.round(avgHealth),
        healthChange: -1.2,
        totalMachines: machines.length,
        activeMachines: active.length,
        healthyCount: machines.filter(m => m.status === 'healthy').length,
        warningCount: machines.filter(m => m.status === 'warning').length,
        criticalCount: machines.filter(m => m.status === 'critical').length,
        maintenanceCount: machines.filter(m => m.status === 'maintenance').length,
        offlineCount: machines.filter(m => m.status === 'offline').length
    };
}

// System status
const systemStatus = {
    gpuUsage: 34,
    gpuTemp: 52,
    inferenceLatency: 8.4,
    throughput: 847,
    modelConfidence: 94.2,
    sensorsOnline: 11,
    sensorsTotal: 12,
    dataIngested: 0,
    uptime: 0,
    modelVersion: 'PredictNet v2.3',
    serverStartTime: Date.now()
};

function updateSystemStatus() {
    systemStatus.gpuUsage = Math.round(30 + Math.random() * 20);
    systemStatus.gpuTemp = Math.round(48 + Math.random() * 10);
    systemStatus.inferenceLatency = +(6 + Math.random() * 6).toFixed(1);
    systemStatus.throughput = Math.round(800 + Math.random() * 200);
    systemStatus.modelConfidence = +(92 + Math.random() * 6).toFixed(1);
    systemStatus.dataIngested = parseFloat((systemStatus.dataIngested + 0.02 + Math.random() * 0.05).toFixed(2));
    systemStatus.uptime = Math.floor((Date.now() - systemStatus.serverStartTime) / 1000);
    return { ...systemStatus };
}

function nextAlertId() {
    alertCounter++;
    return 'ALT-' + String(alertCounter).padStart(3, '0');
}

module.exports = {
    machines,
    SENSOR_RANGES,
    alerts,
    sensorHistory,
    generateSensorValue,
    getMachineReadings,
    getAllReadings,
    getKPIs,
    systemStatus,
    updateSystemStatus,
    nextAlertId
};
