# Code Review — HEAD 91b74cb4

Reviewed: DistanceMap (#10), CoupleAvatars (#96), GuidedCourses (#78), ConversationDecks (#63),
DateNightPlanner (#35), CoupleProvider writers/doc-mapping, lib/growth.ts. Focus: correctness —
haversine/projection math, geolocation error/permission flow, no-repeat shuffle, lesson
indexing/restart, Firestore writes & subcollection usage, React state staleness.

## HIGH

### H1 — ConversationDecks: immediate repeat across the reshuffle boundary
`web/src/components/ConversationDecks.tsx:15-26`
The no-repeat-until-exhausted logic is correct *within* a cycle. But when the deck exhausts,
the fresh `pool` is reset to ALL indices — including the card just shown (the last entry in
`seen`). The next random pick can therefore land on the same card twice in a row, which is the
exact repeat the feature promises to prevent. For a 6-card deck this occurs ~1/6 of every wrap.
Fix: exclude the last-seen index when reshuffling, e.g.
```
pool = d.cards.map((_, i) => i)
const last = seen[seen.length - 1]
if (pool.length > 1 && last !== undefined) pool = pool.filter((i) => i !== last)
nextSeen = []
```

## MEDIUM

### M1 — DistanceMap: 10-minute cached fix can show stale distance with no recency cue
`web/src/components/DistanceMap.tsx:48`
`maximumAge: 600000` lets the browser return a position up to 10 minutes old. `geo[uid].at` is
stored in Firestore but never surfaced, so after travel the mileage can be silently wrong. Not a
formula bug; consider `maximumAge: 0` on explicit taps and/or rendering "updated X ago".

### M2 — DateNightPlanner: a stale geolocation-style permission-denied path is the only error UX
`web/src/components/DistanceMap.tsx:44-47`
The error callback collapses every failure (denial, timeout, position-unavailable) into one
"permission denied?" message. A 10s timeout or unavailable signal will mislead the user into
thinking they denied permission. Branch on `err.code` (`PERMISSION_DENIED` vs `TIMEOUT` vs
`POSITION_UNAVAILABLE`) for an accurate message. Low severity.

## LOW

### L1 — DistanceMap: equirectangular projection distorts the drawn line at high latitudes
`web/src/components/DistanceMap.tsx:18-20`
The displayed haversine mile count is correct. The SVG pins/line use a plain equirectangular
projection, so the rendered line length doesn't scale with true distance away from the equator.
Acceptable for a decorative map; the mile number is the source of truth.

### L2 — DateNightPlanner: saved plans accumulate unbounded in Firestore
`web/src/components/DateNightPlanner.tsx:69-101`
Only the latest 5 are queried (`limit(5)`), but `save()` never prunes older docs, so the
`dateplans` subcollection grows forever. This matches the existing RepairFlow convention in the
codebase (`web/src/components/RepairFlow.tsx:48`), so it is consistent, not a regression.

## Correctness items explicitly verified OK
- Haversine (R=3958.8 mi, toRad, `2*R*asin(sqrt(s))`) — correct.
- ConversationDecks core no-repeat-until-exhausted — correct except H1 boundary case. `seen`
  read from closure is fine (draws are per user click, no batching staleness).
- GuidedCourses: current lesson `idx = min(done, len-1)`; "Mark done · next" writes `idx+1`;
  `complete` when `done >= len`; Restart writes 0; list-view `pct` uses clamped `done` — all
  correct and mutually consistent.
- CoupleProvider writers (`setGeo`/`setAvatar`/`setCourseProgress`) use dotted-path field
  updates (`geo.${uid}`, `avatars.${uid}`, `courses.${courseId}`) — correct, won't clobber the
  partner's nested entry; all guard on db+user+couple.
- CoupleProvider doc-mapping for geo/avatars/courses with `Number()||0` / string fallbacks and
  `at?.toDate?.()` — correct and null-safe.
- DateNightPlanner: `onSnapshot` cleanup returned from effect; `coupleId` dependency correct;
  `save`/`remove` guard on db+coupleId. `pick<T>` random selection fine.
- DistanceMap pin React keys `p.label + p.me` — unique across the two pins (`me` boolean differs).
- CoupleAvatars: `mine` falls back to a default object; edit writes via `setAvatar`; no staleness.
