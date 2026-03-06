// ============================================
// DATA ENGINE — Simulated Sensor Data
// ============================================

const DataEngine = (() => {
  const MACHINES = [
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
    vibration:   { min: 0.5, max: 8.0, unit: 'mm/s', warn: 5.0, crit: 7.0 },
    temperature: { min: 35, max: 120, unit: '°C', warn: 85, crit: 100 },
    pressure:    { min: 80, max: 350, unit: 'PSI', warn: 280, crit: 320 },
    rpm:         { min: 500, max: 5000, unit: 'RPM', warn: 4200, crit: 4700 },
    power:       { min: 10, max: 100, unit: 'kW', warn: 80, crit: 95 },
    current:     { min: 5, max: 50, unit: 'A', warn: 40, crit: 47 }
  };

  // Generate sensor reading based on machine health
  function generateSensorValue(sensor, health, anomaly = false) {
    const range = SENSOR_RANGES[sensor];
    const healthFactor = (100 - health) / 100;
    const base = range.min + (range.max - range.min) * healthFactor * 0.7;
    const noise = (Math.random() - 0.5) * (range.max - range.min) * 0.1;
    const anomalyBoost = anomaly ? (range.max - range.min) * 0.3 * Math.random() : 0;
    return Math.min(range.max, Math.max(range.min, base + noise + anomalyBoost));
  }

  // Generate time series for a sensor
  function generateTimeSeries(sensor, health, points = 60) {
    const data = [];
    const now = Date.now();
    for (let i = 0; i < points; i++) {
      const anomaly = health < 50 && Math.random() < 0.15;
      data.push({
        time: now - (points - i) * 60000,
        value: generateSensorValue(sensor, health, anomaly)
      });
    }
    return data;
  }

  // Get current readings for a machine
  function getMachineReadings(machineId) {
    const machine = MACHINES.find(m => m.id === machineId);
    if (!machine || machine.status === 'offline') return null;
    const anomaly = machine.health < 50 && Math.random() < 0.2;
    return {
      vibration: generateSensorValue('vibration', machine.health, anomaly),
      temperature: generateSensorValue('temperature', machine.health, anomaly),
      pressure: generateSensorValue('pressure', machine.health, anomaly),
      rpm: generateSensorValue('rpm', machine.health, anomaly),
      power: generateSensorValue('power', machine.health, anomaly),
      current: generateSensorValue('current', machine.health, anomaly)
    };
  }

  // Generate alerts
  function generateAlerts() {
    const alerts = [
      { id: 'ALT-001', type: 'critical', machine: 'LTH-002', title: 'Bearing Failure Imminent', desc: 'Vibration anomaly detected — predicted bearing failure within 48 hours. Immediate inspection recommended.', time: '2 min ago', sensor: 'vibration', value: 7.2 },
      { id: 'ALT-002', type: 'warning', machine: 'CNC-002', title: 'Spindle Temperature Rising', desc: 'Spindle temperature trending 18% above baseline. Cooling system performance degraded.', time: '15 min ago', sensor: 'temperature', value: 92 },
      { id: 'ALT-003', type: 'warning', machine: 'WLD-002', title: 'Weld Quality Degradation', desc: 'Electrode wear detected. Weld current fluctuation exceeding ±5% threshold.', time: '32 min ago', sensor: 'current', value: 43 },
      { id: 'ALT-004', type: 'info', machine: 'PRE-001', title: 'Scheduled Maintenance Due', desc: 'Hydraulic fluid replacement scheduled in 72 hours. Current fluid quality at 78%.', time: '1 hr ago', sensor: 'pressure', value: 245 },
      { id: 'ALT-005', type: 'critical', machine: 'LTH-002', title: 'Excessive Vibration Detected', desc: 'Vibration levels exceeded critical threshold (7.0 mm/s). Machine auto-throttled to 60%.', time: '5 min ago', sensor: 'vibration', value: 7.8 },
      { id: 'ALT-006', type: 'info', machine: 'GRN-001', title: 'Grinding Wheel Wear Normal', desc: 'Grinding wheel wear at 45%. Replacement recommended at next scheduled maintenance.', time: '2 hrs ago', sensor: 'rpm', value: 3200 },
      { id: 'ALT-007', type: 'warning', machine: 'CNC-002', title: 'Tool Wear Accelerating', desc: 'Tool wear rate increased by 25% in last 4 hours. Predict tool replacement in 18 hours.', time: '45 min ago', sensor: 'vibration', value: 5.4 },
      { id: 'ALT-008', type: 'info', machine: 'ASM-001', title: 'Lubrication Level Low', desc: 'Joint lubrication reservoir at 22%. Automated refill scheduled for next shift.', time: '3 hrs ago', sensor: 'temperature', value: 58 }
    ];
    return alerts;
  }

  // KPI summary
  function getKPIs() {
    const active = MACHINES.filter(m => m.status !== 'offline');
    const healthy = MACHINES.filter(m => m.status === 'healthy').length;
    const avgHealth = active.reduce((sum, m) => sum + m.health, 0) / active.length;
    return {
      oee: 87.3,
      oeeChange: 2.4,
      predictedFailures: MACHINES.filter(m => m.rul > 0 && m.rul < 200).length,
      failuresChange: -1,
      costSavings: 284500,
      savingsChange: 12.8,
      fleetHealth: Math.round(avgHealth),
      healthChange: -1.2,
      totalMachines: MACHINES.length,
      activeMachines: active.length,
      healthyCount: healthy,
      warningCount: MACHINES.filter(m => m.status === 'warning').length,
      criticalCount: MACHINES.filter(m => m.status === 'critical').length,
      maintenanceCount: MACHINES.filter(m => m.status === 'maintenance').length,
      offlineCount: MACHINES.filter(m => m.status === 'offline').length
    };
  }

  // AI model predictions
  function getPredictions() {
    return MACHINES.filter(m => m.status !== 'offline').map(m => ({
      machineId: m.id,
      machineName: m.name,
      health: m.health,
      rul: m.rul,
      failureProbability: Math.max(0, Math.min(100, Math.round((100 - m.health) * 1.1 + (Math.random() - 0.5) * 10))),
      confidence: Math.round(85 + Math.random() * 12),
      anomalyScore: +(Math.max(0, (100 - m.health) / 100 + (Math.random() - 0.5) * 0.2)).toFixed(3),
      predictedFailureType: m.health < 50 ? 'Bearing Failure' : m.health < 70 ? 'Overheating' : 'None',
      featureImportance: {
        'Vibration RMS': +(0.15 + Math.random() * 0.25).toFixed(3),
        'Temperature Delta': +(0.1 + Math.random() * 0.2).toFixed(3),
        'Pressure Variance': +(0.05 + Math.random() * 0.15).toFixed(3),
        'RPM Stability': +(0.08 + Math.random() * 0.18).toFixed(3),
        'Power Consumption': +(0.05 + Math.random() * 0.12).toFixed(3),
        'Operating Hours': +(0.03 + Math.random() * 0.1).toFixed(3)
      }
    }));
  }

  // Random sparkline data
  function getSparklineData(length = 20, min = 0, max = 100) {
    const data = [];
    let val = min + (max - min) * 0.5;
    for (let i = 0; i < length; i++) {
      val += (Math.random() - 0.48) * (max - min) * 0.1;
      val = Math.max(min, Math.min(max, val));
      data.push(val);
    }
    return data;
  }

  return {
    MACHINES,
    SENSOR_RANGES,
    generateSensorValue,
    generateTimeSeries,
    getMachineReadings,
    generateAlerts,
    getKPIs,
    getPredictions,
    getSparklineData
  };
})();
