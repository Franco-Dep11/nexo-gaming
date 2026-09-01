const path = require("path");
const Database = require("better-sqlite3");

const databasePath = path.join(__dirname, "..", "store.db");

const db = new Database(databasePath);

/*
  Para este MVP usamos DELETE en lugar de WAL.
  Así todos los cambios quedan directamente dentro de store.db,
  que será el archivo que viajará mediante GitHub.
*/
db.pragma("journal_mode = DELETE");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    imageUrl TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;