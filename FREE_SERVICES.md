# Near — Free Services for the Whole Stack ($0 to run)

Researched the current (2026) free tiers for **every external service** Near could need.
Goal: build and run the entire app for **$0**. Limits below are free-tier; for a
two-person couple app you will realistically never hit them.

---

## ⭐ The recommended $0 stack

| Need | Pick | Free allowance (2026) | Why |
|---|---|---|---|
| **Auth** | Firebase Authentication | 50,000 monthly users (email + Google) | Free, dead-simple, pairs with the rest of Firebase |
| **Realtime database** | Cloud Firestore | 1 GB stored · 50k reads / 20k writes / 20k deletes **per day** | Real-time listeners power chat, mood, taps, watch-sync |
| **Push notifications** | Firebase Cloud Messaging | **Unlimited, free** | The standout — never costs anything, web + Android |
| **Photo/file storage** | Cloudinary | 25 GB storage **or** bandwidth/mo (25 credits) | Avoids Firebase Storage's card requirement; great image CDN |
| **Web hosting** | Cloudflare Pages | **Unlimited bandwidth** · 500 builds/mo | Most generous; no commercial-use restriction |
| **Serverless + cron** | Cloudflare Workers | 100k requests/day · 5 cron triggers | Runs scheduled reminders, daily-question, countdown pings |
| **Video / voice calls** | LiveKit Cloud | 5,000 min/mo (or self-host free, Apache-2.0) | WebRTC done for you; sleep-call & calls features |
| **Git + CI** | GitHub | Private repos free · Actions 2,000 min/mo | Already set up ✅ |

> This combination keeps you off any paid plan and **without even entering a card**.

---

## Alternatives per need (all have real free tiers)

### Auth
- **Firebase Auth** — 50k MAU email/social ✅ recommended
- **Supabase Auth** — 50k MAU, open-source, SQL-based
- **Clerk** — 10k MAU free, nicest prebuilt UI

### Realtime database / backend
- **Firestore** — 50k reads / 20k writes / 20k deletes per day, 1 GB ✅
- **Supabase (Postgres)** — 500 MB DB, **unlimited API requests**, 200 concurrent realtime connections, 2M realtime msgs/mo — better if you want SQL/joins
- Pick **one** as your backend; don't run both.

### Push notifications
- **Firebase Cloud Messaging** — unlimited, free ✅
- **OneSignal** — free up to 10k subscribers

### Photo / file storage
- **Cloudinary** — 25 GB free, auto image optimization ✅ (best for the photo album & widgets)
- **Supabase Storage** — 1 GB free
- **Cloudflare R2** — 10 GB free, zero egress fees
- ⚠️ **Firebase Storage** works but **new projects require the Blaze plan** (a card on file). It still costs $0 under the free allotment — but if you want zero card, use Cloudinary/Supabase/R2.

### Web hosting
- **Cloudflare Pages** — unlimited bandwidth ✅
- **Netlify** — 100 GB bandwidth, 300 build-min/mo
- **Firebase Hosting** — 10 GB transfer/mo (convenient if all-in on Firebase)
- ⚠️ **Vercel Hobby** — great DX but **prohibits commercial use**; avoid if you ever monetize.

### Serverless functions & scheduled jobs (reminders, daily question, "good morning")
- **Cloudflare Workers** — 100k req/day + 5 cron triggers free ✅
- **GitHub Actions cron** — free (unlimited for public repos)
- **Supabase Edge Functions + pg_cron** — free
- ⚠️ **Firebase Cloud Functions** — 2M invocations free **but requires Blaze (card)** on new projects.

### Video / voice calls (WebRTC)
- **LiveKit Cloud** — 5,000 min/mo, 50 GB egress; self-host free ✅
- **100ms** — 10,000 min/mo free
- **Daily.co** — 10,000 min/mo free
- **Agora** — 10,000 min/mo free
- **Jitsi** — fully free / open-source (embed `meet.jit.si`)

### STUN / TURN (only if you self-host WebRTC instead of LiveKit/Daily)
- **Google STUN** — `stun:stun.l.google.com:19302` free
- **Metered Open Relay** — 20 GB/mo free TURN
- **ExpressTURN** — 1,000 GB/mo free
- (LiveKit/Daily/100ms/Agora include TURN, so you can skip this.)

---

## Free APIs for specific features

