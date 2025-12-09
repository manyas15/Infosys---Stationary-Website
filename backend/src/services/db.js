const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const itemsFile = path.join(dataDir, 'items.json');
const transactionsFile = path.join(dataDir, 'transactions.json');

function ensureFilesExist() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([] , null, 2));
  if (!fs.existsSync(itemsFile)) fs.writeFileSync(itemsFile, JSON.stringify([] , null, 2));
  if (!fs.existsSync(transactionsFile)) fs.writeFileSync(transactionsFile, JSON.stringify([] , null, 2));
}

ensureFilesExist();

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('readJson error for', filePath, err && err.message ? err.message : err);
    // return empty array as a safe fallback
    return [];
  }
}

function writeJson(filePath, data) {
  try {
    // ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('writeJson error for', filePath, err && err.stack ? err.stack : err);
    throw err;
  }
}

function getUsers() {
  return readJson(usersFile);
}

function saveUsers(users) {
  writeJson(usersFile, users);
}

function getItems() {
  return readJson(itemsFile);
}

function saveItems(items) {
  writeJson(itemsFile, items);
}

function getTransactions() {
  return readJson(transactionsFile);
}

function saveTransactions(transactions) {
  writeJson(transactionsFile, transactions);
}

module.exports = {
  getUsers,
  saveUsers,
  getItems,
  saveItems,
  getTransactions,
  saveTransactions,
};



