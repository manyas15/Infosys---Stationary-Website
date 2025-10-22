const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getUsers, saveUsers } = require('../services/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const users = getUsers();
  const existing = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = { id: uuidv4(), name, email, passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
  return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;



