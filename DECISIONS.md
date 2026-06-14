# DECISIONS: Engineering & Product Log

### 1. The CSV Ingestion Strategy: The "Staging Area" Pattern
* **Decision:** Implement a `StagedExpense` quarantine table instead of direct CSV-to-Ledger insertion.
* **Options Considered:** 1. *Direct Insertion:* Try/catch blocks that skip failing rows entirely.
  2. *Strict Rejection:* Crash the import if any row fails validation.
  3. *Staging Area:* Import raw strings into a temporary table, run validation, and provide a UI to fix errors.
* **Why:** Option 3 is the only one that satisfies Meera's requirement ("I want to approve anything the app deletes or changes") and prevents silent data loss. By isolating dirty data, the permanent `Expense` ledger maintains strict relational integrity.

### 2. Handling USD/INR Discrepancies (Priya's Request)
* **Decision:** Add a `currency` field to the `Expense` model but calculate all final balances uniformly using a fixed backend exchange rate.
* **Options Considered:** 1. Maintain entirely separate ledgers for USD and INR.
  2. Convert USD to INR at the exact time of CSV ingestion and discard the original USD data.
  3. Keep the original currency in the ledger, and apply an exchange rate dynamically during the Net Balance calculation.
* **Why:** Option 3 satisfies both Priya (accurate USD tracking) and Aisha (one unified final number). The original data remains untouched for auditing, but the UI presents a clean, consolidated debt graph.

### 3. Calculating Group Balances (Rohan & Aisha's Requests)
* **Decision:** Implement an O(N) Netting Algorithm that tracks bidirectional trace logs.
* **Options Considered:** 1. Complex graph-based debt simplification (minimizing transaction count).
  2. Strict 1-to-1 tracking with no cross-debt netting.
  3. Aggregated netting that outputs a final number and an itemized audit trail array.
* **Why:** Graph simplification obfuscates *why* someone owes money. By using an itemized trace dictionary (Option 3), Aisha gets her "one number" summary, and Rohan gets a granular, clickable UI breakdown showing exactly which pizza or electricity bill contributed to that number ("No magic numbers").

### 4. Handling Roommate Changes (Sam and Meera)
* **Decision:** Add temporal tracking (`joined_date`, `left_date`) to the `GroupMember` model.
* **Options Considered:** 1. Create entirely separate groups (e.g., "Flat v1" and "Flat v2").
  2. Just delete Meera's account and add Sam's.
  3. Temporal membership windows.
* **Why:** Deleting users breaks relational integrity for past expenses. Creating new groups clutters the UI. Temporal tracking allows the ingestion engine to validate timestamps dynamically, automatically flagging if Meera is billed for an April expense.
### 5. Scope Management: Omitting the Signup Module
* **Decision:** Built a Login module, but intentionally omitted a public Registration/Signup module.
* **Why:** The product requirement specifically requested a "Login module." From a PM perspective, this app serves a closed, known group of 6 specific individuals (Aisha, Rohan, Priya, Meera, Dev, Sam). Building public registration, password-reset flows, and email verification in a 2-day sprint introduces scope creep for a feature that doesn't align with the "private household" nature of the MVP. Users are assumed to be provisioned by the database admin for this iteration.