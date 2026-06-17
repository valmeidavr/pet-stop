import { describe, expect, it } from 'vitest'
import { passwordStrength, MIN_PASSWORD_SCORE } from './password'

describe('passwordStrength', () => {
  it('senha vazia é muito fraca (score 0)', () => {
    expect(passwordStrength('')).toEqual({ score: 0, label: 'muito fraca' })
  })

  it('só letras minúsculas curtas é muito fraca', () => {
    expect(passwordStrength('abc')).toEqual({ score: 0, label: 'muito fraca' })
  })

  it('8+ minúsculas soma 1 (fraca)', () => {
    expect(passwordStrength('abcdefgh')).toEqual({ score: 1, label: 'fraca' })
  })

  it('8+ com maiúscula+minúscula soma 2 (média)', () => {
    expect(passwordStrength('abcdEFGH')).toEqual({ score: 2, label: 'média' })
  })

  it('8+ com maiúscula, minúscula e dígito soma 3 (forte)', () => {
    expect(passwordStrength('abcdEF12')).toEqual({ score: 3, label: 'forte' })
  })

  it('8+ com tudo (símbolo) soma 4 (muito forte)', () => {
    expect(passwordStrength('abcEF12!@')).toEqual({ score: 4, label: 'muito forte' })
  })

  it('MIN_PASSWORD_SCORE é 3', () => {
    expect(MIN_PASSWORD_SCORE).toBe(3)
  })
})
