import { getAllBabas } from '@/lib/queries/babas'
import { BabasList } from './BabasList'
import './babas.css'

export default async function BabasPage() {
  const babas = await getAllBabas()

  return (
    <main className="page babas-page">
      <div className="babas-page__decor" aria-hidden>
        <span className="paw">🐾</span>
        <span className="paw paw--2">🐾</span>
      </div>
      <BabasList babas={babas} />
    </main>
  )
}
