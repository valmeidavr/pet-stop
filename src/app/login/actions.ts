'use server'

import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { loginSchema } from '@/lib/validators'

export type LoginState = { error?: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: 'Email ou senha inválidos' }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    })
  } catch {
    return { error: 'Email ou senha inválidos' }
  }

  redirect('/')
}
