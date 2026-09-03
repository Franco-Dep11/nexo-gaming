import { useEffect, useState } from "react";
import { ArrowUp, Camera, Users, Video } from "lucide-react";
import { Link } from "react-router";
import "./Footer.css";

const placeholderLinks = {
  attention: ["Ayuda", "Consultas por WhatsApp", "Términos y condiciones"],
  company: ["Sobre nosotros", "Preguntas frecuentes", "Servicio posventa"],
};

const socialNetworks = [
  { name: "Instagram", icon: Camera },
  { name: "Facebook", icon: Users },
  { name: "YouTube", icon: Video },
];

function PendingLinks({ links }) {
  return (
    <ul>
      {links.map((label) => (
        <li key={label}>
          <button type="button" disabled title="Próximamente">
            {label}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function updateBackToTopVisibility() {
      setShowBackToTop(window.scrollY > 360);
    }

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateBackToTopVisibility);
    };
  }, []);

  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__grid">
          <section className="site-footer__brand">
            <Link to="/" aria-label="Ir al inicio de Nexus Gaming">
              <span>Nexus</span> Gaming
            </Link>
            <p>
              Tecnología, componentes y equipos para llevar tu experiencia al
              próximo nivel.
            </p>
          </section>

          <nav className="site-footer__column" aria-label="Explorar">
            <h2>Explorar</h2>
            <ul>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/productos">Productos</Link></li>
              <li><Link to="/armar-pc">Armá tu PC</Link></li>
            </ul>
          </nav>

          <section className="site-footer__column">
            <h2>Atención</h2>
            <PendingLinks links={placeholderLinks.attention} />
          </section>

          <section className="site-footer__column">
            <h2>Nexus Gaming</h2>
            <PendingLinks links={placeholderLinks.company} />
          </section>

          <section className="site-footer__social">
            <h2>Seguinos</h2>
            <div>
              {socialNetworks.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  disabled
                  aria-label={`${name} de Nexus Gaming, próximamente`}
                  title="Próximamente"
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="site-footer__bottom">
          <p>© 2026 Nexus Gaming. Todos los derechos reservados.</p>
        </div>
      </div>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? "is-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Volver al inicio de la página"
        tabIndex={showBackToTop ? 0 : -1}
      >
        <ArrowUp size={23} />
      </button>
    </footer>
  );
}
