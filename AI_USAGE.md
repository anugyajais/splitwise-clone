# AI Usage & Course Correction Log

**AI Assistant:** Google Gemini
**Role:** Pair-programming collaborator and boilerplate generator.

As the Lead Engineer, I maintained full architectural control. The AI was used to accelerate syntax generation (e.g., regex for CSV cleaning, CSS modules, Django boilerplate), but required active course correction to meet the strict rubric parameters.

### 🐛 3 Concrete AI Failures & Human Corrections

**1. The "Silent Fail" Import Suggestion**
* **What the AI got wrong:** When prompted to build the CSV ingestion, the AI initially suggested a standard `try/except` block that would skip rows with missing data or math errors and only save the valid ones.
* **How I caught it:** I referenced the rubric ("A crashed import and a silent guess are both failing answers").
* **What I changed:** I rejected the code and directed the AI to build the `StagedExpense` quarantine architecture instead, ensuring bad rows are surfaced to the user.

**2. The Hardcoded Deployment Trap**
* **What the AI got wrong:** During the React frontend build, the AI hardcoded `fetch('http://127.0.0.1:8000/api/...')` directly into the components.
* **How I caught it:** Upon deployment to Vercel, the app threw a `Failed to fetch` error because it was looking for a local server on the live internet.
* **What I changed:** I built an `api.js` utility wrapper that uses a ternary operator to switch between local host and the live Render production URL based on the environment.

**3. Security Risk in settings.py**
* **What the AI got wrong:** The AI generated a default Django `settings.py` file with the `SECRET_KEY` hardcoded as a raw string and `DEBUG=True`.
* **How I caught it:** Pushing this to a public GitHub repository is a massive security vulnerability.
* **What I changed:** I manually re-wrote the settings to use `os.environ.get('SECRET_KEY')` and injected the key securely via Render's environment variable dashboard, while also configuring dynamic `ALLOWED_HOSTS`.