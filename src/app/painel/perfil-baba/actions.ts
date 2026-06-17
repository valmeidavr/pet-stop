'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/session'
import { babaProfileSchema } from '@/lib/validators'
import { uniqueSlug } from '@/lib/slug'

export type BabaProfileState = { error?: string; ok?: boolean }

const PLACEHOLDER_PHOTO = '/baba-placeholder.svg'

export async function saveBabaProfile(
  _prev: BabaProfileState,
  formData: FormData,
): Promise<BabaProfileState> {
  const user = await requireUser()
  if (user.role !== 'BABA') return { error: 'Apenas babás podem editar este perfil.' }

  const parsed = babaProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    bio: formData.get('bio'),
    animalsCared: formData.get('animalsCared'),
    cep: formData.get('cep'),
    logradouro: formData.get('logradouro'),
    numero: formData.get('numero'),
    complemento: formData.get('complemento') ?? '',
    bairro: formData.get('bairro'),
    cidade: formData.get('cidade'),
    estado: formData.get('estado'),
    photo: formData.get('photo') ?? '',
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }
  const d = parsed.data
  const location = `${d.cidade}/${d.estado}`
  const photo = d.photo && d.photo.length > 0 ? d.photo : PLACEHOLDER_PHOTO

  const existing = await prisma.baba.findFirst({ where: { ownerId: user.id } })

  if (existing) {
    await prisma.baba.update({
      where: { id: existing.id },
      data: {
        name: d.name, phone: d.phone, email: d.email, bio: d.bio,
        animalsCared: d.animalsCared, cep: d.cep, logradouro: d.logradouro,
        numero: d.numero, complemento: d.complemento, bairro: d.bairro,
        cidade: d.cidade, estado: d.estado, location, photo,
      },
    })
  } else {
    const slug = await uniqueSlug(d.name, async (s) => {
      const hit = await prisma.baba.findUnique({ where: { slug: s } })
      return hit !== null
    })
    await prisma.baba.create({
      data: {
        slug, ownerId: user.id,
        name: d.name, phone: d.phone, email: d.email, bio: d.bio,
        animalsCared: d.animalsCared, cep: d.cep, logradouro: d.logradouro,
        numero: d.numero, complemento: d.complemento, bairro: d.bairro,
        cidade: d.cidade, estado: d.estado, location, photo,
      },
    })
  }

  revalidatePath('/babas')
  return { ok: true }
}
