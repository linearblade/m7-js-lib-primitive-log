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
    initManager(); // auto-init
});

function initManager() {
    if (manager) return logMessage("Manager already initialized", "warn");

    if (!window.lib?.primitive?.log?.Manager) {
        logMessage("ERROR: window.lib.primitive.log.Manager not found – check auto.js & load order", "error");
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
            max: 100,
            enabled: true,
            console: 'log',
            clone: false
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
    const count = manager.list().length;
    statusEl.textContent = `ready – ${count} bucket${count === 1 ? '' : 's'}`;
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
function createTestBuckets() {
    if (!manager) return logMessage("Manager not ready", "error");

    manager.clear(); // start fresh

    manager.createBucket('app', {
        max: 150,
        console: 'info',
        clone: false
    });

    manager.createBucket('errors', {
        max: 30,
        console: 'error',
        clone: true
    });

    manager.createBucket('debug', {
        max: 200,
        console: 'off',
        clone: true
    });

    logMessage("Created test buckets: app (console:info+), errors (console:error only), debug (console:off)", "info");
    updateStatus();
}

function logToBucket(bucketName, level, data) {
    if (!manager) return logMessage("Manager not ready", "error");

    const worker = manager.bucket(bucketName);
    if (!worker) {
        return logMessage(`Bucket '${bucketName}' does not exist – create buckets first`, "warn");
    }

    let record;
    if (level === 'log')    record = worker.log(data);
    else if (level === 'info')  record = worker.info(data);
    else if (level === 'warn')  record = worker.warn(data);
    else if (level === 'error') record = worker.error(data);
    else return logMessage(`Invalid level: ${level}`, "error");

    const prefix = `[${bucketName.toUpperCase()}] `;
    const display = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    logMessage(prefix + display, level);

    if (record) {
        logMessage(`   → stored (#${worker._count || '?'}) at ${new Date(record.header.at).toLocaleTimeString()}`, "list");
    } else {
        logMessage("   → dropped (bucket disabled?)", "warn");
    }
}

function logHighVolume(bucketName = 'app', count = 80) {
    if (!manager?.bucket(bucketName)) return logMessage(`Bucket '${bucketName}' missing`, "error");

    logMessage(`Generating ${count} logs to '${bucketName}'...`, "warn");
    for (let i = 1; i <= count; i++) {
        const emoji = i % 10 === 0 ? ' 🔥' : '';
        manager.log(bucketName, `Volume test #${i} of ${count}${emoji}`);
    }
    logMessage(`Done – ${count} logs emitted`, "info");
}

function setGlobalConsolePolicy(level) {
    if (!manager) return logMessage("Manager not ready", "error");

    manager.workers.forEach(w => w.setConsoleLevel(level));
    logMessage(`Global console policy → ${level.toUpperCase()} (all buckets)`, level === 'off' ? 'warn' : 'info');
}

function showBucket(bucketName) {
    if (!manager) return logMessage("Manager not ready", "error");

    const worker = manager.bucket(bucketName);
    if (!worker) return logMessage(`Bucket '${bucketName}' not found`, "warn");

    const records = manager.get(bucketName, { limit: 20 });
    const stats = worker.stats(); // get fresh stats

    if (records.length === 0) {
        logMessage(`Bucket '${bucketName}' is empty`, "warn");
        return;
    }

    const overwritten = stats.count > stats.size ? (stats.count - stats.size) : 0;
    const ringNote = stats.ring ? ` (ring buffer – ${overwritten} overwritten)` : '';

    logMessage(
        `Showing last ${records.length} from '${bucketName}' – current size: ${stats.size}${ringNote}`,
        "list"
    );

    records.forEach((rec, i) => {
        const { header, body } = rec;
        const time = new Date(header.at).toLocaleTimeString();
        const level = header.level.toUpperCase().padEnd(5);
        const payload = typeof body === 'object' && body !== null 
            ? JSON.stringify(body, null, 2).replace(/\n/g, ' ') 
            : String(body);
        logMessage(`  #${String(i+1).padStart(2)}  ${time}  ${level} → ${payload}`, header.level);
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
        const storedNow = s.size ?? '—';           // current records in memory
        const totalEmitted = s.count ?? '—';       // lifetime emits (useful for ring)
        const mx = s.max === 0 ? '∞' : (s.max ?? '—');
        const con = s.console ?? '—';
        const ringMode = s.ring ? ' (ring)' : '';

        logMessage(
            ` • ${s.name.padEnd(12)} | enabled: ${s.enabled ?? '?'} | size: ${storedNow} | total: ${totalEmitted} | max: ${mx}${ringMode} | console: ${con}`,
            "list"
        );
    });
}
function clearAll() {
    if (!manager) return;
    manager.clear();
    logMessage("All buckets cleared", "danger");
    updateStatus();
}
