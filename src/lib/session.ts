import { redirect } from 'next/navigation'
import type { Role } from '@prisma/client'
import { auth } from '@/lib/auth'

export async function requireUser(): Promise<{
  id: string
  role: Role
  name?: string | null
}> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return {
    id: session.user.id,
    role: session.user.role as Role,
    name: session.user.name,
  }
}
