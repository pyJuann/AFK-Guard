# 0003. Deadline scheduler with lazy re-arm

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md))
- **Date:** 2026-10-20

## Context
Each tracked member has a silence deadline. Speaking events are frequent (many per second in an active call) and push deadlines later. The scheduler must fire close to the true deadline (p95 lateness target under 2 s), cost nothing when idle, and be deterministic under a fake clock.

## Decision
A min-heap of `(memberId, deadlineAtEnqueue)` with a single timer armed for the earliest entry (ARCHITECTURE 4.3).
- Speaking events do not touch the heap; they update the member's anchor in O(1).
- When the timer fires, the scheduler pops the entry and recomputes the member's true deadline. If it moved later, it re-inserts (re-arm). If it is due, it emits `Expire`.
- Time comes from an injected `Clock`; the real timer lives in an adapter.

## Consequences
- Zero wakeups when no members are tracked; wakeups scale with members, not wall time.
- Stale heap entries are harmless because the true deadline is always recomputed.
- Fully deterministic in tests with `FakeClock`.
- Honest caveat: with at most about 99 members per channel, a once-per-second scan would also perform fine. This design is chosen for determinism, zero idle cost, and testability. `docs/METRICS.md` benchmarks both rather than assuming the difference.

## Alternatives considered
- **Polling loop (every second):** simple, but wakes constantly when idle and adds up to 1 s of lateness.
- **One `setTimeout` per member, reset on every speaking event:** heavy timer churn on busy calls and harder to test.
