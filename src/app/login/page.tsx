'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { login, type LoginState } from './actions'
import './auth.css'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Entrar</h1>
        <p className="auth-card__lead">Acesse sua conta Pet Stop</p>
        <form className="auth-form" action={formAction}>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" name="password" className="auth-input" placeholder="••••••••" required minLength={8} />
          </label>
          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button type="submit" className="btn btn-orange auth-submit" disabled={pending}>
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <p className="auth-footer">
          Não tem conta? <Link href="/cadastro">Cadastre-se</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
