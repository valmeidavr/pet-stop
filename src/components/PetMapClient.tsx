'use client'

import dynamic from 'next/dynamic'
import type { EstablishmentWithRelations } from '@/lib/queries/establishments'

type Props = {
  emergencyMode?: boolean
  establishments: EstablishmentWithRelations[]
  defaultMapCenter: [number, number]
}

const PetMapInner = dynamic(() => import('./PetMap').then((m) => m.PetMap), {
  ssr: false,
  loading: () => <div className="pet-map-loading">Carregando mapa…</div>,
})

export function PetMapClient(props: Props) {
  return <PetMapInner {...props} />
}
