# Spreetail Shared Expenses App

A full-stack, multi-currency shared expenses application designed to ingest, validate, and reconcile messy historical data. Built to satisfy the exact requirements of the 4 flatmates (Aisha, Rohan, Priya, Meera) and their guest (Dev).

## Architecture
* **Frontend:** React + Vite + CSS Modules (Strictly web-based, no heavy UI libraries).
* **Backend:** Django + Django REST Framework (DRF).
* **Database:** PostgreSQL (Relational schema enforcing temporal constraints).
* **Core Engine:** A `StagedExpense` ingestion pipeline that quarantines dirty CSV data for user resolution before committing to the permanent ledger.

## Local Setup Instructions

### 1. Database Setup
Ensure PostgreSQL is installed and running locally.
Create an empty database named `splitwise_db`.

### 2. Backend (Django)
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate

pip install -r requirements.txt # (django, djangorestframework, psycopg2, djangorestframework-simplejwt, python-dateutil, django-cors-headers)

# Run migrations to build the schema
python manage.py makemigrations
python manage.py migrate

# Create a superuser for login
python manage.py createsuperuser

# Start the server
python manage.py runserver