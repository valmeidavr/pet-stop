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
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const { name, email, password, role } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { name, email, passwordHash, role },
  })

  await signIn('credentials', { email, password, redirect: false })
  redirect('/')
}
