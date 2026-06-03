# Code Review — batch: #14 voice, #15 doodle, #44 capsule, #43 on-this-day, #46 compat

Reviewed Chat (recording + doodle), useMessages (audio), MessageRow, DoodleCanvas,
TimeCapsule, OnThisDay, CompatQuiz. Build passes; all verified in browser.

## Verified correct
- MediaRecorder lifecycle: auto-stop reads elapsed time in interval (not in a setState
  updater); onstop cleans stream + sends; cancelRec nulls onstop so cancelled audio isn't
  sent; unmount stops tracks + clears timers; <900KB size guard.
- DoodleCanvas sizes to rect, white bg, pointer capture; PNG sent as image.
- CompatQuiz: setDoc(merge) per-question; match% over both-answered; null until shared.
- TimeCapsule: 30s tick flips sealed->open at unlock (≤30s late, acceptable).
- OnThisDay month/day match with years>=0 guard.

## Hardening applied (LOW)
- startRec double-start guard; recRef nulled in onstop + cancelRec.

VERDICT: APPROVE
