'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registerSchema } from '@/lib/validators'

export type RegisterState = { error?: string }

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, passwordHash, role: 'CUSTOMER' },
  })

  await signIn('credentials', { email, password, redirect: false })
  redirect('/')
}
