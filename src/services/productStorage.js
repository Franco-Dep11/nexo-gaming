import { apiRequest } from "./api";

function normalizeProduct(product) {
  return {
    ...product,
    active: Boolean(product.active),
  };
}

export async function getProducts() {
  const products = await apiRequest("/products/admin/all", {
    requireAdmin: true,
  });

  return products.map(normalizeProduct);
}

export async function createProduct(data) {
  const product = await apiRequest("/products", {
    method: "POST",
    body: data,
    requireAdmin: true,
  });

  return normalizeProduct(product);
}

export async function updateProduct(id, data) {
  const product = await apiRequest(`/products/${id}`, {
    method: "PUT",
    body: data,
    requireAdmin: true,
  });

  return normalizeProduct(product);
}

export async function deactivateProduct(id) {
  return apiRequest(`/products/${id}`, {
    method: "DELETE",
    requireAdmin: true,
  });
}