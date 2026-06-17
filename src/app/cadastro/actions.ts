'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import { registerSchema, babaProfileSchema, establishmentProfileSchema } from '@/lib/validators'
import { uniqueSlug } from '@/lib/slug'
import { geocodeAddress, buildAddressQuery } from '@/lib/address/geocode'

export type RegisterState = { error?: string }

const PLACEHOLDER_PHOTO = '/baba-placeholder.svg'
const PLACEHOLDER_ESTAB = '/estab-placeholder.svg'

async function uploadPhoto(file: FormDataEntryValue | null, fallback: string): Promise<string> {
  if (!(file instanceof File) || file.size === 0) return fallback
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

  let estabData: import('@/lib/validators').EstablishmentProfileInput | null = null
  if (role === 'ESTABLISHMENT_OWNER') {
    const ep = establishmentProfileSchema.safeParse({
      name,
      email,
      phone: formData.get('phone'),
      openingHours: formData.get('openingHours'),
      cep: formData.get('cep'),
      logradouro: formData.get('logradouro'),
      numero: formData.get('numero'),
      complemento: formData.get('complemento') ?? '',
      bairro: formData.get('bairro'),
      cidade: formData.get('cidade'),
      estado: formData.get('estado'),
      types: formData.getAll('types'),
      services: String(formData.get('services') ?? '').split('\n').map((s) => s.trim()).filter(Boolean),
      lat: formData.get('lat') || undefined,
      lng: formData.get('lng') || undefined,
      photo: '',
    })
    if (!ep.success) {
      return { error: ep.error.issues[0]?.message ?? 'Dados do estabelecimento inválidos' }
    }
    estabData = ep.data
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email já cadastrado' }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
  })

  if (role === 'BABA' && babaData) {
    const photo = await uploadPhoto(formData.get('photo'), PLACEHOLDER_PHOTO)
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

  if (role === 'ESTABLISHMENT_OWNER' && estabData) {
    const photo = await uploadPhoto(formData.get('photo'), PLACEHOLDER_ESTAB)
    let lat = estabData.lat
    let lng = estabData.lng
    if (lat === undefined || lng === undefined) {
      const geo = await geocodeAddress(buildAddressQuery(estabData))
      lat = geo?.lat ?? -22.41
      lng = geo?.lng ?? -44.12
    }
    const slug = await uniqueSlug(estabData.name, async (s) => {
      const hit = await prisma.establishment.findUnique({ where: { slug: s } })
      return hit !== null
    })
    const address = `${estabData.logradouro}, ${estabData.numero}${estabData.complemento ? ' - ' + estabData.complemento : ''}, ${estabData.bairro}, ${estabData.cidade}/${estabData.estado}`
    await prisma.establishment.create({
      data: {
        slug,
        ownerId: user.id,
        type: estabData.types[0],
        types: estabData.types,
        name: estabData.name,
        phone: estabData.phone,
        email: estabData.email,
        lat,
        lng,
        address,
        cep: estabData.cep,
        logradouro: estabData.logradouro,
        numero: estabData.numero,
        complemento: estabData.complemento,
        bairro: estabData.bairro,
        cidade: estabData.cidade,
        estado: estabData.estado,
        openingHours: estabData.openingHours,
        services: estabData.services,
        bannerImage: photo,
        logoImage: photo,
        about: '',
      },
    })
  }

  await signIn('credentials', { email, password, redirect: false })
  redirect(role === 'CUSTOMER' ? '/' : '/painel')
}
