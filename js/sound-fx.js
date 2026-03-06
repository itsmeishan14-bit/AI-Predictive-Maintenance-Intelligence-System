// ============================================
// SOUND — Subtle AI Audio Feedback
// Uses Web Audio API for lightweight beeps
// ============================================

const SoundFX = (() => {
    let audioCtx = null;
    let enabled = true;

    function getCtx() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
            catch (e) { enabled = false; }
        }
        return audioCtx;
    }

    function beep(freq = 440, duration = 0.08, vol = 0.04, type = 'sine') {
        if (!enabled) return;
        const ctx = getCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) { /* silent fail */ }
    }

    function predictionBeep() {
        beep(880, 0.06, 0.03, 'sine');
        setTimeout(() => beep(1100, 0.05, 0.02, 'sine'), 80);
    }

    function alertBeep() {
        beep(600, 0.1, 0.04, 'square');
        setTimeout(() => beep(400, 0.15, 0.03, 'square'), 120);
    }

    function hoverClick() {
        beep(1200, 0.03, 0.015, 'sine');
    }

    function successBeep() {
        beep(523, 0.08, 0.03, 'sine');
        setTimeout(() => beep(659, 0.08, 0.03, 'sine'), 100);
        setTimeout(() => beep(784, 0.1, 0.03, 'sine'), 200);
    }

    function dataFlowTick() {
        beep(2000 + Math.random() * 1000, 0.02, 0.008, 'sine');
    }

    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    return { predictionBeep, alertBeep, hoverClick, successBeep, dataFlowTick, toggle, get enabled() { return enabled; } };
})();
