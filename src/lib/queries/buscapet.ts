import { prisma } from '@/lib/prisma'

export async function getAllBuscaPetPosts() {
  return prisma.buscaPetPost.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBuscaPetPostBySlug(slug: string) {
  return prisma.buscaPetPost.findUnique({ where: { slug } })
}
