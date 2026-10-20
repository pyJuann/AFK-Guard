# Security

## Reporting a vulnerability
Use GitHub's private vulnerability reporting (Security tab, "Report a vulnerability"). Please do not open public issues for security problems. Expect an initial response within 7 days.

## Hardening practices
- Bot token only via environment variables or a secrets manager. Never in git; `.env` is ignored and secret scanning is enabled.
- Least privilege: only View Channel, Connect, Send Messages, and Move Members. No Administrator. No privileged intents unless proven necessary.
- Dependencies pinned; Dependabot and `npm audit` in CI. Voice libraries are pinned to exact versions.
- Container runs as non-root with a read-only filesystem where possible.
- All external input (slash command arguments, LLM output) is validated with zod before use.
- Rate limiting on commands; per-guild spend cap on any LLM calls (Phase 7).
- Admin-only commands check permissions server-side, never trusting client hints.

## Threat notes
- Abuse by members: a user trying to evade or trigger disconnects. Mitigation: only the speaking signal is trusted; commands are permission-gated.
- Prompt injection (Phase 7): user text is treated as data, output is schema-validated, and an admin must confirm changes. The model cannot call tools or trigger disconnects.
- Token leak: rotate immediately via the Discord Developer Portal.
