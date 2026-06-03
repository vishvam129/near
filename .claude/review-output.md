# Code Review — HEAD 4b148a92

Scope: the 5 features in commit 4b148a92 (HabitTracker, CoopGoals, Calendar timezone,
AmbientScenes, SpicyZone) plus CoupleProvider/More/Games wiring.

## HIGH

### H1 — Habit streak & toggle use *local* date keys, breaking across timezones
File: `web/src/components/HabitTracker.tsx` (`dayKey`, `toggle`, `streakFor`)

`dayKey()` derives the log key from `toDateInput(new Date())`, which formats in the
*device's local* timezone (`d.getDate()`/`getMonth`/`getFullYear`). This is a
long-distance-couple app: the two partners are in different timezones by definition.
Consequences:
- The same wall-clock "day" produces different keys for each partner. When partner A
  (UTC+5) and partner B (UTC-5) both check in on what they each call "today", they can
  write to two *different* `log[dateKey]` entries, so `theirsDone` shows false and the
  shared-habit feel breaks near day boundaries.
- `streakFor(log, user.uid)` walks `dayKey(off)` in the local zone, so a user crossing a
  DST boundary or traveling can skip/duplicate a key and lose a valid streak.

The codebase already ships `utcDayKey()` in `lib/format.ts` for exactly this purpose
(other day-scoped features use it). Use a single shared day-key convention (UTC, or the
couple's agreed zone) for both writing the log and computing the streak so both partners
resolve to the same key. Confidence: 85.

### H2 — Spicy PIN gate is security theater (does not protect the content)
File: `web/src/components/games/SpicyZone.tsx`

- The "lock" is a client-side React state flag (`unlocked`). The spicy prompts come from
  the bundled `TRUTHS.spicy` / `DARES.spicy` arrays shipped in the JS bundle — anyone can
  read them from devtools/sources regardless of the PIN.
- The PIN is stored as a 32-bit `hash()` (`h*31+c`) in `localStorage`. This is a
  non-cryptographic checksum, trivially brute-forced for a 4-digit PIN (10k candidates)
  and readable by anyone with the device.
- There is no rate limiting on `doUnlock`.
- The *same* spicy content is already reachable with no PIN via the existing
  `TruthOrDare` "Spicy 🌶️" checkbox, so the gate adds no real protection while implying
  privacy ("private", "lock this section").

If the intent is genuine privacy, this needs a real approach (don't ship the content to
unauthorized clients, or gate server-side). At minimum, do not present it as a security
boundary. Confidence: 88.

## MEDIUM

### M1 — CoopGoals `bump` clamps against stale local state → can overshoot target
File: `web/src/components/CoopGoals.tsx` (`bump`)

`bump` computes `next = clamp(g.progress + amt, 0, target)` from the locally-snapshotted
`g.progress`, then writes `increment(next - g.progress)`. The clamp is only correct
relative to the value the client last saw. If both partners tap +1 near the target
concurrently (or one taps faster than the snapshot round-trips), the `increment()`
deltas stack on the server and `progress` can exceed `target` (e.g. stored 6/5). The UI
caps `pct` at 100 but the stored value is wrong. Use a transaction that re-reads
`progress`, or accept overshoot and clamp on read. Confidence: 80.

## LOW

### L1 — Calendar timezone label double-formats per render
File: `web/src/components/Calendar.tsx` (render)

`fmtTz(instantOf(ev), partner.timezone) !== fmtTz(instantOf(ev))` calls `fmtTz` three
times per event per render (constructing `Intl.DateTimeFormat` each time). Correct but
wasteful for long lists; compute the two strings once. Confidence: 80.

### L2 — `at` not backfilled for pre-existing events
File: `web/src/components/Calendar.tsx` (`instantOf`)

New events store `at`; old events have `at: 0`, so `instantOf` falls back to
`new Date(ev.when).getTime()` parsed in the *viewer's* zone — the ambiguity `at` was
added to fix. Acceptable as a fallback, but old events won't render the partner's-time
line correctly. Confidence: 80.

## Firestore rules note (no regression in this commit)
The new `habits`/`goals`/`scene` writes fall under `couples/{id}/**` (or the couples
doc), already member-scoped by the existing rules. No rule changes needed and no new
exposure introduced. The `scene` field is plain couple-doc data — fine.
