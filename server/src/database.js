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

/*
  Galería de imágenes:
  cada producto puede tener una o varias imágenes,
  ordenadas mediante el campo position.
*/
db.exec(`
  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    productId INTEGER NOT NULL,
    imageUrl TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(productId, position),
    FOREIGN KEY (productId) REFERENCES products(id)
  );

  /*
    Migra automáticamente la imagen actual de cada producto.
    Tu RX 5600 XT conservará su foto como imagen principal.
  */
  INSERT OR IGNORE INTO product_images (productId, imageUrl, position)
  SELECT id, imageUrl, 0
  FROM products
  WHERE imageUrl IS NOT NULL
    AND TRIM(imageUrl) <> '';
`);

module.exports = db;