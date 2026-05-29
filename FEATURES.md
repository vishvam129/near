# Near — Full Feature Catalog (Research-Backed)

Every feature a long-distance-couples app *could* have, gathered from researching the
real market (Between, Paired, Cupla, Lovewick, Raft, Locket, NoteIt, Rave, KAST,
Bond Touch, Honi, iPassion, Twig, Flamme, Widgetable, Couplete, and others).

Use this as the master menu. Pick what goes in the MVP vs. later. The machine-readable
version for `/feature` lives in `.claude/generated_features.json`.

Legend: 🟢 MVP candidate · 🟡 phase 2 · 🔵 advanced/later · ⭐ differentiator

---

## 1. Communication & Messaging
- 🟢 Private 1:1 chat between two linked accounts
- 🟢 Photo sharing in chat
- 🟢 Emoji & reactions on messages
- 🟡 Voice notes / audio memos
- 🟡 Doodles / drawings sent in chat
- 🟡 Read receipts & "typing…" indicator
- 🟡 Stickers / GIFs
- 🟡 Async video messages (Marco-Polo style heartfelt clips)
- 🔵 Secret / password-protected photo albums (Between-style)
- 🔵 Auto-translate messages (for international couples)
- 🔵 Digital → physical postcards mailed to partner (Touchnote-style)

## 2. Calls
- 🟡 Voice calls (WebRTC)
- 🟡 Video calls
- 🔵 ⭐ Sleep call — low-light, audio-only, fall asleep "together"
- 🔵 Watch-party voice overlay (talk while watching)

## 3. Home-screen widgets & micro-connection (huge in LDR)
- 🟢 ⭐ "Thinking of you" tap → buzz/notification on their phone (Bond-Touch style)
- 🟡 ⭐ Photo widget — push a photo straight to their home screen (Locket-style)
- 🟡 Love-note / doodle widget (NoteIt-style)
- 🟡 Mood / status widget (Widgetable-style virtual hug & mood)
- 🟡 Partner's live status (online, sleeping, busy)
- 🔵 Battery-level sharing ("your phone's about to die, call me")
- 🔵 Heartbeat sharing (Feel-style) — needs wearable
- 🔵 Smartwatch tap / vibration (Apple Watch / Wear OS)

## 4. Time & Distance (the LDR core)
- 🟢 Two live clocks — your timezone + partner's, side by side
- 🟢 Countdown to next visit / meetup (editable date & place)
- 🟢 Relationship duration counter ("together for 1y 3m 12d")
- 🟡 Auto timezone conversion when scheduling a call/date (Cupla-style)
- 🟡 Lock-screen countdown widget
- 🔵 Distance map — both locations + miles apart
- 🔵 Weather in both cities

## 5. Watch / Listen / Play together
- 🟢 Synced video via YouTube (press play at the same moment)
- 🟡 Watch-party chat overlay
- 🟡 ⭐ Synced music / shared Spotify playlist
- 🔵 Synced streaming (Netflix/Hulu screen-share, Rave/KAST-style)
- 🟡 Couple games: would-you-rather, trivia
- 🟡 "How well do you know me?" quiz
- 🔵 Truth-or-dare (clean + spicy modes, Honi-style)
- 🔵 Drawing / guessing game

## 6. Shared planning & organization
- 🟡 Shared calendar (sync with Google/Apple)
- 🟡 Event threads — chat inside a calendar event (OurCal-style)
- 🟡 Shared to-do lists
- 🟡 ⭐ Date-night planner with idea suggestions (Cupla/Lovewick-style)
- 🟢 Important dates + reminders (anniversary, birthdays)
- 🟡 Shared bucket list / wish box / goals (Couplete-style)
- 🔵 Trip / visit planner
- 🔵 ⭐ Flight-price tracker for next visit
- 🔵 ⭐ Shared savings goal toward visits/flights

## 7. Memories & journaling
- 🟢 Shared photo album / scrapbook (Twig-style)
- 🟢 Relationship / memory timeline
- 🟡 Shared journal & love letters
- 🟡 "On this day" — resurface past memories
- 🔵 ⭐ Time capsule — message/video that unlocks on a future date
- 🟡 Milestone tracker (firsts, anniversaries)

