# Metrics plan

**Targets below are hypotheses, not results.** Replace each with a measured value and the command that produced it. Do not publish a number without a reproducible script.

## Correctness and quality
| Metric | How measured | Target (hypothesis) | Result |
|---|---|---|---|
| False disconnects in simulation | Property test P1 over generated traces | 0 | not measured |
| Test count / coverage on core | Vitest coverage report | 95% lines and branches | not measured |
| Mutation score on core | Stryker | set after baseline | not measured |
| Property-test traces executed per CI run | fast-check config | 1,000+ per invariant | not measured |

## Timeliness and efficiency
| Metric | How measured | Target | Result |
|---|---|---|---|
| Disconnect lateness (p50/p95/p99) | `afkguard_deadline_lateness_seconds` | p95 < 2 s | not measured |
| Scheduler wakeups per hour: polling vs lazy deadline | Benchmark script, same synthetic load | measure both | not measured |
| CPU and RSS per tracked member | Load test | measure | not measured |
| Idle wakeups with zero members | Benchmark | 0 | not measured |

## Stability
| Metric | How measured | Target | Result |
|---|---|---|---|
| Election switches per hour, adversarial oscillating counts, with vs without hysteresis | Simulator | big reduction | not measured |
| Recovery after restart: states correctly restored | Chaos test | 100% | not measured |
| Double actions after restart | Chaos test | 0 | not measured |
| Soak: memory growth over 24 h | Soak script | flat | not measured |

## Real-world (Phase 5, dry-run first)
| Metric | How measured | Result |
|---|---|---|
| Would-have-disconnected decisions | Logs | not measured |
| Suspected false positives (member returned and spoke within 2 min) | Metric + manual review | not measured |
| Member feedback | Short survey | not measured |

## AI phases (optional)
| Metric | Rules baseline | AI version |
|---|---|---|
| Precision / recall / PR-AUC (held out by user) | not measured | not measured |
| False-disconnect rate | not measured | not measured |
| Missed-AFK rate | not measured | not measured |
| Decision latency p95 | not measured | not measured |
| Policy-parse field accuracy, schema-valid %, injection resistance % | n/a | not measured |
| Cost per 1,000 parses (small vs mid model) | n/a | not measured |

Simulated and real sessions are always reported separately.
