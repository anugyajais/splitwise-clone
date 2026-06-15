# Scope & Data Anomaly Log

## 🗄️ Database Schema Architecture
To satisfy the strict requirements for temporal group membership and robust anomaly handling, the relational schema was designed as follows:
* **User (Django Auth):** The core system actor.
* **Group:** The shared household/trip entity.
* **GroupMember:** Junction table with critical `joined_date` and `left_date` fields. This solves the "Sam/Meera" temporal requirement (preventing users from being charged for expenses outside their residency window).
* **Expense:** The validated, permanent ledger entry.
* **ExpenseSplit:** Tracks exact, percentage, or equal splits linked to an Expense.
* **StagedExpense:** A quarantine table. Raw CSV rows land here first. If anomalies are detected, they remain here pending human resolution via the UI.

## 🚨 Anomaly Log (From the CSV)
The importer does not silently fail or guess. It parses the CSV and flags the following deliberate data traps:

1. **MISSING PAYER:** (Row 13 - 'House cleaning supplies'). Importer flags `MISSING PAYER`. Quarantined until the user explicitly assigns the payer in the UI.
2. **SETTLEMENT LOGGED AS EXPENSE:** (Row 14 - 'Rohan paid Aisha back'). Importer detects a single payee with no split distribution. Flagged as `POSSIBLE SETTLEMENT` to convert into a debt-offset rather than a shared expense.
3. **MATH ERROR (PERCENTAGE):** (Rows 15 & 32 - 'Pizza Friday' & 'Weekend brunch'). Importer calculates percentages summing to >100%. Quarantined for user correction.
4. **NEGATIVE AMOUNT:** (Row 26 - 'Parasailing refund'). Importer flags as `NEGATIVE AMOUNT REFUND`. Suspended to apply reverse-split logic rather than treating it as a standard cost.
5. **MISSING CURRENCY:** (Row 28 - 'Groceries DMart'). Flagged as `ASSUMED CURRENCY`. Defaults to INR but requires user approval.
6. **TEMPORAL GHOST MEMBER:** Engine checks expense dates against `GroupMember.left_date` and `joined_date` to catch instances where someone tries to bill Meera after March or Sam before mid-April.