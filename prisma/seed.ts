import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { establishments, babas } from './seed-data'
import { adoptables, campaigns, buscaPetPosts } from './seed-data-extras'

const prisma = new PrismaClient()

async function main() {
  for (const e of establishments) {
    await prisma.establishment.upsert({
      where: { slug: e.id },
      create: {
        slug: e.id,
        type: e.type,
        types: [e.type],
        name: e.name,
        lat: e.lat,
        lng: e.lng,
        address: e.address,
        phone: e.phone,
        email: e.email,
        rating: e.rating,
        bannerImage: e.bannerImage,
        logoImage: e.logoImage,
        publicPrivate: e.publicPrivate,
        about: e.about,
        plans: e.plans ?? [],
        exams: e.exams ?? [],
        vaccines: e.vaccines ?? [],
        medications: e.medications ?? [],
        shopServices: e.shopServices ?? [],
        galleryImages: e.galleryImages ?? [],
        professionals: { create: (e.professionals ?? []).map((p) => ({ name: p.name, specialty: p.specialty })) },
        samplePrices: { create: (e.samplePrices ?? []).map((s) => ({ item: s.item, price: s.price })) },
        reviews: {
          create: (e.testimonials ?? []).map((r) => ({
            authorName: r.author,
            rating: r.rating,
            text: r.text,
          })),
        },
      },
      update: {
        type: e.type,
        types: [e.type],
        name: e.name,
        lat: e.lat,
        lng: e.lng,
        address: e.address,
        phone: e.phone,
        email: e.email,
        rating: e.rating,
        bannerImage: e.bannerImage,
        logoImage: e.logoImage,
        publicPrivate: e.publicPrivate,
        about: e.about,
        plans: e.plans ?? [],
        exams: e.exams ?? [],
        vaccines: e.vaccines ?? [],
        medications: e.medications ?? [],
        shopServices: e.shopServices ?? [],
        galleryImages: e.galleryImages ?? [],
      },
    })
  }

  for (const b of babas) {
    await prisma.baba.upsert({
      where: { slug: b.id },
      create: {
        slug: b.id,
        name: b.name,
        photo: b.photo,
        rating: b.rating,
        reviewCount: b.reviewCount,
        location: b.location,
        phone: b.phone,
        email: b.email,
        bio: b.bio,
        reviews: {
          create: b.reviews.map((r) => ({
            authorName: r.author,
            rating: r.rating,
            text: r.text,
          })),
        },
      },
      update: {
        name: b.name,
        photo: b.photo,
        rating: b.rating,
        reviewCount: b.reviewCount,
        location: b.location,
        phone: b.phone,
        email: b.email,
        bio: b.bio,
      },
    })
  }

  for (const a of adoptables) {
    await prisma.adoptable.upsert({
      where: { slug: a.slug },
      create: a,
      update: { ...a },
    })
  }

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { slug: c.slug },
      create: c,
      update: { ...c },
    })
  }

  for (const p of buscaPetPosts) {
    await prisma.buscaPetPost.upsert({
      where: { slug: p.slug },
      create: p,
      update: { ...p },
    })
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (!adminPassword) {
    console.warn('[seed] SEED_ADMIN_PASSWORD não definida — pulando criação de admin demo')
  } else {
    await prisma.user.upsert({
      where: { email: 'admin@petstop.local' },
      create: {
        email: 'admin@petstop.local',
        name: 'Admin Demo',
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
      },
      update: {
        passwordHash: await bcrypt.hash(adminPassword, 10),
      },
    })
  }

  console.log('Seed concluído.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
