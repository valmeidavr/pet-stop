'use server'

import { revalidatePath } from 'next/cache'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { establishmentProfileSchema } from '@/lib/validators'
import { uniqueSlug } from '@/lib/slug'
import { geocodeAddress, buildAddressQuery } from '@/lib/address/geocode'

export type EstabProfileState = { error?: string; ok?: boolean }

const PLACEHOLDER = '/estab-placeholder.svg'

export async function saveEstablishmentProfile(
  _prev: EstabProfileState,
  formData: FormData,
): Promise<EstabProfileState> {
  const user = await requireUser()
  if (user.role !== 'ESTABLISHMENT_OWNER') return { error: 'Apenas estabelecimentos podem editar este perfil.' }

  const parsed = establishmentProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
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
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  const d = parsed.data

  let lat = d.lat
  let lng = d.lng
  if (lat === undefined || lng === undefined) {
    const geo = await geocodeAddress(buildAddressQuery(d))
    lat = geo?.lat ?? -22.41
    lng = geo?.lng ?? -44.12
  }
  const address = `${d.logradouro}, ${d.numero}${d.complemento ? ' - ' + d.complemento : ''}, ${d.bairro}, ${d.cidade}/${d.estado}`

  const file = formData.get('photo')
  let photo = PLACEHOLDER
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop() || 'jpg'
    const blob = await put(`fotos/${crypto.randomUUID()}.${ext}`, file, { access: 'public', token: process.env.BLOB_READ_WRITE_TOKEN })
    photo = blob.url
  }

  const existing = await prisma.establishment.findFirst({ where: { ownerId: user.id } })
  const common = {
    type: d.types[0], types: d.types, name: d.name, phone: d.phone, email: d.email,
    lat, lng, address, cep: d.cep, logradouro: d.logradouro, numero: d.numero,
    complemento: d.complemento, bairro: d.bairro, cidade: d.cidade, estado: d.estado,
    openingHours: d.openingHours, services: d.services,
  }

  if (existing) {
    const data = file instanceof File && file.size > 0
      ? { ...common, bannerImage: photo, logoImage: photo }
      : common
    await prisma.establishment.update({ where: { id: existing.id }, data })
  } else {
    const slug = await uniqueSlug(d.name, async (s) => {
      const hit = await prisma.establishment.findUnique({ where: { slug: s } })
      return hit !== null
    })
    await prisma.establishment.create({
      data: { slug, ownerId: user.id, ...common, bannerImage: photo, logoImage: photo, about: '' },
    })
  }

  revalidatePath('/paradas-pets')
  return { ok: true }
}
