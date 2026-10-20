# 0007. AI stays out of the action path

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md))
- **Date:** 2026-10-20

## Context
Two optional AI features are planned: an adaptive classifier that estimates "away vs silently listening" (Phase 6) and natural-language admin configuration through an LLM (Phase 7). Disconnect decisions must be predictable, explainable, fast, and safe against prompt injection.

## Decision
- **The LLM is never in the disconnect path.** It only turns an admin's typed request into a configuration proposal. Its output is forced to structured JSON, validated with zod, clamped to safe ranges, and applied only after an admin confirms. It cannot call tools or trigger disconnects. It receives only the admin's text plus channel and role names, never member data.
- **The classifier runs in shadow mode first.** `RulesPolicy` is the baseline. `ModelPolicy` is a small local model (logistic regression exported as JSON), not a remote call, and it fails closed to `RulesPolicy` on any error. It may be promoted per guild, behind a kill switch, only after shadow results are measured and published honestly.

## Consequences
- Disconnect behavior never depends on network calls to an AI provider, model availability, or prompt content.
- The AI features can be removed without changing core behavior.
- Prompt injection can at worst produce a config proposal that an admin must approve, within clamped ranges.

## Alternatives considered
- **LLM decides disconnects:** slow, costly, non-deterministic, and injectable.
- **Ship the classifier directly as the policy:** no evidence it beats the rules; shadow mode produces that evidence first.
