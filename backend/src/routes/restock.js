const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { simulateHistoryForItem } = require('../services/forecastService');
const poService = require('../services/poService');

// GET /api/restock/suggestions
// Returns an array of suggestions { id, name, quantity, reorderLevel, suggestedQty, vendor }
router.get('/suggestions', (req, res) => {
  try {
    const items = db.getItems();
    const leadTimeDays = 7; // default procurement lead time used in calculation
    const suggestions = items.map(item => {
      const qty = Number(item.quantity || 0);
      const reorderLevel = Number(item.reorderLevel || item.minThreshold || 10);

      // Estimate expected demand over lead time using simulated history
      const history = simulateHistoryForItem(item, 30);
      const avgDaily = Math.max(0, Math.round(history.reduce((a,b)=>a+b,0) / Math.max(1, history.length)));
      const expectedDemand = avgDaily * leadTimeDays;
      const safetyStock = Math.ceil(avgDaily * 2); // simple safety buffer

      // If current qty below either configured reorder level or expected demand + safety, suggest restock
      let suggestedQty = 0;
      if (qty < reorderLevel || qty < (expectedDemand + safetyStock)) {
        const target = Math.max(reorderLevel * 2, Math.ceil(expectedDemand + safetyStock));
        suggestedQty = Math.max(1, target - qty);
      }

      return {
        id: item.id || item.sku || item.name,
        name: item.name || item.sku || 'Unnamed',
        quantity: qty,
        reorderLevel,
        suggestedQty,
        vendor: item.vendor || null,
        expectedDemand,
        avgDaily
      };
    }).filter(s => s.suggestedQty > 0);

    res.json({ suggestions });
  } catch (err) {
    console.error('restock suggestions error', err);
    res.status(500).json({ error: 'Failed to compute suggestions' });
  }
});

// POST /api/restock/po
// Body: { supplier: 'Vendor Name', lines: [{ id, name, qty, unitPrice? }] }
router.post('/po', (req, res) => {
  try {
    const { supplier, lines } = req.body || {};
    if (!Array.isArray(lines) || lines.length === 0) return res.status(400).json({ error: 'No lines provided' });

    const po = poService.createPo({ supplier: supplier || 'Unknown Supplier', lines });
    res.json({ po });
  } catch (err) {
    console.error('create PO error', err);
    res.status(500).json({ error: 'Failed to create PO' });
  }
});

// GET /api/restock/po/:id/download  -> returns CSV
router.get('/po/:id/download', (req, res) => {
  try {
    const id = req.params.id;
    const po = poService.getPoById(id);
    if (!po) return res.status(404).json({ error: 'PO not found' });

    const filename = `po_${id}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv');

    // CSV header
    const lines = ['sku_or_id,name,quantity,unitPrice,total'];
    po.lines.forEach(l => {
      const unit = l.unitPrice || '';
      const total = (Number(l.unitPrice || 0) * Number(l.qty || 0)) || '';
      lines.push(`${l.id || ''},"${(l.name||'').replace(/\"/g,'')}",${l.qty || 0},${unit},${total}`);
    });

    res.send(lines.join('\n'));
  } catch (err) {
    console.error('download PO error', err);
    res.status(500).json({ error: 'Failed to download PO' });
  }
});

module.exports = router;
