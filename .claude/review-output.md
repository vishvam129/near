# Code Review — Feature #3: Couple profile (name, photo, timezone, city)

Reviewed: CoupleProvider.tsx, lib/format.ts, lib/image.ts, components/Avatar.tsx,
pages/EditProfile.tsx, pages/Home.tsx. Build passes; both partners' profiles render
with live local times; device photo picker works and persists.

## MEDIUM (fixed)
- EditProfile read `profile` only at mount, so a save before the profile loaded could
  write stale defaults. **Fixed**: Home now renders `<EditProfile key={profile?.uid} …>`,
  remounting the form with fresh initializers whenever the profile id changes.

## LOW (no action)
- Local time ticks every 20s — can lag ~20s at a minute boundary; acceptable & cheaper.
- `initials()` relies on the `'?'` fallback for empty input — correct as written.

## Verified correct
- Partner `useEffect`: subscription, `cancelled` guard before `onSnapshot`, cleanup, and
  re-subscribe on `coupleId` change all correct (no listener leak).
- `updateProfile`: per-field `undefined` checks distinguish "unedited" vs "cleared";
  empty `photoURL` → null; empty patch short-circuits.
- `image.ts`: cover-crop math correct; ImageBitmap.close() cleanup; non-image + context
  failure handled; `<img>` fallback rejects on decode error.
- `timezoneList()`/`browserTimezone()`: feature-detect with static fallback; the current
  timezone is injected as an option so a stored value is never dropped.
- TypeScript sound; no `any` leaks.

VERDICT: APPROVE
