import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Pet Stop',
  description: 'Clínicas, pet shops, emergência veterinária e babás — Vale do Paraíba e Sul Fluminense.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}
