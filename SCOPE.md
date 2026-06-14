# SCOPE: Data Anomalies & Database Architecture

## Part 1: The Anomaly Log (expenses_export.csv)
The provided CSV contained numerous deliberate data inconsistencies. To prevent silent failures or corrupted ledgers, the application utilizes a `StagedExpense` pipeline. Every row is analyzed before being permitted into the permanent `Expense` table. 

Below are the 12 anomalies detected and the policies implemented to handle them:

1. **Exact Duplicates:** * *Trigger:* `2026-02-08, Dinner at Marina Bites` vs `dinner - marina bites`.
   * *Policy:* The ingestion engine generates a signature `(date | lower(desc) | amount)`. Exact matches are flagged as `DUPLICATE_DETECTED` and suspended in the staging area for user review/deletion.
2. **Conflicting Duplicates:** * *Trigger:* `11/03/2026, Thalassa dinner` (Aisha logged 2400, Rohan logged 2450).
   * *Policy:* Flagged for user resolution. The UI forces the user to select the correct amount and delete the conflicting row before finalizing the import.
3. **Inconsistent Date Formats:** * *Trigger:* Mix of `YYYY-MM-DD`, `DD/MM/YYYY`, `Mar 14`, and `04/05/2026`.
   * *Policy:* The `python-dateutil` parser normalizes all dates. Ambiguous dates (like `04/05/2026`) fallback to contextual chronology based on surrounding CSV rows.
4. **Missing Payer (`paid_by`):** * *Trigger:* `2026-02-22, House cleaning supplies` (empty payer).
   * *Policy:* Row is quarantined with a `MISSING_PAYER` flag. The Import Wizard UI forces the user to assign a registered User ID before allowing the row to be imported.
5. **Settlements Disguised as Expenses:** * *Trigger:* `2026-02-25, Rohan paid Aisha back`.
   * *Policy:* Detected via lack of `split_type` alongside a positive amount and a single payee. The engine automatically reroutes this payload to generate a `Settlement` record, not an `Expense`.
6. **String/Formatting in Amount:** * *Trigger:* `Electricity Feb` amount is `"1,200"` and March is `" 1450 "`.
   * *Policy:* The Python engine utilizes a `clean_amount()` function to automatically strip whitespace and commas prior to casting to `Decimal`.
7. **Floating Point Overflow:** * *Trigger:* `Cylinder refill` listed as `899.995`.
   * *Policy:* To prevent fractional penny leaks, all amounts are strictly quantized to `0.01` (two decimal places) upon ingestion.
8. **Mathematical Impossibility (Percentages):** * *Trigger:* `Pizza Friday` splits total 110%.
   * *Policy:* Flagged as `MATH_ERROR_PERCENTAGE`. The row is quarantined until the user recalculates or approves proportional scaling in the review UI.
9. **Missing Currency:** * *Trigger:* `Groceries DMart` on 15/03/2026 has no currency.
   * *Policy:* Defaults safely to `INR` based on group locus, but flags `ASSUMED_CURRENCY` in the Import Report so the user is aware of the assumption.
10. **Zero Amount Expenses:** * *Trigger:* `Dinner order Swiggy` amount is `0`.
    * *Policy:* Row is flagged as `ZERO_AMOUNT_DISCARDED` and completely dropped from staging to prevent ledger clutter.
11. **Negative Amounts (Refunds):** * *Trigger:* `Parasailing refund` is `-30`.
    * *Policy:* Flagged as `NEGATIVE_AMOUNT_REFUND`. The system interprets this as income, inverting the split logic so the payer owes the participants their respective shares.
12. **Temporal Ghost Members:** * *Trigger:* Meera is included in April `Groceries` despite moving out in March.
    * *Policy:* The `GroupMember` schema utilizes temporal tracking (`left_date`). The engine flags `INVALID_PARTICIPANT_DATE` and forces a UI recalculation among the remaining active tenants.

## Part 2: Database Schema
A strictly relational PostgreSQL architecture designed to handle multi-currency ledgers and temporal constraints.

* **User:** `id`, `username`, `password_hash`
* **Group:** `id`, `name`, `created_at`
* **GroupMember:** `id`, `group_id`, `user_id`, `joined_date`, `left_date` (Enables temporal validation)
* **Expense:** `id`, `payer_id`, `group_id`, `amount` (Decimal), `currency` (Char), `split_type` (Enum), `date`
* **ExpenseSplit:** `id`, `expense_id`, `user_id`, `owed_amount` (Decimal)
* **Settlement:** `id`, `payer_id`, `payee_id`, `amount`, `currency`, `date`
* **StagedExpense:** Pure `CharField` quarantine table to absorb unvalidated CSV rows (`raw_amount`, `raw_date`, etc.) with `status` and `anomalies` JSON arrays.