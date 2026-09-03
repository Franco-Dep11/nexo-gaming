require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const productRoutes = require("./products.routes");
const categoryRoutes = require("./categories.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    message: "Backend de Nexus Gaming funcionando.",
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  const correctEmail = email === process.env.ADMIN_EMAIL;
  const correctPassword = password === process.env.ADMIN_PASSWORD;

  if (!correctEmail || !correctPassword) {
    return res.status(401).json({
      message: "Correo o contraseña incorrectos.",
    });
  }

  const token = jwt.sign(
    {
      email: process.env.ADMIN_EMAIL,
      role: "admin",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );

  res.json({
    token,
    admin: {
      email: process.env.ADMIN_EMAIL,
      role: "admin",
    },
  });
});

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

/*
  En modo presentación, Express sirve el React que Vite compila en /dist.
*/
const clientBuildPath = path.join(__dirname, "..", "..", "dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.use((req, res, next) => {
    const acceptsHtml = req.headers.accept?.includes("text/html");
    const isApiRequest = req.path.startsWith("/api");

    if (req.method !== "GET" || !acceptsHtml || isApiRequest) {
      return next();
    }

    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
