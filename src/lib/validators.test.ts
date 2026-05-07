import { describe, expect, it } from 'vitest'
import { registerSchema, loginSchema } from './validators'

describe('registerSchema', () => {
  it('aceita payload válido', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'secret12' })
    expect(r.success).toBe(true)
  })

  it('rejeita senha curta', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'a@b.com', password: 'short' })
    expect(r.success).toBe(false)
  })

  it('rejeita email inválido', () => {
    const r = registerSchema.safeParse({ name: 'Ana', email: 'not-email', password: 'secret12' })
    expect(r.success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const r = registerSchema.safeParse({ name: '', email: 'a@b.com', password: 'secret12' })
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
