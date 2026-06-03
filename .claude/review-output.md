# Code Review — #59 installable PWA

Reviewed sw.js, manifest.webmanifest, index.html, main.tsx. Build passes; prod preview
serves manifest + sw.js.

## Verified correct
- Cross-origin (Firebase) requests left to the network (origin check) — auth/firestore
  untouched. Non-GET bypassed. SPA navigations network-first with offline /index.html
  fallback. SW registers only in PROD (dev HMR unaffected).

## Applied
- Asset cache now only stores successful same-origin responses (res.ok && type basic) —
  no caching of 404/redirect.

## Known (handle at deploy time)
- Cache name 'near-v1' is fixed → bump per release so a deploy purges the old shell and
  old hashed assets don't accumulate. Mitigated now by network-first navigation.

VERDICT: APPROVE
