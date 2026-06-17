'use client'

import { useActionState } from 'react'
import type { Establishment } from '@prisma/client'
import { saveEstablishmentProfile, type EstabProfileState } from './actions'
import { EstablishmentFields } from '@/components/EstablishmentFields'

export function EstabProfileForm({ estab }: { estab: Establishment | null }) {
  const [state, formAction, pending] = useActionState<EstabProfileState, FormData>(saveEstablishmentProfile, {})

  return (
    <form className="auth-form" action={formAction} encType="multipart/form-data">
      <label className="auth-label">
        E-mail de contato
        <input type="email" name="email" className="auth-input" defaultValue={estab?.email ?? ''} required />
      </label>
      <EstablishmentFields
        showName
        defaults={estab ? {
          name: estab.name, phone: estab.phone, cep: estab.cep, logradouro: estab.logradouro,
          numero: estab.numero, complemento: estab.complemento, bairro: estab.bairro,
          cidade: estab.cidade, estado: estab.estado, openingHours: estab.openingHours,
          services: estab.services, types: estab.types,
        } : undefined}
      />
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.ok && <p className="painel__ok" role="status">Perfil salvo! Já aparece em /paradas-pets.</p>}
      <button type="submit" className="btn btn-green auth-submit" disabled={pending}>
        {pending ? 'Salvando…' : 'Salvar perfil'}
      </button>
    </form>
  )
}
