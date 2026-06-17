import Link from 'next/link'
import { requireUser } from '@/lib/session'
import './painel.css'

export default async function PainelPage() {
  const user = await requireUser()

  return (
    <main className="page painel">
      <h1 className="painel__title">Meu painel</h1>
      <p className="painel__lead">Olá{user.name ? `, ${user.name}` : ''}!</p>

      {user.role === 'BABA' && (
        <Link href="/painel/perfil-baba" className="btn btn-green">
          Editar meu perfil de babá
        </Link>
      )}
      {user.role === 'ESTABLISHMENT_OWNER' && (
        <p className="painel__hint">A edição do perfil de estabelecimento chega em breve.</p>
      )}
      {user.role === 'CUSTOMER' && (
        <p className="painel__hint">Sua conta é de usuário comum.</p>
      )}

      <Link href="/" className="painel__back">← Voltar ao início</Link>
    </main>
  )
}
