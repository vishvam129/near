# Code Review — batch: #36 dates, #25 watch, #37 bucket, #42 journal, #50 gratitude, #51 streak

Reviewed Watch.tsx, CoupleProvider (watch/streak), EntryList, BucketList, ImportantDates,
DailyQuestion, format.ts. Build passes; all verified in browser.

## Fixed (was REJECT)
- HIGH: bumpStreak was a non-transactional read-modify-write (race/double-count between
  two clients) → now runTransaction (reads streak inside tx; idempotent under concurrency).
- MEDIUM: Watch player never destroyed → added unmount cleanup calling player.destroy().

## Verified clean
- Watch sync converges (no echo/loop): apply skipped when updatedBy===me or
  updatedAt<=lastApplied; applyingRemote suppresses programmatic echo; updatedAt monotonic.
- EntryList null-createdAt sort is cosmetic/self-correcting; delete gated client-side
  (rules trust members — by design).
- ImportantDates recurring math correct.

## Known minor (acceptable)
- Watch updatedAt uses client clock (skew tolerable for a couple).
- Subcollection delete not author-restricted at rules layer (trusted members).

VERDICT: APPROVE
