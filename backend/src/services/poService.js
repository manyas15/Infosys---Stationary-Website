const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '../../data');
const poFile = path.join(dataDir, 'purchase_orders.json');

function ensurePoFile() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(poFile)) fs.writeFileSync(poFile, JSON.stringify([], null, 2));
}

function readPos() {
  ensurePoFile();
  const raw = fs.readFileSync(poFile, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writePos(pos) {
  ensurePoFile();
  fs.writeFileSync(poFile, JSON.stringify(pos, null, 2));
}

function createPo({ supplier, lines }) {
  const pos = readPos();
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const po = {
    id,
    supplier,
    createdAt,
    status: 'created',
    lines: lines.map(l => ({ id: l.id, name: l.name, qty: Number(l.qty || 0), unitPrice: l.unitPrice || null })),
  };
  pos.push(po);
  writePos(pos);
  return po;
}

function getPoById(id) {
  const pos = readPos();
  return pos.find(p => p.id === id);
}

module.exports = {
  createPo,
  getPoById,
};
