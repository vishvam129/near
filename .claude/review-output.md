# Code Review — batch: #48 ritual, #41 timeline, #29 WYR, #30 know-me, #31 truth/dare

Reviewed CoupleProvider (greeting/wyr), Greeting, MemoryTimeline, WouldYouRather,
KnowMeQuiz, TruthOrDare. Build passes; all verified in browser.

## Fixed (was HIGH)
- KnowMeQuiz: own-doc snapshot overwrote in-progress typing (controlled inputs re-seeded
  on every server echo → lost-update). Now seeds `mine` ONCE from the server (seeded ref,
  reset per uid); local edits own the inputs afterward.

## Verified clean
- WYR: pickWyr requires couple.wyr; buttons disabled after picking; newWyr resets picks.
- Greeting null-safe; only shows partner's greeting.
- MemoryTimeline date-string sort correct; form requires a date.
- TruthOrDare local, in-bounds random.

## Known minor (acceptable, loose-writes tolerance)
- WYR: simultaneous "Next" by both can last-writer-wins flip the question; cosmetic, rare.

VERDICT: APPROVE
