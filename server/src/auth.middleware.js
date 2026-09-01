const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No se recibió el token de administrador.",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).json({
        message: "No tenés permisos de administrador.",
      });
    }

    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({
      message: "Tu sesión venció o el token no es válido.",
    });
  }
}

module.exports = { requireAdmin };