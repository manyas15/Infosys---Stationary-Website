const express = require('express');
const router = express.Router();
const { readItems, simulateHistoryForItem, callPythonPredict } = require('../services/forecastService');

// GET /api/forecast?horizon=7
router.get('/', async (req, res) => {
  try {
    const horizon = parseInt(req.query.horizon || '7', 10);
    const items = readItems();
    const results = [];
    for (const item of items) {
      const history = simulateHistoryForItem(item, 30);
      // Call python service
      let forecast = null;
      try {
        const resp = await callPythonPredict(history, horizon);
        forecast = resp.forecast || [];
      } catch (err) {
        // fallback: simple moving average
        const avg = Math.round(history.reduce((a,b)=>a+b,0)/history.length || 0);
        forecast = Array(horizon).fill(avg);
      }

      const forecastSum = forecast.reduce((a,b)=>a+b, 0);
      const action = forecastSum > (item.quantity||0) ? 'Reorder' : 'Ok';

      results.push({
        id: item.id,
        name: item.name,
        currentStock: item.quantity || 0,
        forecast,
        forecastSum,
        action
      });
    }
    res.json({ results, horizon });
  } catch (err) {
    console.error('Forecast error', err);
    res.status(500).json({ error: err.message || 'Forecast failed' });
  }
});

module.exports = router;
