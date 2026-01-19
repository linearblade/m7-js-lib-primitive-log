// log/Manager.js
//
// Skeleton: log Manager (routes events to Workers/buckets + shared utilities).
// General-purpose (not ActiveTags specific).
//
// Responsibilities:
// - owns Worker registry
// - builds normalized record objects
// - console policy + printing (optional)
// - stack trace capture / pruning utilities
// - ergonomic helpers: info/warn/error/etc.
//
// Worker responsibilities:
// - per-bucket storage (ring/unlimited)
// - per-bucket enable/limits
// - per-bucket hooks

import Worker            from "./Worker.js";
//leave in the event I need it later. 
//import { CONSOLE_LEVEL } from './constants.js';
import utils             from './utils.js';

export default class Manager {
    /**
     * Create a Manager instance.
     *
     * The Manager acts as a coordinator and forwarding gate for log operations.
     * It does not store records itself; instead, it routes log calls to named
     * Worker buckets when enabled.
     *
     * Key semantics:
     * - `enabled` is a Manager-level forwarding gate only.
     *   Disabling the Manager prevents `log/info/warn/error` from forwarding,
     *   but does not mutate or affect existing Workers or Worker defaults.
     * - Worker creation defaults are derived from `opts.worker` via
     *   `setWorkerConfig()` and are independent of Manager enable state.
     * - The resolved Worker environment configuration is cached internally
     *   and reused for subsequent bucket creation.
     *
     * @param {Object} [opts]
     * @param {string} [opts.name='log']
     *        Logical name of this Manager (informational only).
     * @param {boolean} [opts.enabled=true]
     *        Manager-level forwarding gate.
     * @param {boolean} [opts.throwOnError=false]
     *        When true, `error()` throws after handling.
     * @param {Object} [opts.worker]
     *        Default Worker environment configuration applied to newly created
     *        buckets (independent of Manager enable state).
     * @param {Object<string, Object>} [opts.buckets]
     *        Map of `bucketName -> Worker options` used to eagerly create
     *        initial buckets at construction time.
     */
    constructor(opts = {}) {
	this.opts = opts;

	this.name = String(opts.name || "log");

	// Manager-level forwarding gate ONLY
	this.enabled = opts.enabled !== false;

	// Manager policy (not a worker default)
	this.throwOnError = opts.throwOnError === true;

	// Worker environment defaults (unrelated to Manager.enabled)
	this._workerConfig = null;
	this.setWorkerConfig(opts.worker);

	/** @type {Map<string, Worker>} */
	this.workers = new Map();

	// install initial buckets
	const buckets = (opts.buckets && typeof opts.buckets === "object") ? opts.buckets : null;
	if (buckets) {
            for (const [bucketName, wopts] of Object.entries(buckets)) {
		this.createBucket(bucketName, wopts || {});
            }
	}
    }

    /**
     * Set the Manager-level forwarding gate.
     *
     * When disabled, Manager logging methods (`log`, `info`, `warn`, `error`)
     * do not forward to Workers and return null.
     *
     * Notes:
     * - This does not modify Worker state.
     * - This does not affect Worker defaults or future bucket creation.
     *
     * @param {boolean} [on=true] Enable or disable Manager forwarding.
     */
    setEnabled(on = true) {
	this.enabled = !!on;
    }
    /**
     * Enable Manager-level forwarding.
     *
     * Equivalent to `setEnabled(true)`.
     * Does not modify Worker state.
     */
    enable() {
	this.enabled = true;
    }
    /**
     * Disable Manager-level forwarding.
     *
     * When disabled, Manager logging methods do not forward to Workers.
     * Equivalent to `setEnabled(false)`.
     * Does not modify Worker state.
     */
    disable() {
	this.enabled = false;
    }
    /**
     * Test whether Manager-level forwarding is enabled.
     *
     * @returns {boolean} True if Manager forwarding is enabled.
     */
    isEnabled() {
	return this.enabled === true;
    }

