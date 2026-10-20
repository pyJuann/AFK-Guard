# 0005. Blind-interval accounting

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md))
- **Date:** 2026-10-20

## Context
The bot sometimes cannot observe audio: voice reconnects, gateway resumes, process restarts, DAVE failures. If time without observed packets counted as silence, a reconnect could make the bot disconnect members who were talking the whole time.

## Decision
Silence counts only when it was observed (SPEC FR-8, ARCHITECTURE 4.4).
- Adapters report `BlindStart` and `BlindEnd(duration)`.
- On `BlindEnd`, every tracked member gets `blindCredit += duration`, which pushes their deadline later, and every `speaking` flag is cleared because the end event may have been missed.
- On restart, persisted wall-clock state is loaded, downtime is treated as one blind interval, and state is reconciled with live voice states before any action.
- No disconnect is issued while blind.

## Consequences
- A member is never disconnected for silence the bot could not have heard.
- A blind interval never shortens a deadline (invariant P7).
- Repeated outages can delay legitimate disconnects. This is the fail-safe direction and is accepted.
- In-memory durations use a monotonic clock; only wall-clock timestamps are persisted.

## Alternatives considered
- **Reset all clocks on reconnect:** also safe, but discards observed silence and delays action more than needed.
- **Ignore gaps:** unsafe; violates the core correctness invariant.
