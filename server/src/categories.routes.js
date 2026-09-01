const express = require("express");
const db = require("./database");
const { requireAdmin } = require("./auth.middleware");

const router = express.Router();

/* Categorías disponibles para el catálogo y el panel */

router.get("/", (req, res) => {
  const categories = db
    .prepare(`
      SELECT id, name, createdAt
      FROM categories
      ORDER BY name COLLATE NOCASE ASC
    `)
    .all();

  res.json(categories);
});

/* Crear categoría desde el panel administrador */

router.post("/", requireAdmin, (req, res) => {
  const name = req.body.name?.trim();

  if (!name) {
    return res.status(400).json({
      message: "El nombre de la categoría es obligatorio.",
    });
  }

  const existingCategory = db
    .prepare(`
      SELECT id, name
      FROM categories
      WHERE name = ?
    `)
    .get(name);

  if (existingCategory) {
    return res.status(409).json({
      message: "Esa categoría ya existe.",
    });
  }

  const result = db
    .prepare(`
      INSERT INTO categories (name)
      VALUES (?)
    `)
    .run(name);

  const newCategory = db
    .prepare(`
      SELECT id, name, createdAt
      FROM categories
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);

  res.status(201).json(newCategory);
});

module.exports = router;