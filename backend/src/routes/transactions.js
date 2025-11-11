const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware } = require('../middleware/auth');
const { getItems, saveItems, getTransactions, saveTransactions } = require('../services/db');

const router = express.Router();

// List transactions (most recent first)
router.get('/', authMiddleware, (req, res) => {
  const { limit } = req.query;
  const n = limit ? Math.max(0, Math.min(500, Number(limit))) : null;
  const transactions = getTransactions()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ transactions: n ? transactions.slice(0, n) : transactions });
});

// Helper to find item
function findItemOr404(items, id, res) {
  const item = items.find(i => i.id === id);
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return null;
  }
  return item;
}

// Stock-In: increase quantity
router.post('/stock-in', authMiddleware, (req, res) => {
  const { itemId, quantity, notes } = req.body || {};
  const qty = Number(quantity);
  if (!itemId || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'itemId and positive quantity are required' });
  }
  const items = getItems();
  const item = findItemOr404(items, itemId, res);
  if (!item) return;

  item.quantity = Number(item.quantity || 0) + qty;
  item.updatedAt = new Date().toISOString();
  saveItems(items);

  const txns = getTransactions();
  const txn = {
    id: uuidv4(),
    type: 'stock-in',
    itemId,
    itemName: item.name,
    quantity: qty,
    notes: notes || '',
    handledBy: { id: req.user.id, name: req.user.name, email: req.user.email },
    createdAt: new Date().toISOString(),
  };
  txns.push(txn);
  saveTransactions(txns);

  res.status(201).json({ transaction: txn, item });
});

// Stock-Out: decrease quantity (cannot go below zero)
router.post('/stock-out', authMiddleware, (req, res) => {
  const { itemId, quantity, notes } = req.body || {};
  const qty = Number(quantity);
  if (!itemId || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ error: 'itemId and positive quantity are required' });
  }
  const items = getItems();
  const item = findItemOr404(items, itemId, res);
  if (!item) return;

  const current = Number(item.quantity || 0);
  if (qty > current) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  item.quantity = current - qty;
  item.updatedAt = new Date().toISOString();
  saveItems(items);

  const txns = getTransactions();
  const txn = {
    id: uuidv4(),
    type: 'stock-out',
    itemId,
    itemName: item.name,
    quantity: qty,
    notes: notes || '',
    handledBy: { id: req.user.id, name: req.user.name, email: req.user.email },
    createdAt: new Date().toISOString(),
  };
  txns.push(txn);
  saveTransactions(txns);

  res.status(201).json({ transaction: txn, item });
});

module.exports = router;



