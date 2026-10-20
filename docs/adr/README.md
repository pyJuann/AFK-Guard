# Architecture Decision Records

Each ADR records one decision: the context, what was decided, and the consequences. ADRs are append-only. To change a decision, add a new ADR that supersedes the old one and update the old one's status.

| ADR | Title | Status |
|---|---|---|
| [0001](0001-single-monitored-channel.md) | One monitored channel per server | Accepted |
| [0002](0002-speaking-signal-not-audio.md) | Speaking signal, never audio decoding | Accepted (VERIFY in Phase 0) |
| [0003](0003-lazy-deadline-scheduler.md) | Deadline scheduler with lazy re-arm | Accepted |
| [0004](0004-election-hysteresis.md) | Election hysteresis | Accepted |
| [0005](0005-blind-interval-accounting.md) | Blind-interval accounting | Accepted |
| [0006](0006-action-safety.md) | Disconnect, then notify, with last-moment veto | Accepted |
| [0007](0007-ai-placement.md) | AI stays out of the action path | Accepted |
| 0008 | Platform findings | Planned (Phase 0) |

> **Note (2026-10-20):** The original ADR files were not carried over from the previous repository. ADRs 0001-0007 were reconstructed from README.md, docs/SPEC.md, and docs/ARCHITECTURE.md, which summarize each decision. The decisions are unchanged; the wording is new. The project owner should review them.

Template: [template.md](template.md).
