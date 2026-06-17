import { describe, expect, it } from 'vitest'
import { parseViaCep, normalizeCep } from './viacep'

describe('normalizeCep', () => {
  it('remove máscara e mantém 8 dígitos', () => {
    expect(normalizeCep('27330-000')).toBe('27330000')
  })
  it('remove letras e espaços', () => {
    expect(normalizeCep(' 27.330-000 ')).toBe('27330000')
  })
})

describe('parseViaCep', () => {
  it('mapeia resposta válida', () => {
    const json = {
      logradouro: 'Rua A',
      bairro: 'Centro',
      localidade: 'Barra Mansa',
      uf: 'RJ',
    }
    expect(parseViaCep(json)).toEqual({
      logradouro: 'Rua A',
      bairro: 'Centro',
      cidade: 'Barra Mansa',
      uf: 'RJ',
    })
  })
  it('retorna null quando { erro: true }', () => {
    expect(parseViaCep({ erro: true })).toBeNull()
  })
  it('retorna null para formato inesperado', () => {
    expect(parseViaCep('nope')).toBeNull()
  })
})
