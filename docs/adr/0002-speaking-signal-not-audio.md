# 0002. Speaking signal, never audio decoding

- **Status:** Accepted (reconstructed 2026-10-20, see [README](README.md)). Platform behavior to VERIFY in Phase 0, recorded in ADR 0008.
- **Date:** 2026-10-20

## Context
The bot must know whether a member is producing audio. Discord voice has been end-to-end encrypted with the DAVE protocol since March 2026, and voice-receive libraries had early DAVE issues. Decoding audio (decrypting, Opus-decoding, measuring loudness) is CPU-heavy, fragile across protocol changes, and a privacy risk even if nothing is stored.

## Decision
Use only the **speaking signal**: start/end events emitted by the `@discordjs/voice` receiver when packets for a member's SSRC begin and stop arriving. Never decode, record, transcribe, or store audio. Combine this with gateway voice-state metadata (mute, deafen, streaming, camera).

## Consequences
- Low CPU, no Opus decoder dependency, and a small privacy footprint (PRIVACY.md).
- A noisy open mic counts as activity. A member who is muted but listening looks identical to one who walked away. Mitigated by dry-run first, exemptions, the optional grace flow, and the Phase 6 classifier.
- The bot must join **undeafened** to receive packets.
- Speaking end fires after a short delay with no packets, so timings carry a small, bounded error.
- `@discordjs/voice` and its DAVE dependency (`@snazzah/davey`) are pinned to exact versions.

## To verify in Phase 0
- Speaking events keep firing under DAVE, and what happens when decryption fails (do events fire on packet arrival before or after decryption?).
- The exact end-of-speech delay in the pinned library version.
- Behavior for push-to-talk, noisy open mic, and long continuous speech.
- Which encryption library the pinned version needs (`npm run voice:report`).

## Alternatives considered
- **Decode audio and measure volume (VAD):** more accurate for open mics, but heavy, fragile under DAVE, and contrary to the privacy goals.
- **Client presence/idle status:** does not reflect voice activity.
