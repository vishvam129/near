# Near 💗

**Stay close, no matter the distance.** An app for long-distance couples to talk, watch things together, and share their everyday moments.

## What it does

- 💬 **Chat & photos** — message each other, share pictures and voice notes
- 🍿 **Watch together** — synced video/music so you press play at the same moment
- 📸 **Shared moments** — a private album & memory timeline that's just yours
- 🏠 **Couple dashboard** — both time zones side by side, countdown to your next visit, mood/status, a daily question
- 💗 **Thinking of you** — one tap sends a little buzz to their phone
- 📞 **Calls** — voice, video and sleep calls
- 🔒 **Secret chat** — end-to-end encrypted, unlocked with a shared passphrase
- 🎮 **Couple games** and a daily question

## Status

Built and running as an installable web app (PWA). 77 React components across
chat, calls, watch-together, shared albums, games and the couple dashboard.
An Android build is planned; it is not in this repository yet.

## How it's built

- **Frontend:** React 19 + TypeScript + Vite, installable PWA (manifest + service worker), code-split
- **Realtime data:** Cloud Firestore — couple, message and album models, with security rules that restrict every document to its own couple (`web/firestore.rules`)
- **Calls:** WebRTC voice, video and sleep calls. Signaling runs over Firestore — the offer, answer and ICE candidates are documents — so there is no separate signaling server (`web/src/calls/CallProvider.tsx`)
- **Secret chat:** end-to-end encrypted with keys derived from a shared passphrase (PBKDF2, 310,000 iterations) using the Web Crypto API (`web/src/lib/crypto.ts`)
- **Push:** Firebase Cloud Functions + Cloud Messaging for new messages and nudges (`web/functions`)
- **Media:** Cloudinary for photos, voice notes and video messages
- **Watch-together:** YouTube IFrame API with synced playback state
- **Hosting:** Firebase Hosting

## Run it

```bash
cd web
npm install
cp .env.example .env    # add your own Firebase web config
npm run dev
```

The app runs without Firebase values, but sign-in stays disabled until they are filled in.

## Project notes

[FEATURES.md](./FEATURES.md) lists every feature; [PLAN.md](./PLAN.md) and
[BUILD_ORDER.md](./BUILD_ORDER.md) are the original planning documents.
