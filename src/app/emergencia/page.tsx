import { PetMapClient } from '@/components/PetMapClient'
import { defaultMapCenter, getAllEstablishments } from '@/lib/queries/establishments'

export default async function EmergenciaPage() {
  const establishments = await getAllEstablishments()
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient
        emergencyMode
        establishments={establishments}
        defaultMapCenter={defaultMapCenter}
      />
    </main>
  )
}
