import { notFound } from 'next/navigation'
import { getEstablishment } from '@/data/mock'
import EstablishmentProfileView from './EstablishmentProfileView'
import './profile.css'

export default async function EstablishmentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const est = getEstablishment(id)
  if (!est) notFound()

  return <EstablishmentProfileView est={est} />
}
