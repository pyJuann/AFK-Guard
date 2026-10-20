# AFK Guard: rules for Claude Code

Read `docs/SPEC.md`, `docs/ARCHITECTURE.md`, and `docs/adr/` before planning any work. Work one roadmap phase at a time (`docs/ROADMAP.md`). Plan first, get approval, then code. After each phase, STOP and report.

## Stack and conventions
- Node.js LTS, TypeScript `strict`, ESM only. No `any`. No non-null `!` without a comment explaining why it is safe.
- Libraries: discord.js, @discordjs/voice, ioredis, zod, pino, prom-client, vitest, fast-check, @stryker-mutator/*. Python only under `/ml`.
- Pin exact versions for `@discordjs/voice` and its DAVE-related dependencies.
- Layout: `/src/core` (pure), `/src/app` (orchestration), `/src/adapters` (discord, redis, metrics), `/src/sim` (simulator), `/test`.

## Architecture rules (non-negotiable)
1. `/src/core` is pure: NO imports from discord.js, redis, pino, or `Date`/`setTimeout`. Time arrives through an injected `Clock`.
2. Core functions return **effects as data** (`Disconnect`, `Notify`, `JoinChannel`, `LeaveChannel`). Adapters execute them.
3. Never decode, record, or store audio. Only packet-arrival and voice-state metadata.
4. The LLM is never in the disconnect path. See ADR 0007.
5. Disconnect first, then notify. Never announce an action that did not happen. Re-check state immediately before acting (ADR 0006).
6. `DRY_RUN=true` is the default. Real disconnects require an explicit opt-in.
7. Silence counts only when observed (ADR 0005). Never treat a gap in observation as silence.

## Quality gates
- Every behavior change has a test. Core logic needs unit AND property-based tests (`docs/TESTING.md` lists the invariants).
- `npm run lint`, `typecheck`, and `test` must pass before reporting a phase done.
- Never invent metrics. Every published number must come from a script in this repo.
- When uncertain about Discord or library behavior, mark it VERIFY, check current official docs or source, and record findings in an ADR. Do not guess.

## Workflow
- Small commits with descriptive messages. No secrets in git. Keep `.env.example` current.
- Update README, CHANGELOG, and relevant ADRs in the same change as the code.
- Summarize at the end of each phase: what was built, what was measured, what surprised you, what is risky.
