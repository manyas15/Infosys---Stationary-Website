const fs = require('fs');
const path = require('path');

async function callPythonPredict(history, horizon = 7) {
  const url = `http://127.0.0.1:5000/predict`;
  const body = { history, horizon };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Python service error');
  }
  return res.json();
}

function readItems() {
  const file = path.join(__dirname, '../../data/items.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw || '[]');
}

function simulateHistoryForItem(item, days = 30) {
  // create a synthetic sales history based on current quantity and simple randomness
  const base = Math.max(1, Math.round((item.quantity || 0) * 0.05));
  const history = [];
  for (let i = 0; i < days; i++) {
    // add small random variation and occasional trend
    const variation = Math.round(Math.random() * Math.max(1, base));
    const val = Math.max(0, base + variation - Math.round(i * 0.01 * base));
    history.push(val);
  }
  return history;
}

module.exports = {
  callPythonPredict,
  readItems,
  simulateHistoryForItem
};
