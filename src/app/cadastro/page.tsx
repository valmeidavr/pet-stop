'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { register, type RegisterState } from './actions'
import { passwordStrength, MIN_PASSWORD_SCORE } from '@/lib/password'
import { CepAddressFields } from '@/components/CepAddressFields'
import { EstablishmentFields } from '@/components/EstablishmentFields'
import './auth.css'

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Usuário comum' },
  { value: 'BABA', label: 'Babá' },
  { value: 'ESTABLISHMENT_OWNER', label: 'Estabelecimento' },
] as const

export default function CadastroPage() {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {})
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<string>('CUSTOMER')

  const strength = passwordStrength(password)
  const strongEnough = strength.score >= MIN_PASSWORD_SCORE
  const matches = confirm.length === 0 || confirm === password
  const isBaba = role === 'BABA'
  const isEstab = role === 'ESTABLISHMENT_OWNER'

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Cadastre-se</h1>
        <p className="auth-card__lead">Crie sua conta na Pet Stop</p>
        <form className="auth-form" action={formAction} encType="multipart/form-data">
          <fieldset className="auth-roles">
            <legend className="auth-label">Tipo de perfil</legend>
            {ROLE_OPTIONS.map((o) => (
              <label key={o.value} className="auth-role">
                <input
                  type="radio"
                  name="role"
                  value={o.value}
                  checked={role === o.value}
                  onChange={() => setRole(o.value)}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </fieldset>

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
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder="••••••••"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {password.length > 0 && (
            <div className="auth-strength" aria-live="polite">
              <div className={`auth-strength__bar auth-strength__bar--${strength.score}`} />
              <span className="auth-strength__label">Força: {strength.label}</span>
            </div>
          )}

          <label className="auth-label">
            Confirmar senha
            <input
              type="password"
              name="confirmPassword"
              className="auth-input"
              placeholder="••••••••"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {!matches && <p className="auth-error" role="alert">As senhas não coincidem</p>}

          {isBaba && (
            <fieldset className="auth-profile">
              <legend className="auth-card__lead">Dados do seu perfil de babá</legend>

              <label className="auth-label">
                Foto
                <input type="file" name="photo" accept="image/*" className="auth-input" />
              </label>
              <label className="auth-label">
                Telefone
                <input type="tel" name="phone" className="auth-input" placeholder="(24) 99999-0000" required />
              </label>

              <CepAddressFields />

              <label className="auth-label">
                Breve descrição
                <textarea name="bio" className="auth-input" rows={4} placeholder="Conte um pouco sobre você" required />
              </label>
              <label className="auth-label">
                Quais animais você cuida
                <textarea name="animalsCared" className="auth-input" rows={4} placeholder="Ex.: cães de pequeno porte, gatos…" required />
              </label>
            </fieldset>
          )}

          {isEstab && <EstablishmentFields showName={false} />}

          {state.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button
            type="submit"
            className="btn btn-green auth-submit"
            disabled={pending || !strongEnough || !matches || confirm.length === 0}
          >
            {pending ? 'Criando…' : 'Criar conta'}
          </button>
        </form>
        <p className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </p>
        <Link href="/" className="auth-back">← Voltar ao início</Link>
      </div>
    </main>
  )
}
