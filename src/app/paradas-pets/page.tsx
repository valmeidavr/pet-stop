import { PetMapClient } from '@/components/PetMapClient'
import { defaultMapCenter, getAllEstablishments } from '@/lib/queries/establishments'

export default async function ParadasPetsPage() {
  const establishments = await getAllEstablishments()
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient establishments={establishments} defaultMapCenter={defaultMapCenter} />
    </main>
  )
}
