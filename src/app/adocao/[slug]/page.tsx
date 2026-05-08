import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdoptableBySlug } from '@/lib/queries/adocao'
import { whatsappLink } from '@/lib/whatsapp'
import './profile.css'

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

const genderLabel: Record<string, string> = {
  macho: 'Macho',
  femea: 'Fêmea',
}

function ageDisplay(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} meses`
  return years === 1 ? '1 ano' : `${years} anos`
}

export default async function AdoptableProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const pet = await getAdoptableBySlug(slug)
  if (!pet) notFound()

  return (
    <main className="page adocao-profile">
      <div className="adocao-profile__hero">
        <img src={pet.photo} alt="" className="adocao-profile__photo" />
        <div className="adocao-profile__info">
          <h1 className="adocao-profile__name">{pet.name}</h1>
          <p className="adocao-profile__meta">
            {speciesLabel[pet.species]}
            {pet.breed ? ` • ${pet.breed}` : ''} • {ageDisplay(pet.ageYears)} •{' '}
            {sizeLabel[pet.size]} • {genderLabel[pet.gender]}
          </p>
          <p className="adocao-profile__loc">📍 {pet.location}</p>
          <div className="adocao-profile__contacts">
            <a
              href={whatsappLink(pet.contactPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-green"
            >
              💬 WhatsApp
            </a>
            <a
              href={`mailto:${pet.contactEmail}`}
              className="btn btn-outline-green"
            >
              E-mail
            </a>
          </div>
        </div>
      </div>

      <section className="adocao-profile__section">
        <h2 className="adocao-profile__section-title">Sobre {pet.name}</h2>
        <p className="adocao-profile__bio">{pet.description}</p>
      </section>

      <Link href="/adocao" className="adocao-profile__back">
        ← Voltar para adoção
      </Link>
    </main>
  )
}
