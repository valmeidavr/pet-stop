import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/session'
import { getBabaByOwner } from '@/lib/queries/babas'
import { BabaProfileForm } from './BabaProfileForm'
import '../../cadastro/auth.css'
import '../painel.css'
import './perfil-baba.css'

export default async function PerfilBabaPage() {
  const user = await requireUser()
  if (user.role !== 'BABA') redirect('/painel')

  const baba = await getBabaByOwner(user.id)

  return (
    <main className="page painel">
      <h1 className="painel__title">Meu perfil de babá</h1>
      <p className="painel__lead">Preencha seus dados. Eles aparecem na página de babás.</p>
      <BabaProfileForm baba={baba} />
    </main>
  )
}
