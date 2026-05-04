import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { StarRating } from "../components/StarRating";
import { getEstablishment } from "../data/mock";
import type { Establishment } from "../data/mock";
import "./EstablishmentProfile.css";

type Tab = "sobre" | "servicos" | "galeria" | "depoimentos";

function ServiceAccordion({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`est-accordion${open ? " est-accordion--open" : ""}`}>
      <button
        type="button"
        className="est-accordion__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        <span className="est-accordion__chev" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="est-accordion__body">{children}</div>}
    </div>
  );
}

function ServicosTab({ est }: { est: Establishment }) {
  const isClinic =
    est.type === "clinica" || est.type === "hospital" || est.type === "farmacia";

  if (isClinic) {
    return (
      <div className="est-tab-panel">
        <h2 className="est-tab-panel__title">Nossos Serviços</h2>
        {est.professionals && est.professionals.length > 0 && (
          <ServiceAccordion title="Veterinários / Profissionais">
            <ul>
              {est.professionals.map((p) => (
                <li key={p.name}>
                  <strong>{p.name}</strong> — {p.specialty}
                </li>
              ))}
            </ul>
          </ServiceAccordion>
        )}
        {est.exams && est.exams.length > 0 && (
          <ServiceAccordion title="Exames">
            <ul>
              {est.exams.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </ServiceAccordion>
        )}
        {est.vaccines && est.vaccines.length > 0 && (
          <ServiceAccordion title="Vacinas">
            <ul>
              {est.vaccines.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </ServiceAccordion>
        )}
        {est.medications && est.medications.length > 0 && (
          <ServiceAccordion title="Medicamentos">
            <ul>
              {est.medications.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </ServiceAccordion>
        )}
        {est.plans && est.plans.length > 0 && (
          <ServiceAccordion title="Planos aceitos">
            <ul>
              {est.plans.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </ServiceAccordion>
        )}
      </div>
    );
  }

  return (
    <div className="est-tab-panel">
      <h2 className="est-tab-panel__title">Nossos Serviços</h2>
      {est.shopServices && est.shopServices.length > 0 && (
        <ServiceAccordion title="Serviços prestados">
          <ul>
            {est.shopServices.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </ServiceAccordion>
      )}
      {est.samplePrices && est.samplePrices.length > 0 && (
        <ServiceAccordion title="Preços (amostra)">
          <ul>
            {est.samplePrices.map((x) => (
              <li key={x.item}>
                {x.item}: <strong>{x.price}</strong>
              </li>
            ))}
          </ul>
        </ServiceAccordion>
      )}
    </div>
  );
}

export function EstablishmentProfile() {
  const { id } = useParams<{ id: string }>();
  const est = id ? getEstablishment(id) : undefined;
  const [tab, setTab] = useState<Tab>("sobre");

  if (!est) {
    return (
      <main className="page est-page">
        <p>Estabelecimento não encontrado.</p>
        <Link to="/paradas-pets">Ver mapa</Link>
      </main>
    );
  }

  const typeLabel =
    est.type === "clinica"
      ? "Clínica veterinária"
      : est.type === "hospital"
        ? "Hospital veterinário"
        : est.type === "farmacia"
          ? "Farmácia pet"
          : est.type === "banho_tosa"
            ? "Banho e tosa"
            : "Loja / pet shop";

  const subTitle =
    est.type === "clinica" || est.type === "hospital"
      ? est.publicPrivate === "publico"
        ? "Público"
        : "Privado"
      : null;

  return (
    <main className="page est-page">
      <div
        className="est-banner"
        style={{ backgroundImage: `url(${est.bannerImage})` }}
      >
        <div className="est-banner__overlay" />
        <div className="est-banner__content">
          <img src={est.logoImage} alt="" className="est-banner__logo" />
          <div className="est-banner__text">
            <p className="est-banner__type">{typeLabel}</p>
            <h1 className="est-banner__name">{est.name}</h1>
            {subTitle && (
              <div className="est-banner__row">
                <p className="est-banner__sub">{subTitle}</p>
                <StarRating value={est.rating} />
              </div>
            )}
            {!subTitle && (
              <div className="est-banner__row est-banner__row--solo">
                <StarRating value={est.rating} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="est-tabs">
        {(
          [
            ["sobre", "Sobre"],
            ["servicos", "Serviços"],
            ["galeria", "Galeria"],
            ["depoimentos", "Depoimentos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`est-tabs__btn${tab === key ? " est-tabs__btn--active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="est-tab-content">
        {tab === "sobre" && (
          <section className="est-tab-panel">
            <h2 className="est-tab-panel__title est-tab-panel__title--lg">
              Sobre nós
            </h2>
            <p className="est-about">{est.about}</p>
          </section>
        )}

        {tab === "servicos" && <ServicosTab est={est} />}

        {tab === "galeria" && (
          <section className="est-tab-panel">
            <h2 className="est-tab-panel__title">Galeria</h2>
            {est.galleryImages.length > 0 ? (
              <div className="est-gallery">
                {est.galleryImages.map((src) => (
                  <img key={src} src={src} alt="" className="est-gallery__img" />
                ))}
              </div>
            ) : (
              <p className="est-empty">Nenhuma imagem na galeria ainda.</p>
            )}
          </section>
        )}

        {tab === "depoimentos" && (
          <section className="est-tab-panel">
            <h2 className="est-tab-panel__title">Depoimentos</h2>
            {est.testimonials.length > 0 ? (
              <ul className="est-testimonials">
                {est.testimonials.map((t) => (
                  <li key={`${t.author}-${t.date}`} className="est-testimonial">
                    <div className="est-testimonial__head">
                      <strong>{t.author}</strong>
                      <StarRating value={t.rating} size="sm" />
                      <span className="est-testimonial__date">{t.date}</span>
                    </div>
                    <p>{t.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="est-empty">Ainda não há depoimentos.</p>
            )}
          </section>
        )}
      </div>

      <Link to="/paradas-pets" className="est-back">
        ← Voltar ao mapa
      </Link>
    </main>
  );
}
