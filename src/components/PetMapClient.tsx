'use client'

import dynamic from 'next/dynamic'

export const PetMapClient = dynamic(
  () => import('./PetMap').then((m) => m.PetMap),
  { ssr: false, loading: () => <div className="pet-map-loading">Carregando mapa…</div> },
)
