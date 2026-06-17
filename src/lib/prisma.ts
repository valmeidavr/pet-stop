import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Node < 22 has no global WebSocket, which the Neon serverless driver needs.
// Provide the `ws` implementation so the WebSocket connection can be opened.
if (typeof globalThis.WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

function makeClient(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prisma ?? makeClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}
