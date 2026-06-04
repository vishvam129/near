# Code Review — HEAD 776952e4

Scope: E2E secret chat (lib/crypto.ts, components/SecretChat.tsx, #62) and
multi-language/multi-currency UI (lib/i18n.tsx, LanguageSettings, BottomNav,
Expenses, SavingsGoal, main.tsx, More.tsx, #95).

## Summary

The crypto is fundamentally sound for the stated threat model, and the Firestore
rules correctly couple-scope the `secret` subcollection (only the two members can
read/write), so neither keys nor plaintext leak server-side. No HIGH-severity
correctness or security bug was found. There is one genuine MEDIUM correctness bug
in SecretChat (decrypt effect cannot re-run when the key arrives via a ref), plus
several LOW notes.

---

## HIGH

None.

---

## MEDIUM

### M1 — Decrypt effect can leave messages blank (keyRef mutation never re-triggers the effect)
File: web/src/components/SecretChat.tsx:66-82

The decrypt effect depends on `[raw, user?.uid]` but reads `keyRef.current`. A ref
write does NOT trigger a re-render or re-run an effect. If the effect ever runs
while `keyRef.current` is null (line 69 `if (!key) return`), it early-returns and
schedules no retry; because mutating the ref does not re-run the effect, those
messages stay un-decrypted until the next `raw` change arrives.

In the common auto-unlock path (lines 35-43) `keyRef.current = k` is set just
before `setUnlocked(true)`, so it usually works — but it relies on effect ordering
rather than any React guarantee, and is fragile to future reordering.

Fix: drive the key through state so the effect re-runs when it arrives. Mirror the
ref into state and add it to the deps:

```ts
const [key, setKey] = useState<CryptoKey | null>(null)
// on unlock / auto-unlock: keyRef.current = k; setKey(k)
// on forget: keyRef.current = null; setKey(null)
// decrypt effect: read `key`, deps [raw, user?.uid, key]
```

Confidence: 82.

---

## LOW

### L1 — localStorage stores the raw passphrase, weakening the E2E claim under local/XSS attackers
File: web/src/components/SecretChat.tsx:95, 37-39

"Unlock & remember" writes the plaintext passphrase to
`localStorage["near_secret_pass_<coupleId>"]`. For the stated threat model
(server / DB-access adversary) this is fine — the passphrase never reaches
Firestore. But any XSS, shared device, or local-disk access recovers it and thus
all messages. Prefer storing a non-extractable derived `CryptoKey` in IndexedDB
over the plaintext passphrase. Acceptable as a documented tradeoff.
Confidence: 80 (tradeoff, not a bug).

### L2 — Weak passphrase floor (4 chars) + modest KDF makes offline brute force cheap
File: web/src/lib/crypto.ts:38; SecretChat.tsx:91,136

Minimum passphrase is 4 chars and KDF is PBKDF2-SHA256 @ 150k. Anyone holding one
ciphertext+IV (the partner, or a DB-access adversary) can brute-force a 4-char
passphrase offline. Salt (`'near-secret:'+coupleId`) is correct — PBKDF2 salt need
not be secret; it prevents cross-couple/rainbow reuse, which it does. AES-GCM IV is
fresh random 12 bytes per message (line 49) — correct, no reuse concern at this
volume. Fail-closed decrypt is correct. Consider a longer minimum passphrase and/or
higher iteration count.
Confidence: 80 (hardening).

### L3 — money() loses the currency symbol on Intl failure (informational)
File: web/src/lib/i18n.tsx:94-100

`Intl.NumberFormat` is correctly wrapped in try/catch (an invalid currency would
otherwise throw). The fallback returns `${amount}` with no symbol — reasonable.
Note JPY has 0 decimals so `money(1234.5)` → "¥1,235" (rounded) — expected Intl
behavior. No action required.

---

## Verified OK
- Firestore rules (web/firestore.rules:73-77) restrict `couples/{id}/secret` to the
  two members — ciphertext/keys do not leak; key is never written to Firestore.
- base64 helpers (crypto.ts:8-20) correct (btoa/atob over a latin1 byte string).
- AES-GCM random 12-byte IV per message — no reuse concern.
- Fail-closed decrypt returns null; UI renders "locked" and a banner — correct.
- `cancelled` flag in decrypt effect correctly prevents stale `setShown`.
- I18nProvider is outermost in main.tsx; SPA, so no SSR/hydration concern.
- Expenses sign handling: balance>0 uses `money(balance)`, <0 uses
  `money(Math.abs(balance))` — correct.
</content>
