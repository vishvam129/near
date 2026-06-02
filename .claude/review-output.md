# Code Review — batch: #39 savings, #86 expenses, #87 split, #81 check-in, #82 score

Reviewed CoupleProvider (savings + setSavingsGoal/addToSavings), SavingsGoal, Expenses,
WeeklyCheckin, HealthScore. Build passes; all verified in browser.

## Verified correct
- addToSavings: read-then-write inside runTransaction (race-safe, preserves label,
  coerces numbers, guards amount<=0). setSavingsGoal preserves existing saved.
- Expenses split: theirSum=total-mySum, balance=mySum-total/2, correct signs/who-owes;
  all-square tolerance.
- WeeklyCheckin: UTC-Monday key; setDoc(merge) deep-merges nested ratings/notes; reveal
  gated (ratings always 1-5, no falsy-0). HealthScore null-safe + clamped.

## Polish applied
- SavingsGoal "Edit goal" now pre-fills target/label from the saved goal.

VERDICT: APPROVE
