'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { StarRating } from '@/components/StarRating'
import { babas } from '@/data/mock'
import './babas.css'

export default function BabasPage() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return babas
    return babas.filter(
      (b) =>
        b.name.toLowerCase().includes(t) ||
        b.location.toLowerCase().includes(t),
    )
  }, [q])

  return (
    <main className="page babas-page">
      <div className="babas-page__decor" aria-hidden>
        <span className="paw">🐾</span>
        <span className="paw paw--2">🐾</span>
      </div>
      <section className="babas-hero">
        <h1 className="babas-hero__title">Babás</h1>
        <p className="babas-hero__text">
          Encontre profissionais de confiança para cuidar do seu pet com carinho.
        </p>
        <div className="babas-search">
          <label htmlFor="babas-q" className="visually-hidden">
            Buscar por nome ou localização
          </label>
          <input
            id="babas-q"
            type="search"
            className="babas-search__input"
            placeholder="Buscar por nome ou localização…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      <section className="babas-grid" aria-label="Lista de babás">
        {filtered.map((b) => (
          <article key={b.id} className="baba-card">
            <img src={b.photo} alt="" className="baba-card__photo" />
            <div className="baba-card__body">
              <h2 className="baba-card__name">{b.name}</h2>
              <StarRating value={b.rating} size="sm" />
              <p className="baba-card__meta">{b.reviewCount} avaliações</p>
              <p className="baba-card__loc">📍 {b.location}</p>
              <Link
                href={`/babas/${b.id}`}
                className="btn btn-green baba-card__btn"
              >
                Ver perfil
              </Link>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="babas-empty">Nenhuma babá encontrada para sua busca.</p>
        )}
      </section>
    </main>
  )
}
