# Code Review — #19 Thinking-of-you tap + #45 Daily question

Reviewed CoupleProvider (poke + sendPoke), LoveBurst, Home button, questions.ts,
DailyQuestion. Build passes; both verified working in the browser.

## Fixed
- LoveBurst missed the couple's FIRST-ever poke (baseline not set when poke was null
  at mount) → now sets baseline on first couple load (poke?.at ?? 0), so the first
  poke fires.
- Daily key switched to UTC so partners in different timezones share the same
  question/answers doc (was local-time per device).

## Verified clean
- Poke replay/self-poke guards correct (monotonic timestamp; from != me).
- setDoc merge does not clobber partner's answer; deterministic questionForDate.
- onSnapshot cleanup correct; sendPoke shape matches reader.

## Known limitation (acceptable)
- Daily answers doc contains both answers; partner's is only UI-hidden until you answer
  (true server-side hiding would need custom rules). Acceptable for MVP.

VERDICT: APPROVE
