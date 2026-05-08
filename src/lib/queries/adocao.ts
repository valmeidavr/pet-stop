import { prisma } from '@/lib/prisma'

export async function getAllAdoptables() {
  return prisma.adoptable.findMany({
    where: { adoptedAt: null },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAdoptableBySlug(slug: string) {
  return prisma.adoptable.findUnique({ where: { slug } })
}
