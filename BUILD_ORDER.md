# Near — Implementation Order (all 96 features, sequenced)

Build top to bottom. Each **wave** only uses things built in earlier waves, so you're
never blocked waiting on a prerequisite. Feature IDs map to `.claude/generated_features.json`.

- 🟢 **Waves 0–4 = MVP** — a real, usable app.
- 🔵 Waves 5+ = expansion, pulled from the backlog after the MVP works.

> **Pre-req (before Wave 0):** scaffold the project — React + Vite + TypeScript, the
> design system/theme, bottom-nav shell, and a Firebase project. This is the empty
> canvas every feature below sits on.

---

## 🟢 Wave 0 — Foundation & accounts
*Nothing works until you know who the two people are and can talk to their devices.*
1. **#1** Email/Google sign-in
2. **#2** Invite-code pairing (link the two accounts)
3. **#3** Couple profile (name, photo, timezone, city)
4. **#4** Firestore security rules (lock data to the couple)
5. **#57** Push notifications (FCM) — infrastructure many later features need

## 🟢 Wave 1 — Home dashboard
*The glanceable LDR core. Uses profile timezones from Wave 0.*
6. **#5** Two live clocks (your time + theirs)
7. **#6** Countdown to next visit
8. **#7** Relationship duration counter
9. **#36** Important dates + reminders (uses push from #57)
10. **#8** Auto timezone conversion when scheduling

## 🟢 Wave 2 — Messaging
*Real-time chat is the daily backbone. Uses auth + Storage.*
11. **#11** Real-time text chat
12. **#12** Photo sharing in chat
13. **#13** Emoji reactions
14. **#16** Read receipts & typing indicator
15. **#14** Voice notes
16. **#15** Doodles in chat

## 🟢 Wave 3 — Micro-connection
*Tiny, frequent touches. Needs push (#57) + presence + the message pipe.*
17. **#19** "Thinking of you" tap (buzz their phone)
18. **#22** Live partner status (online/sleeping/busy)
19. **#49** Mood / feelings check-in
20. **#45** Daily question (hidden until both answer)
21. **#21** Love-note / mood home-screen widget
22. **#20** Photo widget (push a photo to their home screen)

## 🟢 Wave 4 — Memories  *(end of MVP)*
*Now there's a relationship history worth keeping.*
23. **#40** Shared photo album
24. **#41** Memory timeline
25. **#42** Shared journal & love letters
26. **#43** "On this day" resurfacing
27. **#44** Time capsule (unlocks on a future date)

---

## 🔵 Wave 5 — Do things together (watch / play)
28. **#25** Synced YouTube watch-together
29. **#26** Watch-party chat overlay
30. **#27** Synced music / shared playlist
31. **#29** Couple games: would-you-rather & trivia
32. **#30** "How well do you know me?" quiz
33. **#73** Virtual date-idea generator

## 🔵 Wave 6 — Daily rituals & retention
34. **#51** Connection streaks
35. **#46** Daily quiz / compatibility
36. **#48** Good-morning / good-night ritual
37. **#50** Gratitude / appreciation notes
38. **#47** Love-language quiz & nudges
39. **#81** Weekly relationship check-in

## 🔵 Wave 7 — Planning & gestures
40. **#32** Shared calendar (Google/Apple sync)
41. **#33** Event threads (chat inside an event)
42. **#34** Shared to-do lists
43. **#35** Date-night planner
44. **#37** Shared bucket list / wish box
45. **#90** Schedule a surprise future message
46. **#88** "Open when…" digital letters
47. **#89** Reasons-I-love-you jar

## 🔵 Wave 8 — Calls
48. **#52** Voice calls (WebRTC / LiveKit)
49. **#53** Video calls
50. **#54** Sleep call (ambient, low-light)

## 🔵 Wave 9 — Activity expansion
51. **#69** Cook-together mode
52. **#70** Live shared whiteboard
53. **#71** Simultaneous-reveal drawing game
54. **#72** Karaoke / sing together
55. **#74** Board-game hub
56. **#75** Ambient virtual-location scenes

## 🔵 Wave 10 — Habits, finances, wellbeing
57. **#83** Shared habit tracker
58. **#84** Couple fitness pact
59. **#85** Co-op goals with shared streaks
60. **#86** Shared expense tracking (trips)
61. **#87** Visit/trip budget split
62. **#39** Shared savings goal for visits
63. **#38** Flight-price tracker
64. **#78** Guided relationship courses
65. **#79** Conflict-resolution / repair flow
66. **#80** Active-listening exercises
67. **#82** Relationship health insights / score

## 🔵 Wave 11 — Delight & micro-extras
68. **#65** In-app friendship lamp (tap → their screen glows)
69. **#68** Virtual kiss
70. **#92** Synced alarm / wake-up together
71. **#93** Shared sleep status
72. **#23** Battery-level sharing
73. **#9** Lock-screen countdown widget
74. **#10** Distance map

## 🔵 Wave 12 — Reach, polish & monetization
75. **#94** In-chat auto-translate
76. **#95** Multi-currency & multi-language UI
77. **#59** PWA (installable from browser)
78. **#58** Android build (Capacitor)
79. **#60** Shared premium subscription
80. **#61** PIN / biometric app lock
81. **#18** Secret password-protected album

## 🔵 Wave 13 — Advanced / hardware / AI
82. **#62** End-to-end encryption
83. **#63** AI relationship coach
84. **#64** AI date-idea / gift suggestions
85. **#17** Async video messages
86. **#28** Synced streaming (Netflix screen-share)
87. **#91** Shared menstrual-cycle awareness
88. **#31** Truth-or-dare (clean + spicy)
89. **#55** Spicy questions & dares (PIN-gated)
90. **#56** Connected-toy integration
91. **#24** Smartwatch tap / vibration
92. **#66** Friendship-lamp hardware sync
93. **#67** Heartbeat send / pillow integration
94. **#76** VR hangout room
95. **#77** AR surprises
96. **#96** Customizable couple avatars & shared space

---

## Why this order
- **Dependencies first:** auth → pairing → security → push, before anything that needs them.
- **Value early:** the most-loved LDR features (clocks, countdown, chat, tap, daily question, memories) are all in the MVP (Waves 0–4).
- **Cheap-but-magical sooner, hardware/AI/VR last:** things needing devices, ML, or 3rd-party SDKs (lamps, heartbeat, VR/AR, AI, connected toys) come last so they never block core work.
- **Each wave is a shippable checkpoint** — a natural place to commit + push and actually *use* what you built before moving on.

Machine-readable sequence: `.claude/build_order.json`.
