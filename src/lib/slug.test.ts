import { describe, expect, it } from 'vitest'
import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('normaliza acentos e espaços', () => {
    expect(slugify('Ana São João')).toBe('ana-sao-joao')
  })
  it('remove símbolos', () => {
    expect(slugify('Maria & Cia!!')).toBe('maria-cia')
  })
})

describe('uniqueSlug', () => {
  it('retorna o base quando livre', async () => {
    const r = await uniqueSlug('ana', async () => false)
    expect(r).toBe('ana')
  })
  it('incrementa quando ocupado', async () => {
    const taken = new Set(['ana', 'ana-2'])
    const r = await uniqueSlug('ana', async (s) => taken.has(s))
    expect(r).toBe('ana-3')
  })
})
