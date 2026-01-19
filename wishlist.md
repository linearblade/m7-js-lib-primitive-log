Log Primitive — Wishlist & Future Work

This document tracks non-blocking improvements, enhancements, and follow-ups for the log capture primitive (primitive.log).
None of the items below are required for correctness or current production use.

⸻

1. Documentation & Developer Experience

1.1 API Documentation
    done
1.2 Behavioral Guides

“How it actually behaves” docs (not just signatures):
	•	Record lifecycle: emit() → _push() → onEvent → optional print
	•	Storage modes:
	•	unlimited (max = 0)
	•	ring (max > 0)
	•	Manager.bucket() vs Manager._bucket() semantics (soft vs strict)
	•	get(filter) routing rules (header/body targeting, predicate behavior, limit/since behavior)
	•	Practical usage examples:
	•	Live inspection (short buffer)
	•	Error-only capture (minimal overhead)
	•	Sampling patterns (implemented by user in onEvent)
	•	Export/shipping patterns (user-managed queue + batching)

⸻

2. Public Surface & Packaging

2.1 Public API Surface Declaration
    done
2.2 Build/Distribution Hygiene
    done
⸻

3. Telemetry & Observability

3.1 Minimal Stats/Counters

Add optional counters to support high-volume use without introducing policy:
	•	Per worker:
	•	total emitted (_count already exists)
	•	stored count (accepted)
	•	dropped count (disabled or rejected)
	•	overwrite count (ring overwrite events)
	•	Optional method:
	•	worker.stats() returning a stable shape (read-only snapshot)

3.2 Hook/Print Failure Visibility (Optional)
	•	Optional “debug mode” counters:
	•	onEvent errors swallowed count
	•	print errors swallowed count
	•	Keep default behavior “best-effort/no throw”.

⸻

4. Export & Serialization Helpers (Optional)

4.1 JSON-Safe Snapshot Helper

Provide a helper to support export without promising universal deep copy:
	done
4.2 Shape Reduction Helpers

Optional helpers to reduce payload volume:
	•	allowlist/denylist keys
	•	header/body selection
	•	truncate large strings / arrays

⸻

5. Performance & Safety Notes

5.1 Clone Guidance & Patterns

Document recommended patterns:
	•	default clone:false
	•	enable clone:true only for:
	•	error/warn
	•	sampled events
	•	specific buckets intended for export
	•	clarify “best-effort clone” limitations and fallbacks.

5.2 Console Printing Guidance

Document that console output is often the main bottleneck:
	•	recommend console off by default for high-volume
	•	show sampling patterns for console printing (implemented by user)

⸻

6. Testing

6.1 Unit Tests (Minimal Matrix)

Coverage for:
	•	ring ordering correctness and overwrite behavior
	•	get() filter semantics:
	•	header/body routing
	•	predicates (function values)
	•	limit/since
	•	clone precedence:
	•	Manager default → bucket override → per-call override
	•	name validation:
	•	numeric coercion
	•	invalid inputs
	•	die flag behavior
	•	workspace behavior:
	•	keyed-nuke semantics
	•	“not keyed means unchanged” behavior in configure paths

6.2 Deterministic Test Clock
	•	Provide a simple deterministic clock helper for repeatable tests:
	•	manual tick advancement
	•	predictable header.at/lastAt/delta

⸻

7. Tooling & Debugging Aids
	•	Optional debug mode:
	•	verbose lifecycle logging
	•	record shape inspection helper
	•	Optional “snapshot” helpers for UI console:
	•	current buffer size
	•	ring cursor info (internal-only if desired)

⸻

8. Non-Goals (Explicit)

The following are explicitly out of scope unless requirements change:
	•	Built-in transport/uploader
	•	Built-in retry/backoff, batching queues, or persistent outboxes
	•	Distributed logging / multi-process coordination
	•	Guaranteed delivery or exactly-once semantics
	•	Mandatory deep cloning or schema enforcement

⸻

Status

All items in this document are wishlist / future enhancements.
They should not block shipping, testing, or adoption of the current log primitive.