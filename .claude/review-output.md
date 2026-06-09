# Code Review — commits b383537 (WebRTC calls) & 4596644 (translate/karaoke/AR)

Reviewed:
- web/src/calls/CallProvider.tsx
- web/src/components/CallUI.tsx
- web/src/components/ARSurprise.tsx
- web/src/components/games/Karaoke.tsx
- web/src/lib/translate.ts
- web/src/components/MessageRow.tsx
- web/src/couple/CoupleProvider.tsx (setters)

---

## HIGH

### H1. Stale `ringing` call docs cause ghost incoming calls
`web/src/calls/CallProvider.tsx` (256-278)
If a caller starts a call and the page closes/refreshes before hangUp (no `beforeunload` writes `ended`), the call doc stays `status:'ringing'` forever. The callee's watcher query filters only `status=='ringing'` with no freshness/age cutoff, so on next load it immediately re-rings on the old doc. Recommend filtering by `createdAt` recency (e.g. last ~60s) and writing `ended` in a `beforeunload`/`pagehide` handler.

### H2. Incoming-call watcher re-subscribes on every `status` change → ring race
`web/src/calls/CallProvider.tsx` (256-278)
Effect deps are `[coupleId, user, status]`, so the `onSnapshot` listener is destroyed and recreated on every status transition. When a call ends and status returns to `idle`, Firestore replays the query result set; combined with H1 any still-`ringing` doc immediately re-rings. The tear-down/re-subscribe churn also opens a window where a freshly-arrived ringing doc is delivered to the listener being unsubscribed and is missed. Fix: subscribe once with `[coupleId, user]` and read live status from a ref.

### H3. Glare (both partners call at once) hangs both sides
`web/src/calls/CallProvider.tsx`
Simultaneous calls create two `ringing` docs. Each `startCall` sets `status='outgoing'`, so each side's incoming watcher bails via `if (status !== 'idle') return` and never sees the other's offer. Both sit on "Ringing…" forever; neither offer is answered. No glare resolution (e.g. lower uid backs off). Hard hang today.

### H4. Mic/camera tracks leak on teardown-during-accept (await race)
`web/src/calls/CallProvider.tsx` (120-175, 178-222)
`acceptCall`/`startCall` assign `localRef.current = stream` and later `pcRef.current = pc` across several `await`s. If `declineCall`/`hangUp`/`teardown` runs during an await (e.g. partner hangs up mid-negotiation), `cleanup()` nulls the refs, then the in-flight function re-assigns `localRef.current`/`pcRef.current` *after* cleanup — leaving live camera/mic tracks that are never stopped (camera/mic stays on). No cancel guard around the awaits (unlike ARSurprise which does it right). Fix: a generation/cancel token checked after each await; if cancelled, stop the just-acquired stream and close the pc.

### H5. Translate fallback hardcodes `en` as the source language
`web/src/lib/translate.ts` (19-29)
Lingva uses `/auto/${target}` (correct auto-detect). The MyMemory fallback hardcodes `langpair=en|${target}`. For a couples app the partner's language is frequently not English, so when Lingva is down a non-English message is mistranslated as English (garbage / unchanged). Parameterize/document the source, or detect it. Also no guard for `target === source` (translating to your own language still shows the 🌐 result).

---

## MEDIUM

### M1. CallUI never resets `srcObject` on teardown
`web/src/components/CallUI.tsx` (26-32) + cleanup in CallProvider
CallUI effects only run when `localStream`/`remoteStream` become truthy; when they go null on teardown the `<video>`/`<audio>` keep the last `srcObject`, risking residual frozen frame / audio. `cleanup()` does `setRemoteStream(null)` but doesn't clear element srcObject. Reset `el.srcObject = null` when the stream is null.

### M2. `parseLrc` leaves LRC metadata tags as lyric lines
`web/src/components/games/Karaoke.tsx` (8-19)
LRC files contain metadata like `[ar:..]`, `[ti:..]`, `[length:03:21]`. These don't match the numeric `[MM:SS]` stamp regex, so lines whose only content is such a tag aren't stripped and can render as lyrics. Drop lines that contain no timed stamp / only metadata.

### M3. Karaoke timer runs unbounded; scroll effect fires every second
`web/src/components/games/Karaoke.tsx` (39-55)
The rAF loop never stops at the last lyric time; `elapsed` grows unbounded while playing. The scroll effect depends on `[Math.floor(elapsed)]`, so `scrollIntoView` runs every second even when the active line is unchanged. Key the scroll effect on `activeIdx` and stop the timer at song end.

### M4. AR drag has no pointer capture → stuck-drag state
`web/src/components/ARSurprise.tsx` (55-83)
`dragging.current=true` is set on the object's `onPointerDown`; move/up are on the container. Without `setPointerCapture`, a fast drag off the container stops `onPointerMove`, leaving `dragging.current===true` so the next tap drags. Capture the pointer on down, or bind move/up to window.

---

## LOW

### L1. translate.ts fetches have no timeout — a hung public Lingva instance blocks the fallback chain. Wrap in `AbortController` with a timeout.
`web/src/lib/translate.ts`

### L2. Karaoke `search` doesn't check `r.ok` before `r.json()`; a 5xx yields a non-array and `data.filter` throws (caught as generic error).
`web/src/components/games/Karaoke.tsx` (65-67)

### L3. `makePeer` uses `localRef.current!` non-null assertion inside `forEach` — throws if nulled by the H4 teardown race.
`web/src/calls/CallProvider.tsx` (105)

### L4. AR "Keep it (clear)" button calls `setArSurprise(null)` (deletes it) — contradictory copy.
`web/src/components/ARSurprise.tsx` (89-98)

---

## Verified non-issues
- ARSurprise camera cleanup is correct: `cancelled` flag + `getTracks().stop()` in effect cleanup (27-46) — the calls code should copy this pattern (H4).
- Karaoke rAF cleanup via `cancelAnimationFrame` in effect return is correct.
- CallProvider `cleanup()` stops local tracks and unsubscribes on the normal path; the only leak is the await-race (H4).
- MessageRow stops pointer propagation on the translate button, so it doesn't trigger swipe/long-press.
