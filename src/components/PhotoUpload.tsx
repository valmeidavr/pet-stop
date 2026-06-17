'use client'

import { useState } from 'react'

export function PhotoUpload({ name, defaultUrl = '' }: { name: string; defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setErro('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      if (!res.ok) throw new Error('falha')
      const data = (await res.json()) as { url: string }
      setUrl(data.url)
    } catch {
      setErro('Não foi possível enviar a foto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="photo-upload">
      <input type="hidden" name={name} value={url} readOnly />
      {url && <img src={url} alt="" className="photo-upload__preview" width={96} height={96} />}
      <label className="auth-label">
        Foto
        <input type="file" accept="image/*" className="auth-input" onChange={onChange} />
      </label>
      {loading && <p className="painel__hint">Enviando…</p>}
      {erro && <p className="auth-error" role="alert">{erro}</p>}
    </div>
  )
}
