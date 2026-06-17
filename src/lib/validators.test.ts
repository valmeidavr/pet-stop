import { describe, expect, it } from 'vitest'
import { registerSchema, loginSchema } from './validators'

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
