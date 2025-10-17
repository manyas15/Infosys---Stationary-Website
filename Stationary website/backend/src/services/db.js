const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../data');
const usersFile = path.join(dataDir, 'users.json');
const itemsFile = path.join(dataDir, 'items.json');

function ensureFilesExist() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([] , null, 2));
  if (!fs.existsSync(itemsFile)) fs.writeFileSync(itemsFile, JSON.stringify([] , null, 2));
}

ensureFilesExist();

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw || '[]');
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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

module.exports = {
  getUsers,
  saveUsers,
  getItems,
  saveItems,
};


