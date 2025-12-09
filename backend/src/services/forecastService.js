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

/**
 * Create a simple fallback forecast from history using a linear projection
 * plus moving-average smoothing. Returns an array of length `horizon`.
 */
function generateFallbackForecast(history, horizon = 7) {
  if (!Array.isArray(history) || history.length === 0) return Array(horizon).fill(0);
  const n = history.length;
  const first = history[0];
  const last = history[n - 1];
  // slope per step
  const slope = (last - first) / Math.max(1, n - 1);

  // moving average of last few points to anchor forecast
  const tail = history.slice(Math.max(0, n - 5));
  const anchor = Math.round(tail.reduce((a, b) => a + b, 0) / tail.length);

  const forecast = [];
  for (let t = 1; t <= horizon; t++) {
    // linear projection from last point plus some smoothing toward anchor
    const proj = Math.round(last + slope * t);
    // blend with anchor to avoid wild jumps
    const blended = Math.round((proj * 0.6) + (anchor * 0.4));
    forecast.push(Math.max(0, blended));
  }
  return forecast;
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
  generateFallbackForecast,
  readItems,
  simulateHistoryForItem
};
