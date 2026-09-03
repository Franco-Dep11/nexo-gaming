import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Search, ShoppingCart, UserRound } from "lucide-react";
import { isAdminAuthenticated } from "../services/adminSession";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const adminLoggedIn = isAdminAuthenticated();

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(location.search).get("q") || "";
    setSearchTerm(query);
  }, [location.search]);

  function handleSubmit(event) {
    event.preventDefault();

    const cleanSearch = searchTerm.trim();

    if (!cleanSearch) {
      return;
    }

    navigate(`/buscar?q=${encodeURIComponent(cleanSearch)}`);
  }

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="brand" aria-label="Ir al inicio">
          <div className="brand__symbol">N</div>

          <div className="brand__text">
            <span>Nexus</span>
            <strong>Gaming</strong>
          </div>
        </Link>

        <form className="search" onSubmit={handleSubmit}>
          <input
            type="search"
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <button type="submit" aria-label="Buscar">
            <Search size={21} />
          </button>
        </form>

        <div className="header__actions">
          <Link
            to={adminLoggedIn ? "/admin" : "/admin/login"}
            className={`header__action ${
              adminLoggedIn ? "header__action--admin" : ""
            }`}
          >
            <UserRound size={21} />
            <span>{adminLoggedIn ? "Panel admin" : "Ingresá"}</span>
          </Link>

          <button
            className="cart-button"
            type="button"
            aria-label="Abrir carrito"
          >
            <ShoppingCart size={23} />
            <span className="cart-button__counter">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
