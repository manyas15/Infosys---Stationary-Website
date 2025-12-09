const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getTransactions } = require('../services/db');
const XLSX = require('xlsx');

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

// Excel XLSX download using proper Excel format
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

    // Prepare data for Excel
    const data = filtered.map(t => ({
      'Transaction ID': t.id,
      'Date/Time': t.createdAt,
      'Type': t.type,
      'Item ID': t.itemId,
      'Item Name': t.itemName,
      'Quantity': t.quantity,
      'Handled By': t.handledBy ? `${t.handledBy.name || ''} <${t.handledBy.email||''}>` : '',
      'Notes': t.notes || ''
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Send proper Excel file
    const filename = `transactions_${from||'all'}_${to||'all'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);
    res.send(excelBuffer);
  } catch (err) {
    console.error('Export xlsx error', err);
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

module.exports = router;