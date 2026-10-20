# Testing strategy

## Pyramid
1. **Unit tests (Vitest):** every pure function and edge case in SPEC section 6.
2. **Property-based tests (fast-check):** generate random event traces and assert invariants.
3. **Deterministic simulation:** fake gateway + `FakeClock` + seeded RNG replay scripted and random scenarios end to end through the real core and executor logic.
4. **Trace record/replay:** anonymized real traces are saved and replayed to reproduce bugs exactly.
5. **Mutation testing (Stryker) on `/src/core`:** proves the tests catch real defects, not just execute lines.
6. **Chaos tests:** kill process mid-countdown, drop Redis, drop voice connection, duplicate and reorder events.
7. **Soak test:** 24-hour run in a test server with synthetic joins/leaves; watch memory, wakeups, and drift.

## Invariants (each becomes a property test)
| ID | Invariant |
|---|---|
| P1 | A member whose observed silence is below the threshold is never disconnected |
| P2 | At most one disconnect effect per member per silence stretch |
| P3 | Effects target only members currently in the target channel |
| P4 | Election switch count over any window T is at most floor(T / MIN_DWELL) + 1 |
| P5 | Election is deterministic and independent of member ordering |
| P6 | A speaking event never moves a deadline earlier |
| P7 | A blind interval never shortens any deadline |
| P8 | Duplicate events are no-ops (idempotent) |
| P9 | Exempt members never produce a disconnect effect |
| P10 | Hydrating from persisted state then replaying the remaining trace equals replaying the full trace |
| P11 | A member who is speaking has no deadline, regardless of how long they speak |
| P12 | Pending effects are cancelled on channel switch |

## CI gates
- Lint, typecheck, unit and property tests on every PR.
- Coverage gate on `/src/core` (target: 95% lines/branches).
- Mutation score gate on `/src/core` (target set after the first baseline run, then ratcheted upward).
- No flaky tests: all randomness is seeded, and failing seeds are printed and committed as regression cases.
