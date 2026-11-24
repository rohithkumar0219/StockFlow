# StockFlow MVP

A multi-tenant inventory management app built with **FastAPI** (Python + SQLite) and **React** (Vite + Tailwind CSS).

---

## Features

1. **Authentication & Organizations**
   - Sign up with email, password, and organization name.
   - JWT-based auth with bcrypt password hashing.
   - All data is scoped per organization.
   - Demo credentials pre-filled on the login screen for quick testing.

2. **Product & Inventory Management**
   - Full CRUD for products with unique SKU per organization.
   - Margin calculation when entering cost and selling price.
   - Search by SKU or name, filter by stock status.
   - Stock adjustment with presets (`+5`, `+10`, `+50`, `-1`, `-5`) and optional notes.
   - Prevents stock from going below zero.

3. **Dashboard**
   - Summary cards: total products, total units, inventory value, low stock count.
   - Low stock table with quick restock buttons.
   - Threshold logic: `quantity <= (product threshold or org default or 5)`.

4. **Settings**
   - Organization profile (name, currency).
   - Default low stock threshold applied org-wide.

---

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy + SQLite, PyJWT, bcrypt, Pydantic v2
- **Frontend**: React 19 (Vite), Tailwind CSS, Lucide Icons
- **Dev proxy**: Vite proxies `/api` requests to the backend on port 8000

---

## Quick Start

### 1. Start the Backend
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/health

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open: http://localhost:5173

### 3. Demo Credentials
Click **"Fill Demo"** on the login screen, or enter:
- **Email**: `alex@apexhardware.com`
- **Password**: `demo12345`
- **Organization**: Apex Hardware Inc. (pre-loaded with 8 sample products).

---

## Running Tests
```bash
python -m pytest backend/tests -v
```
Tests cover: health check, signup/login, multi-tenant isolation, product CRUD, stock adjustments, and settings.
