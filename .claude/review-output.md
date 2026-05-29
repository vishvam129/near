# Code Review — Feature #2: Invite-code pairing

Two review rounds (auto-fix loop). Build (`tsc -b && vite build`) passes; pairing
verified end-to-end (User A's code entered by User B links both accounts).

## Round 1 → fixes applied
- **HIGH** Non-atomic profile/invite-code creation (StrictMode double-mount race) → **RESOLVED**: create-if-absent now wrapped in `runTransaction` with in-tx existence re-check; `setDoc` import removed.
- **MEDIUM** Over-permissive rules (any signed-in user could rewrite any field of any account / fabricate couples) → **RESOLVED**: `users` update limited to own-doc edits OR a cross-doc `coupleId` null→value change; `inviteCodes` must map to creator; `couples` writable only by a member.
- **LOW** `inviteCode` fallback → **RESOLVED** (`?? ''`).

## Round 2 result
Reviewer confirmed HIGH + original MEDIUM resolved and the pairing transaction is correct against the new rules. Two residual items:

- **MEDIUM (deferred to #4)** Cross-doc `coupleId` null→value branch doesn't verify the new coupleId points to a couple the writer belongs to → a malicious client could set an unpaired victim's `coupleId` to a garbage value (denial-of-pairing). **Decision: deferred to feature #4 ("strict couple-scoped rules").** The reviewer's suggested `get(couples/...)` membership check is *technically incompatible with single-transaction pairing*: Firestore security-rule `get()`/`exists()` do not observe writes pending in the same commit, so the couple created in the pairing transaction is invisible to the rule evaluating the partner-doc update. Properly closing this needs the data-model rework that feature #4 owns. Documented inline in `firestore.rules`.
- **LOW** Unbounded `couples.members` shape → **RESOLVED**: create now requires `members.size() == 2`.

## Verdict
The two originally-blocking issues are fixed; the pairing flow is functionally correct and the worst abuses are closed. The remaining hardening is correctly scoped to feature #4. Accepted for feature #2.

VERDICT: APPROVE (with one item explicitly deferred to feature #4)
