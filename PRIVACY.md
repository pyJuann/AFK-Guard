# Privacy

AFK Guard is designed to know as little as possible.

## What it processes
- Discord user IDs and guild/channel IDs.
- Voice-state flags: muted, deafened, streaming, camera on.
- Timestamps of when a member last produced audio (derived from packet arrival).

## What it never does
- Decode, record, transcribe, or store audio content.
- Read message content (no Message Content intent).
- Share data with third parties. The optional LLM feature (Phase 7) receives only an admin's typed request plus channel and role names, never member data.

## Storage and retention
- Runtime state is held in memory and mirrored to Redis with a TTL (default 24 hours).
- Logs contain IDs and decisions, not audio or message content. Retention is set by the operator.
- If outcome data is collected for the adaptive model (Phase 6), user IDs are salted and hashed, stored with an expiry, and excluded for members who opted out.

## Member controls
- `/afkguard optout` excludes a member from monitoring. `/afkguard optin` reverses it.
- Opt-out removes stored state for that member.

## Operator responsibilities
- Tell server members that the bot is present and what it does before enabling real disconnects.
- Run `DRY_RUN=true` first and review results.
- Verify the current Discord Developer Terms and Policy regarding voice data and disclosures before listing the bot publicly.

This document is a design commitment, not legal advice.
