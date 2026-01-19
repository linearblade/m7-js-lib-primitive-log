let manager = null;
let output = null;
let statusEl = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM ready! 🚀 m7 primitive.log test rig");
    output = document.getElementById('output');
    statusEl = document.getElementById('current-status');

    if (output) {
        output.textContent += "\nPage loaded at " + new Date().toLocaleTimeString() + "\n";
    }

    // Auto-init manager on load
    initManager();
});

function initManager() {
    if (manager) return;
    if (!window.lib?.primitive?.log) {
        logMessage("ERROR: window.lib.primitive.log not found – check auto.js load order", "error");
        statusEl.textContent = "lib missing";
        statusEl.style.color = '#f66';
        return;
    }

    const { Manager } = window.lib.primitive.log;
    manager = new Manager({
        name: "test-logger",
        enabled: true,
        throwOnError: false,
        worker: {
            max: 100,          // ring buffer per bucket
            enabled: true,
            console: 'log',    // default: show log+ higher
            clone: false       // no auto-clone by default
        }
    });

    logMessage("Manager initialized ✓", "info");
    updateStatus();
}

function updateStatus() {
    if (!manager) {
        statusEl.textContent = "manager not created";
        statusEl.style.color = '#888';
        return;
    }
    const buckets = manager.list().length;
    statusEl.textContent = `ready – ${buckets} bucket${buckets === 1 ? '' : 's'}`;
    statusEl.style.color = '#0d8';
}

// ────────────────────────────────────────────────
// UI Logging Helper
// ────────────────────────────────────────────────
function logMessage(text, className = 'info') {
    const line = document.createElement('div');
    line.className = `log-line ${className}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
    console.log(text);
    updateStatus();
}

function clearOutput() {
    output.innerHTML = '';
    logMessage('Output cleared', 'warn');
}

// ────────────────────────────────────────────────
// Core Demo Actions
// ────────────────────────────────────────────────
function createBuckets() {
    if (!manager) return logMessage("Manager not ready", "error");

    manager.createBucket('app',    { console: 'info' });
    manager.createBucket('errors', { console: 'error', max: 20 });
    manager.createBucket('debug',  { console: 'off', clone: true });

    logMessage("Created buckets: app, errors, debug", "info");
}

function logMessages() {
    if (!manager) return logMessage("Manager not ready", "error");

    manager.log('app',    "App started successfully 🚀");
    manager.info('app',   "User logged in", { userId: 42 });
    manager.warn('app',   "High latency detected ⚠️");
    manager.error('errors', new Error("Database timeout"), { code: 504 });
    manager.log('debug',  { complex: { nested: true, array: [1,2,3] } });

    logMessage("Sample messages logged to buckets", "info");
}

function logHighVolume(count = 50) {
    if (!manager) return logMessage("Manager not ready", "error");

    logMessage(`Generating ${count} log entries...`, "warn");
    for (let i = 1; i <= count; i++) {
        manager.log('app', `Event #${i} – testing volume ${Math.random() > 0.8 ? '🔥' : ''}`);
    }
    logMessage(`Done – ${count} logs emitted`, "info");
}

function changeConsolePolicy(level) {
    if (!manager) return;

    // For demo: apply to all buckets
    manager.workers.forEach(worker => {
        worker.setConsoleLevel(level);
    });

    logMessage(`Console policy set to: ${level.toUpperCase()} for all buckets`, level === 'off' ? 'warn' : 'info');
}

function showBucket(bucketName) {
    if (!manager) return logMessage("Manager not ready", "error");

    const records = manager.get(bucketName, { limit: 20 });
    if (records.length === 0) {
        logMessage(`Bucket '${bucketName}' is empty`, "warn");
        return;
    }

    logMessage(`Showing last ${records.length} records from '${bucketName}':`, "list");
    records.forEach((rec, i) => {
        const { header, body } = rec;
        const line = `[${new Date(header.at).toLocaleTimeString()}] ${header.level.toUpperCase()} → ${JSON.stringify(body)}`;
        logMessage(line, header.level);
    });
}

function listBuckets() {
    if (!manager) return logMessage("Manager not ready", "error");

    const stats = manager.list();
    if (stats.length === 0) {
        logMessage("No buckets created yet", "warn");
        return;
    }

    logMessage(`Buckets (${stats.length}):`, "list");
    stats.forEach(s => {
        logMessage(
            ` • ${s.name.padEnd(12)} | enabled: ${s.enabled} | stored: ${s.stored} | max: ${s.max || '∞'} | console: ${s.console}`,
            "list"
        );
    });
}

function clearAll() {
    if (!manager) return;
    manager.clear(); // clears all buckets
    logMessage("All buckets cleared", "danger");
}
