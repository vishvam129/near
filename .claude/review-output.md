# Code Review — commit 688e872b (friendship lamp / kiss / heartbeat / battery / love-language quiz)

Reviewed:
- web/src/components/SignalOverlay.tsx
- web/src/components/BatteryShare.tsx
- web/src/components/ConnectionDeck.tsx
- web/src/components/LoveLanguageQuiz.tsx
- web/src/couple/CoupleProvider.tsx
- web/src/pages/Home.tsx, More.tsx, components/Shell.tsx

Compared against the established pattern in web/src/components/LoveBurst.tsx.

---

## HIGH

### H1 — SignalOverlay timeout is cancelled by unrelated couple updates; full-screen overlay gets stuck
File: web/src/components/SignalOverlay.tsx (lines 16-34)

The effect depends on `[couple, user?.uid]`, so it re-runs on EVERY couple-doc snapshot
(typing, mood, battery, lastRead, etc.). On a signal it does:

```ts
setActive({...})
const id = window.setTimeout(() => setActive(null), ms)
return () => window.clearTimeout(id)
```

React runs the previous effect's cleanup before each re-run. So when any unrelated couple
snapshot arrives while the overlay is showing, React calls the cleanup (`clearTimeout(id)`),
then re-runs the effect — but now `t === last.current`, the `t > last.current` branch is NOT
entered, no new timeout is scheduled, and the effect returns `undefined`. Result: `active` is
never reset to null and the full-screen overlay stays up indefinitely (until the next *new*
signal arrives).

This is dramatically more likely now because the SAME commit mounts BatteryShare, which writes
`battery.<uid>` to the couple doc on every rounded-percent / charging change. Each such write
yields a couple snapshot that can kill the in-flight signal timeout. Typing indicators and
moods do the same. LoveBurst.tsx shares this structural pattern, but its overlay is small/
non-blocking and the couple doc previously had fewer high-frequency writers; SignalOverlay's
lamp/kiss/heartbeat overlay is full-screen, so a stuck overlay is much worse.

Fix: keep the timeout in a ref decoupled from effect re-runs — clear/reset it only when a NEW
signal fires, and clear once on unmount:

```ts
const timeoutRef = useRef<number | null>(null)
// in the "new signal" branch:
if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
setActive({...})
timeoutRef.current = window.setTimeout(() => setActive(null), ms)
// separate unmount-only effect clears timeoutRef.current
```

---

## MEDIUM

### M1 — BatteryShare: getBattery() rejection is unhandled; UI stuck on "—" with no fallback message
File: web/src/components/BatteryShare.tsx (lines 44-50)

`nav.getBattery().then(...)` has no `.catch`. Some browsers reject (insecure origin, permission
policy, or feature blocked) instead of leaving `getBattery` undefined. On rejection: an
unhandled promise rejection is logged, `supported` stays `true`, and "You" renders "—" forever
instead of the "not shared / can't read battery" message (which only shows when `supported` is
false). Add `.catch(() => { if (!cancelled) setSupported(false) })`.

### M2 — `signal` is a single last-writer-wins field; rapid/overlapping signals coalesce
File: web/src/couple/CoupleProvider.tsx (sendSignal, lines 412-417) + SignalOverlay.tsx

`sendSignal` overwrites the whole `signal` object and the receiver fires only when
`at.getTime() > last.current`. If a kiss is sent while a lamp glow is still animating, the kiss
overwrites the lamp; the receiver re-baselines and the lamp color/animation can mismatch
briefly. Consistent with the existing greeting/poke approach and acceptable for an ephemeral
affection signal, but worth noting that simultaneous signals from both partners are not
independently delivered.

---

## LOW

### L1 — Unchecked `as Lang` cast can throw if loveLang holds an unexpected value
File: web/src/components/LoveLanguageQuiz.tsx (lines 62-63, 110-111, 119-121)

`couple?.loveLang?.[uid]` is typed `string` and cast to `Lang`. If the stored value is ever not
one of the five keys, `LANGS[mine]` is `undefined` and `LANGS[mine].emoji` throws, breaking the
card render. Low risk (only this quiz writes the field), but guard with
`mine && LANGS[mine] ? ... : fallback`.

### L2 — Love-language tie-break is first-key-wins (order-biased)
File: web/src/components/LoveLanguageQuiz.tsx (line 68)

`reduce((a, b) => next[b] > next[a] ? b : a)` keeps the first-seen max on ties; with 8 questions
over 5 langs ties are common, biasing toward the earliest object key (words → time → acts →
touch → gifts). Fine for a casual quiz; flagging as approximate.

### L3 — Battery low threshold expressed in two units, easy to desync
File: web/src/components/BatteryShare.tsx (lines 12-15 vs 82)

`batIcon` low check is `level <= 0.15` (fraction) while the "low" text class uses
`theirs.level <= 15` (percent). Both correct today (level stored as percent, divided by 100 for
the icon), but the duplicated constant in two units is a future-desync hazard. Not a current bug.
