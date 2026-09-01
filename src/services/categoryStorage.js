import { apiRequest } from "./api";

export async function getCategories() {
  const categories = await apiRequest("/categories");

  return categories.map((category) => category.name);
}

export async function createCategory(name) {
  const cleanName = name.trim();

  if (!cleanName) {
    return {
      success: false,
      message: "Escribí un nombre para la categoría.",
    };
  }

  try {
    const category = await apiRequest("/categories", {
      method: "POST",
      body: { name: cleanName },
      requireAdmin: true,
    });

    return {
      success: true,
      category: category.name,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}