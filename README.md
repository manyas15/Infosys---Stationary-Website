# Stationary Website

Simple stationary store demo with a Node.js/Express backend and static frontend (HTML/CSS/JS).

## Overview

This repository contains a small full‑stack demo:
- `backend/` — Express API that serves item data, auth, transactions, restock suggestions, PO download, exports, and forecasts proxy.
- `frontend/` — Static HTML/CSS/JS pages (login, product dashboard, admin dashboard, restock/PO, forecasts, exports).

The backend serves the frontend statically so you can develop and run everything from one origin.

### Key features
- Role-based login (admin/warehouse vs user) with JWT.
- Product management dashboard (`home.html`) with Add/Update/Delete/Stock In-Out links.
- Admin dashboard (`admin.html`) with KPIs, recent transactions, and download CSV/XLSX buttons.
- Auto-Restock suggestions and Purchase Orders (`restock.html`) with CSV PO download.
- Demand Forecast view (`forecast.html`) with fallback forecasts if the external service is down.
- Transaction exports to CSV/XLSX.

## Tech stack

- Node.js (>= 16 recommended)
- Express
- JSON files used as a lightweight data store
- Frontend: plain HTML, CSS, and vanilla JavaScript + Chart.js for charts
- (Optional) Forecast microservice (HTTP POST /predict at 127.0.0.1:5000) — fallback forecast is built-in if unavailable

## Quick start (Windows / cmd.exe)

