const express = require("express");
const db = require("./database");
const { requireAdmin } = require("./auth.middleware");

const router = express.Router();

router.get("/", (req, res) => {
  const categories = db
    .prepare(`
      SELECT name
      FROM (
        SELECT name FROM categories
        UNION
        SELECT category AS name
        FROM products
        WHERE TRIM(category) <> ''
      )
      ORDER BY name COLLATE NOCASE
    `)
    .all();

  res.json(categories);
});

router.post("/", requireAdmin, (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    return res.status(400).json({
      message: "El nombre de la categoría es obligatorio.",
    });
  }

  db.prepare(`
    INSERT OR IGNORE INTO categories (name)
    VALUES (?)
  `).run(name);

  res.status(201).json({ name });
});

module.exports = router;