import { Link, useNavigate } from "react-router";
import { LogOut, Store } from "lucide-react";
import { logoutAdmin } from "../services/adminSession";
import ProductManager from "../components/ProductManager";
import "./Admin.css";

function AdminDashboard() {
  const navigate = useNavigate();

  function handleLogout() {
    logoutAdmin();
    navigate("/");
  }

  return (
    <main className="admin-page">
      <section className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <span className="admin-login__eyebrow">Nexus Gaming</span>
            <h1>Panel administrador</h1>
            <p>Administrá los productos que se mostrarán en la tienda.</p>
          </div>

          <div className="admin-dashboard__actions">
            <Link to="/" className="admin-secondary-button">
              <Store size={18} />
              Ver tienda
            </Link>

            <button
              type="button"
              className="admin-secondary-button"
              onClick={handleLogout}
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </header>

        <ProductManager />
      </section>
    </main>
  );
}

export default AdminDashboard;
