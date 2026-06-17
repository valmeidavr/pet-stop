import Link from 'next/link'
import { getAllCampaigns } from '@/lib/queries/campanhas'
import './campanhas.css'

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export default async function CampanhasPage() {
  const items = await getAllCampaigns()

  return (
    <main className="page campanhas-page">
      <section className="campanhas-hero">
        <h1 className="campanhas-hero__title">Campanhas</h1>
        <p className="campanhas-hero__text">
          Mutirões, vacinação, castração e ações sociais na região.
        </p>
      </section>

      <section className="campanhas-grid" aria-label="Lista de campanhas">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/campanhas/${c.slug}`}
            className={`campaign-card${c.status === 'encerrada' ? ' campaign-card--encerrada' : ''}`}
          >
            <img src={c.bannerImage} alt="" className="campaign-card__banner" />
            <div className="campaign-card__body">
              <span
                className={`campaign-card__badge campaign-card__badge--${c.status}`}
              >
                {c.status === 'ativa' ? 'Ativa' : 'Encerrada'}
              </span>
              <h2 className="campaign-card__title">{c.title}</h2>
              <p className="campaign-card__meta">
                📅 {dateFmt.format(c.startsAt)} – {dateFmt.format(c.endsAt)}
              </p>
              <p className="campaign-card__meta">📍 {c.location}</p>
              <span className="btn btn-green campaign-card__btn">Ver detalhes</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="campanhas-empty">Nenhuma campanha ativa.</p>
        )}
      </section>
    </main>
  )
}