1. Clone the repo (if you haven't already)
```cmd
git clone https://github.com/manyas15/Infosys---Stationary-Website.git
cd "Infosys---Stationary website"
```

2. Install backend dependencies and start the server
```cmd
cd backend
npm install
npm start
```
By default the server listens on port `4000`. Open http://localhost:4000 in your browser to view the frontend served by the backend.

3. Open the frontend directly (alternative)
- You can open `frontend/index.html` directly in a browser, but most pages expect the API at `http://localhost:4000`. For full functionality serve the frontend via the backend (recommended).

4. (Optional) Start the forecast service
- The backend calls `http://127.0.0.1:5000/predict`. If you don’t run a forecast service, the backend uses a built-in fallback forecast.

5. Login and navigate
- Login at `http://localhost:4000/index.html`.
- Admin/warehouse roles land on `admin.html` (includes downloads); users land on `user.html`. You can always open `home.html` for the product dashboard and `restock.html` for restock/PO.

4. Using Stock In/Out
- Login, open `home.html`, and click "Stock In / Out" to record transactions and view history.

## Environment variables

The server reads optional environment variables:
- `PORT` — port to listen on (default: `4000`)
- `JWT_SECRET` — secret used to sign JWTs (recommended to set for production)

Example (Windows cmd):
```cmd
set JWT_SECRET=your-secret
set PORT=4000
npm start
```

## API (contract)

Base URL: `http://localhost:4000/api`

Auth
- POST /api/auth/signup
  - body: { "name": "...", "email": "...", "password": "...", "role": "admin|user" }
  - response: { token, user }
- POST /api/auth/login
  - body: { "email": "...", "password": "..." }
  - response: { token, user } on success
- GET /api/auth/me
  - header: Authorization: Bearer <token>
  - response: current user

Items
- GET /api/items
  - returns list of items
- GET /api/items/:id
  - returns one item by id
- POST /api/items
  - protected (requires Authorization header)
  - body: item object
- PUT /api/items/:id
  - protected, update item
- DELETE /api/items/:id
  - protected, delete item

Stock Transactions
- GET /api/transactions?limit=100
  - protected
  - returns most recent transactions first
- POST /api/transactions/stock-in
  - protected
  - body: { "itemId": "<uuid>", "quantity": <positive number>, "notes": "optional" }
  - effect: increases item quantity; records transaction with timestamp and handler
- POST /api/transactions/stock-out
  - protected
  - body: { "itemId": "<uuid>", "quantity": <positive number>, "notes": "optional" }
  - effect: decreases item quantity (not below zero); records transaction

Example curl (Windows cmd):
```cmd
curl -X GET http://localhost:4000/api/items
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice@example.com\",\"password\":\"pass\"}"

:: Set token variable for subsequent calls
for /f "delims=" %a in ('curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{\""email\"":\""alice@example.com\"",\""password\"":\""pass\""}" ^| jq -r ".token"') do @set TOKEN=%a

:: Stock-in 10 units
curl -X POST http://localhost:4000/api/transactions/stock-in -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"itemId\":\"<ITEM_ID>\",\"quantity\":10,\"notes\":\"supplier PO#123\"}"

:: Stock-out 2 units
curl -X POST http://localhost:4000/api/transactions/stock-out -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"itemId\":\"<ITEM_ID>\",\"quantity\":2,\"notes\":\"invoice 987\"}"

Restock & Purchase Orders
- GET /api/restock/suggestions
  - returns array of suggested items with suggestedQty (uses heuristic and fallback forecast)
- POST /api/restock/po
  - body: { supplier, lines: [{ id, name, qty, unitPrice? }] }
  - response: { po }
- GET /api/restock/po/:id/download
  - downloads PO as CSV

Forecast
- GET /api/forecast?horizon=7
  - calls external predictor at 127.0.0.1:5000/predict; falls back to local trend-based forecast

Exports
- GET /api/exports/transactions (auth) — CSV download
- GET /api/exports/transactions/xlsx (auth) — Excel-friendly CSV with XLSX filename
```

## Final Features & Updates (2025)

- **Role-based authentication**: Signup/login supports admin and user roles. Admins see full dashboard, users see request page.
- **Product dashboard**: Add, update, delete, and stock in/out for items. Accessible via `home.html`.
- **Admin dashboard**: KPIs, recent transactions, and download buttons for CSV/XLSX. Charts now render correctly (Top Restock Value, Inventory Breakdown).
- **Auto-Restock & PO**: Restock suggestions use demand forecast and reorder levels. Create PO for selected items, download PO as CSV.
- **Forecasts**: Uses external service if available, otherwise built-in fallback (trend-based). Source indicator shown in UI.
- **Exports**: Download transactions as CSV or real Excel (.xlsx) file. Excel export now opens in Microsoft Excel with correct formatting.
- **Diagnostics**: Restock page shows diagnostics table if no suggestions (qty, forecast, reorder level).
- **Data**: All data stored in JSON files (`backend/data/`). Sample items and transactions included for demo/testing.
- **Error handling**: All major actions show visible error messages in UI and console. Charts and downloads now robust against empty data and format issues.
- **Frontend**: All charts (pie, bar) now render correctly with responsive sizing. UI improved for clarity and usability.

### How to use
- Start backend (`npm start` in `backend/`)
- Open `http://localhost:4000` in browser
- Signup as admin or user, login, and use dashboard features
- For exports, ensure you are logged in as admin
- For forecast, external service is optional
- For restock/PO, lower item quantity or reorder level to see suggestions
- For Excel export, use the XLSX button in admin dashboard

---

## Project structure

- backend/
  - package.json
  - src/
    - server.js         (Express server)
    - routes/           (auth, items, transactions)
    - services/         (file-backed data helpers)
    - middleware/       (auth middleware)
  - data/               (items.json, users.json, transactions.json)
- frontend/
  - index.html, home.html, add.html, update.html, delete.html, transactions.html
  - js/                 (api client, auth)
  - styles.css

## Development notes & edge cases

- Data is stored in JSON files under `backend/data/` — concurrent writes are not safe for production.
- Missing/invalid JWT -> 401 on protected endpoints (items CRUD, transactions, exports).
- Forecast service is optional: if offline, backend uses fallback and marks source as `fallback`.
- Restock suggestions are heuristic; if none appear, check quantities vs reorderLevel and forecast sums (UI shows diagnostics when empty).
- Exports require an auth token; 401 means login again.
- Consider replacing JSON-backed storage with a real DB (SQLite/Postgres) for production.

## Troubleshooting

- "Cannot fetch frontend resources / CORS" — run the backend (which serves the frontend) so the browser uses the same origin: `http://localhost:4000`.
- Login/exports return 401 — ensure you are logged in and `localStorage.auth.token` exists; then retry.
- No restock suggestions — open `restock.html` and view the diagnostics table (auto-shown when empty) to see qty vs forecast/reorder. Lower your reorderLevel or stock out an item to see suggestions.
- Forecast flat line — ensure forecast service at 127.0.0.1:5000 is running; otherwise fallback is used.
- Node experimental ESM warning for uuid — upgrade Node to latest LTS to suppress; harmless for dev.

## Tests / verification

This project does not include automated tests. Quick manual checks:
- Start backend and visit http://localhost:4000 — the `index.html` should load.
- Open DevTools → Network to confirm API requests hit `/api/...` and return 200/JSON.

## Contributing

- Create a topic branch and submit a PR.
- For destructive changes to git history (e.g., removing files from all commits) coordinate with maintainers — history rewrite requires force-push and affects collaborators.

## License & credits

Add your preferred license here (e.g., MIT) and any credits.
