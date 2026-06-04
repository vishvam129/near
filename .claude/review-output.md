# Code Review — HEAD 2a2c4c81

Scope: the 5 features added in commit 2a2c4c81 under `web/src` — AlbumGrid, PhotoAlbum,
SecretVault, PhotoWidget, ImmersiveCountdown, IdeaSuggestions, `lib/image.ts:fileToAlbumImage`,
and CoupleProvider `photoWidget`/`setPhotoWidget`.

Verdict: No HIGH-severity correctness bugs found. The implementation is sound and consistent
with established codebase patterns. One MEDIUM and two LOW observations below.

---

## MEDIUM

### M1 — PhotoWidget photo shares the heavily-populated couples doc; risk of hitting the 1MB limit
`web/src/components/PhotoWidget.tsx:28-29`, `web/src/couple/CoupleProvider.tsx:514-521`

`fileToAlbumImage` caps the data URL at <700KB and that value is written into
`couple.photoWidget.url` — a field on the **couples doc itself**, not its own document. Unlike the
album (where each photo is a separate doc, safe), the couples doc already carries many large fields
(watch, ttt, geo, avatars, pinnedNote, savings, battery, cycle, ...). A 700KB base64 string plus
the existing couple state can approach Firestore's 1,048,576-byte per-document hard limit.
- Impact: a large widget photo on an already-large couples doc can make `updateDoc` fail
  (document too large); the user only sees the generic "Could not send that photo."
- Suggestion: use a tighter cap for the widget specifically (smaller `maxDim`, e.g.
  `fileToAlbumImage(file, 700)`, or a dedicated target well under ~300KB), since it is a transient
  single photo sharing the doc.

## LOW

### L1 — Newly-added album photo ordering flicker with pending serverTimestamp
`web/src/components/AlbumGrid.tsx:33,54-59`

`orderBy('createdAt','desc')` with `createdAt: serverTimestamp()` means the just-added doc has a
null/estimated timestamp in the immediate local snapshot, so its position can shift once the
server resolves it. Minor visual reflow, not a correctness bug, and matches the established pattern
across the app (EntryList, EventThread, Whiteboard, etc.). No change required.

### L2 — AlbumGrid `name`-change unsubscribe is correct but never exercised in practice
`web/src/components/AlbumGrid.tsx:31-44`

The effect returns the `onSnapshot` unsubscribe and lists `name` in its deps, so a `name` change
would tear down and re-subscribe cleanly. The two consumers (PhotoAlbum name="album", SecretVault
name="vault") are separate component instances, so `name` never actually mutates within an
instance — the reuse is safe either way. No change required.

---

## Items explicitly checked and cleared

- **AlbumGrid subcollection switching / snapshot cleanup** — effect cleanup correct; deps
  `[coupleId, name]` complete. CLEAN.
- **Firestore rules for `album`/`vault` subcollections** — `couples/{coupleId}/{document=**}`
  recursive match covers both, members-only. CLEAN (`web/firestore.rules:73-77`).
- **Album doc-size for base64** — each album photo is its own document; `<700_000` JS chars ≈
  700KB UTF-8 for ASCII base64, comfortably under the 1MB doc limit. CLEAN.
- **SecretVault PIN gate** — soft device-local lock; mirrors SpicyZone exactly (same hash,
  localStorage key pattern, setup/unlock flow). Understood/intended, not encryption. CLEAN.
- **ImmersiveCountdown setInterval cleanup** — interval created only when `open`, cleared in
  cleanup, deps `[open]`. No leak; `setTick` drives re-render. CLEAN.
- **ImmersiveCountdown timezone parsing** — `new Date(meetup.date + 'T00:00:00')` parses the
  `yyyy-mm-dd` value (set via `updateMeetup` from a `type="date"` input) in local time, matching
  `prettyDate` and the other `format.ts` helpers (all use `+ 'T00:00:00'`). Consistent. CLEAN.
- **IdeaSuggestions Fisher-Yates** — standard unbiased shuffle (i from len-1 down to 1, j in
  [0,i] inclusive). CLEAN.
- **IdeaSuggestions useMemo deps** — `[type, budget, energy, roll]` complete; `void roll`
  intentionally forces a re-sample on "More ideas". CLEAN.
- **PhotoWidget state model** — `fromMe` derivation, dismiss/take-down via `setPhotoWidget(null)`
  -> `deleteField()`, and the CoupleProvider doc-mapping are all consistent and null-safe (aside
  from the M1 size note).
- **CoupleProvider `setPhotoWidget` / doc-mapping** — guards on db+user+couple; dotted write of a
  whole object is fine here (single shared field, not per-user); `at?.toDate?.()` null-safe. CLEAN.
