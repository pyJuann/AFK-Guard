# Changelog

All notable changes are documented here. Format: Keep a Changelog. Versioning: SemVer.

## [Unreleased]
### Added
- Planning documentation: spec, architecture, ADRs, roadmap, testing and metrics plans.
- ADRs 0001-0007 reconstructed from the README, spec, and architecture docs (originals were not carried over); ADR index and template.
- Project skeleton: TypeScript (strict, ESM), ESLint, Vitest with fast-check, exact-pinned dependencies including `@discordjs/voice` 0.19.2 and `@snazzah/davey` 0.1.12.
- Lint rule enforcing core purity: `/src/core` cannot import Discord, Redis, logging, metrics, or Node built-ins, or use `Date`, timers, `process`, or `console`. Covered by tests.
- Config loader (`src/app/config.ts`): validates every variable in `.env.example` with zod, defaults `DRY_RUN` to true and only disables it for an explicit `false`, and never echoes values in errors.
- `npm run voice:report` to list the voice libraries `@discordjs/voice` detects (Phase 0 input).
- GitHub Actions CI (lint, typecheck, test, audit) and Dependabot, with voice libraries excluded from automatic upgrades.
