# Code Review — Messaging batch (#11 chat, #12 photos, #13 reactions, #16 typing/seen)

Reviewed: useMessages.ts, MessageRow.tsx, Chat.tsx, CoupleProvider.tsx, EmojiPicker.tsx,
lib/image.ts, lib/format.ts. Build passes; verified working in the browser (real-time
chat, photos, reactions via quick bar + full picker, swipe-to-reply, double-tap ❤️,
long-press, unsend, day separators).

## Resolved during review
- Swipe could drop on a fast flick (read stale React state) → now uses a live `dxRef`.
- Full emoji picker rebuilt on every parent render (flicker) → replaced the emoji-mart
  web component with a custom React grid over the same dataset (also fixed taps not
  registering) — centered modal, search, close button.
- Pointer-capture on pointer-down stole taps from the in-message buttons (reactions, ＋,
  reply) → capture only once a swipe starts; stopPropagation on those buttons.

## Verified clean
- Gesture disambiguation (tap/double-tap/long-press/swipe); timers cleared on
  swipe-start/move/up/cancel; pointercancel resets state.
- Outside-tap dismiss listener for the reaction bar adds/removes correctly.
- Typing debounce clears + flushes on unmount; markRead writes once per message change.
- Seen comparison guards nulls; setReaction/deleteField dotted writes correct.
- deleteMessage gated to own messages in UI; couple-doc typing/lastRead writes satisfy
  the members-unchanged rule.

## Known minor (acceptable / deferred)
- markRead writes one couple-doc update per inbound message (fine for 1:1).
- Either member can technically delete a message at the rules layer (UI gates to own).

VERDICT: APPROVE
