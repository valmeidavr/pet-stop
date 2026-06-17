import { describe, expect, it } from 'vitest'
import { parseNominatim, buildAddressQuery } from './geocode'

describe('parseNominatim', () => {
  it('mapeia o primeiro resultado', () => {
    expect(parseNominatim([{ lat: '-22.41', lon: '-44.12' }])).toEqual({ lat: -22.41, lng: -44.12 })
  })
  it('retorna null para lista vazia', () => {
    expect(parseNominatim([])).toBeNull()
  })
  it('retorna null para formato inesperado', () => {
    expect(parseNominatim({})).toBeNull()
  })
})

describe('buildAddressQuery', () => {
  it('monta a query com endereço e país', () => {
    expect(buildAddressQuery({ logradouro: 'Rua A', numero: '10', cidade: 'Barra Mansa', estado: 'RJ' }))
      .toBe('Rua A, 10, Barra Mansa, RJ, Brasil')
  })
})
