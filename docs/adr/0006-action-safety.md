# 0006. Disconnect, then notify, with last-moment veto

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md))
- **Date:** 2026-10-20

## Context
Disconnecting someone is visible and annoying when wrong. The decision to act and the action itself are separated in time (queueing, retries, rate limits), and a member may speak, leave, or become exempt in that gap. Announcing a disconnect that failed or never happened would be misleading.

## Decision
At the deadline, the executor runs, in order (SPEC FR-5, ARCHITECTURE 4.5):
1. **Veto check:** re-read fresh state. Abort if the member spoke, left, became exempt, the deadline moved, or the target channel changed.
2. **Disconnect** with up to 3 retries (exponential backoff with jitter, honoring `retry-after` on 429).
3. **Notify** only if the disconnect succeeded. Notices within `NOTICE_COALESCE_MS` are merged into one message.

`DRY_RUN=true` is the default: decisions are logged and steps 2 and 3 are skipped. Real disconnects require an explicit opt-in.

## Consequences
- The bot never announces an action that did not happen.
- The race window between decision and action is as small as possible.
- A failed disconnect produces no notice, only a metric and a log line.
- New installations cannot disconnect anyone until the operator turns dry-run off.

## Alternatives considered
- **Notify first, then disconnect:** announces actions that may fail.
- **Act on the decision without re-checking:** vulnerable to the decision/action race.