    /**
     * Define or update the default Worker environment configuration.
     *
     * This configuration is cached on the Manager and used as the base set of
     * options when creating new Worker buckets. It does not affect existing
     * Workers.
     *
     * Semantics:
     * - Worker defaults are independent of Manager enable state.
     * - Configuration is worker-scoped only (no inheritance from Manager options).
     * - Omitted keys preserve previously cached Worker defaults.
     * - On first call, hard defaults are applied where values are not provided.
     * - Values are normalized/resolved once and stored on the Manager.
     * - Per-bucket options provided to `createBucket()` may override these defaults.
     *
     * Notes:
     * - `workspace` is passed through as-is; Workers are responsible for
     *   sanitizing workspace values.
     * - Function references (`onEvent`, `onPrint`) are resolved best-effort
     *   at configuration time.
     *
     * @param {Object} [cfg]
     *        Worker environment configuration.
     * @param {boolean} [cfg.enabled=true]
     *        Default enabled state for newly created Workers.
     * @param {number|string} [cfg.max=0]
     *        Default storage limit for Workers.
     * @param {number|string|boolean} [cfg.console]
     *        Default console emission policy for Workers.
     * @param {Function|string|any} [cfg.onEvent]
     *        Default per-record hook for Workers.
     * @param {Function|string|any} [cfg.clock]
     *        Default clock function for Workers.
     * @param {any} [cfg.workspace]
     *        Default workspace value passed to Workers.
     * @param {boolean} [cfg.clone]
     *        Default cloning policy for Workers.
     * @param {Function|string|any} [cfg.onPrint]
     *        Default printer implementation for Workers.
     *
     * @returns {Object}
     *          The normalized and cached Worker environment configuration.
     */
    setWorkerConfig(cfg = {}) {
	const w = (cfg && typeof cfg === "object") ? cfg : {};

	// previous worker defaults (NOT Manager opts)
	const prev = (this._workerConfig && typeof this._workerConfig === "object")
              ? this._workerConfig
              : {};

	const rawConsole = ("console" in w) ? w.console : prev.console;
	const rawOnEvent = ("onEvent" in w) ? w.onEvent : prev.onEvent;
	const rawClock   = ("clock"   in w) ? w.clock   : prev.clock;

	const workspace  = ("workspace" in w) ? w.workspace : prev.workspace;

	this._workerConfig = {
            // IMPORTANT: default worker.enabled is independent of Manager.enabled
            enabled: ("enabled" in w) ? (w.enabled !== false) : (prev.enabled ?? true),

            // optional storage default
            max: ("max" in w) ? w.max : (prev.max ?? 0),

            // normalized/resolved (worker-only, but defaults from prior worker config)
            console: utils._normalizeConsoleLevel(rawConsole),
            onEvent: utils._getFunction(rawOnEvent, "onEvent"),
            clock: utils._getClock(rawClock),

            // opaque user workspace (Worker may sanitize if desired)
            workspace: workspace ?? {},

            // cloning (only true means true)
            clone: ("clone" in w) ? (w.clone === true) : (prev.clone === true),

            // optional printer default
            onPrint: ("onPrint" in w)
		? utils._getFunction(w.onPrint, "onPrint")
		: (prev.onPrint ?? null),
	};

	return this._workerConfig;
    }
    // ---------------------------------------------------------------------------
    // Bucket management
    // ---------------------------------------------------------------------------
    /**
     * Create (or replace) a Worker bucket.
     *
     * Worker options are built by merging the Manager's cached Worker environment
     * defaults with per-bucket overrides provided in `opts`.
     *
     * Precedence:
     * - Per-bucket overrides (`opts`) win over environment defaults.
     * - `name` is always enforced from the `name` argument.
     * - If `opts` has an own `workspace` key, that value is used; otherwise the
     *   environment workspace is used.
     * - If `opts` has an own `clone` key, that value determines clone (only true
     *   enables); otherwise the environment clone policy is used.
     *
     * Safety:
     * - Non-object `opts` values are treated as `{}` to avoid crashes.
     * - Console, hook, printer, and clock values are re-normalized after merge
     *   to account for per-bucket raw overrides.
     *
     * Replacement behavior:
     * - If a bucket with the same name already exists, it is replaced in the
     *   internal registry via Map overwrite (no teardown is performed).
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` → `"0"`).
     * - All other values throw.
     *
     * @param {string|number} name Bucket name (required).
     * @param {Object} [opts] Worker options override.
     * @returns {Worker} The created Worker instance.
     * @throws {Error} If `name` is invalid.
     */
    createBucket(name, opts = {}) {
	const key = utils.validateBucketName(name);

	const env = this._workerConfig || this.setWorkerConfig(this.opts.worker);

	// IMPORTANT: never allow non-object/null options to crash bucket creation
	const o = (opts && typeof opts === "object") ? opts : {};

	const hasWorkspace = Object.prototype.hasOwnProperty.call(o, "workspace");
	const hasClone     = Object.prototype.hasOwnProperty.call(o, "clone");

	const merged = Object.assign({}, env, o, {
            name: key,
            workspace: hasWorkspace ? o.workspace : env.workspace,
            clone: hasClone ? (o.clone === true) : (env.clone === true)
	});

	// If per-bucket overrides provided raw values, normalize again safely
	merged.console = utils._normalizeConsoleLevel(merged.console);
	merged.onEvent = utils._getFunction(merged.onEvent, "onEvent");
	merged.onPrint = utils._getFunction(merged.onPrint, "onPrint");
	merged.clock   = utils._getClock(merged.clock);

	const worker = new Worker(merged);
	this.workers.set(worker.name, worker);
	return worker;
    }
    /**
     * Get an existing Worker by name (soft lookup).
     *
     * This is an explicit lookup and does NOT create missing buckets.
     *
     * Behavior:
     * - Validates and normalizes the bucket name.
     * - If the name is invalid, returns `null` (does not throw).
     * - If the bucket does not exist, returns `null`.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` -> `"0"`).
     * - All other values are treated as invalid.
     *
     * @param {string|number} name Bucket name.
     * @returns {Worker|null} The Worker instance, or null if invalid or not found.
     */
    bucket(name) {
	const key = utils.validateBucketName(name,false);
	if(key===null) return null;
	return this.workers.get(key) || null;
    }


