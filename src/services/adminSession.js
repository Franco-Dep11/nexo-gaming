const SESSION_KEY = "nexo_gaming_admin_session";
const API_URL = "http://localhost:3000/api";

export async function loginAdmin(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "No se pudo iniciar sesión.",
      };
    }

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        token: data.token,
        email: data.admin.email,
        role: data.admin.role,
        loggedAt: new Date().toISOString(),
      })
    );

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      message: "No se pudo conectar con el servidor.",
    };
  }
}

export function getAdminToken() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));

    return session?.token || null;
  } catch {
    return null;
  }
}

export function isAdminAuthenticated() {
  return getAdminToken() !== null;
}

export function logoutAdmin() {
  localStorage.removeItem(SESSION_KEY);
}