'use client'

import { CepAddressFields } from '@/components/CepAddressFields'
import { MapPicker } from '@/components/MapPicker'
import { establishmentTypeValues } from '@/lib/validators'

export type EstablishmentFieldValues = {
  name: string
  phone: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  openingHours: string
  services: string[]
  types: string[]
}

const TYPE_LABELS: Record<string, string> = {
  clinica: 'Clínica',
  loja: 'Loja / Pet Shop',
  farmacia: 'Farmácia',
  hospital: 'Hospital',
  banho_tosa: 'Banho e tosa',
}

export function EstablishmentFields({
  defaults,
  showName = false,
}: {
  defaults?: Partial<EstablishmentFieldValues>
  showName?: boolean
}) {
  return (
    <fieldset className="auth-profile">
      <legend className="auth-card__lead">Dados do estabelecimento</legend>

      {showName && (
        <label className="auth-label">
          Nome da empresa
          <input type="text" name="name" className="auth-input" defaultValue={defaults?.name ?? ''} required />
        </label>
      )}

      <label className="auth-label">
        Foto / logo
        <input type="file" name="photo" accept="image/*" className="auth-input" />
      </label>
      <label className="auth-label">
        Telefone
        <input type="tel" name="phone" className="auth-input" defaultValue={defaults?.phone ?? ''} placeholder="(24) 3333-0000" required />
      </label>

      <CepAddressFields
        defaultValues={{
          cep: defaults?.cep ?? '', logradouro: defaults?.logradouro ?? '', numero: defaults?.numero ?? '',
          complemento: defaults?.complemento ?? '', bairro: defaults?.bairro ?? '', cidade: defaults?.cidade ?? '', estado: defaults?.estado ?? '',
        }}
      />

      <label className="auth-label">
        Horário de funcionamento
        <textarea name="openingHours" className="auth-input" rows={3} defaultValue={defaults?.openingHours ?? ''} placeholder="Seg a Sex 8h-18h, Sáb 8h-12h" required />
      </label>
      <label className="auth-label">
        Serviços oferecidos (um por linha)
        <textarea name="services" className="auth-input" rows={4} defaultValue={(defaults?.services ?? []).join('\n')} placeholder="Banho&#10;Vacinação&#10;Consulta" />
      </label>

      <fieldset className="auth-types">
        <legend className="auth-label">Tipos (pode marcar mais de um)</legend>
        {establishmentTypeValues.map((t) => (
          <label key={t} className="auth-role">
            <input type="checkbox" name="types" value={t} defaultChecked={defaults?.types?.includes(t) ?? false} />
            <span>{TYPE_LABELS[t]}</span>
          </label>
        ))}
      </fieldset>

      <MapPicker latName="lat" lngName="lng" />
    </fieldset>
  )
}
