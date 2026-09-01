import { getAdminToken } from "./adminSession";

const API_URL = "http://localhost:3000/api";

export async function apiRequest(
  path,
  { method = "GET", body, requireAdmin = false } = {}
) {
  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (requireAdmin) {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Tu sesión de administrador no es válida.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errors = Array.isArray(data.errors)
      ? data.errors.join(" ")
      : data.message;

    throw new Error(errors || "Ocurrió un error en el servidor.");
  }

  return data;
}