import Link from 'next/link'
import { getAllAdoptables } from '@/lib/queries/adocao'
import './adocao.css'

const speciesLabel: Record<string, string> = {
  cao: 'Cão',
  gato: 'Gato',
  outro: 'Outro',
}

const sizeLabel: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
}

function ageDisplay(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} meses`
  return years === 1 ? '1 ano' : `${years} anos`
}

export default async function AdocaoPage() {
  const items = await getAllAdoptables()

  return (
    <main className="page adocao-page">
      <section className="adocao-hero">
        <h1 className="adocao-hero__title">Pets para adoção</h1>
        <p className="adocao-hero__text">
          Conheça os pets disponíveis para adoção responsável na região.
        </p>
      </section>

      <section className="adocao-grid" aria-label="Lista de pets para adoção">
        {items.map((p) => (
          <Link key={p.id} href={`/adocao/${p.slug}`} className="adocao-card">
            <img src={p.photo} alt="" className="adocao-card__photo" />
            <div className="adocao-card__body">
              <h2 className="adocao-card__name">{p.name}</h2>
              <p className="adocao-card__meta">
                {speciesLabel[p.species]} • {ageDisplay(p.ageYears)} • {sizeLabel[p.size]}
              </p>
              <p className="adocao-card__loc">📍 {p.location}</p>
              <span className="btn btn-green adocao-card__btn">Ver perfil</span>
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="adocao-empty">Nenhum pet disponível no momento.</p>
        )}
      </section>
    </main>
  )
}
