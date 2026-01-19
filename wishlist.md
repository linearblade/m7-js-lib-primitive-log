
Interval Management Suite — Wishlist & Future Work

This document tracks non-blocking improvements, enhancements, and follow-ups for the interval management system.
None of the items below are required for correctness or current production use.

⸻

1. Documentation & Developer Experience

1.1 API Documentation
	•	Full JSDoc coverage for:
	•	ManagedInterval
	•	IntervalManager
	•	Explicit documentation of:
	•	Lifecycle states (running, paused, cancelled)
	•	Environment gating (visible, online, suspended)
	•	Overlap policies (skip, coalesce, queue)
	•	Queue semantics and limits
	•	Constructor / destructor behavior

1.2 Behavioral Guides
	•	“How it actually behaves” docs (not just signatures):
	•	start() vs resume()
	•	runNow() vs step()
	•	pause() vs environment-induced pause
	•	Examples for:
	•	Game loop usage
	•	Background worker usage
	•	Debug / step-through usage

⸻

2. Telemetry & Observability

2.1 Queue Telemetry
	•	Emit events for:
	•	Queue overflow (queueOverflow)
	•	Dropped queue items
	•	Queue drain start / completion
	•	Optional per-interval counters:
	•	Total enqueued
	•	Total dropped
	•	Max queue depth reached

2.2 Gating Telemetry
	•	Emit warnings/events when:
	•	runNow() is blocked by environment gating
	•	step() is blocked by inflight execution
	•	Interval is “runnable” but blocked by policy

⸻

3. Policy Presets

Introduce optional presets to reduce configuration burden:
	•	Game Loop Preset
	•	overlapPolicy: 'queue'
	•	queueErrorPolicy: 'preserve'
	•	pauseWhenHidden: true
	•	pauseWhenOffline: true
	•	Emphasis on determinism and debuggability
	•	Background Worker Preset
	•	overlapPolicy: 'coalesce'
	•	queueErrorPolicy: 'clear'
	•	pauseWhenHidden: false
	•	Emphasis on throughput
	•	Cron / Task Preset
	•	overlapPolicy: 'skip'
	•	errorPolicy: 'backoff'
	•	Emphasis on non-overlap and resilience

⸻

4. Queue Enhancements (Optional)

4.1 Payload-Carrying Queue
	•	Allow queued executions to carry:
	•	Payloads
	•	Signals
	•	Context overrides
	•	Enables:
	•	Deterministic replay
	•	Step-through of queued work
	•	Event-driven workloads

4.2 Advanced Queue Drain Policies
	•	Drain strategies:
	•	FIFO (current)
	•	LIFO
	•	Priority-based
	•	Partial drain on resume / step

⸻

5. Semantics & Naming Polish

5.1 isRunnable() Semantics
	•	Clarify or rename:
	•	Distinguish between “can run now” vs “eligible to run”
	•	Possible alternatives:
	•	canExecuteNow
	•	isEligible
	•	isBlocked

5.2 Comment & JSDoc Alignment
	•	Bring comments in sync with current behavior:
	•	step() (always pauses after execution)
	•	Queue behavior notes
	•	Overlap policy descriptions

⸻

6. Testing

6.1 Unit Tests
	•	Coverage for:
	•	Queue + error interactions
	•	Step + queue interactions
	•	Environment gating edge cases
	•	Constructor / destructor error policies

6.2 Deterministic Test Clock
	•	First-class test clock helper:
	•	Manual tick advancement
	•	Deterministic scheduling assertions

⸻

7. Tooling & Debugging Aids
	•	Optional debug mode:
	•	Verbose lifecycle logging
	•	State transition tracing
	•	Snapshot / inspect helpers:
	•	Queue depth
	•	Inflight state
	•	Pending / backoff state

⸻

8. Non-Goals (Explicit)

The following are explicitly out of scope unless requirements change:
	•	Distributed scheduling
	•	Cross-process coordination
	•	Persistent queues
	•	Job durability guarantees

⸻

Status

All items in this document are wishlist / future enhancements.
They should not block shipping, testing, or adoption of the current system.

