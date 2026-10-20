# 0004. Election hysteresis

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md))
- **Date:** 2026-10-20

## Context
Human counts per channel fluctuate constantly as people hop between channels. Switching resets everyone's silence clock ([ADR 0001](0001-single-monitored-channel.md)), so naive "always go to the busiest" logic would make the bot hop back and forth and never act.

## Decision
A voluntary switch requires all of the following (SPEC FR-2, ARCHITECTURE 4.1):
- The challenger leads the incumbent by at least `SWITCH_MARGIN` humans (default 2).
- The lead holds continuously for `ELECTION_STABLE_SECONDS` (default 20).
- The bot has been in the current channel for at least `MIN_DWELL_SECONDS` (default 60).

The bot switches immediately if the incumbent is deleted, becomes inaccessible, or drops below `MIN_HUMANS`. Ties go to the incumbent, then most recent speech, then lowest channel ID, so the result is deterministic.

## Consequences
- Oscillating counts (5/6/5/6) cause no switching.
- Switch count over a window T is bounded by floor(T / MIN_DWELL) + 1 (invariant P4).
- The bot may briefly stay in a channel that is no longer the busiest. This is accepted.
- The election is a pure function of snapshot, state, time, and config, independent of member ordering (P5).

## Alternatives considered
- **No hysteresis:** constant hopping (to be quantified by the simulator, see METRICS.md).
- **Time-averaged counts:** smoother but harder to reason about and to bound.
