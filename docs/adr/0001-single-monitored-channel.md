# 0001. One monitored channel per server

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md))
- **Date:** 2026-10-20

## Context
Detecting silence requires receiving voice packets, which requires a voice connection. Discord allows a bot only one voice connection per guild, so a bot cannot listen to every voice channel in a server at once.

## Decision
Monitor exactly one voice channel per guild: the one with the most human members (SPEC FR-1). Channels with fewer than `MIN_HUMANS` humans are not monitored. The choice is re-evaluated as members move, subject to the hysteresis in [ADR 0004](0004-election-hysteresis.md).

## Consequences
- The platform limit becomes a product feature: the bot goes where freeing a spot matters most.
- Members in other channels are never acted on. This is documented as a known limitation.
- Switching channels resets observation for everyone, so switching must be rare (ADR 0004) and pending actions for the old channel must be cancelled (invariant P12).
- One process can serve many guilds, one connection each.

## Alternatives considered
- **Multiple bot accounts per guild** to cover more channels: operationally heavy, against the spirit of Discord's limits, and multiplies the privacy footprint.
- **Rotate between channels:** silence observed in one visit cannot be combined with another without treating unobserved time as silence, which violates [ADR 0005](0005-blind-interval-accounting.md).
- **Use client idle / AFK channel signals only:** Discord's built-in inactivity mover already does this, and it does not reflect whether a member is producing audio.