    /**
     * Get or create a Worker bucket.
     *
     * If the bucket does not exist, it is created via `createBucket(name, opts)`.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` -> `"0"`).
     * - All other values throw.
     *
     * @param {string|number} name Bucket name (required).
     * @param {Object} [opts] Worker options used only if bucket must be created.
     * @returns {Worker} The existing or newly created Worker.
     * @throws {Error} If `name` is invalid.
     */
    ensureBucket(name, opts = {}) {
	const key = utils.validateBucketName(name);
	let w = this.workers.get(key);
	if (!w) w = this.createBucket(key, opts);
	return w;
    }

    /**
     * Configure a bucket at runtime (creates bucket if missing).
     *
     * If the bucket exists:
     * - Applies the runtime portion of `patch` via `Worker.configure(patch)`.
     * - Creation-only options (e.g. `clone`) are ignored for existing buckets.
     *
     * If the bucket does not exist:
     * - Creates it first, with creation-time handling:
     *   - If `patch` has an own `workspace` property (even if `undefined`/`null`),
     *     that value is used during creation.
     *   - Otherwise uses the Manager's Worker environment default workspace
     *     (from `setWorkerConfig(...)`).
     *   - If `patch` has an own `clone` property, it is applied at creation time.
     * - Then applies the remaining runtime options via `Worker.configure(...)`.
     *
     * Notes:
     * - Non-object `patch` values are forwarded directly to `Worker.configure`
     *   and may throw.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` → `"0"`).
     * - All other values throw.
     *
     * @param {string|number} name Bucket name (required).
     * @param {Object} [patch] Worker configuration patch.
     * @returns {Worker} The configured Worker instance.
     * @throws {Error} If `name` is invalid.
     */
    configureBucket(name, patch = {}) {
	const key = utils.validateBucketName(name);

	const isObj = patch && typeof patch === "object";

	// Detect explicit overrides (even if undefined/null/false)
	const hasWorkspace =
              isObj && Object.prototype.hasOwnProperty.call(patch, "workspace");

	const hasClone =
              isObj && Object.prototype.hasOwnProperty.call(patch, "clone");

	// Creation-only opts (used only if bucket is missing)
	const createOpts = {};
	if (hasWorkspace) createOpts.workspace = patch.workspace;
	if (hasClone) createOpts.clone = (patch.clone === true);

	const w = this.ensureBucket(key, createOpts);

	// Apply runtime patch keys (exclude creation-only `clone`)
	if (isObj && hasClone) {
            const { clone, ...rest } = patch;
            w.configure(rest);
	} else {
            w.configure(patch);
	}

	return w;
    }
    // ---------------------------------------------------------------------------
    // Logging API (structured + optional console)
    // ---------------------------------------------------------------------------
    /**
     * Alias for `bucket(name)`.
     *
     * Behavior:
     * - Performs a soft lookup.
     * - Returns `null` if the bucket does not exist.
     * - Returns `null` if the bucket name is invalid.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` -> `"0"`).
     * - All other values are treated as invalid.
     *
     * @param {string|number} bucketName Bucket name.
     * @returns {Worker|null} The Worker instance, or null if invalid or not found.
     */

