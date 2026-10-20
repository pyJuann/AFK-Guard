# Roadmap

Work one phase at a time. Start Claude Code in plan mode, ask for a plan, approve it, then build. Each phase ends with a report: what was built, what was measured, what was surprising, what is risky.

**Standing kickoff prompt (use at the start of every phase):**
> Read CLAUDE.md, docs/SPEC.md, docs/ARCHITECTURE.md, and docs/adr/. Produce a plan for Phase N only. Do not write code until I approve the plan. When done, run lint, typecheck, and tests, update docs and CHANGELOG, then stop and report.

---

## Phase 0: Verify platform behavior (no feature code)
**Goal:** replace assumptions with facts.
**Tasks**
- Throwaway script: join one voice channel undeafened, log speaking start/end with timestamps, survive a reconnect.
- Answer every item in SPEC section 7 and record results in `docs/adr/0008-platform-findings.md`.
- Test: muted, deafened, push-to-talk, noisy open mic, long continuous speech, user limit channel.

**Definition of done:** findings table complete; library version pinned; any design change proposed before Phase 1.
**Phase prompt addition:** "If speaking events are unreliable under DAVE, stop and propose alternatives before continuing."

## Phase 1: Pure core and simulator
**Goal:** all decision logic correct and tested with zero Discord code.
**Tasks:** `Clock` + `FakeClock`; member FSM; deadline scheduler (lazy re-arm); election; blind-interval accounting; simulator with seeded RNG and trace record/replay; property-based tests for every invariant in `docs/TESTING.md`.
**Definition of done:** all invariants pass with at least 1,000 generated traces each; mutation testing configured and baseline score recorded; coverage report committed to `reports/`.
**Phase prompt addition:** "Core must not import discord.js, redis, pino, Date, or setTimeout. Enforce with a lint rule."

## Phase 2: Discord adapters and commands
**Tasks:** gateway listener; voice manager (join/leave/switch, reconnect with backoff and jitter); executor (veto, disconnect, notify, coalescing); slash commands from SPEC FR-6; permission preflight; dry-run mode.
**Definition of done:** runs in a real test server in dry-run, with decision traces matching what the simulator predicts for the same scenario.
**Add to README:** step-by-step Discord setup.

## Phase 3: Reliability
**Tasks:** Redis persistence; rehydrate and reconcile; graceful SIGTERM; retry policy; chaos tests (kill process mid-countdown, drop Redis, drop voice connection).
**Definition of done:** chaos tests pass; no double actions after restart; degraded mode verified.

## Phase 4: Observability, CI/CD, containers
**Tasks:** pino logs with decision traces; Prometheus metrics; `/healthz`; multi-stage non-root Dockerfile; docker-compose with Redis; GitHub Actions (lint, typecheck, tests with coverage gate, mutation test on core, image build); soak test script.
**Definition of done:** CI green; 24-hour soak run with stable memory recorded in `docs/METRICS.md`.

## Phase 5: Dry-run dogfooding and measurement
**Tasks:** run in a real server with members informed; collect would-have-disconnected decisions and outcomes; review each false-positive candidate; tune defaults.
**Definition of done:** at least 2 weeks of dry-run data summarized (decisions, suspected false positives, member feedback). Only then consider enabling real disconnects.

## Phase 6: Adaptive decision layer (optional, shadow mode)
**Tasks:** feature extraction at deadline time; outcome labeling from real signals (returned and spoke after disconnect, clicked "I'm here"); simulator personas for training data; logistic regression in `/ml` (split by user, not by window); export `model.json`; `ModelPolicy` that fails closed to `RulesPolicy`; shadow comparison script; per-guild A/B rollout and kill switch.
**Definition of done:** `npm run eval:policy-compare` prints rules vs model results with simulated and real data reported separately. Negative results are documented honestly.

## Phase 7: Natural-language admin config (optional)
**Tasks:** `/afkguard policy <text>` with forced structured output, zod validation, clamping, admin confirm button, audit log, rate limit and spend cap; golden-set eval harness (40+ cases including injection attempts); record/replay LLM client for CI; Langfuse tracing.
**Definition of done:** `npm run eval:policy-parse` outputs accuracy, schema-valid rate, injection-resistance rate, latency, and cost for each model tested.

## Phase 8: Polish
**Tasks:** README results section populated from `docs/METRICS.md`; demo GIF; `docs/interview-notes.md` with likely questions and honest answers (including what did not work); tag v1.0.0.
