import { auth } from '@/lib/auth'

export default auth(() => {
  return undefined
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
