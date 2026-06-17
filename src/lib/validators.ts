import { z } from 'zod'
import { passwordStrength, MIN_PASSWORD_SCORE } from './password'

export const profileRoleValues = ['CUSTOMER', 'BABA', 'ESTABLISHMENT_OWNER'] as const

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Nome obrigatório').max(100),
    email: z.email('Email inválido'),
    password: z
      .string()
      .min(8, 'Senha deve ter ao menos 8 caracteres')
      .refine((pw) => passwordStrength(pw).score >= MIN_PASSWORD_SCORE, {
        message: 'Senha muito fraca: use maiúsculas, minúsculas e números (ou símbolos).',
      }),
    confirmPassword: z.string(),
    role: z.enum(profileRoleValues),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
