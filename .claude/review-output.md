# Code Review — Feature #1: Email/Google sign-in with Firebase Auth

Reviewed: firebase.ts, AuthProvider.tsx, SignIn.tsx, Home.tsx, App.tsx, main.tsx.
Build (`tsc -b && vite build`) and runtime (email + Google sign-in, sign-out, log-back-in) verified manually.

## Security
- `.env` git-ignored at repo root; only `web/.env.example` (placeholders) tracked. Firebase web keys are public by design. No secret exposure.

## HIGH
None.

## MEDIUM
1. `useMemo` in AuthProvider memoizes on `[user, loading]` but closes over auth callbacks recreated each render — limited benefit. Consider stabilizing methods (useCallback) before the dashboard adds many consumers.

## LOW
2. `setBusy(false)` in `finally` runs after SignIn unmounts on success — harmless no-op in React 18/19.
3. `googleProvider` always instantiated even when Firebase disabled — safe (no app needed).
4. `email` not trimmed while `name` is — negligible.

## Notes
- `onAuthStateChanged` cleanup correct; `requireAuth()` rejection path handled; `friendlyError` narrows `unknown` safely; `useAuth` guards provider usage.

VERDICT: APPROVE
