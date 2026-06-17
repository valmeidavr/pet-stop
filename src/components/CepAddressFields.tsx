'use client'

import { useState } from 'react'
import { lookupCep } from '@/lib/address/viacep'
import { UFS } from '@/lib/address/ufs'

export type AddressValues = {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export function CepAddressFields({ defaultValues }: { defaultValues?: Partial<AddressValues> }) {
  const [cep, setCep] = useState(defaultValues?.cep ?? '')
  const [logradouro, setLogradouro] = useState(defaultValues?.logradouro ?? '')
  const [bairro, setBairro] = useState(defaultValues?.bairro ?? '')
  const [cidade, setCidade] = useState(defaultValues?.cidade ?? '')
  const [estado, setEstado] = useState(defaultValues?.estado ?? '')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function buscar() {
    setLoading(true)
    setErro('')
    const r = await lookupCep(cep)
    setLoading(false)
    if (!r) {
      setErro('CEP não encontrado.')
      return
    }
    setLogradouro(r.logradouro)
    setBairro(r.bairro)
    setCidade(r.cidade)
    setEstado(r.uf)
  }

  return (
    <div className="cep-fields">
      <label className="auth-label">
        CEP
        <div className="cep-fields__row">
          <input
            type="text"
            name="cep"
            className="auth-input"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            placeholder="00000-000"
            required
          />
          <button type="button" className="btn btn-outline-green" onClick={buscar} disabled={loading}>
            {loading ? 'Buscando…' : 'Buscar CEP'}
          </button>
        </div>
      </label>
      {erro && <p className="auth-error" role="alert">{erro}</p>}

      <label className="auth-label">
        Logradouro
        <input type="text" name="logradouro" className="auth-input" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} required />
      </label>
      <label className="auth-label">
        Número
        <input type="text" name="numero" className="auth-input" defaultValue={defaultValues?.numero ?? ''} required />
      </label>
      <label className="auth-label">
        Complemento
        <input type="text" name="complemento" className="auth-input" defaultValue={defaultValues?.complemento ?? ''} />
      </label>
      <label className="auth-label">
        Bairro
        <input type="text" name="bairro" className="auth-input" value={bairro} onChange={(e) => setBairro(e.target.value)} required />
      </label>
      <label className="auth-label">
        Cidade
        <input type="text" name="cidade" className="auth-input" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
      </label>
      <label className="auth-label">
        Estado
        <select name="estado" className="auth-input" value={estado} onChange={(e) => setEstado(e.target.value)} required>
          <option value="">UF</option>
          {UFS.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
