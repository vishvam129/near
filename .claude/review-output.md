# Code Review — Dashboard batch (features #5 clocks, #6 countdown, #7 together-counter)

Files: CoupleProvider.tsx, Clocks.tsx, Countdown.tsx, TogetherCounter.tsx,
lib/format.ts, lib/india.ts, EditProfile.tsx, Home.tsx. Build passes; verified in browser.

## HIGH (fixed)
- `durationSince` month-borrow produced negative days for end-of-month start dates
  (e.g. Jan 31 → Mar 1 rendered "1 month, -1 days"). **Fixed**: replaced with a
  cursor-stepping algorithm (advance whole years, then whole months, then count
  remaining days) that is always non-negative. Verified across edge cases:
  - 2024-01-31 → 2024-03-01 = 30 days
  - 2023-03-31 → 2024-03-01 = 11 months
  - 2020-12-31 → 2026-06-01 = 5y 4m 29d
  No negative values in any tested case.

## LOW (acknowledged, no action)
- countdownTo / durationSince parse the date at local midnight and diff against local
  now; across a DST change the hours value can be off by one. Acceptable for a
  days/months display.

## Verified clean
- CoupleProvider: all three effects return their unsubscribe; profile effect uses a
  `cancelled` guard (StrictMode-safe); couple-doc and partner effects re-key correctly,
  tearing down old listeners. No leak / double-subscribe.
- updateMeetup/updateSince: field-merge updateDoc leaves `members` untouched → satisfies
  the membership-immutability rule.
- Interval cleanup in Clocks (1s) and Countdown (60s) correct; one interval drives both
  clock columns.
- countdownTo decomposition correct; india.ts (28 states + 8 UTs); EditProfile optgroup +
  datalist + custom-tz fallback option; Home re-key on uid.

VERDICT: APPROVE