    to(bucketName) {
	return this.bucket(bucketName);
    }

    /**
     * Forward a `log` record to a bucket (soft runtime operation).
     *
     * Behavior:
     * - If Manager is disabled => returns null
     * - If bucket name is invalid or bucket does not exist => returns null
     * - Otherwise forwards to `Worker.log(data, opts)` and returns the stored record
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` → `"0"`).
     * - All other values are treated as invalid (soft failure).
     *
     * @param {string|number} bucketName Bucket name.
     * @param {any} data Payload to log.
     * @param {Object} [opts] Forwarded to Worker.
     * @returns {Object|null}
     *        The stored record, or null if dropped or bucket is missing/invalid.
     */
    log(bucketName, data, opts = {}) {
	if (!this.enabled) return null;
	const w = this.bucket(bucketName);
	if (!w) return null;
	return w.log(data, opts);
    }

    /**
     * Forward an `info` record to a bucket (soft runtime operation).
     *
     * Behavior:
     * - If Manager is disabled => returns null
     * - If bucket name is invalid or bucket does not exist => returns null
     * - Otherwise forwards to `Worker.info(data, opts)` and returns the stored record
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` → `"0"`).
     * - All other values are treated as invalid (soft failure).
     *
     * @param {string|number} bucketName Bucket name.
     * @param {any} data Payload to log.
     * @param {Object} [opts] Forwarded to Worker.
     * @returns {Object|null}
     *        The stored record, or null if dropped or bucket is missing/invalid.
     */
    info(bucketName, data, opts = {}) {
	if (!this.enabled) return null;
	const w = this.bucket(bucketName);
	if (!w) return null;
	return w.info(data, opts);
    }
    /**
     * Forward a `warn` record to a bucket (soft runtime operation).
     *
     * Behavior:
     * - If Manager is disabled => returns null
     * - If bucket name is invalid or bucket does not exist => returns null
     * - Otherwise forwards to `Worker.warn(data, opts)` and returns the stored record
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` → `"0"`).
     * - All other values are treated as invalid (soft failure).
     *
     * @param {string|number} bucketName Bucket name.
     * @param {any} data Payload to log.
     * @param {Object} [opts] Forwarded to Worker.
     * @returns {Object|null}
     *        The stored record, or null if dropped or bucket is missing/invalid.
     */
    warn(bucketName, data, opts = {}) {
	if (!this.enabled) return null;
	const w = this.bucket(bucketName);
	if (!w) return null;
	return w.warn(data, opts);
    }

