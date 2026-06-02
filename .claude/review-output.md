# Code Review — #49 mood check-in + #22 live partner presence

Reviewed CoupleProvider (moods + setMood, lastActive + heartbeat), Mood.tsx, Chat.tsx
(presence header), format.ts (timeAgo). Build passes; both verified in browser.

## Heartbeat loop check (primary concern) — SAFE
Heartbeat writes users/{uid}.lastActive; own-profile onSnapshot re-fires but the effect
deps are [user] (no re-subscribe), couple effect keys on primitive coupleId, partner
effect on [couple,user] — none re-fire from a heartbeat. Net: one benign re-render/40s.
Cleanup (cancelled guard, interval, listeners) correct.

## Verified clean
- setMood toggle/clear ('' falsy → hidden) round-trips correctly; partner mood display ok.
- presence online null-guards lastActive; 20s re-eval; timeAgo correct.
- rules permit lastActive self-write and moods.{uid} member write.

## Non-blocking notes
- own-profile re-renders every 40s (lastActive changes) — harmless at couple scale.
- online badge can lag up to ~20s past the 75s cutoff (re-eval cadence). Fine.
- cleared mood lingers as '' rather than deleteField — acceptable.

VERDICT: APPROVE
