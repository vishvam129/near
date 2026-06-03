# Code Review — batch: #26 watch-chat, #74 ttt, #71 draw-reveal, #70 whiteboard, #69 cook

Reviewed CoupleProvider (ttt/recipe/cook), TicTacToe, DrawReveal, Whiteboard, WatchChat,
CookTogether. Build passes; all verified in browser.

## Fixed (was HIGH)
- Whiteboard canvas only sized once on mount → strokes distorted on viewport change /
  risked drawing against a default-size bitmap. Now a ResizeObserver keeps the bitmap
  matched to display size and redraws (correct scale for normalized strokes both sides).

## Verified correct
- TicTacToe: winnerOf (8 lines + draw) correct; turn-flip serializes alternating play so a
  partner can't move out of turn; LWW writes acceptable (loose couple-doc writes).
- DrawReveal: canvas re-inits on prompt/mode change; reveal gated on both images.
- WatchChat reuses message thread; CookTogether shared absolute-end-time countdown (sync,
  survives reload).

## Known minor (MVP-acceptable)
- TicTacToe "New game" can reset mid-game and resetter becomes X (no confirm). Fairness
  nicety, not a bug.

VERDICT: APPROVE
