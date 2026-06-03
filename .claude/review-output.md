# Code Review — HEAD 11ce9a2c

Reviewing the 5-feature commit (FitnessPact #84, RepairFlow #79, ActiveListening #80, CycleAwareness #91, LoveNotePin #21) plus CoupleProvider / format / CSS / page wiring.

Files reviewed:
- web/src/couple/CoupleProvider.tsx
- web/src/components/CycleAwareness.tsx
- web/src/components/FitnessPact.tsx
- web/src/components/RepairFlow.tsx
- web/src/components/ActiveListening.tsx
- web/src/components/LoveNotePin.tsx
- web/src/lib/format.ts
- web/firestore.rules

---

## HIGH

### H1. CycleAwareness next-date prediction is off by a day for users west of UTC. Confidence 88
File: web/src/components/CycleAwareness.tsx:22 and :62

`dayOfCycle` computes the day count entirely in UTC, then builds `nextStart` as a UTC-midnight Date:
```
const today = new Date(toDateInput(new Date()) + 'T00:00:00Z').getTime()  // UTC midnight
const nextStart = new Date(today + (length - inCycle) * 86400000)         // still UTC midnight
```
At line 62 it renders `prettyDate(toDateInput(nextStart))`. But `toDateInput` reads LOCAL components (`getFullYear/getMonth/getDate`). A UTC-midnight Date, viewed in any negative-offset zone (America/New_York, America/Los_Angeles — both in this app's supported timezone list), is the PREVIOUS calendar day locally. So `toDateInput(nextStart)` yields the day before, and the predicted "next around …" date is shown one day early for all western users.

The function is internally inconsistent: it deliberately normalizes `today` to a UTC boundary for the modulo math, but then converts `nextStart` back through the local-based `toDateInput`. The two halves use different time bases.

Fix: format `nextStart` with UTC getters (or add `length - inCycle` days to the UTC date string directly) before passing to `prettyDate`, so the whole pipeline stays in UTC.

### H2. dayOfCycle returns `day` (UTC-based) and `nextStart` (rendered local) on different time bases. Confidence 80
File: web/src/components/CycleAwareness.tsx:16-23

Same root cause as H1, called out separately because it is a latent trap: `day` (Day N) is computed and displayed purely in UTC and is correct/stable everywhere, but `nextStart` only becomes correct once it is also formatted in UTC. Any future edit that trusts these two outputs to share a timezone will reintroduce the off-by-one. Resolve by keeping the function UTC end-to-end and documenting the contract.

---

## MEDIUM

### M1. RepairFlow: orderBy('createdAt') + serverTimestamp causes a transient null-sort flicker; no missing index. Confidence 78
File: web/src/components/RepairFlow.tsx:45-49 and :87

A single-field `orderBy('createdAt','desc')` does NOT need a composite index (single-field indexes are automatic), so there is no missing-index crash — the query is fine as written. However, a just-added repair has `createdAt === null` locally until the server timestamp resolves; during that window Firestore may sort the pending doc to an unexpected position or transiently drop it from the `limit(5)` view. It self-heals on the server round-trip. Minor UX flicker only. Documented so it is not mistaken for a data-loss bug.

---

## LOW / CONFIRMED-OK

- setCycle uses `[`cycle.${uid}`]: deleteField()` — CORRECT. A dotted-path + deleteField removes only that partner's nested map entry, leaving the other partner's cycle intact. Contrast with setPinnedNote using whole-field `pinnedNote: deleteField()`, also correct since pinnedNote is a single shared field. Both deleteField usages are right.
- Firestore rules: couples/{id}/{document=**} grants read/write to members, so the new pacts/ and repairs/ subcollections are covered. OK.
- Effect cleanup: FitnessPact, RepairFlow, and the CoupleProvider couple-doc effect all return the onSnapshot unsubscribe function correctly — no listener leak. ActiveListening is local-only and needs none.
- FitnessPact daysFor: counts keys whose array includes the uid; an emptied day-array (after arrayRemove) correctly contributes 0, and pct is clamped to 100. No bug.
- Cycle opt-in privacy: cycle data is only written on explicit Save; "Stop sharing" deletes the nested key. The partner UI shows only a coarse phase label + day. NOTE for the "no details" claim: the raw `start` date and `length` are stored in the shared couple doc and are technically readable by the partner's client (rules let members read the whole couple doc). The UI never renders them, but the data model does expose them. Worth documenting given the explicit "no details" copy.

---

## Privacy note (product, not a bug)
LoveNotePin: when the partner taps "Got it", `setPinnedNote(null)` deletes the shared field for both users, so the sender's "waiting" card vanishes with no read/dismiss distinction. Intended behavior; flagged only because the sender cannot tell "seen" from "I took it down."
