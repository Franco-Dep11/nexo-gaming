import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router";

const links = [
  { id: 1, label: "Productos", href: "/productos", internal: true },
  { id: 2, label: "Notebooks", href: "#notebooks" },
  { id: 3, label: "Armá tu PC", href: "/armar-pc", internal: true },
  { id: 4, label: "Ofertas", href: "#ofertas" },
  { id: 5, label: "Ayuda", href: "#ayuda" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div className="navbar__container">
        <button
          className="navbar__toggle"
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
          <span>Menú</span>
        </button>

        <ul className={`navbar__links ${menuOpen ? "is-open" : ""}`}>
          {links.map((link) => (
            <li key={link.id}>
              {link.internal ? (
                <Link to={link.href} onClick={closeMenu}>
                  {link.label}
                </Link>
              ) : (
                <a href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
