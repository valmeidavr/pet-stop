'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registerSchema, babaProfileSchema } from '@/lib/validators'
import { uniqueSlug } from '@/lib/slug'

export type RegisterState = { error?: string }

const PLACEHOLDER_PHOTO = '/baba-placeholder.svg'

async function uploadPhoto(file: FormDataEntryValue | null): Promise<string> {
  if (!(file instanceof File) || file.size === 0) return PLACEHOLDER_PHOTO
  const ext = file.name.split('.').pop() || 'jpg'
  const blob = await put(`fotos/${crypto.randomUUID()}.${ext}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return blob.url
}

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

  // Quando o perfil é babá, os dados do perfil são preenchidos na mesma tela.
  let babaData: import('@/lib/validators').BabaProfileInput | null = null
  if (role === 'BABA') {
    const bp = babaProfileSchema.safeParse({
      name,
      email,
      phone: formData.get('phone'),
      bio: formData.get('bio'),
      animalsCared: formData.get('animalsCared'),
      cep: formData.get('cep'),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      complemento: formData.get('complemento') ?? '',
      bairro: formData.get('bairro'),
      cidade: formData.get('cidade'),
      estado: formData.get('estado'),
      photo: '',
    })
    if (!bp.success) {
      return { error: bp.error.issues[0]?.message ?? 'Dados do perfil inválidos' }
    }
    babaData = bp.data
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  })

  if (role === 'BABA' && babaData) {
    const photo = await uploadPhoto(formData.get('photo'))
    const slug = await uniqueSlug(babaData.name, async (s) => {
      const hit = await prisma.baba.findUnique({ where: { slug: s } })
      return hit !== null
    })
    await prisma.baba.create({
      data: {
        slug,
        ownerId: user.id,
        name: babaData.name,
        phone: babaData.phone,
        email: babaData.email,
        bio: babaData.bio,
        animalsCared: babaData.animalsCared,
        cep: babaData.cep,
        logradouro: babaData.logradouro,
        numero: babaData.numero,
        complemento: babaData.complemento,
        bairro: babaData.bairro,
        cidade: babaData.cidade,
        estado: babaData.estado,
        location: `${babaData.cidade}/${babaData.estado}`,
        photo,
      },
    })
  }

  await signIn('credentials', { email, password, redirect: false })
  redirect(role === 'CUSTOMER' ? '/' : '/painel')
}
