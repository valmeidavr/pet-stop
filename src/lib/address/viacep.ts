export type CepResult = {
  logradouro: string
  bairro: string
  cidade: string
  uf: string
}

export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '').slice(0, 8)
}

export function parseViaCep(json: unknown): CepResult | null {
  if (!json || typeof json !== 'object') return null
  const o = json as Record<string, unknown>
  if (o.erro) return null
  if (typeof o.localidade !== 'string' || typeof o.uf !== 'string') return null
  return {
    logradouro: typeof o.logradouro === 'string' ? o.logradouro : '',
    bairro: typeof o.bairro === 'string' ? o.bairro : '',
    cidade: o.localidade,
    uf: o.uf,
  }
}

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const c = normalizeCep(cep)
  if (c.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${c}/json/`)
    if (!res.ok) return null
    return parseViaCep(await res.json())
  } catch {
    return null
  }
}