| Feature | Free service | Free allowance |
|---|---|---|
| **Watch together** | YouTube IFrame Player API | Free, no key for embeds |
| **Listen together** | Spotify Web API + Web Playback SDK | Free (users need Spotify Premium to control playback) |
| **AI coach / date ideas** (#63, #64) | **Google Gemini API** | 1,500 req/day, 1M token context, **no credit card** |
| ⤷ alternatives | Groq (fastest), OpenRouter (11+ free models), Cerebras | 1k–14k req/day |
| **In-chat translate** (#94) | **Microsoft Translator** | 2,000,000 chars/mo (most generous) |
| ⤷ alternatives | DeepL Free (500k chars/mo, best quality), LibreTranslate (self-host) | — |
| **Maps / distance** (#10) | OpenStreetMap + Leaflet | Free & open (distance = haversine math, no API) |
| ⤷ if you need tiles/geocoding | MapTiler / Mapbox | ~50k loads/mo free |
| **Flight-price tracker** (#38) | Amadeus Self-Service | Free test tier (flight offers search) |
| ⤷ alternative | Aviationstack | 100 req/mo free |
| **Cook-together recipes** (#69) | TheMealDB | Free |
| ⤷ alternative | Spoonacular | 150 points/day free |
| **Couple games / trivia** (#29) | Open Trivia DB (OpenTDB) | Free, no key |
| **Transactional email** (if beyond Firebase's built-in auth emails) | Brevo | 300 emails/day forever free |
| ⤷ alternative | Resend | 3,000 emails/mo free |
| **Error monitoring** | PostHog | 100k errors/mo (most generous) |
| ⤷ alternative | Sentry | 5k errors/mo free |
| **Analytics** | Firebase Analytics | Free, unlimited |
| ⤷ alternative | PostHog | 1M events/mo free |

---

## The only things that aren't free

| Item | Cost | Required? |
|---|---|---|
| **Google Play Store** publishing | **$25 one-time** | Optional — you can install the APK directly or use the PWA instead |
| **Custom domain** (e.g. `near.app`) | ~$10–15/year | Optional — free `*.pages.dev` / `*.web.app` subdomain works fine |
| **SMS / phone-number auth** | per-message $ | **Avoid** — use email + Google sign-in (free) |

Everything else in Near's 96-feature roadmap runs on free tiers.

---

## Two clean ways to assemble it

**Option A — "No card anywhere" (strictest free):**
Supabase (auth + DB + storage + edge functions + cron) → Cloudflare Pages (hosting) → FCM (push) → LiveKit (calls) → Cloudinary (images). Zero credit card required.

**Option B — "Firebase-centric" (simplest, matches PLAN.md):**
Firebase Auth + Firestore + FCM + Hosting, with **Cloudinary** for photos (to dodge Storage's Blaze requirement) and **Cloudflare Workers** for cron. Add a card only if you later want Firebase Storage/Functions.

> Recommendation: **Option B** to start (fewest moving parts), with Cloudinary + Cloudflare Workers bolted on. Revisit if you ever need SQL or want to avoid a card entirely.

---

## Sources
- [Firebase pricing / Spark limits](https://firebase.google.com/pricing) · [Firestore quotas](https://firebase.google.com/docs/firestore/quotas)
- [Supabase free tier](https://supabase.com/pricing) · [Supabase vs Firebase](https://supabase.com/alternatives/supabase-vs-firebase)
- [LiveKit pricing](https://checkthat.ai/brands/livekit/pricing) · [WebRTC platforms compared](https://www.rtcinsights.com/blog/webrtc-platforms-compared/)
- [Gemini API free tier](https://tokenmix.ai/blog/gemini-api-free-tier-limits) · [Free LLM APIs 2026](https://klymentiev.com/blog/free-llm-api)
- [Cloudflare Pages free tier](https://www.devtoolreviews.com/reviews/cloudflare-pages-pricing-bandwidth-limits-2026) · [Hosting free-tier comparison](https://agentdeals.dev/hosting-free-tier-comparison-2026)
- [Cloudflare Workers cron triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Metered Open Relay TURN](https://www.metered.ca/tools/openrelay/) · [Free STUN/TURN list](https://dev.to/aprogrammer22/list-of-free-stun-and-turn-servers-open-relay-project-3a70)
- [Best free translation APIs 2026](https://langbly.com/blog/best-free-translation-api-2026) · [LibreTranslate](https://libretranslate.com/)
- [Amadeus self-service flights](https://developers.amadeus.com/self-service) · [Open Trivia DB](https://opentdb.com/api_config.php)
- [Resend vs Brevo email](https://www.buildmvpfast.com/api-costs/email) · [Brevo free plan](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)
- [PostHog vs Sentry](https://posthog.com/blog/posthog-vs-sentry) · [Cloudinary pricing](https://checkthat.ai/brands/cloudinary/pricing)
