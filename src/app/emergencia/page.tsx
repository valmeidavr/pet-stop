import { PetMapClient } from '@/components/PetMapClient'

export default function EmergenciaPage() {
  return (
    <main className="page page--flush page--pet-map">
      <PetMapClient emergencyMode />
    </main>
  )
}
