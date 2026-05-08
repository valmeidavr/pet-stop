import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role?: typeof token.role }).role
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id
      if (token.role) session.user.role = token.role
      return session
    },
  },
}
