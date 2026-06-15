# Engineering & Product Decision Log

### 1. The "Quarantine" Architecture (Staged vs. Permanent Data)
* **Decision:** Built a two-tier database structure (`StagedExpense` and `Expense`).
* **Why:** The rubric explicitly states "a silent guess is a failing answer." Directly inserting CSV rows and skipping bad data is dangerous. By quarantining dirty rows in a `StagedExpense` table, the system safely ingests the entire file, processes the clean data, and surfaces the bad data to a React UI, forcing the user to make the final call.

### 2. Temporal Group Membership
* **Decision:** Added `joined_date` and `left_date` to the `GroupMember` model.
* **Why:** Sam moved in mid-April; Meera moved out in March. A standard Splitwise clone assumes infinite membership. This temporal design ensures the O(N) netting algorithm cross-references the expense date with the residency dates, throwing a validation error if a ghost member is billed.

### 3. Dual-View Dashboard (Aisha vs. Rohan)
* **Decision:** The UI serves two distinct data visualization components simultaneously.
* **Why:** Aisha requested "just one number" (Net Balance). Rohan requested "no magic numbers" (Audit Trail). I built the `balances/` API endpoint to return both a consolidated `user_summaries` array for Aisha's UI cards, and a `detailed_debts` array containing the full transaction trace for Rohan's accordion UI.

### 4. Scope Management: Omitting Public Registration
* **Decision:** Omitted a public Signup/Registration UI flow.
* **Why:** As a PM, prioritizing a 2-day sprint requires cutting scope creep. This app is for a closed household of 6 known individuals. Building password-reset flows and email verification is unnecessary for an MVP. Users are provisioned securely via backend admin commands.