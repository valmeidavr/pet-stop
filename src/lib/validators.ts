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

export const babaProfileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  phone: z.string().min(8, 'Telefone obrigatório'),
  email: z.email('Email inválido'),
  bio: z.string().min(1, 'Descrição obrigatória').max(1000),
  animalsCared: z.string().min(1, 'Informe quais animais você cuida').max(2000),
  cep: z.string().min(1, 'CEP obrigatório'),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional().default(''),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Estado obrigatório').max(2),
  photo: z.string().optional().default(''),
})

export const establishmentTypeValues = ['loja', 'clinica', 'farmacia', 'hospital', 'banho_tosa'] as const

export const establishmentProfileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  phone: z.string().min(8, 'Telefone obrigatório'),
  email: z.email('Email inválido'),
  openingHours: z.string().min(1, 'Horário obrigatório').max(500),
  cep: z.string().min(1, 'CEP obrigatório'),
  logradouro: z.string().min(1, 'Logradouro obrigatório'),
  numero: z.string().min(1, 'Número obrigatório'),
  complemento: z.string().optional().default(''),
  bairro: z.string().min(1, 'Bairro obrigatório'),
  cidade: z.string().min(1, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Estado obrigatório').max(2),
  types: z.array(z.enum(establishmentTypeValues)).min(1, 'Selecione ao menos um tipo'),
  services: z.array(z.string()).default([]),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  photo: z.string().optional().default(''),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type BabaProfileInput = z.infer<typeof babaProfileSchema>
export type EstablishmentProfileInput = z.infer<typeof establishmentProfileSchema>
