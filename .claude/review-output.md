# Code Review — Feature #4: Strict couple-scoped Firestore rules

File: web/firestore.rules. Reviewed for correctness (all client ops still pass),
security (non-member isolation), and pitfalls.

## Correctness — all documented client operations pass
own users read/onSnapshot/create; inviteCodes create (uid==self); couples getDoc as
member; own-doc profile update; pairing (partner coupleId null->value, couple create
size==2 + creator in members, own coupleId link); subcollection access via get() on
the parent couple doc.

## Security — deliverable met
- Non-member read on `couples/{id}` denied (uid not in members).
- Non-member subcollection access denied (get() parent membership check).
- Membership immutable on update; no world-open collection; default-deny in effect.

## Known limitations (require a server / Cloud Function — deferred; needs Blaze/card)
- MEDIUM: any signed-in user can create a `couples` doc naming an unconsenting second uid
  (can't read it usefully without that user also linking).
- MEDIUM: the `coupleId` null->value cross-doc link doesn't validate the value references
  a couple the target belongs to (griefing: set an unpaired user's coupleId to garbage).
  Same-transaction get() can't see the just-created couple, so this is unsolvable purely
  in rules. Document as a backend-hardening task.
- LOW: inviteCodes are enumerable by signed-in users (by design — must be resolvable).
- LOW (client contract): couple-doc updates must resend the unchanged `members` array or
  the immutability check denies the write. Noted for future couple-field updates.

## Verdict
Read/write isolation for couple data is correct and enforced; remaining items are
server-side hardening tasks that don't affect feature #4's guarantee.

VERDICT: APPROVE
