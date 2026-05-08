import Link from "next/link";
import "./home.css";

const heroPhoto = "/hero-banner.png";
const imgClinica = "/cardclinicas.png";
const imgEmergencia = "/cardemergencial.png";
const imgBaba = "/cardbaba.png";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero__banner">

          <div className="hero__panel-col">
            <div className="hero__panel">
              <div className="hero__panel-bg"/>
              <div className="hero__panel-scrim" aria-hidden />
              <div className="hero__panel-inner">
                <h1 className="hero__title">
                  <span className="hero__welcome">Bem-vindo ao</span>
                  <span className="hero__brand-word">Pet Stop</span>
                </h1>
                <p className="hero__subtitle">
                  Encontre tudo para o seu pet em um só lugar!
                </p>
                <div className="hero__actions">
                  <Link href="/login" className="btn btn-orange hero__cta">
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    className="btn btn-green hero__cta"
                  >
                    Cadastrar
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="hero__photo-col">

            <img src={heroPhoto} alt="Cão e gato sentados juntos em ambiente acolhedor" className="hero__photo"/>

          </div>
        </div>
      </section>

      <section className="services-intro">
        <h2 className="services-intro__title">Nossos Serviços</h2>
        <p className="services-intro__text">
          Tudo o que você precisa para cuidar do seu melhor amigo
        </p>
      </section>

      <section className="service-cards">
        <article className="service-card">
          <div className="service-card__image-wrap">
            <img
              src={imgClinica}
              alt="Clínicas e pet shops"
              className="service-card__image"
            />
          </div>
          <div className="service-card__body">
            <h3 className="service-card__title">Clínicas e pet shops próximas</h3>
            <p className="service-card__desc">
              Ache clínicas veterinárias e pet shops mais próximas
            </p>
            <Link href="/paradas-pets" className="btn btn-green service-card__btn">
              Entrar
            </Link>
          </div>
        </article>

        <article className="service-card">
          <div className="service-card__image-wrap">
            <img
              src={imgEmergencia}
              alt="Atendimento emergencial veterinário"
              className="service-card__image"
            />
          </div>
          <div className="service-card__body">
            <h3 className="service-card__title">Atendimento emergencial</h3>
            <p className="service-card__desc service-card__desc--long">
              Ao abrir a tela, veja um mapa com sua localização e a clínica ou
              hospital veterinário mais próximo, com a rota mais rápida até o
              local.
            </p>
            <Link href="/emergencia" className="btn btn-green service-card__btn">
              Entrar
            </Link>
          </div>
        </article>

        <article className="service-card">
          <div className="service-card__image-wrap">
            <img
              src={imgBaba}
              alt="Babás para pets"
              className="service-card__image"
            />
          </div>
          <div className="service-card__body">
            <h3 className="service-card__title">Babás</h3>
            <p className="service-card__desc">
              Cuide do seu pet com amor
            </p>
            <Link href="/babas" className="btn btn-green service-card__btn">
              Entrar
            </Link>
          </div>
        </article>
      </section>
    </>
  );
}
