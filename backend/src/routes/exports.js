const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getTransactions } = require('../services/db');

// GET /api/exports/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/transactions', authMiddleware, (req, res) => {
  try {
    const { from, to } = req.query;
    const txns = getTransactions();

    let filtered = txns;
    if (from) {
      const fromDate = new Date(from);
      filtered = filtered.filter(t => new Date(t.createdAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      // include the whole 'to' day
      toDate.setHours(23,59,59,999);
      filtered = filtered.filter(t => new Date(t.createdAt) <= toDate);
    }

    // build CSV
    const headers = ['id','createdAt','type','itemId','itemName','quantity','handledBy','notes'];
    const rows = filtered.map(t => {
      const handled = t.handledBy ? `${t.handledBy.name || ''} <${t.handledBy.email||''}>` : '';
      return [t.id, t.createdAt, t.type, t.itemId, t.itemName, t.quantity, handled, (t.notes||'')];
    });

    res.setHeader('Content-Type', 'text/csv');
    const filename = `transactions_${from||'all'}_${to||'all'}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // write header
    res.write(headers.join(',') + '\n');
    for (const row of rows) {
      // escape commas and quotes
      const line = row.map(v => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      }).join(',');
      res.write(line + '\n');
    }
    res.end();
  } catch (err) {
    console.error('Export error', err);
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

module.exports = router;

// Excel-compatible download (CSV but with Excel MIME/extension)
router.get('/transactions/xlsx', authMiddleware, (req, res) => {
  try {
    const { from, to } = req.query;
    const txns = getTransactions();

    let filtered = txns;
    if (from) {
      const fromDate = new Date(from);
      filtered = filtered.filter(t => new Date(t.createdAt) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23,59,59,999);
      filtered = filtered.filter(t => new Date(t.createdAt) <= toDate);
    }

    const headers = ['id','createdAt','type','itemId','itemName','quantity','handledBy','notes'];
    const rows = filtered.map(t => {
      const handled = t.handledBy ? `${t.handledBy.name || ''} <${t.handledBy.email||''}>` : '';
      return [t.id, t.createdAt, t.type, t.itemId, t.itemName, t.quantity, handled, (t.notes||'')];
    });

    // Respond with CSV but set headers so Excel will open it easily
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    const filename = `transactions_${from||'all'}_${to||'all'}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.write(headers.join(',') + '\n');
    for (const row of rows) {
      const line = row.map(v => {
        if (v == null) return '';
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      }).join(',');
      res.write(line + '\n');
    }
    res.end();
  } catch (err) {
    console.error('Export xlsx error', err);
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

