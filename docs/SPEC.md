# Specification

## 1. Goal
For each guild, find the busiest voice channel, stay in it, and disconnect members who produce no audio for the silence threshold, announcing it in the channel.

## 2. Glossary
- **Target channel:** the single voice channel the bot currently monitors in a guild.
- **Signal:** a speaking start or end event from the voice receiver, or a relevant voice-state change from the gateway.
- **Anchor:** the moment a member's silence stretch began (join of observation, or last speaking end).
- **Blind interval:** a period when the bot could not observe signals (reconnect, restart, outage).
- **Dry run:** decisions are computed and logged but no disconnect or notice is sent.

## 3. Functional requirements

### FR-1 Target channel selection
- At most one target channel per guild.
- Candidates: voice channels where the bot has View Channel and Connect, excluding the guild AFK channel, stage channels, and `IGNORED_CHANNEL_IDS`.
- Score: number of **human** members (bots excluded). Tie-break, in order: incumbent wins, most recent speech, lowest channel ID (deterministic).
- A channel needs at least `MIN_HUMANS` to be monitored. If none qualify, the bot leaves voice and idles.
- Switching rules: see FR-2.

### FR-2 Election stability
- Voluntary switch only if a challenger leads by at least `SWITCH_MARGIN` humans continuously for `ELECTION_STABLE_SECONDS` AND the bot has been in the current channel at least `MIN_DWELL_SECONDS`.
- Immediate switch (no waiting) if the incumbent is deleted, becomes inaccessible, or drops below `MIN_HUMANS`.
- On any switch, all pending actions for the old channel are cancelled, and members of the new channel start fresh silence clocks.

### FR-3 Silence tracking
- A member is **silent** if no audio has been observed from them for `SILENCE_THRESHOLD_SECONDS`.
- A member who is **currently speaking** has no deadline. The clock starts at the speaking **end** event (continuous speech longer than the threshold must never trigger action).
- A member's anchor starts when the bot begins observing them: when they join the target channel, or when the bot enters the channel. Everyone gets a full threshold first.
- Leaving and rejoining resets the clock.
- Bots are never tracked.

### FR-4 Exemptions
Never acted on: members who are streaming (if `EXEMPT_STREAMING`), have camera on (if `EXEMPT_CAMERA`), hold an exempt role, opted out, or are server-muted by an admin (they cannot speak). Exemption changes take effect immediately.

### FR-5 Action
At the deadline, in order:
1. **Veto check:** re-read the member's latest state; abort if they spoke, left, became exempt, or the target channel changed.
2. **Disconnect** the member.
3. **Notify** in the channel's text chat only if the disconnect succeeded. Simultaneous expirations are coalesced into one message (`NOTICE_COALESCE_MS`).
- If `GRACE_SECONDS > 0`: send a warning with an "I'm here" button first, then act after the grace period if no signal or click arrives.
- If `DRY_RUN`: log the would-be action and skip steps 2 and 3.

### FR-6 Commands
- `/afkguard status`: current target channel, tracked members, permission health, dry-run state.
- `/afkguard config show|set` (Manage Server): view or change thresholds, exemptions, dry-run.
- `/afkguard pause` / `resume` (Manage Server).
- `/afkguard optout` / `optin` (any member, for themselves).

### FR-7 Recovery
- On restart, rehydrate state from Redis, treat downtime as a blind interval, and reconcile against the live gateway state before acting.
- On voice reconnect, apply FR-8.

### FR-8 Blind intervals
Silence during a blind interval does not count. Deadlines are extended by the blind duration, and any "currently speaking" flags are cleared (the end event may have been missed).

### FR-9 Permission preflight
On startup and every channel switch, check View Channel, Connect, Send Messages, and Move Members. Missing permissions degrade gracefully (for example, disconnect without notice) and appear in `/afkguard status`. Never crash-loop on a permission error.

## 4. Non-functional requirements
- **Correctness invariant:** a member who produced audio within the threshold is never disconnected.
- **Timeliness (target):** p95 disconnect lateness after the deadline is under 2 seconds under normal conditions.
- **Idle cost:** zero timer wakeups when no members are tracked.
- **Resilience:** survives voice reconnects, gateway resumes, and process restarts without double actions.
- **Observability:** every decision is logged with its inputs and reason; metrics exposed in Prometheus format.
- **Privacy:** no audio decoded or stored (see PRIVACY.md).

## 5. Non-goals
Audio recording or transcription; monitoring multiple channels per guild; moving members to an AFK channel (this bot disconnects); web dashboard; cross-server analytics.

## 6. Edge cases (each needs a test)
| Case | Expected behavior |
|---|---|
| Member speaks continuously for 10 minutes | Never expired; clock starts at speaking end |
| Member leaves and rejoins within the window | Clock resets |
| Two channels tie | Incumbent stays; otherwise deterministic tie-break |
| Counts oscillate 5/6/5/6 | No switching (margin and stability rules) |
| Target channel deleted | Immediate re-election, pending actions cancelled |
| Admin drags the bot to another channel | Treated as a forced switch; re-elect after dwell |
| Bot kicked or loses permission | Re-election; permission health reported |
| Voice reconnect mid-countdown | Blind interval extends deadlines |
| Process restart mid-countdown | Rehydrate, blind interval, reconcile |
| Member speaks between decision and action | Veto aborts the action |
| Disconnect API call fails | Retry with backoff (max 3), no notice, metric incremented |
| Five members expire together | One coalesced notice |
| Member server-muted by admin | Exempt |
| Member joins just as bot switches channels | Fresh clock in the new channel |

## 7. Platform facts to VERIFY in Phase 0
- Speaking events keep firing under DAVE; behavior if decryption fails.
- Current `@discordjs/voice` version and DAVE status.
- Whether Move Members lets the bot join a full user-limited channel without consuming a slot for humans.
- Whether role hierarchy blocks disconnecting higher-role members.
- Whether non-privileged intents suffice for role-based exemptions.
- Whether the bot can post in a voice channel's text chat with only Send Messages.
