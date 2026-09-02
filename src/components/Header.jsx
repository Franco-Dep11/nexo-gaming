import { Link } from "react-router";
import { Search, UserRound, ShoppingCart } from "lucide-react";
import { isAdminAuthenticated } from "../services/adminSession";

function Header({ searchTerm, onSearchChange }) {
  const adminLoggedIn = isAdminAuthenticated();

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="brand" aria-label="Ir al inicio">
          <div className="brand__symbol">N</div>

          <div className="brand__text">
            <span>NEXO</span>
            <strong>GAMING</strong>
          </div>
        </Link>

        <form className="search" onSubmit={(event) => event.preventDefault()}>
          <input
            type="search"
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
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