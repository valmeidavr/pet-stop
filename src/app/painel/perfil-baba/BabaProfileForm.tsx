'use client'

import { useActionState } from 'react'
import type { Baba } from '@prisma/client'
import { saveBabaProfile, type BabaProfileState } from './actions'
import { CepAddressFields } from '@/components/CepAddressFields'
import { PhotoUpload } from '@/components/PhotoUpload'

export function BabaProfileForm({ baba }: { baba: Baba | null }) {
  const [state, formAction, pending] = useActionState<BabaProfileState, FormData>(saveBabaProfile, {})

  return (
    <form className="auth-form" action={formAction}>
      <PhotoUpload name="photo" defaultUrl={baba?.photo ?? ''} />

      <label className="auth-label">
        Nome
        <input type="text" name="name" className="auth-input" defaultValue={baba?.name ?? ''} required />
      </label>
      <label className="auth-label">
        Telefone
        <input type="tel" name="phone" className="auth-input" defaultValue={baba?.phone ?? ''} required />
      </label>
      <label className="auth-label">
        E-mail
        <input type="email" name="email" className="auth-input" defaultValue={baba?.email ?? ''} required />
      </label>

      <CepAddressFields
        defaultValues={baba ? {
          cep: baba.cep, logradouro: baba.logradouro, numero: baba.numero,
          complemento: baba.complemento, bairro: baba.bairro, cidade: baba.cidade, estado: baba.estado,
        } : undefined}
      />

      <label className="auth-label">
        Breve descrição
        <textarea name="bio" className="auth-input" rows={4} defaultValue={baba?.bio ?? ''} required />
      </label>
      <label className="auth-label">
        Quais animais você cuida
        <textarea name="animalsCared" className="auth-input" rows={4} defaultValue={baba?.animalsCared ?? ''} required />
      </label>

      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.ok && <p className="painel__ok" role="status">Perfil salvo! Já aparece em /babas.</p>}
      <button type="submit" className="btn btn-green auth-submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar perfil'}
      </button>
    </form>
  )
}
