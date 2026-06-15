# Spreetail Shared Expenses App

## Overview

A full-stack shared expense management application built to support expense tracking, settlement management, flexible splitting strategies, and historical CSV imports with anomaly detection.

## Live Deployment

Frontend:
https://splitwise-clone-three-omega.vercel.app/

Backend:
https://splitwise-clone-8y2j.onrender.com/api

## Tech Stack

### Frontend
- React
- Vite
- CSS Modules

### Backend
- Django
- Django REST Framework
- Simple JWT

### Database
- PostgreSQL

### Deployment
- Vercel
- Render

## Features

- Expense creation and tracking
- Equal, unequal, percentage, and share-based splits
- Multi-currency support
- Settlement tracking
- JWT authentication
- CSV expense import
- Anomaly detection and review workflow
- Import reporting

## Project Structure

### Backend
- core/
- expenses/
- manage.py

### Frontend
- src/
- public/

## Assignment Deliverables

Additional documentation included in the repository:

- README.md
- SCOPE.md
- DECISIONS.md
- AI_USAGE.md

The import report is generated dynamically by the application during CSV ingestion and anomaly review.
