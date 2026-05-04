import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import "./Navbar.css";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `navbar__link${isActive ? " navbar__link--active" : ""}`;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <BrandLogo className="navbar__brand-img" />
        </Link>
        <button
          type="button"
          className={`navbar__toggle${menuOpen ? " navbar__toggle--open" : ""}`}
          aria-expanded={menuOpen}
          aria-controls="navbar-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="navbar__toggle-bar" aria-hidden />
          <span className="navbar__toggle-bar" aria-hidden />
          <span className="navbar__toggle-bar" aria-hidden />
          <span className="visually-hidden">
            {menuOpen ? "Fechar menu" : "Abrir menu"}
          </span>
        </button>
        <nav
          id="navbar-nav"
          className={`navbar__links${menuOpen ? " navbar__links--open" : ""}`}
          aria-label="Principal"
        >
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/paradas-pets" className={linkClass}>
            Paradas Pets
          </NavLink>
          <NavLink to="/emergencia" className={linkClass}>
            Atendimento Emergencial
          </NavLink>
          <NavLink to="/babas" className={linkClass}>
            Babás
          </NavLink>
        </nav>
        <Link to="/login" className="btn btn-orange navbar__cta">
          Entrar
        </Link>
      </div>
    </header>
  );
}
