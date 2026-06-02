# Code Review — batch: #34 to-do, #73 date ideas, #88 open-when, #89 reasons, #90 scheduled

Reviewed CheckList, DateIdeas, OpenWhen, ReasonsJar, ScheduleMessage, ScheduledDelivery,
More, Shell. Build passes; all verified in browser.

## Verified correct
- ScheduledDelivery: cross-collection transaction reads schedRef then update+set → the
  real cross-client guard. snapshot+20s interval double-firing is idempotent (transaction
  + delivered flag); deliveringRef arms/disarms in finally; cleanup unsub+clearInterval ok.
  No double or missed delivery.
- Random pick loops (ReasonsJar, DateIdeas) terminate for 0/1/n items.
- OpenWhen reveal is client-only UI state (by design). CheckList correct.

## Known caveats (by design)
- Scheduled messages deliver only while at least one partner has the app open (no server
  cron). Server-side scheduling would come with a backend / #57.
- deliverAt judged by client clock (skew tolerable).

VERDICT: APPROVE
