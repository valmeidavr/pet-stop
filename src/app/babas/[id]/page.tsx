import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StarRating } from '@/components/StarRating'
import { getBabaBySlug } from '@/lib/queries/babas'
import { whatsappLink } from '@/lib/whatsapp'
import './profile.css'

const dateFmt = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })

export default async function BabaProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const baba = await getBabaBySlug(id)
  if (!baba) notFound()

  return (
    <main className="page baba-profile">
      <div className="baba-profile__highlight">
        <img
          src={baba.photo}
          alt=""
          className="baba-profile__photo"
        />
        <div className="baba-profile__info">
          <h1 className="baba-profile__name">{baba.name}</h1>
          <StarRating value={baba.rating} />
          <p className="baba-profile__loc">📍 {baba.location}</p>
          <div className="baba-profile__contacts">
            <a href={`tel:${baba.phone}`} className="btn btn-outline-green">
              📞 {baba.phone}
            </a>
            <a href={`mailto:${baba.email}`} className="btn btn-green">
              E-mail
            </a>
          </div>
        </div>
      </div>

      <section className="baba-profile__section">
        <h2 className="baba-profile__section-title">Sobre</h2>
        <p className="baba-profile__bio">{baba.bio}</p>
      </section>

      <section className="baba-profile__section">
        <h2 className="baba-profile__section-title">Avaliações</h2>
        <ul className="baba-reviews">
          {baba.reviews.map((r) => (
            <li key={r.id} className="baba-review">
              <div className="baba-review__head">
                <strong>{r.authorName ?? 'Anônimo'}</strong>
                <StarRating value={r.rating} showNumber={false} size="sm" />
                <span className="baba-review__date">{dateFmt.format(r.createdAt)}</span>
              </div>
              <p className="baba-review__text">{r.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="baba-profile__section baba-profile__cta">
        <p className="baba-profile__cta-text">Quer conversar com {baba.name}?</p>
        <div className="baba-profile__contacts">
          <a
            href={whatsappLink(baba.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-green"
          >
            💬 WhatsApp
          </a>
          <a href={`mailto:${baba.email}`} className="btn btn-outline-green">
            Enviar e-mail
          </a>
        </div>
      </section>

      <Link href="/babas" className="baba-profile__back">
        ← Voltar para babás
      </Link>
    </main>
  )
}
