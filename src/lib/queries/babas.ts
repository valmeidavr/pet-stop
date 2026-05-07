import { prisma } from '@/lib/prisma'

export async function getAllBabas() {
  return prisma.baba.findMany({ orderBy: { name: 'asc' } })
}

export async function getBabaBySlug(slug: string) {
  return prisma.baba.findUnique({
    where: { slug },
    include: { reviews: { orderBy: { createdAt: 'desc' } } },
  })
}
