function isVibrationSupported() {
    return "vibrate" in navigator;
}

function safeVibrate(pattern) {
    if (!isVibrationSupported()) return false;
    navigator.vibrate(pattern);
    return true;
}

 function vibrateOnce(durationMs = 200) {
    return safeVibrate(durationMs);
}

function vibratePattern(pattern = [100, 50, 100]) {
    return safeVibrate(pattern);
}

function stopVibration() {
    if (!isVibrationSupported()) return false;
    navigator.vibrate(0);
    return true;
}

function vibrateSuccess() {
    return vibratePattern([80, 40, 80]);
}

 function vibrateError() {
    return vibratePattern([150, 60, 150]);
}

 function vibrateWarning() {
    return vibratePattern([60, 40, 60, 40, 60]);
}

function vibrateForEvent(type, { durationMs = 150, pattern } = {}) {
    switch (type) {
        case "success":
            return vibrateSuccess();
        case "error":
            return vibrateError();
        case "warning":
            return vibrateWarning();
        case "once":
            return vibrateOnce(durationMs);
        case "custom":
            return vibratePattern(pattern);
        default:
            return vibrateOnce(120);
    }
}

 function onRoomFound() {
    vibrateSuccess();
}

function onNavigationError() {
    vibrateError();
}

 function onRecenterMap() {
    vibrateOnce(80);
}

 function onQuickTiltDetected() {
    vibrateWarning();
}

// Device Orientation (Gyro)
let orientationEnabled = false;
let orientationHandler = null;
let orientationCallbacks = [];
let quickTiltCallbacks = [];
let lastBeta = null;
let lastGamma = null;
let lastTime = null;
let cooldownUntil = 0;
const DEFAULT_ANGLE_THRESHOLD = 25;
const DEFAULT_TIME_THRESHOLD_MS = 250;
const DEFAULT_COOLDOWN_MS = 500;
let angleThreshold = DEFAULT_ANGLE_THRESHOLD;
let timeThresholdMs = DEFAULT_TIME_THRESHOLD_MS;
let cooldownMs = DEFAULT_COOLDOWN_MS;

 function isDeviceOrientationSupported() {
    return typeof window !== "undefined" && "DeviceOrientationEvent" in window;
}

function setQuickTiltConfig(opts = {}) {
    if (typeof opts.angleThreshold === "number") angleThreshold = opts.angleThreshold;
    if (typeof opts.timeThresholdMs === "number") timeThresholdMs = opts.timeThresholdMs;
    if (typeof opts.cooldownMs === "number") cooldownMs = opts.cooldownMs;
}

function handleOrientationEvent(event) {
    const { beta, gamma } = event;
    const now = Date.now();
    
    if (beta == null || gamma == null) return;
    if (now < cooldownUntil) return;
    
    if (lastBeta === null) {
        lastBeta = beta;
        lastGamma = gamma;
        lastTime = now;
        return;
    }
    
    const dt = now - (lastTime ?? now);
    const diffBeta = Math.abs(beta - lastBeta);
    const diffGamma = Math.abs(gamma - lastGamma);
    
    orientationCallbacks.forEach((cb) => {
        try {
            cb({ alpha: event.alpha, beta, gamma, dt, diffBeta, diffGamma });
        } catch {}
    });
    
    if (dt < timeThresholdMs && (diffBeta > angleThreshold || diffGamma > angleThreshold)) {
        quickTiltCallbacks.forEach((cb) => {
            try {
                cb({ diffBeta, diffGamma });
            } catch {}
        });
        cooldownUntil = now + cooldownMs;
        lastBeta = beta;
        lastGamma = gamma;
        lastTime = now;
        return;
    }
    
    lastBeta = beta;
    lastGamma = gamma;
    lastTime = now;
}

async function enableDeviceOrientation() {
    if (!isDeviceOrientationSupported()) return false;
    if (orientationEnabled) return true;
    
    if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
        try {
            const result = await DeviceOrientationEvent.requestPermission();
            if (result !== "granted") return false;
        } catch {
            return false;
        }
    }
    
    orientationHandler = handleOrientationEvent;
    window.addEventListener("deviceorientation", orientationHandler);
    orientationEnabled = true;
    return true;
}

 function disableDeviceOrientation() {
    if (!orientationEnabled) return;
    
    if (orientationHandler && typeof window !== "undefined") {
        window.removeEventListener("deviceorientation", orientationHandler);
    }
    
    orientationHandler = null;
    orientationEnabled = false;
    lastBeta = null;
    lastGamma = null;
    lastTime = null;
    cooldownUntil = 0;
}

 function onOrientationChange(callback) {
    if (typeof callback !== "function") return;
    if (!orientationCallbacks.includes(callback)) orientationCallbacks.push(callback);
}

function offOrientationChange(callback) {
    orientationCallbacks = orientationCallbacks.filter((cb) => cb !== callback);
}

function onQuickTilt(callback) {
    if (typeof callback !== "function") return;
    if (!quickTiltCallbacks.includes(callback)) quickTiltCallbacks.push(callback);
}

function offQuickTilt(callback) {
    quickTiltCallbacks = quickTiltCallbacks.filter((cb) => cb !== callback);

}
