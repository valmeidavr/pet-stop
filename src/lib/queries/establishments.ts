import { prisma } from '@/lib/prisma'

export const defaultMapCenter: [number, number] = [-22.41, -44.12]

export async function getAllEstablishments() {
  return prisma.establishment.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getEstablishmentBySlug(slug: string) {
  return prisma.establishment.findUnique({
    where: { slug },
    include: {
      professionals: true,
      samplePrices: true,
      reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
}
