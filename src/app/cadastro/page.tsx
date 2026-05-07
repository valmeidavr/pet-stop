'use client'

import Link from 'next/link'
import './auth.css'

export default function CadastroPage() {
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Cadastre-se</h1>
        <p className="auth-card__lead">Crie sua conta na Pet Stop</p>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <label className="auth-label">
            Nome
            <input type="text" name="name" className="auth-input" placeholder="Seu nome" required />
          </label>
          <label className="auth-label">
            E-mail
            <input type="email" name="email" className="auth-input" placeholder="seu@email.com" required />
          </label>
          <label className="auth-label">
            Senha
            <input type="password" name="password" className="auth-input" placeholder="••••••••" required minLength={8} />
          </label>
          <button type="submit" className="btn btn-green auth-submit">Criar conta</button>
        </form>
        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
