const express = require("express");
const db = require("./database");
const { requireAdmin } = require("./auth.middleware");

const router = express.Router();

function normalizeImageUrls(data) {
  const rawImages = Array.isArray(data.images)
    ? data.images
    : data.imageUrl
      ? [data.imageUrl]
      : [];

  const imageUrls = rawImages
    .filter((imageUrl) => typeof imageUrl === "string")
    .map((imageUrl) => imageUrl.trim())
    .filter(Boolean);

  return [...new Set(imageUrls)];
}

function validateProduct(data) {
  const errors = [];

  const name = data.name?.trim();
  const description = data.description?.trim();
  const category = data.category?.trim();
  const price = Number(data.price);
  const stock = Number(data.stock);
  const active = data.active !== false;
  const images = normalizeImageUrls(data);

  if (!name) errors.push("El nombre es obligatorio.");
  if (!description) errors.push("La descripción es obligatoria.");
  if (!category) errors.push("La categoría es obligatoria.");

  if (Number.isNaN(price) || price < 0) {
    errors.push("El precio debe ser un número mayor o igual a cero.");
  }

  if (!Number.isInteger(stock) || stock < 0) {
    errors.push("El stock debe ser un número entero mayor o igual a cero.");
  }

  return {
    errors,
    product: {
      name,
      description,
      category,
      price,
      stock,
      active: active ? 1 : 0,
      imageUrl: images[0] || null,
      images,
    },
  };
}

function getProductImages(productId) {
  return db
    .prepare(`
      SELECT id, imageUrl, position
      FROM product_images
      WHERE productId = ?
      ORDER BY position ASC
    `)
    .all(productId);
}

function attachImages(product) {
  const images = getProductImages(product.id);

  return {
    ...product,
    imageUrl: product.imageUrl || images[0]?.imageUrl || null,
    images,
  };
}

function saveProductImages(productId, imageUrls) {
  db.prepare(`
    DELETE FROM product_images
    WHERE productId = ?
  `).run(productId);

  const insertImage = db.prepare(`
    INSERT INTO product_images (productId, imageUrl, position)
    VALUES (?, ?, ?)
  `);

  imageUrls.forEach((imageUrl, position) => {
    insertImage.run(productId, imageUrl, position);
  });
}

/* Productos visibles en la tienda */

router.get("/", (req, res) => {
  const products = db
    .prepare(`
      SELECT *
      FROM products
      WHERE active = 1
      ORDER BY id DESC
    `)
    .all()
    .map(attachImages);

  res.json(products);
});

/* Panel administrador: activos y dados de baja */

router.get("/admin/all", requireAdmin, (req, res) => {
  const products = db
    .prepare(`
      SELECT *
      FROM products
      ORDER BY id DESC
    `)
    .all()
    .map(attachImages);

  res.json(products);
});

router.post("/", requireAdmin, (req, res) => {
  const { errors, product } = validateProduct(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const result = db
    .prepare(`
      INSERT INTO products (
        name,
        description,
        price,
        category,
        imageUrl,
        stock,
        active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      product.name,
      product.description,
      product.price,
      product.category,
      product.imageUrl,
      product.stock,
      product.active
    );

  saveProductImages(result.lastInsertRowid, product.images);

  const newProduct = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json(attachImages(newProduct));
});

router.put("/:id", requireAdmin, (req, res) => {
  const existingProduct = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  if (!existingProduct) {
    return res.status(404).json({
      message: "Producto no encontrado.",
    });
  }

  const { errors, product } = validateProduct(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  db.prepare(`
    UPDATE products
    SET
      name = ?,
      description = ?,
      price = ?,
      category = ?,
      imageUrl = ?,
      stock = ?,
      active = ?,
      updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    product.name,
    product.description,
    product.price,
    product.category,
    product.imageUrl,
    product.stock,
    product.active,
    req.params.id
  );

  saveProductImages(req.params.id, product.images);

  const updatedProduct = db
    .prepare("SELECT * FROM products WHERE id = ?")
    .get(req.params.id);

  res.json(attachImages(updatedProduct));
});

router.delete("/:id", requireAdmin, (req, res) => {
  const result = db
    .prepare(`
      UPDATE products
      SET active = 0, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    .run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({
      message: "Producto no encontrado.",
    });
  }

  res.json({
    message: "Producto dado de baja correctamente.",
  });
});

/* Producto individual público: debe ir al final */

router.get("/:id", (req, res) => {
  const product = db
    .prepare(`
      SELECT *
      FROM products
      WHERE id = ? AND active = 1
    `)
    .get(req.params.id);

  if (!product) {
    return res.status(404).json({
      message: "Producto no encontrado.",
    });
  }

  res.json(attachImages(product));
});

module.exports = router;