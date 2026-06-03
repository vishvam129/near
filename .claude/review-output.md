# Code Review — batch: #32 calendar, #33 threads, #61 app lock, #92 alarm, #93 sleep

Reviewed pin.ts, PinGate, PinSettings, App, Calendar, EventThread, CoupleProvider,
Bedtime, AlarmWatcher. Build passes; all verified in browser.

## Verified correct
- PIN: device-local hashed lock, honestly framed; wraps only Shell (never auth/pairing);
  clearing localStorage recovers access — can't lock you out of your account. Session
  unlock correct.
- Calendar orderBy('when') lexical sort is correct for fixed datetime-local format.
- EventThread path couples/{id}/events/{id}/comments valid.
- Alarm: fires when at<=now & not dismissed; dismiss clears for both + guards re-fire;
  client-clock + catch-on-open by design. sleeping/alarm dotted-path writes don't clobber.

## Known minor (acceptable)
- Deleting an event doesn't cascade-delete its comments (orphaned, harmless).
- No brute-force throttle on the casual PIN.
- Client-clock alarm timing.

VERDICT: APPROVE
