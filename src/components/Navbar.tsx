"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "./BrandLogo";
import "./Navbar.css";

const linkClass = (isActive: boolean) =>
  `navbar__link${isActive ? " navbar__link--active" : ""}`;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
        <Link href="/" className="navbar__logo">
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
          <Link href="/" className={linkClass(pathname === "/")}>
            Home
          </Link>
          <Link
            href="/paradas-pets"
            className={linkClass(pathname?.startsWith("/paradas-pets") ?? false)}
          >
            Paradas Pets
          </Link>
          <Link
            href="/emergencia"
            className={linkClass(pathname?.startsWith("/emergencia") ?? false)}
          >
            Atendimento Emergencial
          </Link>
          <Link
            href="/babas"
            className={linkClass(pathname?.startsWith("/babas") ?? false)}
          >
            Babás
          </Link>
        </nav>
        <Link href="/login" className="btn btn-orange navbar__cta">
          Entrar
        </Link>
      </div>
    </header>
  );
}
