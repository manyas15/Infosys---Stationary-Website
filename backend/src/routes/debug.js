const express = require('express');
const router = express.Router();
const db = require('../services/db');

// GET /api/debug/files
// Returns basic info about data files and attempts a safe write-test to verify permissions.
router.get('/files', (req, res) => {
  try {
    const result = { ok: true, checks: {} };
    try {
      const users = db.getUsers();
      result.checks.users = { present: true, count: Array.isArray(users) ? users.length : null };
      // attempt to write the same data back to verify write permissions
      db.saveUsers(users);
      result.checks.users.write = 'ok';
    } catch (err) {
      result.checks.users = { present: false, error: err.message };
      result.ok = false;
    }

    try {
      const items = db.getItems();
      result.checks.items = { present: true, count: Array.isArray(items) ? items.length : null };
      db.saveItems(items);
      result.checks.items.write = 'ok';
    } catch (err) {
      result.checks.items = { present: false, error: err.message };
      result.ok = false;
    }

    try {
      const tx = db.getTransactions();
      result.checks.transactions = { present: true, count: Array.isArray(tx) ? tx.length : null };
      db.saveTransactions(tx);
      result.checks.transactions.write = 'ok';
    } catch (err) {
      result.checks.transactions = { present: false, error: err.message };
      result.ok = false;
    }

    res.json(result);
  } catch (err) {
    console.error('Debug files error', err);
    res.status(500).json({ error: 'Debug failed', detail: err.message });
  }
});

module.exports = router;