## 8. Daily connection rituals
- 🟢 Daily question — answer hidden until *both* reply (Paired-style)
- 🟡 Daily quiz / compatibility (Happy Couple-style)
- 🟡 Love-language quiz & care nudges (Love-Nudge-style)
- 🟡 Good-morning / good-night ritual
- 🟡 Mood / feelings check-in tracker
- 🟡 Gratitude / appreciation notes
- 🟡 ⭐ Connection streaks (consecutive days you both showed up)

## 9. Intimacy (optional, PIN-gated)
- 🔵 Spicy questions & dares (iPassion / Honi-style)
- 🔵 Fantasy / desire sharing
- 🔵 Dares you can "cash in" on the next visit (Desire-style)
- 🔵 Connected-toy integration (Lovense/Kiiroo) — advanced, optional
- 🔵 PIN/biometric-locked private section

## 10. Gifts & gestures
- 🔵 Send digital gift cards (Gyft-style)
- 🔵 Care package / wishlist
- 🔵 Order food to partner (delivery integration)
- 🟡 Send a song
- 🟡 Schedule a surprise message for later

## 11. Account, pairing, settings & safety
- 🟢 Sign up / sign in (email or Google)
- 🟢 Invite-code pairing (link exactly two accounts)
- 🟢 Profile: name, photo, timezone, city
- 🟡 Push-notification preferences
- 🟡 PIN / biometric app lock
- 🔵 End-to-end encryption
- 🔵 Data export & delete-my-data
- 🔵 Backup & restore
- 🟡 ⭐ Shared premium — one partner pays, both get Premium (Paired model)

## 12. Platform / technical
- 🟢 Web app (React + Vite)
- 🟢 Android app (Capacitor wrap)
- 🟢 Real-time sync (Firestore)
- 🟢 Push notifications (FCM)
- 🟡 PWA — installable from the browser
- 🔵 Offline support
- 🔵 iOS build (same codebase)

## 13. Differentiators worth considering ⭐
- AI relationship coach & conversation prompts (Flamme-style)
- AI date-idea / gift suggestions personalized to your story
- A shared "couple AI" that remembers your relationship
- Live shared space / "co-presence" room you can both hang in

---

## Recommended MVP (ship this first)

The 🟢 items, focused into one coherent first release:

1. Auth + invite-code pairing
2. Home dashboard: two clocks, countdown, relationship counter
3. Real-time chat + photos
4. "Thinking of you" tap
5. Daily question
6. Shared photo album / memories
7. Watch-together (YouTube)
8. Important-date reminders
9. Web + Android, with push notifications

Everything else becomes phase 2 / advanced, tracked in `.claude/generated_features.json`.

---

## Sources
- [5 Best Apps for Long-Distance Couples in 2025 — OurCal](https://ourcal.com/blog/5-best-apps-for-long-distance-couples)
- [Long-Distance Relationship Apps: Top 24 — Lasting the Distance](https://lastingthedistance.com/long-distance-relationship-apps/)
- [11 Must-Have Apps for Long Distance Couples — Cupla](https://cupla.app/blog/11-must-have-apps-for-long-distance-couples/)
- [18 Apps for Couples — Paired](https://www.paired.com/articles/best-apps-for-couples)
- [Lovewick: Relationship App for Couples](https://lovewick.com/)
- [7 Best Couple Apps in 2026 — Habi](https://habi.app/insights/best-couple-apps/)
- [Top 8 LDR Apps in 2025 — Flamme](https://www.flamme.app/top-8-ldr-apps-in-2025-for-long-distance-romance)
- [20 Online Games for Long Distance Couples — Endless Distances](https://www.endlessdistances.com/online-games-for-long-distance-couples-long-distance-relationship-games/)
- [Long-Distance Relationship Gadgets — Paired](https://www.paired.com/articles/long-distance-relationship-gadgets)
- [Bond Touch — App Store](https://apps.apple.com/us/app/bond-touch/id1291952832)
- [What's Paired Premium? — Paired Support](https://support.paired.com/en/articles/164633-what-s-paired-premium)
