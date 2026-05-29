# Near — Build Plan & Roadmap

A long-distance-couples app: chat, watch-together, shared moments, and a couple dashboard.
One codebase that runs as a **web app** and an **Android app**.

This doc is written for a beginner. It explains *what* we build, *why* each choice, and
in *what order*, so you always know where we are.

---

## 1. The big picture (how the pieces fit)

```
        ┌─────────────────────────────┐
        │   Near app (one codebase)   │   React + TypeScript
        │   web build  +  Android app │   (Android via Capacitor)
        └──────────────┬──────────────┘
                       │  talks to
                       ▼
        ┌─────────────────────────────┐
        │   Firebase (the backend)    │   no server to manage
        │  • Auth      → who you are  │
        │  • Firestore → live chat,   │
        │      moods, countdown, etc. │
        │  • Storage   → photos       │
        │  • Messaging → push notifs  │
        └─────────────────────────────┘
```

**Why this stack (for a beginner):**
- **React + Vite + TypeScript** — the most popular, best-documented way to build a UI. TypeScript catches mistakes early.
- **Capacitor** — wraps the *same* web app into a real installable Android `.apk`. No separate Android codebase.
- **Firebase** — gives us login, a realtime database, photo storage, and push notifications *without running our own server*. Generous free tier. Perfect for a 2-person app.
- **YouTube IFrame API** — the simplest legal way to "watch together": we sync play/pause/seek over Firestore.
- **LiveKit** (later) — handles the hard parts of video/voice calls.

> Alternative considered: **Expo / React Native** (more "native" feel) and **Supabase** (SQL instead of Firestore). Both are great; we chose web-first + Firebase because it's the fastest, gentlest path to something real on both web and Android. We can revisit.

---

## 2. Core concept: "the couple"

Everything is built around a **couple = two linked users**.

- You sign up → you get an **invite code**.
- Your partner signs up → enters your code → you're **paired**.
- A `couples/{coupleId}` record holds everything you share (messages, moments, countdown, settings).
- Only the two of you can read/write your couple's data (enforced by Firebase security rules).

This keeps it private and simple: no "friends list", no public profiles — just the two of you.

---

## 3. Data model (Firestore)

```
users/{uid}
  name, photo, timezone, city, coupleId, pushToken

couples/{coupleId}
  members: [uidA, uidB]
  nextMeetup: { date, place, who-travels }
  createdAt

couples/{coupleId}/messages/{msgId}
  from, text, photoUrl?, type, sentAt, readAt?

couples/{coupleId}/moments/{momentId}
  photoUrl, caption, date, addedBy

couples/{coupleId}/state/live          (single doc, realtime)
  moodA, moodB
  watch: { videoId, playing, positionSec, updatedAt, updatedBy }
  dailyAnswer: { question, answerA, answerB, date }

couples/{coupleId}/dates/{dateId}      anniversaries, birthdays
couples/{coupleId}/bucketList/{itemId} shared goals
couples/{coupleId}/journal/{entryId}   shared diary
```

---

## 4. Milestones (the order we build in)

Each milestone is a working, shippable slice. We finish one before starting the next.

### M0 — Foundations  ⏱ setup
- [ ] Create React + Vite + TypeScript project
- [ ] Design system: colors, fonts, the warm pink→purple theme
- [ ] Bottom-nav shell with 5 tabs (Home, Chat, Watch, Moments, More)
- [ ] Static prototype screens (no backend yet) — *this is the clickable demo*

### M1 — Accounts & pairing  🔐
- [ ] Firebase project + Auth (email or Google sign-in)
- [ ] Sign up / sign in screens
- [ ] Invite-code pairing flow (link two users into a couple)
- [ ] Security rules: only the couple can access their data

### M2 — Home dashboard  🏠
- [ ] Two live clocks (your timezone + partner's)
- [ ] Countdown to next meetup (editable date & place)
- [ ] Mood picker (shared in realtime)
- [ ] "Send love" tap → writes an event (push comes in M6)
- [ ] Daily question (you both answer, see each other's answer)

### M3 — Chat & photos  💬
- [ ] Realtime messages (Firestore listener)
- [ ] Send text, emoji
- [ ] Send photos (upload to Storage)
- [ ] Read receipts + "typing…" (nice-to-have)

### M4 — Shared moments  📸
- [ ] Photo album grid
- [ ] Add photo + caption + date
- [ ] Memory timeline view

### M5 — Watch together  🍿
- [ ] Paste a YouTube link
- [ ] Sync play / pause / seek over Firestore `state/live.watch`
- [ ] "In sync" indicator
- [ ] (Stretch) shared music playlist

### M6 — Push notifications  🔔
- [ ] Firebase Cloud Messaging setup
- [ ] Notify on: new message, "thinking of you", mood change, good-morning
- [ ] Works on web (PWA) and Android

### M7 — Couple extras  ✨
- [ ] Important dates + reminders (anniversary, birthdays)
- [ ] Shared bucket list
- [ ] Shared journal
- [ ] Couple games (would-you-rather, daily trivia)
- [ ] Sleep call (ambient) — depends on M8

### M8 — Video & voice calls  📞
- [ ] LiveKit (or Daily.co) integration
- [ ] 1:1 video & voice
- [ ] Sleep-call mode (audio-only, low brightness)

### M9 — Ship to Android  🤖
- [ ] Add Capacitor, build Android project
- [ ] App icon, splash, name
- [ ] Test on a real phone
- [ ] (Optional) Play Store listing & release
- [ ] Make web build a PWA (installable from browser)

---

## 5. Privacy & safety (important for a couple app)

- All couple data locked to the two members via Firebase rules.
- Photos in Storage are private (signed access only).
- Be clear: this is **not** end-to-end encrypted at first (that's an advanced add-on). Document it honestly.
- No analytics that sell data. Delete-my-data option later.

---

## 6. Costs

- **$0 to start.** Firebase free tier (Spark) covers a 2-person app comfortably.
- A custom domain (optional) ≈ $10–15/year.
- Google Play one-time developer fee = $25 (only if you publish to the store).
- Video calls: LiveKit free tier / self-host; paid only at scale.

---

## 7. What we do next (immediate)

1. ✅ Create the repo (this).
2. ▶ **M0** — scaffold the React project and build the clickable prototype.
3. Then **M1** — wire up Firebase and pairing.

> We tackle one milestone at a time, and you'll have something working to look at after each.
