# Stationary Website

Simple stationary store demo with a Node.js/Express backend and static frontend (HTML/CSS/JS).

## Overview

This repository contains a small full‑stack demo:
- `backend/` — Express API that serves item data and handles authentication.
- `frontend/` — Static HTML/CSS/JS pages (client uses the API).

The backend can also serve the frontend statically so you can develop and run everything from one origin.

## Tech stack

- Node.js (>= 16 recommended)
- Express
- JSON files used as a lightweight data store
- Frontend: plain HTML, CSS, and vanilla JavaScript

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
- The frontend is static — you can open `frontend/index.html` directly in a browser, but some pages expect the API to be at `http://localhost:4000`. For full functionality serve the frontend via the backend (recommended).

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
  - body: { "name": "...", "email": "...", "password": "..." }
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
```

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
- Possible edge cases:
  - Missing/invalid JWT -> 401 responses on protected endpoints.
  - Empty or malformed request body -> 400 validation errors.
  - Large requests or many concurrent writes -> data corruption risk when using file-based storage.
- Consider replacing JSON-backed storage with a real DB (SQLite/Postgres) for production.

## Troubleshooting

- "Cannot fetch frontend resources / CORS" — run the backend (which serves the frontend) so the browser uses the same origin: `http://localhost:4000`.
- If you get an error about JWT secret or invalid tokens, set `JWT_SECRET` before starting.
- If `node` complains about experimental module interop for some dependency, upgrading Node to a newer stable LTS (Node 18+) usually resolves it.

## Tests / verification

This project does not include automated tests. Quick manual checks:
- Start backend and visit http://localhost:4000 — the `index.html` should load.
- Open DevTools → Network to confirm API requests hit `/api/...` and return 200/JSON.

## Contributing

- Create a topic branch and submit a PR.
- For destructive changes to git history (e.g., removing files from all commits) coordinate with maintainers — history rewrite requires force-push and affects collaborators.

## License & credits

Add your preferred license here (e.g., MIT) and any credits.
