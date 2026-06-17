import { describe, expect, it } from 'vitest'
import { registerSchema, loginSchema, babaProfileSchema, establishmentProfileSchema } from './validators'

describe('registerSchema', () => {
  const base = {
    name: 'Ana',
    email: 'a@b.com',
    password: 'abcdEF12',
    confirmPassword: 'abcdEF12',
    role: 'CUSTOMER' as const,
  }

  it('aceita payload válido', () => {
    const r = registerSchema.safeParse(base)
    expect(r.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const r = registerSchema.safeParse({ ...base, password: 'short', confirmPassword: 'short' })
    expect(r.success).toBe(false)
  })

  it('rejeita email inválido', () => {
    const r = registerSchema.safeParse({ ...base, email: 'not-email' })
    expect(r.success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const r = registerSchema.safeParse({ ...base, name: '' })
    expect(r.success).toBe(false)
  })
})

describe('registerSchema (papel + senha)', () => {
  const base = {
    name: 'Ana',
    email: 'a@b.com',
    password: 'abcdEF12',
    confirmPassword: 'abcdEF12',
    role: 'BABA' as const,
  }

  it('aceita payload válido com papel e confirmação', () => {
    expect(registerSchema.safeParse(base).success).toBe(true)
  })

  it('rejeita quando a confirmação não bate', () => {
    const r = registerSchema.safeParse({ ...base, confirmPassword: 'outraCoisa1' })
    expect(r.success).toBe(false)
  })

  it('rejeita senha com força abaixo do mínimo', () => {
    const r = registerSchema.safeParse({
      ...base,
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    })
    expect(r.success).toBe(false)
  })

  it('rejeita papel inválido', () => {
    const r = registerSchema.safeParse({ ...base, role: 'ADMIN' })
    expect(r.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('aceita payload válido', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const r = loginSchema.safeParse({ email: 'a@b.com', password: '1' })
    expect(r.success).toBe(false)
  })
})

describe('babaProfileSchema', () => {
  const base = {
    name: 'Ana',
    phone: '24999990000',
    email: 'ana@b.com',
    bio: 'Cuido de pets há 10 anos.',
    animalsCared: 'Cães de pequeno porte e gatos.',
    cep: '27330000',
    logradouro: 'Rua A',
    numero: '100',
    complemento: '',
    bairro: 'Centro',
    cidade: 'Barra Mansa',
    estado: 'RJ',
    photo: '',
  }

  it('aceita perfil válido', () => {
    expect(babaProfileSchema.safeParse(base).success).toBe(true)
  })
  it('rejeita sem animais cuidados', () => {
    expect(babaProfileSchema.safeParse({ ...base, animalsCared: '' }).success).toBe(false)
  })
  it('rejeita sem cidade', () => {
    expect(babaProfileSchema.safeParse({ ...base, cidade: '' }).success).toBe(false)
  })
})

describe('establishmentProfileSchema', () => {
  const base = {
    name: 'Clínica X', phone: '2433330000', email: 'c@x.com',
    openingHours: 'Seg a Sex 8h-18h',
    cep: '27330000', logradouro: 'Av B', numero: '50', complemento: '',
    bairro: 'Centro', cidade: 'Barra Mansa', estado: 'RJ',
    types: ['clinica', 'loja'], services: ['Vacinação', 'Banho'],
    lat: -22.5, lng: -44.1, photo: '',
  }
  it('aceita perfil válido', () => {
    expect(establishmentProfileSchema.safeParse(base).success).toBe(true)
  })
  it('rejeita sem nenhum tipo', () => {
    expect(establishmentProfileSchema.safeParse({ ...base, types: [] }).success).toBe(false)
  })
  it('rejeita tipo inválido', () => {
    expect(establishmentProfileSchema.safeParse({ ...base, types: ['xpto'] }).success).toBe(false)
  })
  it('aceita services vazio', () => {
    expect(establishmentProfileSchema.safeParse({ ...base, services: [] }).success).toBe(true)
  })
})
