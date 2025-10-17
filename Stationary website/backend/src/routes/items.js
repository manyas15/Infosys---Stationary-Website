const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getItems, saveItems } = require('../services/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Public: list items
router.get('/', (req, res) => {
  const items = getItems();
  res.json({ items });
});

// Public: get by id
router.get('/:id', (req, res) => {
  const items = getItems();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json({ item });
});

// Protected: create
router.post('/', authMiddleware, (req, res) => {
  const { name, category, quantity, price } = req.body || {};
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required' });
  }
  const qty = Number(quantity ?? 0);
  const pr = Number(price ?? 0);
  const items = getItems();
  const item = {
    id: uuidv4(),
    name,
    category,
    quantity: Number.isFinite(qty) && qty >= 0 ? qty : 0,
    price: Number.isFinite(pr) && pr >= 0 ? pr : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  saveItems(items);
  res.status(201).json({ item });
});

// Protected: update
router.put('/:id', authMiddleware, (req, res) => {
  const { name, category, quantity, price } = req.body || {};
  const items = getItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const existing = items[idx];
  const qty = quantity !== undefined ? Number(quantity) : existing.quantity;
  const pr = price !== undefined ? Number(price) : existing.price;
  items[idx] = {
    ...existing,
    name: name ?? existing.name,
    category: category ?? existing.category,
    quantity: Number.isFinite(qty) && qty >= 0 ? qty : existing.quantity,
    price: Number.isFinite(pr) && pr >= 0 ? pr : existing.price,
    updatedAt: new Date().toISOString(),
  };
  saveItems(items);
  res.json({ item: items[idx] });
});

// Protected: delete
router.delete('/:id', authMiddleware, (req, res) => {
  const items = getItems();
  const idx = items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const [removed] = items.splice(idx, 1);
  saveItems(items);
  res.json({ item: removed });
});

module.exports = router;


