import { notFound } from 'next/navigation'
import { getEstablishmentBySlug } from '@/lib/queries/establishments'
import EstablishmentProfileView from './EstablishmentProfileView'
import './profile.css'

export default async function EstablishmentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const est = await getEstablishmentBySlug(id)
  if (!est) notFound()

  return <EstablishmentProfileView est={est} />
}
