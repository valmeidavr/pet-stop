import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const defaultMapCenter: [number, number] = [-22.41, -44.12]

const fullInclude = {
  professionals: true,
  samplePrices: true,
  reviews: { orderBy: { createdAt: 'desc' as const }, take: 20 },
} satisfies Prisma.EstablishmentInclude

export type EstablishmentWithRelations = Prisma.EstablishmentGetPayload<{
  include: typeof fullInclude
}>

export async function getAllEstablishments(): Promise<EstablishmentWithRelations[]> {
  return prisma.establishment.findMany({
    orderBy: { name: 'asc' },
    include: fullInclude,
  })
}

export async function getEstablishmentBySlug(slug: string) {
  return prisma.establishment.findUnique({
    where: { slug },
    include: fullInclude,
  })
}
