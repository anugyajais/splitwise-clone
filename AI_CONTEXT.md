# AI_CONTEXT: Shared Expenses App (Spreetail Assignment)

## 1. Product Understanding & Goals
A shared expenses application built for four flatmates (plus a guest) to reconcile a messy, real-world spreadsheet. The core product value is not just tracking future expenses, but acting as a data-cleaning and reconciliation engine to parse, validate, and import historical, error-prone data (`expenses_export.csv`) without silent failures or crashes.

## 2. Product Scope & Features
*   **Auth:** Standard user login.
*   **Groups:** Create/manage groups with temporal membership (tracking when users join/leave to validate historical splits).
*   **Expenses:** Support for Equal, Unequal, Percentage, and Share splits across multiple currencies (INR, USD).
*   **Balances:** Group-wise and individual summaries with exact trace-backs (Rohan's request) and unified currency conversion (Priya's request).
*   **Settlements:** Record payments to clear debts.
*   **Data Import Engine:** The core feature. A staging pipeline that ingests `expenses_export.csv`, detects anomalies, surfaces them via an Import Wizard UI, and generates a final Import Report detailing actions taken.

## 3. Implementation Decisions (Architecture)
*   **The Staging Pattern:** Instead of directly inserting CSV rows into the main `Expense` ledger, data is first loaded into a `StagedExpense` table. This allows the system to flag errors and forces the user to resolve them in the UI before committing them to the permanent ledger.
*   **Exchange Rate Handling:** Hardcoded/configurable exchange rate applied at the balance-calculation layer to unify USD and INR into a single summary number (Aisha's request).
*   **Temporal Validation:** `GroupMember` records include `joined_date` and `left_date` to prevent users from being charged for expenses outside their residency (Sam and Meera's requests).

## 4. Tech Stack
*   **Frontend:** React (Vite) + CSS Modules + React Router.
*   **Backend:** Django + Django REST Framework (DRF).
*   **Database:** PostgreSQL (Strictly relational).
*   **Data Parsing:** Python's built-in `csv` and `python-dateutil` for robust date normalization.

## 5. Database Schema
*   **User:** `id`, `name`, `email`
*   **Group:** `id`, `name`
*   **GroupMember:** `id`, `group_id`, `user_id`, `joined_date`, `left_date` (Nullable)
*   **Expense:** `id`, `group_id`, `payer_id`, `amount`, `currency`, `description`, `split_type`, `date`
*   **ExpenseSplit:** `id`, `expense_id`, `user_id`, `owed_amount`
*   **Settlement:** `id`, `payer_id`, `payee_id`, `group_id`, `amount`, `date`
*   **StagedExpense (For CSV Import):** `id`, `raw_date`, `raw_desc`, `raw_payer`, `raw_amount`, `raw_currency`, `raw_split_type`, `raw_split_with`, `raw_split_details`, `status` (Pending/Resolved/Rejected), `anomaly_flags` (Text)

## 6. Required Deliverables Tracking
*   [ ] Deployed URL
*   [ ] GitHub Repo (Meaningful commits)
*   [ ] `README.md`
*   [ ] `SCOPE.md` (Anomaly log & Schema)
*   [ ] `DECISIONS.md` (Decision log)
*   [ ] Import Report Feature
*   [ ] `AI_USAGE.md`