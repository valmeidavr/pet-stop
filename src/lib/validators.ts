import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  email: z.email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
})

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
