import { prisma } from '@/lib/prisma'

export async function getAllCampaigns() {
  return prisma.campaign.findMany({
    orderBy: [{ status: 'asc' }, { startsAt: 'desc' }],
  })
}

export async function getCampaignBySlug(slug: string) {
  return prisma.campaign.findUnique({ where: { slug } })
}
