import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type BabaWithReviews = Prisma.BabaGetPayload<{
  include: { reviews: true }
}>

export async function getAllBabas() {
  return prisma.baba.findMany({ orderBy: { name: 'asc' } })
}

export async function getBabaBySlug(slug: string): Promise<BabaWithReviews | null> {
  return prisma.baba.findUnique({
    where: { slug },
    include: { reviews: { orderBy: { createdAt: 'desc' } } },
  })
}
