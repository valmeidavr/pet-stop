import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getEstablishmentByOwner } from '@/lib/queries/establishments'
import { EstabProfileForm } from './EstabProfileForm'
import '../../cadastro/auth.css'
import '../painel.css'

export default async function PerfilEstabPage() {
  const user = await requireUser()
  if (user.role !== 'ESTABLISHMENT_OWNER') redirect('/painel')

  const estab = await getEstablishmentByOwner(user.id)

  return (
    <main className="page painel">
      <h1 className="painel__title">Meu estabelecimento</h1>
      <p className="painel__lead">Preencha os dados. Eles aparecem no mapa de paradas pet.</p>
      <EstabProfileForm estab={estab} />
    </main>
  )
}