    /**
     * Forward an `error` record to a bucket.
     *
     * Behavior:
     * - If Manager is disabled => returns null.
     * - If bucket name is invalid or bucket does not exist:
     *     - returns null
     *     - unless `throwOnError` is enabled, in which case:
     *         - prints the payload via `console.error`
     *         - throws
     * - If bucket exists:
     *     - forwards to `Worker.error(data, opts)`
     *     - returns the stored record
     *     - if `throwOnError` is enabled:
     *         - forwards to Worker with printing suppressed
     *         - prints once via `console.error`
     *         - throws after recording
     *
     * Notes:
     * - When throwing, the `opts` object forwarded to the Worker is modified
     *   to suppress Worker-side printing.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` → `"0"`).
     * - All other values are treated as invalid (soft failure).
     *
     * @param {string|number} bucketName Bucket name.
     * @param {any} data Payload to log.
     * @param {Object} [opts] Forwarded to Worker.
     * @returns {Object|null}
     *        The stored record, or null if dropped or bucket is missing/invalid.
     * @throws {Error}
     *        If `throwOnError` is enabled (regardless of bucket existence).
     */    
    error(bucketName, data, opts = {}) {
	if (!this.enabled) return null;

	const w = this.bucket(bucketName);

	// Missing / invalid bucket
	if (!w) {
            if (!this.throwOnError) return null;

            console.error(data);

            const err = new Error(
		`[log] error(${bucketName}) invalid or missing bucket (throwOnError enabled)`
            );
            err.bucket = bucketName;
            err.data = data;
            throw err;
	}

	// Emit, but suppress worker printing if we are going to throw
	const rec = w.error(
            data,
            this.throwOnError
		? Object.assign({}, opts, { print: false })
		: opts
	);

	if (!this.throwOnError) return rec;

	console.error(rec);

	const err = new Error(
            `[log] error(${bucketName}) (throwOnError enabled)`
	);
	err.bucket = bucketName;
	err.record = rec;
	throw err;
    }
    // ---------------------------------------------------------------------------
    // Reading / clearing
    // ---------------------------------------------------------------------------
    /**
     * Retrieve stored records from an existing bucket.
     *
     * Note:
     * - This method validates the bucket name and will throw if invalid.
     * - If the bucket does not exist, returns an empty array.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` -> `"0"`).
     * - All other values throw.
     *
     * @param {string|number} bucketName Existing bucket name.
     * @param {Object} [filter={}] Filter forwarded to `Worker.get(filter)`.
     * @returns {Object[]} Matching records; empty array if bucket does not exist.
     * @throws {Error} If `bucketName` is invalid.
     */
    get(bucketName, filter = {}) {
	const w = this._bucket(bucketName);
	if (!w) return [];
	return w.get(filter);
    }
    /**
     * Clear records.
     *
     * - If `bucketName` is null/undefined => clears all buckets.
     * - Otherwise clears only the named bucket (no-op if missing).
     *
     * Note:
     * - When clearing a specific bucket, the bucket name is validated and will throw if invalid.
     *
     * Bucket name rules (when `bucketName` is provided):
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` -> `"0"`).
     * - All other values throw.
     *
     * @param {string|number|null|undefined} bucketName Bucket name, or null/undefined for all.
     * @returns {void}
     * @throws {Error} If `bucketName` is provided but invalid.
     */
    clear(bucketName) {
	// if omitted => clear all
	if (bucketName == null) {
            for (const w of this.workers.values()) w.clear();
            return;
	}
	const w = this._bucket(bucketName);
	if (w) w.clear();
    }
    /**
     * List bucket stats for all registered Workers.
     *
     * @returns {Array<Object>} Array of `Worker.stats()` snapshots.
     */
    list() {
	const out = [];
	for (const w of this.workers.values()) {
            out.push(w.stats());
	}
	return out;
    }
    // ---------------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------------

    /**
     * Get an existing Worker by name (strict lookup).
     *
     * Internal variant of `bucket()` that enforces strict validation.
     *
     * Behavior:
     * - Validates and normalizes the bucket name.
     * - Throws if the name is invalid.
     * - Returns `null` if the bucket does not exist.
     *
     * Bucket name rules:
     * - Valid names are non-empty strings.
     * - Finite numbers are accepted and coerced to strings (e.g. `0` -> `"0"`).
     * - All other values throw.
     *
     * @param {string|number} name Bucket name.
     * @returns {Worker|null} The Worker instance, or null if not found.
     * @throws {Error} If `name` is invalid.
     */
    _bucket(name) {
	const key = utils.validateBucketName(name);
	return this.workers.get(key) || null;
    }

    

}
