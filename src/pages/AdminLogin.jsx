import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { loginAdmin } from "../services/adminSession";
import "./Admin.css";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const result = await loginAdmin(email, password);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/admin");
  }

  return (
    <main className="admin-page">
      <section className="admin-login">
        <Link to="/" className="admin-back">
          <ArrowLeft size={18} />
          Volver a la tienda
        </Link>

        <div className="admin-login__icon">
          <LockKeyhole size={28} />
        </div>

        <span className="admin-login__eyebrow">NEXO GAMING</span>
        <h1>Acceso administrador</h1>
        <p>Ingresá para administrar el catálogo de productos.</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico

            <div className="admin-input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="admin@nexogaming.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          <label>
            Contraseña

            <div className="admin-input">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Ingresá tu contraseña"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </label>

          {error && <p className="admin-form__error">{error}</p>}

          <button
            type="submit"
            className="admin-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ingresando..." : "Ingresar al panel"}
          </button>
        </form>

        <p className="admin-login__demo">
          Demo: <strong>admin@nexogaming.com</strong> /{" "}
          <strong>admin123</strong>
        </p>
      </section>
    </main>
  );
}

export default AdminLogin;