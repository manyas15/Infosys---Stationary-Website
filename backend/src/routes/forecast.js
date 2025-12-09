const express = require('express');
const router = express.Router();
const { readItems, simulateHistoryForItem, callPythonPredict, generateFallbackForecast } = require('../services/forecastService');

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
        let source = 'unknown';
        try {
          const resp = await callPythonPredict(history, horizon);
          forecast = resp.forecast || [];
          source = resp.source || 'model';
        } catch (err) {
          // fallback: generate a varying forecast using history trend
          forecast = generateFallbackForecast(history, horizon);
          source = 'fallback';
      }

      const forecastSum = forecast.reduce((a,b)=>a+b, 0);
      const action = forecastSum > (item.quantity||0) ? 'Reorder' : 'Ok';

        results.push({
          id: item.id,
          name: item.name,
          currentStock: item.quantity || 0,
          forecast,
          forecastSum,
          action,
          source
        });
    }
    res.json({ results, horizon });
  } catch (err) {
    console.error('Forecast error', err);
    res.status(500).json({ error: err.message || 'Forecast failed' });
  }
});

module.exports = router;
